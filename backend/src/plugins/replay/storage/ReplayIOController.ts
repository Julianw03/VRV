import {
    BadRequestException,
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
import { ReplayIOManager } from '@/plugins/replay/storage/ReplayIOManager';
import {
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
} from '@nestjs/swagger';
import { StorageStatusDTO } from '@/plugins/replay/storage/StorageStatusDTO';
import { ReplayMetadata } from '@/plugins/replay/storage/ReplayStorageFormat';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller({
    path: 'plugins/replay/storage',
    version: '1',
})
export class ReplayIOController {
    private readonly logger = new Logger(ReplayIOController.name);

    constructor(protected readonly replayIOManager: ReplayIOManager) {}

    @Post('')
    @ApiOperation({
        summary: 'Initialize replay storage',
        description:
            'Creates and prepares persistent storage for replay files.',
    })
    @ApiCreatedResponse({
        description: 'Storage initialized successfully.',
    })
    @HttpCode(HttpStatus.CREATED)
    async setupStorage(): Promise<void> {
        await this.replayIOManager.setup();
    }

    @Delete('')
    @ApiOperation({
        summary: 'Delete replay storage',
        description:
            'Removes all stored replays and deletes persistent storage.',
    })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({
        description: 'Storage deleted successfully.',
    })
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
        type: StorageStatusDTO,
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
    })
    async listStoredMatches(): Promise<ReplayMetadata[]> {
        return this.replayIOManager.listMatches();
    }

    @Post('matches')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: 200 * 1024 * 1024,
            },
        }),
    )
    async uploadReplayPortable(
        @UploadedFile() file: Express.Multer.File,
        @Query('override') override = 'true',
    ): Promise<void> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (!file.originalname?.toLowerCase().endsWith('.vrp')) {
            throw new BadRequestException('Invalid file type (expected .vrp)');
        }

        if (!file.buffer || file.buffer.length === 0) {
            throw new BadRequestException('Uploaded file is empty');
        }

        await this.replayIOManager.importMatch(
            file.buffer,
            override !== 'false',
        );
    }

    @Get('matches/:matchId')
    @ApiOperation({
        summary: 'Download replay file package',
        description:
            'Streams the replay file package (.vrp) for the specified match.',
    })
    @ApiOkResponse({
        description: 'Replay file stream.',
    })
    async downloadReplayPortable(
        @Param('matchId') matchId: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        if (!(await this.replayIOManager.matchExists(matchId))) {
            throw new NotFoundException(
                `Match ${matchId} not found in storage`,
            );
        }

        const filePath = await this.replayIOManager.exportMatch(matchId);

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
    @ApiNoContentResponse({
        description: 'Match deleted successfully.',
    })
    @ApiNotFoundResponse({
        description: 'Match not found.',
    })
    async deleteStoredMatch(@Param('matchId') matchId: string): Promise<void> {
        if (!(await this.replayIOManager.matchExists(matchId))) {
            throw new NotFoundException(
                `Match ${matchId} not found in storage`,
            );
        }
        await this.replayIOManager.deleteMatch(matchId);
    }

    @Get('storage/matches/:matchId/metadata')
    @ApiOperation({
        summary: 'Get match metadata',
        description: 'Returns detailed metadata for a specific stored match.',
    })
    @ApiOkResponse({
        description: 'Match metadata retrieved.',
    })
    @ApiNotFoundResponse({
        description: 'Match not found.',
    })
    async getMatchMetadata(
        @Param('matchId') matchId: string,
    ): Promise<ReplayMetadata> {
        const metadata = await this.replayIOManager.getMetadata(matchId);
        if (!metadata)
            throw new NotFoundException(
                `Match ${matchId} not found in storage`,
            );
        return metadata;
    }
}
