import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils.ts';
import SlantedDisplay, { FacingDirections } from '@/components/advancedDetails/SlantedDisplay.tsx';
import AgentDisplayComponent from '@/components/advancedDetails/AgentDisplayComponent.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.tsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { type RiotMatchPlayer, TWO_TEAM_IDS, type TWO_TEAMS_TEAM_ID } from '#/schemas/RiotMatchApiReponseDTO.ts';
import type { GUID } from '#/schemas/GUIDSchema.ts';
import type { ReplayMetadataV2 } from '#/schemas/ReplayFormatV2.schema.ts';
import {
    buildDuelSummary,
    buildMatchIndex,
    buildPlayerStats,
    displayName,
    type DuelEvent,
    formatRoundTime,
    type MatchIndex,
    topFragger,
    type VersusPlayerStats,
} from '@/lib/versusStats.ts';
import { useWeaponRegistry } from '@/lib/queries.ts';

const TEAM_STYLES: Record<TWO_TEAMS_TEAM_ID, { text: string; glow: string }> = {
    [TWO_TEAM_IDS.RED]: {
        text: 'text-rose-500 dark:text-rose-400',
        // drop-shadow follows the alpha channel, so the glow traces the slanted edge.
        glow: 'drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]',
    },
    [TWO_TEAM_IDS.BLUE]: {
        text: 'text-sky-500 dark:text-sky-400',
        glow: 'drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]',
    },
};

const number0 = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const number2 = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = (n: number) => `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;

// ---------------------------------------------------------------------------
// Selector
// ---------------------------------------------------------------------------

const PlayerPick = ({

                        label,
                        selected,
                        children,
                    }: {
    teamId: TWO_TEAMS_TEAM_ID;
    label: string;
    selected: boolean;
    children: React.ReactNode;
}) => (
    // No onClick: SlantedDisplay's item wrapper already handles it. The button is here
    // for focus — Enter/Space fire a click that bubbles up to that wrapper.
    <button
        type={'button'}
        aria-pressed={selected}
        aria-label={`Compare ${label}`}
        className={cn(
            'h-full w-full cursor-pointer transition duration-200 motion-reduce:transition-none',
            // ring-inset, because the parent's clipPath would cut off an outset ring.
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
            selected
                ? cn('opacity-100')
                : 'opacity-40 grayscale hover:opacity-80 hover:grayscale-0',
        )}
    >
        {children}
    </button>
);

const TeamStrip = ({
                       index,
                       teamId,
                       players,
                       tilt,
                       gap,
                       tiltTowards,
                       selectedId,
                       onSelect,
                   }: {
    index: MatchIndex;
    teamId: TWO_TEAMS_TEAM_ID;
    players: RiotMatchPlayer[];
    tilt: number;
    gap: number;
    tiltTowards: typeof FacingDirections[keyof typeof FacingDirections];
    selectedId: GUID | undefined;
    onSelect: (subject: GUID) => void;
}) => (
    <SlantedDisplay
        tilt={tilt}
        gap={gap}
        tiltTowards={tiltTowards}
        items={players}
        // Controlled: selectedId is the single source of truth, so the widened item and
        // the highlight can't drift apart. Without this, SlantedDisplay's internalIndex
        // starts at 0 while selectedId starts at the top fragger.
        activeIndex={Math.max(0, players.findIndex((p) => p.subject === selectedId))}
        onActiveIndexChange={(next) => {
            const player = players[next];
            if (player) onSelect(player.subject);
        }}
        renderItem={(teamEntry, props) => {
            const name = displayName(index, teamEntry.subject);
            return (
                <PlayerPick
                    teamId={teamId}
                    label={`${name.gameName}#${name.tagLine}`}
                    selected={props.isSelected}
                >
                    <AgentDisplayComponent
                        agentId={teamEntry.characterId}
                        gameName={name.gameName}
                        tagLine={name.tagLine}
                        {...props}
                    />
                </PlayerPick>
            );
        }}
    />
);

// ---------------------------------------------------------------------------
// Shared row
// ---------------------------------------------------------------------------

