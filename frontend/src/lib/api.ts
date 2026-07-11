import * as LocalLinkResolver from '@/lib/LocalLinkResolver.ts';
import type { DownloadStateDTO } from '#/dto/DownloadStateDTO.ts';
import type { PlayerAliasDTO } from '#/dto/PlayerAliasDTO.ts';
import type { AgentAssetDTO } from '#/dto/assets/AgentAssetDTO.ts';
import type { MapAssetDTO } from '#/dto/assets/MapAssetDTO.ts';
import type { WeaponAssetDTO } from '#/dto/assets/WeaponAssetDTO.ts';
import type { GearAssetDTO } from '#/dto/assets/GearAssetDTO.ts';
import type { PlayerUuidDTO } from '#/dto/PlayerUuidDTO.ts';
import type { ProductSession } from '#/dto/ProductSessionDTO.ts';
import type { RiotMatchApiResponseDTO } from '#/dto/RiotMatchApiReponseDTO.ts';

export const API_BASE = LocalLinkResolver.resolve('/api/v1', 'http');

// ---- Types ----

export interface MinimalVersionInfo {
    version: string;
}

export interface StorageStatus {
    isSetup: boolean;
    matchCount: number;
    totalSizeBytes: number;
}

export interface Location {
    x: number;
    y: number;
}

export interface PlayerEventLocation {
    subject: string;
    viewRadians: number;
    location: Location;
}

export interface FinishingDamage {
    damageType: string;
    damageItem: string;
    isSecondaryFireMode: boolean;
}

export interface Kill {
    gameTime: number;
    round: number;
    roundTime: number;
    killer: string;
    victim: string;
    victimLocation: Location;
    assistants: string[];
    playerLocations: PlayerEventLocation[];
    finishingDamage: FinishingDamage;
}

export interface Damage {
    receiver: string;
    damage: number;
    legshots: number;
    bodyshots: number;
    headshots: number;
}

export interface Economy {
    loadoutValue: number;
    weapon: string;
    armor: string;
    remaining: number;
    spent: number;
}

export interface RoundPlayerEconomy extends Economy {
    subject: string;
}

export interface RoundPlayerScore {
    subject: string;
    score: number;
}

export interface RoundPlayerStat {
    subject: string;
    score: number;
    kills: Kill[];
    damage: Damage[];
    economy: Economy;
    wasAfk: boolean;
    wasPenalized: boolean;
    stayedInSpawn: boolean;
}

export interface RoundResult {
    roundNum: number;
    roundResult: string;
    roundCeremony: string;
    roundResultCode: string;
    winningTeam: string;
    winningTeamRole: string;
    bombPlanter?: string;
    plantRoundTime?: number;
    plantPlayerLocations?: PlayerEventLocation[];
    plantLocation?: Location;
    plantSite?: string;
    defuseRoundTime?: number;
    defusePlayerLocations?: PlayerEventLocation[];
    defuseLocation?: Location;
    playerStats: RoundPlayerStat[];
    playerEconomies: RoundPlayerEconomy[];
    playerScores: RoundPlayerScore[];
}

export interface AbilityCasts {
    grenadeCasts: number;
    ability1Casts: number;
    ability2Casts: number;
    ultimateCasts: number;
}

export interface TeamSummary {
    teamId: string;
    won: boolean;
    roundsWon: number;
    roundsPlayed: number;
    numPoints?: number;
}

export interface PlayerSummary {
    puuid: string;
    gameName: string;
    tagLine: string;
    teamId: string;
    characterId: string;
    kills: number;
    deaths: number;
    assists: number;
    isObserver: boolean;
    competitiveTier?: number;
    score?: number;
    roundsPlayed?: number;
    playtimeMillis?: number;
    abilityCasts?: AbilityCasts;
}

export interface DownloadInfo {
    downloadedAt: number;
    downloaderId: string;
}

export interface MatchInfo {
    matchId: string;
    mapId: string;
    queueID: string;
    gameVersion: string;
    gameStartMillis: number;
    gameLengthMillis: number;
    isRanked: boolean;
    isReplayRecorded?: boolean;
}

export interface ReplayMetadata {
    formatVersion: number;
    replayFileSize: number;
    downloadInfo: DownloadInfo;
    matchInfo: MatchInfo;
    teams: TeamSummary[];
    players: PlayerSummary[];
    roundResults?: RoundResult[];
    kills?: Kill[];
}

export const InjectStates = {
    IDLE: 'IDLE',
    DOWNLOADING_PLACEHOLDER: 'DOWNLOADING_PLACEHOLDER',
    AWAITING_REPLAY_START: 'AWAITING_REPLAY_START',
    INJECTED: 'INJECTED',
    RESTORING_ORIGINAL_REPLAY: 'RESTORING_ORIGINAL_REPLAY',
    FAILED: 'FAILED',
} as const;

export type InjectState =
    typeof InjectStates[keyof typeof InjectStates];

export interface InjectStatus {
    state: InjectState;
    targetMatchId: string | null;
    placeholderMatchId: string | null;
}

// ---- Match stats (from Riot API via backend cache) ----


export type MatchStatsResult =
    | { type: 'PENDING' }
    | { type: 'SUCCESS'; data: RiotMatchApiResponseDTO }
    | { type: 'FAILURE'; error: { message: string } }


// ---- Configuration ----

export type SupportedRegion = 'na' | 'latam' | 'eu' | 'ap' | 'kr' | 'br';
export type SupportedShard = 'na' | 'pbe' | 'eu' | 'ap' | 'kr';

