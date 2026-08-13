import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import AdmZip from 'adm-zip';
import { ReplayFetchManager } from '@/modules/Valorant/ValorantReplays/remote/ReplayFetchManager';
import { AsyncResult } from '#/utils/AsyncResult';
import { SimpleEventBus } from '@/core/events/SimpleEventBus';
import { isPathWithin } from '@/utils/PathUtils';
import { IMapDataManager } from '@/core/data/interfaces/IMapDataManager';
import { SimpleMapDataManager } from '@/core/data/SimpleMapDataManager';
import { EmittingMapDataBehavior } from '@/core/data/behaviors/emission/EmittingMapDataBehavior';
import { KeyDataViewable } from '@/core/data/interfaces/capabilities/KeyDataViewable';
import { CachingMapMappingBehavior } from '@/core/data/behaviors/viewMapping/CachingMapMappingBehavior';
import { DownloadState, DownloadStateDTO } from '#/schemas/DownloadState.schema';
import { getResolvedPath } from '@/config/ConfigV1.schema';
import { ReplayMetadataV2, ReplayMetadataV2Schema } from '#/schemas/ReplayFormatV2.schema';
import { StorageStatusDTO } from '#/schemas/StorageStatusDTO';
import { CURRENT_REPLAY_FORMAT_VERSION } from '@/modules/Valorant/ValorantReplays/storage/ReplayStorageDTO.schema';
import { ReplayImportRequest } from '#/schemas/upload/ImportReplay.schema';
import { ImportData } from '@/modules/Valorant/ValorantReplays/storage/import/ImportHandler';
import { forType as forImportType } from '@/modules/Valorant/ValorantReplays/storage/import/HandlerFactory';
import { PuuidToPlayerAliasManager } from '@/modules/PuuidToPlayerAliasModule/PuuidToPlayerAliasManager';
import { createHash } from 'node:crypto';
import { type AppConfig, InjectConfig } from '@/config/configLoader';


type ImportMatchError =
    | MatchAlreadyExistsError
    | IllegalDownloadStateError
    | InvalidReplayArchiveError
    | IOError;

type LoadSavedMetadataError =
    | MatchNotFoundError
    | IllegalDownloadStateError
    | IOError

type DeleteMatchError = MatchNotFoundError;

export class MatchNotFoundError extends Error {
    constructor(matchId: string) {
        super(`Match ${matchId} not found in storage`);
    }
}

export class MatchAlreadyExistsError extends Error {
    constructor(matchId: string) {
        super(`Match ${matchId} already exists in storage`);
    }
}

export class IllegalDownloadStateError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class IOError extends Error {
    constructor(message: string, e: Error) {
        super(`IOError ${message}`);
        this.cause = e;
    }
}

export class InvalidReplayArchiveError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class StorageNotSetupError extends Error {
    constructor() {
        super('Storage is not set up');
    }
}

export class UnableToDeleteMatchError extends Error {
    constructor(matchId: string, originalError: Error) {
        super(`Failed to delete match ${matchId}: ${originalError.message}`);
        this.stack = originalError.stack;
    }
}

const expect = (
    expected: DownloadState,
    actual: DownloadState | null,
): AsyncResult<DownloadState, IllegalDownloadStateError> => {
    if (actual === expected) {
        return AsyncResult.success(actual);
    }

    return AsyncResult.failure(
        new IllegalDownloadStateError(
            `Expected ${expected}, got ${actual}`,
        ),
    );
};

@Injectable()
export class ReplayIOManager implements KeyDataViewable<string, DownloadStateDTO>, OnModuleInit {

    private static NON_SETUP_STATUS: StorageStatusDTO = { isSetup: false, matchCount: 0, totalSizeBytes: 0 };

    protected readonly storageBasePath: string;
    protected readonly storageLegacyPath: string;
    protected readonly manager: IMapDataManager<string, DownloadState, DownloadStateDTO>;
    protected readonly logger = new Logger(this.constructor.name);
    private storageStatus: StorageStatusDTO = ReplayIOManager.NON_SETUP_STATUS;
    private readonly demosDir: string;