interface StatRowProps {
    label: string;
    left: number;
    right: number;
    leftLabel?: string;
    rightLabel?: string;
    leftTeam: TWO_TEAMS_TEAM_ID;
    rightTeam: TWO_TEAMS_TEAM_ID;
    lowerIsBetter?: boolean;
}

const StatRow = ({
                     label,
                     left,
                     right,
                     leftLabel,
                     rightLabel,
                     leftTeam,
                     rightTeam,
                     lowerIsBetter = false,
                 }: StatRowProps) => {
    const leftLeads = lowerIsBetter ? left < right : left > right;
    const rightLeads = lowerIsBetter ? right < left : right > left;

    return (
        <div className={'grid grid-cols-3 items-center gap-3 py-1.5'}>
            <span
                className={cn(
                    'text-right text-sm tabular-nums',
                    leftLeads ? cn('font-semibold', TEAM_STYLES[leftTeam].text) : 'text-muted-foreground',
                )}
            >
                {leftLabel ?? number0(left)}
            </span>
            <span className={'text-center text-xs text-muted-foreground'}>{label}</span>
            <span
                className={cn(
                    'text-sm tabular-nums',
                    rightLeads ? cn('font-semibold', TEAM_STYLES[rightTeam].text) : 'text-muted-foreground',
                )}
            >
                {rightLabel ?? number0(right)}
            </span>
        </div>
    );
};

const NameRow = ({ left, right }: { left: VersusPlayerStats; right: VersusPlayerStats }) => (
    <div className={'grid grid-cols-3 items-center gap-3 pb-1'}>
        <span className={cn('truncate text-right text-sm font-semibold', TEAM_STYLES[left.teamId].text)}>
            {left.gameName}
        </span>
        <span />
        <span className={cn('truncate text-sm font-semibold', TEAM_STYLES[right.teamId].text)}>
            {right.gameName}
        </span>
    </div>
);

const DuelRow = ({
                     event,
                     left,
                     right,
                 }: {
    event: DuelEvent;
    left: VersusPlayerStats;
    right: VersusPlayerStats;
}) => {
    const winner = event.winner === left.subject ? left : right;
    const weapon = useWeaponRegistry()?.[event.weaponId?.toLowerCase()];

    return (
        <TableRow>
            <TableCell className={'tabular-nums text-muted-foreground'}>{event.round + 1}</TableCell>
            <TableCell className={'tabular-nums text-muted-foreground'}>{formatRoundTime(event.roundTimeMs)}</TableCell>
            <TableCell className={cn('font-medium', TEAM_STYLES[winner.teamId].text)}>{winner.gameName}</TableCell>
            <TableCell>
                <Badge variant={event.kind === 'direct' ? 'default' : 'secondary'}>
                    {event.kind === 'direct' ? 'Direct' : 'Assist'}
                </Badge>
            </TableCell>
            <TableCell className={'text-muted-foreground'}>
                {weapon?.displayName || event.damageType}
            </TableCell>
        </TableRow>
    );
};

// ---------------------------------------------------------------------------
// Tab
// ---------------------------------------------------------------------------

export interface VersusTabProps {
    data: ReplayMetadataV2;
    highlightPlayerUuid?: GUID;
    weaponName?: (weaponId: string) => string;
}