export const SUPPORTED_REGIONS: SupportedRegion[] = ['na', 'latam', 'eu', 'ap', 'kr', 'br'];
export const SUPPORTED_SHARDS: SupportedShard[] = ['na', 'pbe', 'eu', 'ap', 'kr'];

export interface ConfigOverrides {
    overrides: {
        'valorant-api': {
            region?: SupportedRegion | null;
            shard?: SupportedShard | null;
        };
        'valorant-version-read': {
            version?: string | null;
        };
    };
}

export interface EffectiveConfig {
    overrides: {
        'valorant-api': {
            region?: SupportedRegion | null;
            shard?: SupportedShard | null;
        };
        'valorant-version-read': {
            version?: string | null;
        };
    };
    configurations: {
        app: {
            port: number;
            'additional-cors-origins': string[];
        };
        'valorant-version-read': {
            'retry-timeout-ms': number;
            regex: string;
        };
    };
}

// ---- HTTP client ----

async function request<T = void>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, options);
    if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
            const body = await response.json();
            message = body.message ?? message;
        } catch {
            // ignore parse errors
        }
        throw new Error(message);
    }
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        return response.json() as Promise<T>;
    }
    return undefined as T;
}

// ---- API ----

export const api = {
    riotClient: {
        isConnected: () => request<boolean>('/riotclient/status/connected'),
        connect: () => request('/riotclient/connect', { method: 'POST' }),
    },
    application: {
        getVersion: () => request<string>('/application/version'),
    },
    valorantVersionInfo: {
        get: () => request<MinimalVersionInfo>('/caching/valorant-version-info'),
    },
    storage: {
        getAllDownloadStates: () => request<Record<string, DownloadStateDTO>>('/plugins/replay/storage/download-states'),
        getStatus: () => request<StorageStatus>('/plugins/replay/storage/status'),
        setup: () => request('/plugins/replay/storage', { method: 'POST' }),
        teardown: () => request('/plugins/replay/storage', { method: 'DELETE' }),
        listMatches: () => request<ReplayMetadata[]>('/plugins/replay/storage/matches'),
        getMetadata: (matchId: string) => request<ReplayMetadata>(`/plugins/replay/storage/matches/${matchId}/metadata`),
        deleteMatch: (matchId: string) =>
            request(`/plugins/replay/storage/matches/${matchId}`, { method: 'DELETE' }),
        uploadReplay: (file: File, override = true) => {
            const formData = new FormData();
            formData.append('file', file);
            return request(`/plugins/replay/storage/matches?override=${override}`, { method: 'POST', body: formData });
        },
    },
    matchHistory: {
        getRecentMatches: ({ after, limit }: { after: UUID | null, limit: number }) => {
            const params = new URLSearchParams();
            if (after) {
                params.set('after', after);
            }
            params.set('limit', limit.toString());
            return request<RiotMatchApiResponseDTO[]>(`/plugins/history/matches/recent?${params}`);
        },
        getNewMatches: ({ after, limit }: { after: UUID, limit: number }) => {
            const params = new URLSearchParams();
            params.set('since', after.toString());
            params.set('limit', limit.toString());
            return request<RiotMatchApiResponseDTO[]>(`/plugins/history/matches/new?${params}`);
        },
    },
    remote: {
        triggerDownload: (matchId: string) =>
            request(`/plugins/replay/remote/matches/recent/${matchId}/download`, { method: 'POST' }),
        retryDownload: (matchId: string) =>
            request(`/plugins/replay/remote/matches/recent/${matchId}/download/retry`, { method: 'POST' }),
        getDownloadState: (matchId: string) =>
            request<DownloadStateDTO | null>(
                `/plugins/replay/remote/matches/recent/${matchId}/download/state`,
            ),
    },
    injector: {
        getStatus: () => request<InjectStatus>('/plugins/replay/injector/status'),
        startInject: (matchId: string) =>
            request(`/plugins/replay/injector/matches/${matchId}`, { method: 'POST' }),
        cancelInject: () => request('/plugins/replay/injector', { method: 'DELETE' }),
    },
    account: {
        getAlias: () => request<PlayerAliasDTO>('/caching/riot-account/alias'),
        getPuuid: () => request<PlayerUuidDTO>('/caching/riot-account/puuid'),
    },
    sessions: {
        getAllProductSessions: () => request<Record<string, ProductSession>>('/caching/product-sessions'),
    },
    assets: {
        getAllMaps: () => request<Record<string, MapAssetDTO>>('/assets/maps/'),
        getAllAgents: () => request<Record<string, AgentAssetDTO>>('/assets/agents'),
        getAllWeapons: () => request<Record<string, WeaponAssetDTO>>('/assets/weapons'),
        getAllGear: () => request<Record<string, GearAssetDTO>>('/assets/gear'),
    },
    matchStats: {
        getById: (matchId: string) =>
            request<MatchStatsResult>(`/caching/valorant-game-stats/${matchId}`),
        triggerFetch: (matchId: string) =>
            request(`/caching/valorant-game-stats/${matchId}/fetch`, { method: 'POST' }),
    },
    config: {
        getCurrent: () => request<EffectiveConfig>('/configuration/current'),
        getOverrides: () => request<ConfigOverrides>('/configuration/overrides'),
        saveOverrides: (overrides: ConfigOverrides) =>
            request<ConfigOverrides>('/configuration/overrides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(overrides),
            }),
        deleteOverrides: () => request('/configuration/overrides', { method: 'DELETE' }),
    },
    processControl: {
        shutdown: () => request('/process-control/shutdown', { method: 'POST' }),
    },
} as const;
