import { type JSX, useState } from 'react';
import { groupBy, groupByUnique } from '@/lib/utils.ts';
import { RoundOverviewTab } from '@/components/match-details/RoundOverviewTab.tsx';
import { VersusTab } from '@/components/match-details/VersusTab.tsx';
import { useMatchMetadata } from '@/lib/queries.ts';
import { type Params, useParams } from 'react-router-dom';
import { MatchOverviewHeader, type MatchOverviewHeaderProps } from '@/components/advancedDetails/MatchOverviewHeader.tsx';
import { TWO_TEAM_IDS, type RiotMatchTeam, type TWO_TEAMS_TEAM_ID } from '#/schemas/RiotMatchApiReponseDTO.ts';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';

const TABS = {
    ROUND_OVERVIEW: 'RoundOverview',
    VERSUS: 'Versus',
} as const;

type Tab = typeof TABS[keyof typeof TABS];

const TeamPerspectiveSelector = (
    {
        teams,
        selectedTeam,
        onSelectTeam,
    }: {
        teams: Record<TWO_TEAMS_TEAM_ID, RiotMatchTeam>;
        selectedTeam: TWO_TEAMS_TEAM_ID;
        onSelectTeam: (teamId: TWO_TEAMS_TEAM_ID) => void;
    },
) => {
    return (
        <div className={'flex items-center gap-2 px-3 pb-3 text-sm'}>
            <span className={'text-muted-foreground'}>Viewing as</span>
            {Object.keys(teams).map((teamId) => (
                <Button
                    key={teamId}
                    type={'button'}
                    variant={selectedTeam === teamId ? 'default' : 'outline'}
                    size={'sm'}
                    className={cn(selectedTeam === teamId && 'pointer-events-none')}
                    onClick={() => onSelectTeam(teamId as TWO_TEAMS_TEAM_ID)}
                >
                    {teamId} Team
                </Button>
            ))}
        </div>
    );
};

const MatchDetailsPage = (): JSX.Element => {
    const { matchId } = useParams<Params>();
    const { data, isLoading, isError } = useMatchMetadata(matchId || '');
    //TODO: Tab selection.
    const [tab] = useState<Tab>(TABS.ROUND_OVERVIEW);
    const [selectedTeam, setSelectedTeam] = useState<TWO_TEAMS_TEAM_ID>(TWO_TEAM_IDS.RED);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError || data === undefined) {
        return <div>Error loading match data.</div>;
    }

    const hasHighlightPlayer = !!data.downloaderMetadata;

    const highlightPlayer = data.downloaderMetadata?.downloaderId;

    const highlightPlayerTeam: TWO_TEAMS_TEAM_ID | undefined = hasHighlightPlayer
        ? data.riotMatchMetadata.matchMetadata.players.find(p => p.subject === highlightPlayer)?.teamId as TWO_TEAMS_TEAM_ID | undefined
        : selectedTeam;
    const winningTeam = data.riotMatchMetadata.matchMetadata.teams.find(it => it.won);
    const teamsById = groupByUnique((t => t.teamId), ...data.riotMatchMetadata.matchMetadata.teams) as Record<TWO_TEAMS_TEAM_ID, RiotMatchTeam>;
    const matchOverviewHeaderData: MatchOverviewHeaderProps = {
        teams: teamsById,
        mapId: data.riotMatchMetadata.matchMetadata.matchInfo.mapId,
        winningTeam: winningTeam?.teamId as TWO_TEAMS_TEAM_ID | undefined,
        userTeam: highlightPlayerTeam,
        startTimeMillis: data.riotMatchMetadata.matchMetadata.matchInfo.gameStartMillis,
        queueId: data.riotMatchMetadata.matchMetadata.matchInfo.queueID,
        durationMillis: data.riotMatchMetadata.matchMetadata.matchInfo.gameLengthMillis,
    };

    if (data.formatVersion === 1) {
        return <div>Replay Version 1 doesnt support this view :(</div>;
    }

    const activePlayersByTeam = groupBy((p => p.teamId), ...data.riotMatchMetadata.matchMetadata.players.filter(p => !p.isObserver)!);

    if (Object.keys(activePlayersByTeam).length !== 2) {
        return <div>Not supported...</div>;
    }

    switch (tab) {
        case TABS.ROUND_OVERVIEW:
            return (
                <>
                    <MatchOverviewHeader data={matchOverviewHeaderData} />
                    {!hasHighlightPlayer && (
                        <TeamPerspectiveSelector
                            teams={teamsById}
                            selectedTeam={selectedTeam}
                            onSelectTeam={setSelectedTeam}
                        />
                    )}
                    <RoundOverviewTab data={data} highlightPlayerUuid={highlightPlayer} highlightPlayerTeam={highlightPlayerTeam} /></>
            );
        case TABS.VERSUS:
            return <>
                <MatchOverviewHeader data={matchOverviewHeaderData} />
                {!hasHighlightPlayer && (
                    <TeamPerspectiveSelector
                        teams={teamsById}
                        selectedTeam={selectedTeam}
                        onSelectTeam={setSelectedTeam}
                    />
                )}
                <VersusTab data={data} />
            </>;
    }

};

export default MatchDetailsPage;