export function VersusTab({ data }: VersusTabProps) {
    const index = useMemo(() => buildMatchIndex(data.riotMatchMetadata!), [data]);
    const [leftTeam, rightTeam] = index.playersByTeam;

    const seed = (team: typeof leftTeam): GUID | undefined =>
        team?.players.find((p) => p.subject === data.downloaderMetadata.downloaderId)?.subject ?? topFragger(team?.players ?? [])?.subject;

    const [leftId, setLeftId] = useState<GUID | undefined>(() => seed(leftTeam));
    const [rightId, setRightId] = useState<GUID | undefined>(() => seed(rightTeam));

    const left = useMemo(() => (leftId ? buildPlayerStats(index, leftId) : undefined), [index, leftId]);
    const right = useMemo(() => (rightId ? buildPlayerStats(index, rightId) : undefined), [index, rightId]);
    const duels = useMemo(
        () => (leftId && rightId ? buildDuelSummary(index, leftId, rightId) : undefined),
        [index, leftId, rightId],
    );

    if (!leftTeam || !rightTeam) {
        return <div className={'p-6 text-sm text-muted-foreground'}>This match doesn't have two teams to compare.</div>;
    }

    return (
        <div className={'space-y-4'}>
            <div className={'flex aspect-[6] w-full overflow-hidden sm:aspect-[10]'}>
                <div className={'flex-1'}>
                    <TeamStrip
                        index={index}
                        teamId={leftTeam.teamId}
                        players={leftTeam.players}
                        tilt={35}
                        gap={5}
                        tiltTowards={FacingDirections.LEFT}
                        selectedId={leftId}
                        onSelect={setLeftId}
                    />
                </div>
                <div
                    className={'flex w-8 items-center justify-center text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground'}>
                    vs
                </div>
                <div className={'flex-1'}>
                    <TeamStrip
                        index={index}
                        teamId={rightTeam.teamId}
                        players={rightTeam.players}
                        tilt={50}
                        gap={10}
                        tiltTowards={FacingDirections.RIGHT}
                        selectedId={rightId}
                        onSelect={setRightId}
                    />
                </div>
            </div>

            {left && right && duels && (
                <div className={'space-y-4 px-3 pb-3'}>
                    <Card>
                        <CardHeader>
                            <CardTitle className={'text-base'}>Duels</CardTitle>
                        </CardHeader>
                        <CardContent className={'space-y-4'}>
                            <div className={'text-center'}>
                                <div className={'text-xs uppercase tracking-wide text-muted-foreground'}>Duels won</div>
                                <div className={'mt-1 grid grid-cols-3 items-baseline gap-3'}>
                                    <span
                                        className={cn('text-right text-4xl font-bold tabular-nums', TEAM_STYLES[left.teamId].text)}>
                                        {duels.a.total}
                                    </span>
                                    <span className={'text-center text-lg text-muted-foreground'}>–</span>
                                    <span
                                        className={cn('text-left text-4xl font-bold tabular-nums', TEAM_STYLES[right.teamId].text)}>
                                        {duels.b.total}
                                    </span>
                                </div>
                                <NameRow left={left} right={right} />
                                <p className={'mt-2 text-xs text-muted-foreground'}>
                                    They met in {duels.roundsContested} rounds · {left.teamId} took{' '}
                                    {duels.contestedRoundsWonByA} of them
                                </p>
                            </div>

                            <div>
                                <StatRow label={'Kills on each other'} left={duels.a.direct} right={duels.b.direct}
                                         leftTeam={left.teamId} rightTeam={right.teamId} />
                                <StatRow label={'Assisted kills'} left={duels.a.assisted} right={duels.b.assisted}
                                         leftTeam={left.teamId} rightTeam={right.teamId} />
                                <StatRow label={'Damage dealt'} left={duels.a.damage.damage}
                                         right={duels.b.damage.damage} leftTeam={left.teamId}
                                         rightTeam={right.teamId} />
                            </div>

                            {duels.events.length === 0 ? (
                                <p className={'py-4 text-center text-sm text-muted-foreground'}>
                                    These two never crossed paths. Pick another pairing to see their fights.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Round</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Winner</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Weapon</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {duels.events.map((event, i) => (
                                            <DuelRow
                                                key={`${event.round}-${event.roundTimeMs}-${i}`}
                                                event={event}
                                                left={left}
                                                right={right}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className={'text-base'}>Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <NameRow left={left} right={right} />
                            <Accordion type={'multiple'} defaultValue={['kills', 'combat']}>
                                <AccordionItem value={'kills'}>
                                    <AccordionTrigger className={'text-sm'}>Kills</AccordionTrigger>
                                    <AccordionContent>
                                        <StatRow label={'Kills'} left={left.kills} right={right.kills}
                                                 leftTeam={left.teamId} rightTeam={right.teamId} />
                                        <StatRow label={'Deaths'} left={left.deaths} right={right.deaths}
                                                 leftTeam={left.teamId} rightTeam={right.teamId} lowerIsBetter />
                                        <StatRow label={'Assists'} left={left.assists} right={right.assists}
                                                 leftTeam={left.teamId} rightTeam={right.teamId} />
                                        <StatRow
                                            label={'KDA'}
                                            left={left.kda}
                                            right={right.kda}
                                            leftLabel={number2(left.kda)}
                                            rightLabel={number2(right.kda)}
                                            leftTeam={left.teamId}
                                            rightTeam={right.teamId}
                                        />
                                        <StatRow label={'First bloods'} left={left.firstBloods}
                                                 right={right.firstBloods} leftTeam={left.teamId}
                                                 rightTeam={right.teamId} />
                                        <StatRow label={'First deaths'} left={left.firstDeaths}
                                                 right={right.firstDeaths} leftTeam={left.teamId}
                                                 rightTeam={right.teamId} lowerIsBetter />
                                        <StatRow
                                            label={'Multikills 3+'}
                                            left={left.tripleKills + left.quadKills + left.aces}
                                            right={right.tripleKills + right.quadKills + right.aces}
                                            leftTeam={left.teamId}
                                            rightTeam={right.teamId}
                                        />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value={'combat'}>
                                    <AccordionTrigger className={'text-sm'}>Combat</AccordionTrigger>
                                    <AccordionContent>
                                        <StatRow
                                            label={'Combat score'}
                                            left={left.acs}
                                            right={right.acs}
                                            leftLabel={number0(left.acs)}
                                            rightLabel={number0(right.acs)}
                                            leftTeam={left.teamId}
                                            rightTeam={right.teamId}
                                        />
                                        <StatRow
                                            label={'Damage / round'}
                                            left={left.adr}
                                            right={right.adr}
                                            leftLabel={number0(left.adr)}
                                            rightLabel={number0(right.adr)}
                                            leftTeam={left.teamId}
                                            rightTeam={right.teamId}
                                        />
                                        <StatRow
                                            label={'Headshot %'}
                                            left={left.headshotPct}
                                            right={right.headshotPct}
                                            leftLabel={percent(left.headshotPct)}
                                            rightLabel={percent(right.headshotPct)}
                                            leftTeam={left.teamId}
                                            rightTeam={right.teamId}
                                        />
                                        <StatRow
                                            label={'Survived'}
                                            left={left.survivalRate}
                                            right={right.survivalRate}
                                            leftLabel={percent(left.survivalRate)}
                                            rightLabel={percent(right.survivalRate)}
                                            leftTeam={left.teamId}
                                            rightTeam={right.teamId}
                                        />
                                        <StatRow label={'Ultimates used'} left={left.ultimateCasts}
                                                 right={right.ultimateCasts} leftTeam={left.teamId}
                                                 rightTeam={right.teamId} />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value={'spike'}>
                                    <AccordionTrigger className={'text-sm'}>Spike</AccordionTrigger>
                                    <AccordionContent>
                                        <StatRow label={'Planted'} left={left.plants} right={right.plants}
                                                 leftTeam={left.teamId} rightTeam={right.teamId} />
                                        <StatRow label={'Defused'} left={left.defuses} right={right.defuses}
                                                 leftTeam={left.teamId} rightTeam={right.teamId} />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value={'loadout'} className={'border-b-0'}>
                                    <AccordionTrigger className={'text-sm'}>Loadout</AccordionTrigger>
                                    <AccordionContent>
                                        <StatRow
                                            label={'Avg loadout value'}
                                            left={left.avgLoadoutValue}
                                            right={right.avgLoadoutValue}
                                            leftLabel={number0(left.avgLoadoutValue)}
                                            rightLabel={number0(right.avgLoadoutValue)}
                                            leftTeam={left.teamId}
                                            rightTeam={right.teamId}
                                        />
                                        <StatRow
                                            label={'Avg spend'}
                                            left={left.avgSpend}
                                            right={right.avgSpend}
                                            leftLabel={number0(left.avgSpend)}
                                            rightLabel={number0(right.avgSpend)}
                                            leftTeam={left.teamId}
                                            rightTeam={right.teamId}
                                        />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}