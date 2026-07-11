import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
    PlayerSummary,
    CURRENT_REPLAY_FORMAT_VERSION,
    ReplayMetadata,
    RoundResult,
    TeamSummary,
} from '@/modules/Valorant/ValorantReplays/storage/ReplayStorageFormat';
import { MatchHistoryEntry, RiotValorantAPIManager } from '@/integrations/riot/RiotValorantAPIManager';
import { ValorantMatchStatsManager } from '@/modules/Valorant/ValorantMatchStatsModule/ValorantMatchStatsManager';
import { EntitlementTokenManager } from '@/modules/EntitlementTokenModule/EntitlementTokenManager';
import { PuuidToPlayerAliasManager } from '@/modules/PuuidToPlayerAliasModule/PuuidToPlayerAliasManager';
import { RiotMatchApiResponseDTO } from '#/dto/RiotMatchApiReponseDTO';

export interface CombinedReplayData {
    metadata: ReplayMetadata;
    replayBuffer: Buffer;
    matchDetails: RiotMatchApiResponseDTO;
}

@Injectable()
export class ReplayFetchManager {
    private readonly logger = new Logger(ReplayFetchManager.name);

    constructor(
        private readonly apiClient: RiotValorantAPIManager,
        private readonly tokenManager: EntitlementTokenManager,
        private readonly puuidManager: PuuidToPlayerAliasManager,
    ) {
    }



    public async fetchCombinedReplayData(matchId: string): Promise<CombinedReplayData> {
        const [summary, replayBuffer, matchDetails] = await Promise.all([
            this.apiClient.getReplaySummary(matchId),
            this.apiClient.downloadReplayFile(matchId),
            this.apiClient.getMatchDetails(matchId),
        ]);


        const puuids = matchDetails.players
            .map((p) => p.subject)
            .filter((p) => p !== undefined);

        try {
            this.puuidManager.requestBatchFetch(puuids);
            const resolveMap = await this.puuidManager.getBestEffortBatchedResult(puuids, 5_000);

            for (const matchDetail of matchDetails?.players ?? []) {
                const resolvedAlias = resolveMap[matchDetail.subject ?? ''];
                if (resolvedAlias) {
                    matchDetail.gameName = resolvedAlias.gameName;
                    matchDetail.tagLine = resolvedAlias.tagLine;
                }
            }
        } catch (error) {
            this.logger.warn(
                'Failed to resolve player aliases for replay metadata. Proceeding with unresolved puuids.',
                error,
            );
        }

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
        return {
            metadata,
            replayBuffer,
            matchDetails,
        };
    }
}

function buildMetadata(
    matchId: string,
    gameVersion: string,
    replayFileSize: number,
    matchDetails: RiotMatchApiResponseDTO,
    subject: string,
): ReplayMetadata {
    const { matchInfo, players, teams, roundResults, kills } = matchDetails;

    const teamSummaries: TeamSummary[] = (teams ?? []).map((t) => ({
        teamId: t.teamId,
        won: t.won,
        roundsWon: t.roundsWon,
        roundsPlayed: t.roundsPlayed,
        numPoints: t.numPoints,
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
        competitiveTier: p.competitiveTier ?? 0,
        score: p.stats?.score ?? 0,
        roundsPlayed: p.stats?.roundsPlayed ?? 0,
        playtimeMillis: p.stats?.playtimeMillis ?? 0,
        abilityCasts: p.stats?.abilityCasts ?? {
            grenadeCasts: 0,
            ability1Casts: 0,
            ability2Casts: 0,
            ultimateCasts: 0,
        },
    }));

    const roundResultSummaries: RoundResult[] = (roundResults ?? []).map((r) => ({
        roundNum: r.roundNum ?? 0,
        roundResult: r.roundResult ?? '',
        roundCeremony: r.roundCeremony ?? '',
        roundResultCode: r.roundResultCode ?? '',
        winningTeam: r.winningTeam ?? '',
        winningTeamRole: r.winningTeamRole ?? '',
        bombPlanter: r.bombPlanter,
        plantRoundTime: r.plantRoundTime,
        plantPlayerLocations: r.plantPlayerLocations ?? undefined,
        plantLocation: r.plantLocation,
        plantSite: r.plantSite,
        defuseRoundTime: r.defuseRoundTime,
        defusePlayerLocations: r.defusePlayerLocations ?? undefined,
        defuseLocation: r.defuseLocation,
        playerStats: (r.playerStats ?? []).map((ps) => ({
            subject: ps.subject ?? '',
            score: ps.score ?? 0,
            kills: ps.kills ?? [],
            damage: ps.damage ?? [],
            economy: ps.economy ?? { loadoutValue: 0, weapon: '', armor: '', remaining: 0, spent: 0 },
            wasAfk: ps.wasAfk ?? false,
            wasPenalized: ps.wasPenalized ?? false,
            stayedInSpawn: ps.stayedInSpawn ?? false,
        })),
        playerEconomies: r.playerEconomies ?? [],
        playerScores: r.playerScores ?? [],
    }));

    return {
        formatVersion: CURRENT_REPLAY_FORMAT_VERSION,
        matchInfo: {
            matchId,
            mapId: matchInfo.mapId,
            queueID: matchInfo.queueID,
            gameStartMillis: matchInfo.gameStartMillis,
            gameLengthMillis: matchInfo.gameLengthMillis,
            isRanked: matchInfo.isRanked,
            isReplayRecorded: matchInfo.isReplayRecorded,
            gameVersion,
        },
        downloadInfo: {
            downloadedAt: Date.now(),
            downloaderId: subject,
        },
        replayFileSize,
        teams: teamSummaries,
        players: playerSummaries,
        roundResults: roundResultSummaries,
        kills: (kills ?? []).map((k) => ({
            gameTime: k.gameTime ?? 0,
            round: k.round ?? 0,
            roundTime: k.roundTime ?? 0,
            killer: k.killer ?? '',
            victim: k.victim ?? '',
            victimLocation: k.victimLocation ?? { x: 0, y: 0 },
            assistants: k.assistants ?? [],
            playerLocations: k.playerLocations ?? [],
            finishingDamage: k.finishingDamage!!,
        })),
    };
}
