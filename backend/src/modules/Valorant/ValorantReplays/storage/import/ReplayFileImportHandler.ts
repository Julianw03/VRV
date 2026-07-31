import { createHash } from 'node:crypto';
import { ImportData, ImportHandler } from '@/modules/Valorant/ValorantReplays/storage/import/ImportHandler';
import { ReplayFileTypeSchema, ReplayImportRequest } from '#/schemas/upload/ImportReplay.schema';
import { ReplayMetadataV2 } from '#/schemas/ReplayFormatV2.schema';
import { CURRENT_REPLAY_FORMAT_VERSION } from '@/modules/Valorant/ValorantReplays/storage/ReplayStorageDTO.schema';

export class ReplayFileImportHandler implements ImportHandler {
    async import(file: Buffer, request: ReplayImportRequest): Promise<ImportData> {
        if (request.type !== ReplayFileTypeSchema.enum.replayFile) {
            throw new Error(`ReplayFileImportHandler received unexpected import type: ${request.type}`);
        }

        const matchUuid = request.matchUuid;
        const checksum = createHash('sha256').update(file).digest('hex');
        const concatId = matchUuid.substring(0, 8);

        const metadata: ReplayMetadataV2 = {
            formatVersion: CURRENT_REPLAY_FORMAT_VERSION,
            uuid: matchUuid,
            replayFileMetadata: {
                fileSizeBytes: file.byteLength,
                checksum,
            },
            riotMatchMetadata: null,
            downloaderMetadata: null,
            userMetadata: request.userMetadata ?? {
                name: `Replay ${concatId}`,
                tags: [],
                notes: null,
            },
        };

        return { metadata, replayFile: file };
    }
}
