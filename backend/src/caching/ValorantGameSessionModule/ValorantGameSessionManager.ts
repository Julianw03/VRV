import { SimpleUUID } from '@/caching/ValorantMatchStatsModule/RiotMatchApiResponseDTO';
import { Injectable } from '@nestjs/common';
import { EmittingMapDataManager } from '@/caching/base/EmittingMapDataManager';
import { SimpleEventBus } from '@/events/SimpleEventBus';
import { MatchStatus } from '@/caching/ValorantGameSessionModule/MatchStatus';

@Injectable()
export class ValorantGameSessionManager extends EmittingMapDataManager<
    SimpleUUID,
    MatchStatus,
    MatchStatus
> {
    constructor(protected readonly eventBus: SimpleEventBus) {
        super(eventBus);
    }

    private latestMatchId: SimpleUUID | null = null;

    private static ValidTransitionStates: Record<MatchStatus, MatchStatus[]> = {
        [MatchStatus.CHAMPION_SELECTION]: [
            MatchStatus.IN_PROGRESS,
            MatchStatus.ASSUMED_CANCELLED,
        ],
        [MatchStatus.IN_PROGRESS]: [MatchStatus.ENDED],
        [MatchStatus.ENDED]: [],
        // An example would be quitting a deathmatch game, while its in progress,
        // We could start another game right after, but the game would later on end
        // so we need to allow this transition
        [MatchStatus.ASSUMED_CANCELLED]: [MatchStatus.ENDED],
    };

    protected async resetInternalState(): Promise<void> {
        this.latestMatchId = null;
    }

    public notifyMatchState(matchId: SimpleUUID, status: MatchStatus): void {
        const currentStatus = this.getEntryView(matchId);
        if (currentStatus === status) {
            return;
        }

        if (!this.verifyTransition(currentStatus, status)) {
            this.logger.warn(
                `Invalid state transition for matchId ${matchId} from ${currentStatus} to ${status}`,
            );
            return;
        }

        if (matchId !== this.latestMatchId) {
            this.logger.log(
                `Registering new current matchId ${matchId}, was ${this.latestMatchId}`,
            );
            this.handleNewMatchId(matchId);
        }

        this.logger.log(
            `Received match state update for Valorant matchId ${matchId} to status ${status}`,
        );
        this.logger.log('Latest matchId is', this.latestMatchId);
        this.setKeyValue(matchId, status);
    }

    private handleNewMatchId(newMatchId: SimpleUUID): void {
        const previousMatchId = this.latestMatchId;
        this.latestMatchId = newMatchId;
        if (previousMatchId === null) return;
        const previousStatus = this.getEntryView(previousMatchId);
        if (
            !this.matchRegistered(newMatchId) &&
            this.verifyTransition(previousStatus, MatchStatus.ASSUMED_CANCELLED)
        ) {
            this.logger.log(
                'Previous match was not ended, we will assume that it was cancelled',
            );
            this.setKeyValue(previousMatchId, MatchStatus.ASSUMED_CANCELLED);
        }
    }

    private matchRegistered(matchId: SimpleUUID): boolean {
        return this.getEntryView(matchId) !== null;
    }

    private verifyTransition(
        oldStatus: MatchStatus | null,
        newStatus: MatchStatus,
    ): boolean {
        if (oldStatus === null) {
            return true;
        }

        const validTransitions =
            ValorantGameSessionManager.ValidTransitionStates[oldStatus] || [];
        return validTransitions.includes(newStatus);
    }

    protected getViewForValue(value: MatchStatus | null): MatchStatus | null {
        return value;
    }

    setKeyValue(key: SimpleUUID, value: MatchStatus) {
        const prev = this.getEntryView(key);
        if (!this.verifyTransition(prev, value)) return;
        const prevMatchId = this.latestMatchId;
        if (prev === null) {
            this.latestMatchId = key;
            if (prevMatchId !== null) {
                this.logger.log(
                    `Got a new match id ${key} that will replace ${prevMatchId} -> Attempting to transition it to ${MatchStatus.ASSUMED_CANCELLED}`,
                );
                this.setKeyValue(prevMatchId, MatchStatus.ASSUMED_CANCELLED);
            }
        }
        super.setKeyValue(key, value);
    }
}
