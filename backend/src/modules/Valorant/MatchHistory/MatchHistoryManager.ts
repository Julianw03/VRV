import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RiotValorantAPIManager } from '@/integrations/riot/RiotValorantAPIManager';
import { ValorantMatchStatsManager } from '@/modules/Valorant/ValorantMatchStatsModule/ValorantMatchStatsManager';
import { DataDeletable } from '@/core/data/interfaces/capabilities/DataDeletable';
import { SimpleEventBus } from '@/core/events/SimpleEventBus';
import { Subscription } from 'rxjs';
import { onSource } from '@/core/events/adapters/rxjsAdapters';
import { ValorantGameSessionManager } from '@/modules/Valorant/ValorantGameSessionModule/ValorantGameSessionManager';
import { EventType } from '@/core/events/EventTypes';
import { MatchStatus } from '@/modules/Valorant/ValorantGameSessionModule/MatchStatus';
import { KeyValueUpdatedEvent } from '@/core/events/BasicEvent';
import { RiotMatchApiResponseDTO } from '#/dto/RiotMatchApiReponseDTO';

@Injectable()
export class MatchHistoryManager implements DataDeletable, OnModuleInit {
    private readonly orderedMatchIds: UUID[] = [];
    private readonly knownMatchIds = new Set<UUID>();
    private readonly logger = new Logger(MatchHistoryManager.name);

    private loadingMore: Promise<void> | null = null;
    private remoteMatchHistoryEndReached = false;
    private subscription$: Subscription;

    constructor(
        private readonly riot: RiotValorantAPIManager,
        private readonly eventBus: SimpleEventBus,
        private readonly stats: ValorantMatchStatsManager,
    ) {
    }

    onModuleInit() {
        this.subscription$ = onSource(this.eventBus, ValorantGameSessionManager.name)
            .subscribe((it) => {
                    switch (it.type) {
                        case EventType.KeyValueUpdated: {
                            const typed = it as KeyValueUpdatedEvent<UUID, MatchStatus>;
                            if (typed.payload.value !== MatchStatus.ENDED) return;
                            this.logger.debug(`Match ${typed.payload.key} has ended, prepending to match history`);
                            /**
                             * This is correct under the assumption that a new match that ended is, well
                             * always new and therefore prepending this should be valid.
                             * This should in theory also work if multiple
                             * */
                            this.prepend(typed.payload.key);
                        }
                    }
                },
            );
    }


    deleteState(): void {
        this.orderedMatchIds.length = 0;
        this.knownMatchIds.clear();
        this.loadingMore = null;
        this.remoteMatchHistoryEndReached = false;
    }

    private prepend(matchId: UUID): void {
        if (this.knownMatchIds.has(matchId)) {
            this.logger.debug(`Prepend for ${ matchId } cancelled: Key already registered.`);
            return;
        }

        this.knownMatchIds.add(matchId);
        this.orderedMatchIds.unshift(matchId);

        this.logger.debug(`Match ${matchId} has been registered. Match data is being requested...`);
        this.stats.requestMatchFetch(matchId);
    }

    private async loadMore(count = 20): Promise<void> {
        if (this.remoteMatchHistoryEndReached) {
            this.logger.debug("Wont load more data: External API has reached its limit.")
            return;
        }

        if (this.loadingMore) {
            this.logger.debug("A load is in progress, wont start new one.")
            return this.loadingMore;
        }

        this.loadingMore = this.doLoadMore(count);

        try {
            await this.loadingMore;
        } finally {
            this.loadingMore = null;
        }
    }

    private async doLoadMore(count = 20): Promise<void> {
        /**
         * We use the fact that we (hopefully) have received new matches and therefore
         * have our offset into the pagination as a nice side effect.
         * */
        const page = await this.riot.getMatchHistory(
            this.orderedMatchIds.length,
            this.orderedMatchIds.length + count,
        );

        if (page.length < count) {
            this.logger.debug("We've seem to have hit the end of the match history. Marking as exhausted.")
            this.remoteMatchHistoryEndReached = true;
        }

        page
            .sort((a, b) => b.GameStartTime - a.GameStartTime)
            .forEach(entry => {
                if (this.knownMatchIds.has(entry.MatchID)) {
                    return;
                }

                this.knownMatchIds.add(entry.MatchID);
                this.orderedMatchIds.push(entry.MatchID);

                this.stats.requestMatchFetch(entry.MatchID);
            });
    }

    public async getMatchIdsAfter(
        afterMatchId: UUID | null,
        limit = 10,
    ): Promise<UUID[]> {
        if (afterMatchId === null) {
            this.logger.debug("No after provided, will therefore use / return our latest (newest) match data.")
            if (this.orderedMatchIds.length < limit) {
                await this.loadMore();
            }

            return this.orderedMatchIds.slice(0, limit);
        }

        const index = this.orderedMatchIds.indexOf(afterMatchId);
        if (index === -1) {
            /**
             * TODO:
             * This should propagate as an error probably to make it clear to the client that the requests must be done
             * sequentially and cant just use any random "pointer".
             **/
            return [];
        }

        const available = this.orderedMatchIds.length - (index + 1);

        const missing = limit - available;

        if (missing > 0 && !this.remoteMatchHistoryEndReached) {
            await this.loadMore(Math.min(missing, 20));
        }

        return this.orderedMatchIds.slice(index + 1, index + 1 + limit);
    }

    public async getMatchDataAfter(
        afterMatchId: UUID | null,
        limit = 10,
    ): Promise<Record<UUID, RiotMatchApiResponseDTO>> {
        const ids = await this.getMatchIdsAfter(afterMatchId, limit);

        return this.stats.getBestEffortBatchedResult(
            ids,
            5_000,
        );
    }

    public async getMatchIdsBefore(
        beforeMatchId: UUID,
        limit = 10,
    ): Promise<UUID[]> {
        const index = this.orderedMatchIds.indexOf(beforeMatchId);

        if (index === -1) {
            return [];
        }

        const start = Math.max(0, index - limit);

        return this.orderedMatchIds.slice(start, index);
    }

    public async getMatchDataBefore(
        beforeMatchId: UUID,
        limit = 10,
    ): Promise<Record<UUID, RiotMatchApiResponseDTO>> {
        const ids = await this.getMatchIdsBefore(
            beforeMatchId,
            limit,
        );

        return this.stats.getBestEffortBatchedResult(
            ids,
            5_000,
        );
    }
}