    constructor(
        protected readonly fetchManager: ReplayFetchManager,
        protected readonly eventBus: SimpleEventBus,
        protected readonly puuidManager: PuuidToPlayerAliasManager,
        @InjectConfig()
        config: AppConfig,
    ) {
        const base = new SimpleMapDataManager<string, DownloadState>();
        const map = new CachingMapMappingBehavior(base, ReplayIOManager.map);
        this.manager = new EmittingMapDataBehavior(map, eventBus, this.constructor.name);
        const localAppData =
            process.env.LOCALAPPDATA ??
            path.join(os.homedir(), 'AppData', 'Local');
        this.storageBasePath = path.join(localAppData, 'ValorantReplayViewer', 'replays');
        this.storageLegacyPath = path.join(localAppData, 'ValorantReplayViewer', 'old_replays');
        this.demosDir = path.join(
            getResolvedPath(config.filepaths['valorant-saved']),
            'Demos',
        );
    }

    getKeyView(key: string): DownloadStateDTO | null {
        return this.manager.getKeyView(key);
    }

    getView(): Record<string, DownloadStateDTO> | null {
        return this.manager.getView();
    }

    private matchDirSafe(matchId: string): string {
        const assumedPath = path.normalize(path.join(this.storageBasePath, matchId));
        if (!isPathWithin(this.storageBasePath, assumedPath)) {
            throw new Error('Invalid matchId, potential path traversal detected');
        }
        return assumedPath;
    }

    private replayFilePath(matchId: string): string {
        const dirPath = this.matchDirSafe(matchId);
        const assumedPath = path.normalize(path.join(dirPath, `${matchId}.vrf`));
        if (!isPathWithin(dirPath, assumedPath)) {
            throw new Error('Invalid matchId, potential path traversal detected');
        }
        return assumedPath;
    }

    private metadataFilePath(matchId: string): string {
        return path.join(this.matchDirSafe(matchId), 'metadata.json');
    }

    protected static map(value: DownloadState): DownloadStateDTO {
        return {
            state: value,
        };
    }

    async onModuleInit() {
        const isSetup = await this.isSetup();
        if (!isSetup) return;
        await this.handleInitialLoad().catch();
        this.updateStorageStatus();
    }

    public getStatus(): StorageStatusDTO {
        return this.storageStatus;
    }

    private async listStoredMatchIds(): Promise<string[]> {
        try {
            const exists = await this.isSetup();
            if (!exists) return [];
            const entries = await fs.readdir(this.storageBasePath, {
                withFileTypes: true,
            });
            return entries.filter((e) => e.isDirectory()).map((e) => e.name);
        } catch {
            return [];
        }
    }

    async getStoredMatchesMetadata(): Promise<ReplayMetadataV2[]> {
        const matchIds = await this.listStoredMatchIds();
        const metadataList: ReplayMetadataV2[] = [];
        for (const matchId of matchIds) {
            try {
                const contents = await this.getMetadataFileContents(matchId);
                if (this.isUnsupportedFormat(contents)) {
                    this.logger.warn(`Metadata for match ${matchId} is in an unsupported format`);
                    continue;
                }
                const metadata = await this.parseMetadataFileContents(contents);
                metadataList.push(metadata);
            } catch (err) {
                this.logger.error(`Failed to load metadata for match ${matchId}`, err);
            }
        }
        return metadataList;
    }

    private isUnsupportedFormat(content: string): boolean {
        try {
            const parsed = JSON.parse(content);
            const replayMetadataVersion = parsed['formatVersion'];
            if (replayMetadataVersion !== CURRENT_REPLAY_FORMAT_VERSION) {
                return true;
            }
        } catch {
            return true;
        }
        return false;
    }

