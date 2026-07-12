import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, IsUUID, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export const REPLAY_FORMAT_VERSIONS = {
    VERSION_1: 1,
    VERSION_2: 2
} as const

export const CURRENT_REPLAY_FORMAT_VERSION = REPLAY_FORMAT_VERSIONS.VERSION_2;

const isVersion2 = (o: { formatVersion: number }) => o.formatVersion === REPLAY_FORMAT_VERSIONS.VERSION_2;

export class Location {
    @IsNumber()
    x: number;

    @IsNumber()
    y: number;
}

export class PlayerEventLocation {
    @IsUUID('all')
    subject: string;

    @IsNumber()
    viewRadians: number;

    @ValidateNested()
    @Type(() => Location)
    location: Location;
}

export class FinishingDamage {
    @IsString()
    damageType: string;

    @IsString()
    damageItem: string;

    @IsBoolean()
    isSecondaryFireMode: boolean;
}

export class Kill {
    @IsNumber()
    gameTime: number;

    @IsNumber()
    round: number;

    @IsNumber()
    roundTime: number;

    @IsUUID('all')
    killer: string;

    @IsUUID('all')
    victim: string;

    @ValidateNested()
    @Type(() => Location)
    victimLocation: Location;

    @IsArray()
    @IsUUID('all', { each: true })
    assistants: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlayerEventLocation)
    playerLocations: PlayerEventLocation[];

    @ValidateNested()
    @Type(() => FinishingDamage)
    finishingDamage: FinishingDamage;
}

export class Damage {
    @IsUUID('all')
    receiver: string;

    @IsNumber()
    damage: number;

    @IsNumber()
    legshots: number;

    @IsNumber()
    bodyshots: number;

    @IsNumber()
    headshots: number;
}

export class Economy {
    @IsNumber()
    loadoutValue: number;

    @IsString()
    weapon: string;

    @IsString()
    armor: string;

    @IsNumber()
    remaining: number;

    @IsNumber()
    spent: number;
}

export class RoundPlayerEconomy extends Economy {
    @IsUUID('all')
    subject: string;
}

export class RoundPlayerScore {
    @IsUUID('all')
    subject: string;

    @IsNumber()
    score: number;
}

export class RoundPlayerStat {
    @IsUUID('all')
    subject: string;

    @IsNumber()
    score: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Kill)
    kills: Kill[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Damage)
    damage: Damage[];

    @ValidateNested()
    @Type(() => Economy)
    economy: Economy;

    @IsBoolean()
    wasAfk: boolean;

    @IsBoolean()
    wasPenalized: boolean;

    @IsBoolean()
    stayedInSpawn: boolean;
}

export class RoundResult {
    @IsNumber()
    roundNum: number

    @IsString()
    roundResult: string

    @IsString()
    roundCeremony: string

    @IsString()
    roundResultCode: string;

    @IsString()
    winningTeam: string;

    @IsString()
    winningTeamRole: string;

    @IsOptional()
    @IsUUID('all')
    bombPlanter?: string;

    @IsOptional()
    @IsNumber()
    plantRoundTime?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlayerEventLocation)
    plantPlayerLocations?: PlayerEventLocation[];

    @IsOptional()
    @ValidateNested()
    @Type(() => Location)
    plantLocation?: Location;

    @IsOptional()
    @IsString()
    plantSite?: string;

    @IsOptional()
    @IsNumber()
    defuseRoundTime?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlayerEventLocation)
    defusePlayerLocations?: PlayerEventLocation[];

    @IsOptional()
    @ValidateNested()
    @Type(() => Location)
    defuseLocation?: Location;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoundPlayerStat)
    playerStats: RoundPlayerStat[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoundPlayerEconomy)
    playerEconomies: RoundPlayerEconomy[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoundPlayerScore)
    playerScores: RoundPlayerScore[];
}

export class AbilityCasts {
    @IsNumber()
    grenadeCasts: number;

    @IsNumber()
    ability1Casts: number;

    @IsNumber()
    ability2Casts: number;

    @IsNumber()
    ultimateCasts: number;
}

export class TeamSummary {
    @IsString()
    teamId: string;

    @IsBoolean()
    won: boolean;

    @IsNumber()
    roundsWon: number;

    @IsNumber()
    roundsPlayed: number;

    @IsOptional()
    @IsNumber()
    numPoints?: number;
}

export class PlayerSummary {
    @IsUUID('all')
    puuid: string;

    @IsString()
    gameName: string;

    @IsString()
    tagLine: string;

    @IsString()
    teamId: string;

    @IsString()
    characterId: string;

    @IsNumber()
    kills: number;

    @IsNumber()
    deaths: number;

    @IsNumber()
    assists: number;

    @IsBoolean()
    isObserver: boolean;

    @IsOptional()
    @IsNumber()
    competitiveTier?: number;

    @IsOptional()
    @IsNumber()
    score?: number;

    @IsOptional()
    @IsNumber()
    roundsPlayed?: number;

    @IsOptional()
    @IsNumber()
    playtimeMillis?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => AbilityCasts)
    abilityCasts?: AbilityCasts;
}

export class DownloadInfo {
    @IsNumber()
    downloadedAt: number;

    @IsUUID('all')
    downloaderId: string;
}

export class MatchInfo {
    @IsString()
    matchId: string;

    @IsString()
    mapId: string;

    @IsString()
    queueID: string;

    @IsString()
    gameVersion: string;

    @IsNumber()
    gameStartMillis: number;

    @IsNumber()
    gameLengthMillis: number;

    @IsBoolean()
    isRanked: boolean;

    @IsOptional()
    @IsBoolean()
    isReplayRecorded?: boolean;
}

export class ReplayMetadata {
    @IsNumber()
    formatVersion: number;

    @IsNumber()
    replayFileSize: number;

    @ValidateNested()
    @Type(() => DownloadInfo)
    downloadInfo: DownloadInfo;

    @ValidateNested()
    @Type(() => MatchInfo)
    matchInfo: MatchInfo;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TeamSummary)
    teams: TeamSummary[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlayerSummary)
    players: PlayerSummary[];

    @ValidateIf(isVersion2)
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoundResult)
    roundResults: RoundResult[];

    @ValidateIf(isVersion2)
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Kill)
    kills: Kill[];
}
