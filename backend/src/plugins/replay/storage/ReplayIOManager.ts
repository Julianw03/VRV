import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
} from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { ReplayMetadata } from '@/plugins/replay/storage/ReplayStorageFormat';
import { StorageStatusDTO } from '@/plugins/replay/storage/StorageStatusDTO';
import AdmZip from 'adm-zip';
import { validate } from 'class-validator';

@Injectable()
export class ReplayIOManager {
    private readonly logger = new Logger(ReplayIOManager.name);

    readonly storageBasePath: string;

    constructor() {
        const localAppData =
            process.env.LOCALAPPDATA ??
            path.join(os.homedir(), 'AppData', 'Local');
        this.storageBasePath = path.join(localAppData, 'VViewer', 'replays');
    }

    private matchDir(matchId: string): string {
        return path.join(this.storageBasePath, matchId);
    }

    replayFilePath(matchId: string): string {
        return path.join(this.matchDir(matchId), `${matchId}.vrf`);
    }

    private metadataFilePath(matchId: string): string {
        return path.join(this.matchDir(matchId), 'metadata.json');
    }

    async isSetup(): Promise<boolean> {
        try {
            await fs.access(this.storageBasePath);
            return true;
        } catch {
            return false;
        }
    }

    async setup(): Promise<void> {
        await fs.mkdir(this.storageBasePath, { recursive: true });
        this.logger.log(`Storage initialised at ${this.storageBasePath}`);
    }

    async teardown(): Promise<void> {
        await fs.rm(this.storageBasePath, { recursive: true, force: true });
        this.logger.log('Storage removed');
    }

    async getStatus(): Promise<StorageStatusDTO> {
        if (!(await this.isSetup())) {
            return { isSetup: false, matchCount: 0, totalSizeBytes: 0 };
        }

        const ids = await this.listMatchIds();
        let totalSizeBytes = 0;

        for (const id of ids) {
            try {
                const stat = await fs.stat(this.replayFilePath(id));
                totalSizeBytes += stat.size;
            } catch {}
        }

        return { isSetup: true, matchCount: ids.length, totalSizeBytes };
    }

    private async listMatchIds(): Promise<string[]> {
        try {
            const entries = await fs.readdir(this.storageBasePath, {
                withFileTypes: true,
            });
            return entries.filter((e) => e.isDirectory()).map((e) => e.name);
        } catch {
            return [];
        }
    }

    async listMatches(): Promise<ReplayMetadata[]> {
        const ids = await this.listMatchIds();
        const results: ReplayMetadata[] = [];

        for (const id of ids) {
            const meta = await this.getMetadata(id);
            if (meta) results.push(meta);
        }

        return results.sort(
            (a, b) => b.matchInfo.gameStartMillis - a.matchInfo.gameStartMillis,
        );
    }

    async getMetadata(matchId: string): Promise<ReplayMetadata | null> {
        try {
            const raw = await fs.readFile(
                this.metadataFilePath(matchId),
                'utf-8',
            );
            return JSON.parse(raw) as ReplayMetadata;
        } catch {
            return null;
        }
    }

    async matchExists(matchId: string): Promise<boolean> {
        try {
            await fs.access(this.metadataFilePath(matchId));
            return true;
        } catch {
            return false;
        }
    }

    async saveReplay(
        matchId: string,
        replayData: Buffer,
        metadata: ReplayMetadata,
    ): Promise<void> {
        await fs.mkdir(this.matchDir(matchId), { recursive: true });
        await fs.writeFile(this.replayFilePath(matchId), replayData);
        await fs.writeFile(
            this.metadataFilePath(matchId),
            JSON.stringify(metadata, null, 2),
            'utf-8',
        );
        this.logger.log(
            `Saved replay for match ${matchId} (${replayData.byteLength} bytes)`,
        );
    }

    async exportMatch(matchId: string): Promise<Buffer> {
        const zip = new AdmZip();
        zip.addLocalFolder(this.matchDir(matchId));
        return zip.toBuffer();
    }

    async importMatch(
        zipBuffer: Buffer,
        overrideIfExists = true,
    ): Promise<void> {
        let zip: AdmZip;

        try {
            zip = new AdmZip(zipBuffer);
        } catch {
            throw new BadRequestException('Invalid zip archive');
        }

        const entries = zip.getEntries();

        if (entries.length === 0) {
            throw new BadRequestException(
                'Invalid replay archive: no files found',
            );
        }

        for (const entry of entries) {
            const normalized = path.normalize(entry.entryName);
            if (normalized.includes('..')) {
                throw new BadRequestException(
                    'Invalid archive: path traversal detected',
                );
            }
        }

        const metadataEntry = entries.find((e) =>
            e.entryName.endsWith('metadata.json'),
        );

        if (!metadataEntry) {
            throw new BadRequestException(
                'Invalid replay archive: metadata.json not found',
            );
        }

        const replayEntry = entries.find((e) => e.entryName.endsWith('.vrf'));

        if (!replayEntry) {
            throw new BadRequestException(
                'Invalid replay archive: .vrf file missing',
            );
        }

        let metadata: ReplayMetadata;

        try {
            metadata = JSON.parse(
                metadataEntry.getData().toString('utf-8'),
            ) as ReplayMetadata;
            await validate(metadata);
        } catch {
            throw new BadRequestException('Invalid metadata.json');
        }

        const matchId = metadata.matchInfo.matchId;

        if ((await this.matchExists(matchId)) && !overrideIfExists) {
            throw new ConflictException(
                `Match ${matchId} already exists in storage`,
            );
        }

        const targetDir = this.matchDir(matchId);
        await fs.mkdir(targetDir, { recursive: true });

        zip.extractAllTo(targetDir, true);

        this.logger.log(`Imported match ${matchId} from archive`);
    }

    async deleteMatch(matchId: string): Promise<void> {
        await fs.rm(this.matchDir(matchId), { recursive: true, force: true });
        this.logger.log(`Deleted match ${matchId}`);
    }
}