    // TODO: This might become an issue if the number of matches grows large.
    // Instead of calculating the total size on every call, we could maintain a running total that gets updated on match add/delete.
    async updateStorageStatus(): Promise<void> {
        try {
            const matchIds = await this.listStoredMatchIds();

            const results = await Promise.allSettled(
                matchIds.map(async (matchId) => {
                    const matchPath = this.matchDirSafe(matchId);
                    const files = await fs.readdir(matchPath);

                    const sizes = await Promise.allSettled(
                        files.map(async (file) => {
                            const stats = await fs.stat(path.join(matchPath, file));
                            return stats.size;
                        }),
                    );

                    return sizes
                        .filter(r => r.status === 'fulfilled')
                        .reduce((sum, r: PromiseFulfilledResult<number>) => sum + r.value, 0);
                }),
            );

            const totalSizeBytes = results
                .filter(r => r.status === 'fulfilled')
                .reduce((sum, r: PromiseFulfilledResult<number>) => sum + r.value, 0);

            const matchCount = results.filter(r => r.status === 'fulfilled').length;

            this.storageStatus = { isSetup: true, matchCount, totalSizeBytes };
        } catch (err) {
            this.logger.error('Failed to update storage status', err);
        }
    }

    async setup(): Promise<void> {
        await fs.mkdir(this.storageBasePath, { recursive: true });
        this.logger.log(`Storage initialised at ${this.storageBasePath}`);
        this.updateStorageStatus();
    }

    async teardown(): Promise<void> {
        await fs.rm(this.storageBasePath, { recursive: true, force: true });
        this.logger.log('Storage removed');
        this.manager.deleteState();
        this.storageStatus = ReplayIOManager.NON_SETUP_STATUS;
    }

    async isSetup(): Promise<boolean> {
        try {
            await fs.access(this.storageBasePath);
            return true;
        } catch {
            return false;
        }
    }

    async deleteMatch(matchId: string): Promise<AsyncResult<void, DeleteMatchError>> {
        try {
            const exists = await this.matchExistsIO(matchId);
            if (!exists) {
                return AsyncResult.failure(new MatchNotFoundError(matchId));
            }
            await fs.rm(this.matchDirSafe(matchId), { recursive: true, force: true });
            this.logger.log(`Deleted match ${matchId}`);
            this.manager.deleteKey(matchId);
        } catch (e) {
            this.logger.warn(`Failed to delete match ${matchId}`);
            return AsyncResult.failure(new UnableToDeleteMatchError(matchId, e as Error));
        }
        await this.updateStorageStatus();
        return AsyncResult.success(undefined);
    }

    async moveToLegacyDir(matchId: string): Promise<AsyncResult<void, Error>> {
        const exists = await this.matchExistsIO(matchId);
        if (!exists) {
            return AsyncResult.failure(new MatchNotFoundError(matchId));
        }
        await fs.rm(
            path.join(this.storageLegacyPath, matchId),
            { recursive: true, force: true },
        );
        await fs.rename(
            path.normalize(path.join(this.storageBasePath, matchId)),
            path.normalize(path.join(this.storageLegacyPath, matchId),
            ),
        );
        return AsyncResult.success(undefined);
    }


    public matchRegistered(matchId: string) {
        return this.manager.getKeyView(matchId) !== null;
    }

    private async matchExistsIO(matchId: string): Promise<boolean> {
        try {
            await fs.access(this.metadataFilePath(matchId));
            return true;
        } catch {
            return false;
        }
    }


    private getMetadataFileContents(matchId: string): Promise<string> {
        return fs.readFile(this.metadataFilePath(matchId), 'utf-8');
    }

    private async parseMetadataFileContents(contents: string): Promise<ReplayMetadataV2> {
        try {
            const data = JSON.parse(contents);
            return await ReplayMetadataV2Schema.parseAsync(data);
        } catch (e) {
            this.logger.error(`Failed to parse metadata`, e);
            throw e;
        }
    }

    public async loadSavedMetadata(matchId: string): Promise<AsyncResult<ReplayMetadataV2, LoadSavedMetadataError>> {
        const current = this.manager.getKeyView(matchId)?.state ?? null;
        if (current === null) {
            return AsyncResult.failure(new MatchNotFoundError(matchId));
        }
        return await expect(DownloadState.DOWNLOADED, current).flatMapAsync(async () => {
            const content = await this.getMetadataFileContents(matchId);
            return AsyncResult.fromPromiseWithErrorMapper(this.parseMetadataFileContents(content), (e) => new IOError(`Failed to parse metadata for match ${matchId}`, e as Error));
        });
    }

