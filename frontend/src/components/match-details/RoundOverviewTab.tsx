import { useState } from 'react';
import { groupByUnique } from '@/lib/utils.ts';
import {
    type Kill,
    type RiotMatchApiResponse,
    type RoundResult,
    TWO_TEAM_IDS,
    TWO_TEAM_ROLE_IDS,
    type TWO_TEAMS_ROLE_ID,
    type TWO_TEAMS_TEAM_ID,
} from '@/lib/api.ts';
import { RoundTimeline, type RoundTimelineData } from '@/components/advancedDetails/RoundTimeline.tsx';
import { buildRoundChips, RoundSelectorStrip } from '@/components/advancedDetails/RoundSelectorStrip.tsx';
import {
    type EconomyPlayerRow,
    type RoundEconomyData,
    RoundEconomyOverview,
} from '@/components/advancedDetails/RoundEconomyOverview.tsx';

function roundDuration(r: RoundResult, kills: Kill[]): number {
    let last = 0;
    for (const k of kills) last = Math.max(last, k.roundTime);
    if (r.plantRoundTime) last = Math.max(last, r.plantRoundTime);
    if (r.defuseRoundTime) last = Math.max(last, r.defuseRoundTime);
    return Math.min(last + 5_000);
}

function deriveRolesRoundResult(
    result: RoundResult,
): Record<TWO_TEAMS_TEAM_ID, TWO_TEAMS_ROLE_ID> {
    const winningTeamRole = result.winningTeamRole;
    const winningTeam = result.winningTeam;

    const ret = {} as Record<TWO_TEAMS_TEAM_ID, TWO_TEAMS_ROLE_ID>;
    ret[winningTeam] = winningTeamRole;

    const losingTeam = Object.values(TWO_TEAM_IDS).find(t => t !== winningTeam);
    const losingTeamRole = Object.values(TWO_TEAM_ROLE_IDS).find(r => r !== winningTeamRole);

    ret[losingTeam] = losingTeamRole;

    return ret;
}

function roundTimeline(
    match: RiotMatchApiResponse,
    roundNum: number,
): RoundTimelineData {
    const roundResult = match.roundResults.find((x) => x.roundNum === roundNum);
    const kills = match.kills.filter(k => k.round === roundNum);
    const duration = roundDuration(roundResult, kills);

    const roles = deriveRolesRoundResult(roundResult);

    const players = groupByUnique(f => f.puuid, ...match.players);

    return {
        roundNum,
        durationMs: duration,
        kills: kills.map((k, i) => ({
            roundTimeMs: k.roundTime,
            killerId: k.killer,
            killerSide: roles[players[k.killer].teamId],
            killerAgentId: players[k.killer]?.characterId,
            weaponIconUrl: k.finishingDamage?.damageItem,
            headshot: (k.finishingDamage?.damageType || '').toLowerCase() === 'head',
            firstBlood: i === 0,
        })),
        plant: roundResult.plantRoundTime ? { roundTimeMs: roundResult.plantRoundTime } : undefined,
        defuse: roundResult.defuseRoundTime ? { roundTimeMs: roundResult.defuseRoundTime } : undefined,
    };
}

function roundEconomy(
    match: RiotMatchApiResponse,
    roundNum: number,
): RoundEconomyData {
    const roundResult = match.roundResults.find((x) => x.roundNum === roundNum);
    const roles = deriveRolesRoundResult(roundResult);
    const players = groupByUnique(f => f.puuid, ...match.players);

    const rows = roundResult.playerStats.map((stat): EconomyPlayerRow => {
        const player = players[stat.subject];
        return {
            subject: stat.subject,
            agentId: player?.characterId,
            gameName: player?.gameName ?? '',
            tagLine: player?.tagLine ?? '',
            weaponId: stat.economy.weapon,
            armorId: stat.economy.armor,
            remaining: stat.economy.remaining,
            moneySpend: stat.economy.spent,
            loadoutValue: stat.economy.loadoutValue
        };
    });

    const attackers = rows.filter((row) => roles[players[row.subject].teamId] === TWO_TEAM_ROLE_IDS.ATTACKER);
    const defenders = rows.filter((row) => roles[players[row.subject].teamId] === TWO_TEAM_ROLE_IDS.DEFENDER);

    return {
        roundNum,
        attackers,
        defenders,
        attackerTotal: attackers.reduce((sum, row) => sum + row.moneySpend, 0),
        defenderTotal: defenders.reduce((sum, row) => sum + row.moneySpend, 0),
    };
}

export interface RoundOverviewTabProps {
    data: RiotMatchApiResponse;
    highlightPlayerUuid: UUID | undefined;
}

export function RoundOverviewTab({ data, highlightPlayerUuid }: RoundOverviewTabProps) {
    const [selectedRound, setSelectedRound] = useState<number>(1);
    const highlightPlayerTeam = data.players.find(p => p.puuid === highlightPlayerUuid)?.teamId;

    return (
        <>

            <RoundSelectorStrip
                chips={buildRoundChips(data.roundResults, data.players, highlightPlayerTeam as TWO_TEAMS_TEAM_ID)}
                selectedRound={selectedRound}
                onSelect={setSelectedRound}
            />
            <RoundTimeline
                data={roundTimeline(data, selectedRound)}
            />
            <RoundEconomyOverview
                data={roundEconomy(data, selectedRound)}
                highlightPlayer={highlightPlayerUuid}
            />
        </>
    );
}
