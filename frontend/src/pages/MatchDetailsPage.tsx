import { type JSX, useState } from 'react';
import { groupBy, groupByUnique } from '@/lib/utils.ts';
import { RoundOverviewTab } from '@/components/match-details/RoundOverviewTab.tsx';
import { VersusTab } from '@/components/match-details/VersusTab.tsx';
import { useMatchMetadata } from '@/lib/queries.ts';
import { type Params, useParams } from 'react-router-dom';
import { MatchOverviewHeader, type MatchOverviewHeaderProps } from '@/components/advancedDetails/MatchOverviewHeader.tsx';
import { RiotMatchTeam, type TWO_TEAMS_TEAM_ID } from '#/dto/RiotMatchApiReponseDTO.ts';

const TABS = {
    ROUND_OVERVIEW: 'RoundOverview',
    VERSUS: 'Versus',
} as const;

type Tab = typeof TABS[keyof typeof TABS];

const MatchDetailsPage = (): JSX.Element => {
    const { matchId } = useParams<Params>();
    const { data, isLoading, isError } = useMatchMetadata(matchId || '');
    //TODO: Tab selection.
    const [tab] = useState<Tab>(TABS.ROUND_OVERVIEW);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError || data === undefined) {
        return <div>Error loading match data.</div>;
    }

    const highlightPlayer = data.downloadInfo.downloaderId

    const highlightPlayerTeam = data.players.find(p => p.puuid === highlightPlayer)?.teamId;
    const winningTeam = data.teams.find(it => it.won);
    const teamsById = groupByUnique((t => t.teamId), ...data.teams) as Record<TWO_TEAMS_TEAM_ID, RiotMatchTeam>;
    const matchOverviewHeaderData: MatchOverviewHeaderProps = {
        teams: teamsById,
        mapId: data.matchInfo.mapId,
        winningTeam: winningTeam?.teamId as TWO_TEAMS_TEAM_ID | undefined,
        userTeam: highlightPlayerTeam as TWO_TEAMS_TEAM_ID | undefined,
        startTimeMillis: data.matchInfo.gameStartMillis,
        queueId: data.matchInfo.queueID,
        durationMillis: data.matchInfo.gameLengthMillis,
    };

    if (data.formatVersion === 1) {
        return <div>Replay Version 1 doesnt support this view :(</div>;
    }

    const activePlayersByTeam = groupBy((p => p.teamId), ...data.players.filter(p => !p.isObserver)!);

    if (Object.keys(activePlayersByTeam).length !== 2) {
        return <div>Not supported...</div>;
    }

    switch (tab) {
        case TABS.ROUND_OVERVIEW:
            return (
                <>
                    <MatchOverviewHeader data={matchOverviewHeaderData} />
                    <RoundOverviewTab data={data} highlightPlayerUuid={highlightPlayer} /></>
            );
        case TABS.VERSUS:
            return <>
                <MatchOverviewHeader data={matchOverviewHeaderData} />
                <VersusTab data={data} />
            </>;
    }

};

export default MatchDetailsPage;
