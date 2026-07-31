import {
    BadRequestException,
    Body,
    ConflictException,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Logger,
    NotFoundException,
    Param,
    Post,
    Query,
    Res,
    StreamableFile,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import {
    IllegalDownloadStateError,
    InvalidReplayArchiveError,
    MatchAlreadyExistsError,
    MatchNotFoundError,
    ReplayIOManager,
} from '@/modules/Valorant/ValorantReplays/storage/ReplayIOManager';
import {
    ApiCreatedResponse, ApiExtraModels,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation, getSchemaPath,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { mapErrorAsync } from '@/utils/AsyncResultSwagger';
import { DownloadStateDTO, DownloadStateDTOSchema } from '#/schemas/DownloadState.schema';
import { ReplayMetadataV2, ReplayMetadataV2Schema } from '#/schemas/ReplayFormatV2.schema';
import { StorageStatusDTO, StorageStatusDTOSchema } from '#/schemas/StorageStatusDTO';
import { ReplayImportSchema } from '#/schemas/upload/ImportReplay.schema';
import { createZodDto } from 'nestjs-zod';

class StorageStatusModel extends createZodDto(StorageStatusDTOSchema) {
}

class DownloadStateModel extends createZodDto(DownloadStateDTOSchema) {
}

class ReplayMetadataV2Model extends createZodDto(ReplayMetadataV2Schema) {
}

@Controller({
    path: 'plugins/replay/storage',
    version: '1',
})
export class ReplayIOController {
    private readonly logger = new Logger(ReplayIOController.name);

    constructor(protected readonly replayIOManager: ReplayIOManager) {
    }

    @Post('')
    @ApiOperation({
        summary: 'Initialize replay storage',
        description: 'Creates and prepares persistent storage for replay files.',
    })
    @ApiCreatedResponse({ description: 'Storage initialized successfully.' })
    @HttpCode(HttpStatus.CREATED)
    async setupStorage(): Promise<void> {
        await this.replayIOManager.setup();
    }

    @Delete('')
    @ApiOperation({
        summary: 'Delete replay storage',
        description: 'Removes all stored replays and deletes persistent storage.',
    })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Storage deleted successfully.' })
    async teardownStorage(): Promise<void> {
        await this.replayIOManager.teardown();
    }

    @Get('status')
    @ApiOperation({
        summary: 'Get storage status',
        description: 'Returns current status and health of replay storage.',
    })
    @ApiOkResponse({
        description: 'Storage status retrieved.',
        type: StorageStatusModel,
    })
    async getStorageStatus(): Promise<StorageStatusDTO> {
        return this.replayIOManager.getStatus();
    }

    @Get('matches')
    @ApiOperation({
        summary: 'List stored matches',
        description: 'Returns metadata for all matches currently stored.',
    })
    @ApiOkResponse({
            description: 'List of stored match metadata.',
            type: ReplayMetadataV2Model,
            isArray: true,
        },
    )
    async listStoredMatches(): Promise<ReplayMetadataV2[]> {
        return this.replayIOManager.getStoredMatchesMetadata();
    }

    @Get('download-states')
    @ApiOperation({
        summary: 'Get all download states',
        description:
            'Returns the current in-memory download state for every known match. ' +
            'Intended for initial hydration of the frontend store.',
    })
    @ApiOkResponse({
        description: 'Map of matchId to DownloadState',
        schema: {
            type: 'object',
            additionalProperties: {
                $ref: getSchemaPath(DownloadStateModel)
            }
        }
    })
    @ApiExtraModels(DownloadStateModel)
    async getDownloadStates(): Promise<Record<string, DownloadStateDTO | null>> {
        const view = this.replayIOManager.getView();
        if (!view) {
            throw new NotFoundException('Replay IO Manager view not available');
        }
        return view;
    }

    @Post('import')
    @ApiOperation({
        summary: 'Import a replay',
        description:
            'Imports a full replay package (.vrp), a raw replay file (.vrf), or a raw Riot match API response (.json). ' +
            'The `data` field must contain the JSON-encoded import request describing which of these `file` is.',
    })
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 200 * 1024 * 1024 },
        }),
    )
    async importReplay(
        @UploadedFile() file: Express.Multer.File,
        @Body('data') rawData: string,
        @Query('override') override = 'true',
    ): Promise<void> {
        if (!file) throw new BadRequestException('No file uploaded');
        if (!file.buffer || file.buffer.length === 0)
            throw new BadRequestException('Uploaded file is empty');

        let parsedData: unknown;
        try {
            parsedData = JSON.parse(rawData ?? '{}');
        } catch {
            throw new BadRequestException('Invalid JSON in `data` field');
        }

        const parseResult = ReplayImportSchema.safeParse(parsedData);
        if (!parseResult.success) {
            throw new BadRequestException(`Invalid import request: ${parseResult.error.message}`);
        }

        return mapErrorAsync(
            this.replayIOManager.importReplay(file.buffer, parseResult.data, override !== 'false'),
            new Map([
                [MatchAlreadyExistsError, (e) => new ConflictException(e.message)],
                [IllegalDownloadStateError, (e) => new ConflictException(e.message)],
                [InvalidReplayArchiveError, (e) => new BadRequestException(e.message)],
            ]),
        );
    }

    @Get('matches/:matchId')
    @ApiOperation({
        summary: 'Download replay file package',
        description: 'Streams the replay file package (.vrp) for the specified match.',
    })
    @ApiOkResponse({ description: 'Replay file stream.' })
    async downloadReplayPortable(
        @Param('matchId') matchId: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const filePath = await this.replayIOManager.exportMatchToZip(matchId);
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${matchId}.vrp"`,
        });
        return new StreamableFile(filePath);
    }

    @Delete('matches/:matchId')
    @ApiOperation({
        summary: 'Delete stored match',
        description: 'Deletes replay file and metadata for a specific match.',
    })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Match deleted successfully.' })
    @ApiNotFoundResponse({ description: 'Match not found.' })
    async deleteStoredMatch(@Param('matchId') matchId: string): Promise<void> {
        return mapErrorAsync(
            this.replayIOManager.deleteMatch(matchId),
            new Map([
                [MatchNotFoundError, (e) => new NotFoundException(e.message)],
                [IllegalDownloadStateError, (e) => new ConflictException(e.message)],
            ]),
        );
    }

    @Get('matches/:matchId/metadata')
    @ApiOperation({
        summary: 'Get match metadata',
        description: 'Returns detailed metadata for a specific stored match.',
    })
    @ApiOkResponse(
        {
            description: 'Match metadata retrieved.',
            type: ReplayMetadataV2Model,
        },
    )
    @ApiNotFoundResponse({ description: 'Match not found.' })
    async getMatchMetadata(@Param('matchId') matchId: string): Promise<ReplayMetadataV2> {
        return mapErrorAsync(
            this.replayIOManager.loadSavedMetadata(matchId),
            new Map([
                [MatchNotFoundError, (e) => new NotFoundException(e.message)],
                [IllegalDownloadStateError, (e) => new ConflictException(e.message)],
            ]),
        );
    }
}