    async handleInitialLoad(): Promise<void> {
        if (!(await this.isSetup())) {
            this.logger.log('Storage not set up, skipping initial load');
            return;
        }
        await fs.mkdir(this.storageLegacyPath, { recursive: true });
        const matchIds = await this.listStoredMatchIds();
        await Promise.allSettled(
            matchIds.map(async (matchId) => {
                this.manager.updateKeyValue(matchId, DownloadState.DOWNLOADING);

                try {
                    const matchExists = await this.matchExistsIO(matchId);
                    const contents = await this.getMetadataFileContents(matchId);
                    if (this.isUnsupportedFormat(contents)) {
                        this.logger.warn(`Metadata for match ${matchId} is in an unsupported format, moving to legacy files...`);
                        await this.moveToLegacyDir(matchId);
                        this.manager.updateKeyValue(matchId, DownloadState.FAILED);
                        return;
                    }
                    this.manager.updateKeyValue(matchId, matchExists ? DownloadState.DOWNLOADED : DownloadState.FAILED);
                } catch (err) {
                    this.logger.error(`Failed to load metadata for match ${matchId}`, err);
                    this.manager.updateKeyValue(matchId, DownloadState.FAILED);
                }
            }),
        );
        this.logger.log('All matches initialzed');
    }

    async moveToValorantDemos(matchId: string): Promise<void> {
        const current = this.manager.getKeyView(matchId)?.state ?? null;
        if (current === null) {
            throw new MatchNotFoundError(matchId);
        }
        if (current !== DownloadState.DOWNLOADED) {
            throw new IllegalDownloadStateError(`Match ${matchId} is in state ${current}, cannot move to Demos folder`);
        }
        const replayPath = this.replayFilePath(matchId);
        const targetPath = path.join(this.demosDir, `${matchId}.vrf`);
        if (!isPathWithin(this.demosDir, targetPath)) {
            throw new Error('Invalid matchId, potential path traversal detected');
        }
        await fs.copyFile(replayPath, targetPath);
        this.logger.log(`Copied replay for match ${matchId} to Valorant Demos folder`);
    }

    async triggerDownload(matchId: string, forceRetryWhenFailed = false): Promise<void> {
        const current = this.manager.getKeyView(matchId)?.state ?? null;
        if (current !== null && current !== DownloadState.FAILED) {
            this.logger.log('Match already exists in memory or is being downloaded, skipping download');
            return;
        }
        if (current === DownloadState.FAILED && !forceRetryWhenFailed) {
            this.logger.log('Previous download attempt failed, skipping download');
            return;
        }
        this.manager.updateKeyValue(matchId, DownloadState.DOWNLOADING);
        try {
            const { metadata, replayBuffer } = await this.fetchManager.fetchCombinedReplayData(matchId);

            await this.doSaveReplay(matchId, replayBuffer, metadata);
            this.manager.updateKeyValue(matchId, DownloadState.DOWNLOADED);
        } catch (err) {
            this.logger.error(`Failed to download and save match ${matchId}`, err);
            this.manager.updateKeyValue(matchId, DownloadState.FAILED);
        }
        this.updateStorageStatus();
    }

    private async doSaveReplay(
        matchId: string,
        replayData: Buffer | undefined,
        metadata: ReplayMetadataV2,
    ): Promise<void> {
        await fs.mkdir(this.matchDirSafe(matchId), { recursive: true });
        if (replayData) {
            await fs.writeFile(this.replayFilePath(matchId), replayData);
        }
        await fs.writeFile(
            this.metadataFilePath(matchId),
            JSON.stringify(metadata, null, 2),
            'utf-8',
        );
        this.logger.log(
            replayData
                ? `Saved replay for match ${matchId} (${replayData.byteLength} bytes)`
                : `Saved metadata-only entry for match ${matchId}`,
        );
    }

    public async exportMatchToZip(matchId: string): Promise<Buffer> {
        if (!await this.matchExistsIO(matchId)) {
            throw new MatchNotFoundError(matchId);
        }
        const zip = new AdmZip();
        zip.addLocalFolder(this.matchDirSafe(matchId));
        return zip.toBuffer();
    }


