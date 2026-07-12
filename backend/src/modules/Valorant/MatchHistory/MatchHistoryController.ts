import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { ProductSessionGuard, RequiredProduct } from '@/modules/ProductSessionModule/ProductSessionGuard';
import { MatchHistoryManager } from '@/modules/Valorant/MatchHistory/MatchHistoryManager';
import { GetRecentMatchesDto } from '@/modules/Valorant/MatchHistory/GetRecentMatchesDTO';
import { GetNewMatchesDto } from '@/modules/Valorant/MatchHistory/GetNewMatchesDTO';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { RiotMatchApiResponseDTO } from '#/dto/RiotMatchApiReponseDTO';

@RequiredProduct('valorant')
@UseGuards(ProductSessionGuard)
@Controller({
    path: 'plugins/history/matches'
})
export class MatchHistoryController {
    private readonly logger = new Logger(MatchHistoryController.name);

    constructor(
        protected readonly matchHistoryManager: MatchHistoryManager,
    ) {
    }

    @Get('recent')
    @ApiOperation({
        summary: 'Get recent matches',
        description: 'Get matches older than a specified matchId'
    })
    @ApiOkResponse({
        description: 'List of recent matches sorted from most to least recent matches (older than the cursor).',
        type: RiotMatchApiResponseDTO,
        isArray: true
    })
    async getRecentMatches(
        @Query() query: GetRecentMatchesDto
    ) {
        this.logger.debug(`Getting recent matches recent matches`, query);
        const data = await this.matchHistoryManager.getMatchDataAfter(
            query.after ?? null,
            query.limit
        )
        return Object.values(data).sort((a, b) => b.matchInfo.gameStartMillis - a.matchInfo.gameStartMillis)
    }


    @Get('new')
    @ApiOperation({
        summary: 'Get new matches',
        description: 'Get matches newer than a specified matchId'
    })
    @ApiOkResponse({
        description: 'List of new matches sorted from newest to least recent matches (newer than the cursor)',
        type: RiotMatchApiResponseDTO,
        isArray: true
    })
    async getNewMatches(
        @Query() query: GetNewMatchesDto
    ) {
        this.logger.debug(`Getting new matches`, query);
        const data = await this.matchHistoryManager.getMatchDataBefore(
            query.since,
            query.limit
        )

        return Object.values(data).sort((a, b) => b.matchInfo.gameStartMillis - a.matchInfo.gameStartMillis)
    }
}