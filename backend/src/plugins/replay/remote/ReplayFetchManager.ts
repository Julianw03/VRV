import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ReplayIOManager } from '@/plugins/replay/storage/ReplayIOManager';
import { AsyncResult, AsyncResultType, AsyncResultUnion } from '@/utils/AsyncResult';
import {
    PlayerSummary,
    REPLAY_FORMAT_VERSION,
    ReplayMetadata,
    TeamSummary,
} from '@/plugins/replay/storage/ReplayStorageFormat';
import { RiotMatchApiResponse } from '@/caching/ValorantMatchStatsModule/RiotMatchApiResponseDTO';
import { MatchHistoryEntry, RiotValorantAPI } from '@/api/riot/RiotValorantAPI';
import { ValorantMatchStatsManager } from '@/caching/ValorantMatchStatsModule/ValorantMatchStatsManager';
import { EntitlementTokenManager } from '@/caching/EntitlementTokenManager/EntitlementTokenManager';

@Injectable()
export class ReplayFetchManager {
    private readonly logger = new Logger(ReplayFetchManager.name);

    private readonly downloadStates = new Map<string, AsyncResult<void>>();

    constructor(
        private readonly apiClient: RiotValorantAPI,
        private readonly ioManager: ReplayIOManager,
        private readonly tokenManager: EntitlementTokenManager,
        private readonly valorantMatchStatsManager: ValorantMatchStatsManager,
    ) {
    }

    getDownloadState(matchId: string): AsyncResultUnion<void> | null {
        const state = this.downloadStates.get(matchId);
        if (!state) return null;
        return { ...state } as AsyncResultUnion<void>;
    }

    async getRecentMatches(
        startIndex = 0,
        endIndex = 20,
    ): Promise<MatchHistoryEntry[]> {
        const entries = await this.apiClient.getMatchHistory(
            startIndex,
            endIndex,
        );
        entries.forEach((entry) => {
            this.valorantMatchStatsManager.requestMatchFetch(entry.MatchID);
        });
        return entries;
    }

    async triggerDownload(matchId: string): Promise<void> {
        const existing = this.downloadStates.get(matchId);
        if (existing?.type === AsyncResultType.PENDING) {
            return;
        }

        this.downloadStates.set(matchId, AsyncResult.ofPending<void>());

        this.doDownload(matchId)
            .then(() => {
                this.downloadStates.set(
                    matchId,
                    AsyncResult.ofSuccess<unknown>(undefined as never),
                );
            })
            .catch((e: Error) => {
                this.logger.error(`Download failed for match ${matchId}`, e);
                this.downloadStates.set(
                    matchId,
                    AsyncResult.ofFailure<unknown>(e),
                );
            });
    }

    async retryDownload(matchId: string): Promise<void> {
        const state = this.downloadStates.get(matchId);
        if (!state) {
            throw new Error(
                `No download has been triggered for match ${matchId}`,
            );
        }
        if (state.type !== AsyncResultType.FAILURE) {
            throw new Error(
                `Cannot retry a download that is not in FAILURE state`,
            );
        }
        this.downloadStates.delete(matchId);
        await this.triggerDownload(matchId);
    }

    /**
     * Downloads and saves a match to persistent storage, awaiting completion.
     * Skips the download if the match is already present.
     * Unlike triggerDownload, this is synchronous from the caller's perspective.
     */
    async downloadAndSave(matchId: string): Promise<void> {
        if (await this.ioManager.matchExists(matchId)) {
            return;
        }
        await this.doDownload(matchId);
    }

    private async doDownload(matchId: string): Promise<void> {
        const [summary, replayBuffer, matchDetails] = await Promise.all([
            this.apiClient.getReplaySummary(matchId),
            this.apiClient.downloadReplayFile(matchId),
            this.apiClient.getMatchDetails(matchId),
        ]);

        const tokens = this.tokenManager.getView();

        if (!tokens) {
            throw new InternalServerErrorException(
                'Current user\'s account name and tag line not found',
            );
        }

        const metadata = buildMetadata(
            matchId,
            summary.GameVersion,
            replayBuffer.byteLength,
            matchDetails,
            tokens.subject,
        );
        await this.ioManager.saveReplay(matchId, replayBuffer, metadata);
    }
}

function buildMetadata(
    matchId: string,
    gameVersion: string,
    replayFileSize: number,
    matchDetails: RiotMatchApiResponse,
    subject: string,
): ReplayMetadata {
    const { matchInfo, players, teams } = matchDetails;

    const teamSummaries: TeamSummary[] = (teams ?? []).map((t) => ({
        teamId: t.teamId,
        won: t.won,
        roundsWon: t.roundsWon,
        roundsPlayed: t.roundsPlayed,
    }));

    const playerSummaries: PlayerSummary[] = players.map((p) => ({
        puuid: p.subject ?? '',
        gameName: p.gameName ?? '',
        tagLine: p.tagLine ?? '',
        teamId: p.teamId ?? '',
        characterId: p.characterId ?? '',
        kills: p.stats?.kills ?? 0,
        deaths: p.stats?.deaths ?? 0,
        assists: p.stats?.assists ?? 0,
        isObserver: p.isObserver ?? false,
    }));

    return {
        formatVersion: REPLAY_FORMAT_VERSION,
        matchInfo: {
            matchId,
            mapId: matchInfo.mapId,
            queueID: matchInfo.queueID,
            gameStartMillis: matchInfo.gameStartMillis,
            gameLengthMillis: matchInfo.gameLengthMillis,
            isRanked: matchInfo.isRanked,
            gameVersion,
        },
        downloadInfo: {
            downloadedAt: Date.now(),
            downloaderId: subject,
        },
        replayFileSize,
        teams: teamSummaries,
        players: playerSummaries,
    };
}
