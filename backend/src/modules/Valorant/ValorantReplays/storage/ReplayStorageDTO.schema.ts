import { z } from 'zod';

export const REPLAY_FORMAT_VERSIONS = {
    VERSION_1: 1,
    VERSION_2: 2,
    VERSION_3: 3,
} as const;

export const CURRENT_REPLAY_FORMAT_VERSION = REPLAY_FORMAT_VERSIONS.VERSION_3;

export const LocationSchema = z.object({
    x: z.number(),
    y: z.number()
});
export type Location = z.infer<typeof LocationSchema>;

export const PlayerEventLocationSchema = z.object({
    subject: z.uuid(),
    viewRadians: z.number(),
    location: LocationSchema
});
export type PlayerEventLocation = z.infer<typeof PlayerEventLocationSchema>;

export const FinishingDamageSchema = z.object({
    damageType: z.string(),
    damageItem: z.string(),
    isSecondaryFireMode: z.boolean()
});
export type FinishingDamage = z.infer<typeof FinishingDamageSchema>;

export const KillSchema = z.object({
    gameTime: z.number(),
    roundTime: z.number(),
    killer: z.uuid(),
    victim: z.uuid(),
    victimLocation: LocationSchema,
    assistants: z.array(z.uuid()),
    playerLocations: z.array(PlayerEventLocationSchema),
    finishingDamage: FinishingDamageSchema
});
export type Kill = z.infer<typeof KillSchema>;

export const DamageSchema = z.object({
    receiver: z.uuid(),
    damage: z.number(),
    legshots: z.number(),
    bodyshots: z.number(),
    headshots: z.number()
});
export type Damage = z.infer<typeof DamageSchema>;

export const EconomySchema = z.object({
    loadoutValue: z.number(),
    weapon: z.string(),
    armor: z.string(),
    remaining: z.number(),
    spent: z.number()
});
export type Economy = z.infer<typeof EconomySchema>;

export const RoundPlayerEconomySchema = EconomySchema.extend({
    subject: z.uuid()
});
export type RoundPlayerEconomy = z.infer<typeof RoundPlayerEconomySchema>;

export const RoundPlayerScoreSchema = z.object({
    subject: z.uuid(),
    score: z.number()
});
export type RoundPlayerScore = z.infer<typeof RoundPlayerScoreSchema>;

export const RoundPlayerStatSchema = z.object({
    subject: z.uuid(),
    score: z.number(),
    kills: z.array(KillSchema),
    damage: z.array(DamageSchema),
    economy: EconomySchema,
    wasAfk: z.boolean(),
    wasPenalized: z.boolean(),
    stayedInSpawn: z.boolean()
});
export type RoundPlayerStat = z.infer<typeof RoundPlayerStatSchema>;

export const RoundResultSchema = z.object({
    roundNum: z.number(),
    roundResult: z.string(),
    roundCeremony: z.string(),
    roundResultCode: z.string(),
    winningTeam: z.string(),
    winningTeamRole: z.string(),

    bombPlanter: z.uuid().optional(),
    plantRoundTime: z.number().optional(),
    plantPlayerLocations: z.array(PlayerEventLocationSchema).optional(),
    plantLocation: LocationSchema.optional(),
    plantSite: z.string().optional(),

    defuseRoundTime: z.number().optional(),
    defusePlayerLocations: z.array(PlayerEventLocationSchema).optional(),
    defuseLocation: LocationSchema.optional(),

    playerStats: z.array(RoundPlayerStatSchema),
    playerEconomies: z.array(RoundPlayerEconomySchema),
    playerScores: z.array(RoundPlayerScoreSchema)
});
export type RoundResult = z.infer<typeof RoundResultSchema>;

export const AbilityCastsSchema = z.object({
    grenadeCasts: z.number(),
    ability1Casts: z.number(),
    ability2Casts: z.number(),
    ultimateCasts: z.number()
});
export type AbilityCasts = z.infer<typeof AbilityCastsSchema>;

export const TeamSummarySchema = z.object({
    teamId: z.string(),
    won: z.boolean(),
    roundsWon: z.number(),
    roundsPlayed: z.number(),
    numPoints: z.number().optional()
});
export type TeamSummary = z.infer<typeof TeamSummarySchema>;

export const PlayerSummarySchema = z.object({
    puuid: z.uuid(),
    gameName: z.string(),
    tagLine: z.string(),
    teamId: z.string(),
    characterId: z.string(),
    kills: z.number(),
    deaths: z.number(),
    assists: z.number(),
    isObserver: z.boolean(),

    competitiveTier: z.number().optional(),
    score: z.number().optional(),
    roundsPlayed: z.number().optional(),
    playtimeMillis: z.number().optional(),
    abilityCasts: AbilityCastsSchema.optional()
});
export type PlayerSummary = z.infer<typeof PlayerSummarySchema>;

export const DownloadInfoSchema = z.object({
    downloadedAt: z.number(),
    downloaderId: z.uuid()
});
export type DownloadInfo = z.infer<typeof DownloadInfoSchema>;

export const MatchInfoSchema = z.object({
    matchId: z.string(),
    mapId: z.string(),
    queueID: z.string(),
    gameVersion: z.string(),
    gameStartMillis: z.number(),
    gameLengthMillis: z.number(),
    isRanked: z.boolean(),
    isReplayRecorded: z.boolean().optional()
});
export type MatchInfo = z.infer<typeof MatchInfoSchema>;

const ReplayMetadataBaseSchema = z.object({
    formatVersion: z.number(),
    replayFileSize: z.number(),
    downloadInfo: DownloadInfoSchema,
    matchInfo: MatchInfoSchema,
    teams: z.array(TeamSummarySchema),
    players: z.array(PlayerSummarySchema),

    roundResults: z.array(RoundResultSchema).optional(),
    kills: z.array(KillSchema).optional()
});

export const ReplayMetadataSchema = ReplayMetadataBaseSchema.superRefine((data, ctx) => {
    if (data.formatVersion === REPLAY_FORMAT_VERSIONS.VERSION_2) {
        if (data.roundResults === undefined) {
            ctx.addIssue({
                code: 'custom',
                message: 'roundResults is required when formatVersion is VERSION_2',
                path: ['roundResults']
            });
        }

        if (data.kills === undefined) {
            ctx.addIssue({
                code: 'custom',
                message: 'kills is required when formatVersion is VERSION_2',
                path: ['kills']
            });
        }
    }
});

export type ReplayMetadata = z.infer<typeof ReplayMetadataSchema>;