    async postImportValidate(importData: ImportData): Promise<ImportData> {
        const { replayFile: replay, metadata: metadata } = importData;
        const schemaValidated = await ReplayMetadataV2Schema.parseAsync(metadata);

        if (!!schemaValidated.replayFileMetadata) {
            if (!replay) throw new InvalidReplayArchiveError('Expected replay file');
            const checksum = createHash('sha256').update(replay).digest('hex');
            if (schemaValidated.replayFileMetadata.checksum !== checksum) {
                throw new InvalidReplayArchiveError('Replay file hash does not match metadata checksum.');
            }
        }

        return {
            replayFile: replay,
            metadata: schemaValidated,
        };
    }

    public async importReplay(
        file: Buffer,
        request: ReplayImportRequest,
        overrideIfExists = false,
    ): Promise<AsyncResult<void, ImportMatchError>> {
        let importData: ImportData;
        //TODO: restructure this.
        try {
            const handler = forImportType(request.type, this.puuidManager);
            const untrustedImport = await handler.import(file, request);
            this.logger.debug('Initial Import handler done. Will now run validation.');
            importData = await this.postImportValidate(untrustedImport);
        } catch (e) {
            if (e instanceof InvalidReplayArchiveError) {
                return AsyncResult.failure(e);
            }
            this.logger.error('Failed to process uploaded replay import', e);
            return AsyncResult.failure(new InvalidReplayArchiveError('Failed to process uploaded file'));
        }

        const { metadata, replayFile } = importData;
        const matchId = metadata.uuid;

        const current = this.manager.getKeyView(matchId)?.state ?? null;
        switch (current) {
            //TODO: Are these two checks correct ?
            case DownloadState.DOWNLOADED:
                if (!overrideIfExists) {
                    this.logger.debug('Rejecting upload: Internal state marked as downloaded.');
                    return AsyncResult.failure(new MatchAlreadyExistsError(matchId));
                }
            //Otherwise we can just continue, Fallthrough intended
            case null:
            case DownloadState.FAILED:
                break;
            default:
                return AsyncResult.failure(new IllegalDownloadStateError(`Match ${matchId} is currently in state ${current}, cannot import`));
        }
        this.manager.updateKeyValue(matchId, DownloadState.DOWNLOADING);

        try {
            const exists = await this.matchExistsIO(matchId);
            if (exists && !overrideIfExists) {
                this.logger.debug(`Rejecting import for ${matchId}: Already exists and no override provided.`);
                throw new MatchAlreadyExistsError(matchId);
            }
            await this.doSaveReplay(matchId, replayFile, metadata).catch((e) => {
                throw new IOError(`Failed to save replay file for match ${matchId}: ${e.message}`, e as Error);
            });
            this.logger.log(`Imported match ${matchId} (type: ${request.type})`);
            this.manager.updateKeyValue(matchId, DownloadState.DOWNLOADED);
        } catch (err) {
            this.logger.error(`Failed to import match ${matchId}`, err);
            this.manager.updateKeyValue(matchId, DownloadState.FAILED);
            return AsyncResult.failure(new InvalidReplayArchiveError('Failed to save imported replay, see server logs for details'));
        }

        this.updateStorageStatus();
        return AsyncResult.success(undefined);
    }

    async injectReplayOverPlaceholder(
        targetMatchId: string,
        placeholderMatchId: string,
    ): Promise<void> {
        const targetData = await fs.readFile(this.replayFilePath(targetMatchId));
        const overwritePath = path.join(this.demosDir, `${placeholderMatchId}.vrf`);
        if (!isPathWithin(this.demosDir, overwritePath)) {
            throw new Error('Invalid placeholderMatchId, potential path traversal detected');
        }
        await fs.writeFile(
            overwritePath,
            targetData,
        );
        this.logger.log(`Injected ${targetMatchId} over placeholder ${placeholderMatchId}`);
    }

    async restoreReplayFile(matchId: string): Promise<void> {
        const data = await fs.readFile(this.replayFilePath(matchId));
        const restorePath = path.join(this.demosDir, `${matchId}.vrf`);
        if (!isPathWithin(this.demosDir, restorePath)) {
            throw new Error('Invalid matchId, potential path traversal detected');
        }
        await fs.writeFile(
            restorePath,
            data,
        );
        this.logger.log(`Restored original replay file for ${matchId}`);
    }
}