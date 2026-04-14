import type { MatchDetailsPanelProps, MinimalMatchPlayer } from '@/components/match-details/MatchDetailsPanel.tsx';
import { formatDate, formatDuration, mapDisplayName } from '@/components/saved-replays/formatters.ts';
import type { RiotMatchTeam } from '@/lib/api.ts';
import { cn } from '@/lib/utils.ts';


const TEAM_NAMES: Record<string, string> = {
    'Red': 'Attacker',
    'Blue': 'Defender',
} as const;

function ScoreBanner({ teams }: { teams: RiotMatchTeam[] }) {
    if (teams.length < 2) return null;
    const [a, b] = teams;

    return (
        <div className="mb-4 flex items-center justify-center gap-4 rounded-lg bg-muted/30 py-3">
      <span className={cn('text-sm font-semibold', a.won ? 'text-green-400' : 'text-muted-foreground')}>
        {TEAM_NAMES[a.teamId] || a.teamId}
      </span>
            <span className="font-mono text-lg font-bold tabular-nums">
        <span className={a.won ? 'text-green-400' : 'text-foreground'}>{a.roundsWon}</span>
        <span className="mx-2 text-muted-foreground">–</span>
        <span className={b.won ? 'text-green-400' : 'text-foreground'}>{b.roundsWon}</span>
      </span>
            <span className={cn('text-sm font-semibold', b.won ? 'text-green-400' : 'text-muted-foreground')}>
        {TEAM_NAMES[b.teamId] || b.teamId}
      </span>
        </div>
    );
}

function PlayerList({
                        players,
                        highlightPlayer,
                    }: {
    players: MinimalMatchPlayer[];
    highlightPlayer?: string;
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                <span className="flex-1">Player</span>
                <span className="w-20 shrink-0 text-right font-mono grid grid-cols-[2ch_1ch_2ch_1ch_2ch] items-center whitespace-nowrap">
          K / D / A
        </span>
            </div>

            {players.map((player) => (
                <PlayerRow
                    key={player.subject}
                    player={player}
                    highlightPlayer={highlightPlayer}
                />
            ))}

            {players.length === 0 && (
                <p className="px-2 py-1 text-xs text-muted-foreground">
                    No players
                </p>
            )}
        </div>
    );
}

type PlayerRowProps = {
    player: MinimalMatchPlayer;
    highlightPlayer?: string;
};

function PlayerRow({ player, highlightPlayer }: PlayerRowProps) {
    const isActive = player.subject === highlightPlayer;

    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1 text-xs',
                isActive
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                    : 'bg-muted/30'
            )}
        >
      <span className="flex-1 truncate">
        <span className={cn('font-medium', isActive && 'text-blue-300')}>
          {player.gameName}
        </span>
        <span className="text-muted-foreground">
          #{player.tagLine}
        </span>
      </span>

            <span
                className={cn(
                    'w-20 shrink-0 text-right font-mono grid grid-cols-[2ch_auto_2ch_auto_2ch] whitespace-nowrap',
                    isActive ? 'text-blue-300' : 'text-muted-foreground'
                )}
            >
        {player.stats.kills}/{player.stats.deaths}/{player.stats.assists}
      </span>
        </div>
    );
}

export const TwoTeamDetailsPanel = (
    {
        matchInfo,
        teams,
        players,
        highlightPlayer,
    }: MatchDetailsPanelProps,
) => {

    const activePlayers = players.filter((p) => !p.isObserver);

    return (
        <div className="border-t border-border/50 px-4 pb-4 pt-3">
            {/* Meta info */}
            <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>Started {formatDate(matchInfo.gameStartMillis)}</span>
                <span>·</span>
                <span>{formatDuration(matchInfo.gameLengthMillis)}</span>
                <span>·</span>
                <span>{mapDisplayName(matchInfo.mapId)}</span>
                {matchInfo.isRanked && (
                    <>
                        <span>·</span>
                        <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-400">
              Ranked
            </span>
                    </>
                )}
                <span>·</span>
                <span className="font-mono">{matchInfo.gameVersion}</span>
            </div>

            {teams && teams.length == 2 ? (
                <>
                    <ScoreBanner teams={teams} />
                    <div className="grid grid-cols-2 gap-4">
                        {teams.map((team) => (
                            <PlayerList
                                key={team.teamId}
                                players={activePlayers.filter((p) => p.teamId === team.teamId)}
                                highlightPlayer={highlightPlayer}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <PlayerList players={activePlayers} highlightPlayer={highlightPlayer} />
            )}
        </div>
    );
};