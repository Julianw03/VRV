import {
    BadRequestException,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Logger,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiAcceptedResponse, ApiOperation } from '@nestjs/swagger';
import { ReplayIOManager } from '@/modules/Valorant/ValorantReplays/storage/ReplayIOManager';
import { ProductSessionGuard, RequiredProduct } from '@/modules/ProductSessionModule/ProductSessionGuard';
import { DownloadStateDTO } from '#/schemas/DownloadState.schema';

@RequiredProduct('valorant')
@UseGuards(ProductSessionGuard)
@Controller({
    path: 'plugins/replay/remote',
})
export class ReplayRemoteController {
    private readonly logger = new Logger(ReplayRemoteController.name);

    constructor(
        protected readonly replayIOManager: ReplayIOManager,
    ) {
    }

    @Post('matches/recent/:matchId/download')
    @ApiOperation({
        summary: 'Trigger replay download',
        description: 'Starts downloading replay data for a given match.',
    })
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiAcceptedResponse({
        description: 'Download triggered.',
    })
    async triggerDownload(@Param('matchId') matchId: string): Promise<void> {
        this.replayIOManager.triggerDownload(matchId);
    }

    @Post('matches/recent/:matchId/download/retry')
    @ApiOperation({
        summary: 'Retry replay download',
        description: 'Retries a failed replay download for a given match.',
    })
    @HttpCode(HttpStatus.ACCEPTED)
    async retryDownload(@Param('matchId') matchId: string): Promise<void> {
        this.replayIOManager.triggerDownload(matchId, true);
    }

    @Get('matches/recent/:matchId/download/state')
    @ApiOperation({
        summary: 'Get download state',
        description: 'Returns current status of a replay download job.',
    })
    async getDownloadState(
        @Param('matchId') matchId: string,
    ): Promise<DownloadStateDTO | null> {
        const entryView = this.replayIOManager.getKeyView(matchId);
        if (entryView === null) {
            throw new BadRequestException(`No download job found for match ${matchId}`);
        }
        return entryView;
    }
}
