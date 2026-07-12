export const TWO_TEAM_ROLE_IDS = {
    ATTACKER: 'Attacker',
    DEFENDER: 'Defender',
} as const;

export type TWO_TEAMS_ROLE_ID = typeof TWO_TEAM_ROLE_IDS[keyof typeof TWO_TEAM_ROLE_IDS];

export const TWO_TEAM_IDS = {
    RED: 'Red',
    BLUE: 'Blue',
} as const;

export const getOppositeTeamId = (teamId: TWO_TEAMS_TEAM_ID) => {
    if (teamId === TWO_TEAM_IDS.RED) return TWO_TEAM_IDS.BLUE;
    return TWO_TEAM_IDS.RED;
};

export type TWO_TEAMS_TEAM_ID = typeof TWO_TEAM_IDS[keyof typeof TWO_TEAM_IDS];


export class AbilityCasts {
    grenadeCasts!: number
    ability1Casts!: number
    ability2Casts!: number
    ultimateCasts!: number
}

export class RiotMatchPlayerStats {
    score!: number;
    roundsPlayed!: number;
    kills!: number;
    deaths!: number;
    assists!: number;
    playtimeMillis!: number;
    abilityCasts!: AbilityCasts;
    platformInfo!: unknown;
}

export class RiotMatchPlayer {
    subject!: UUID;
    gameName!: string;
    tagLine!: string;
    teamId!: string;
    characterId!: string;
    isObserver!: boolean;
    stats!: RiotMatchPlayerStats;
    competitiveTier!: number;
}

export class RiotMatchTeam {
    teamId!: string;
    won!: boolean;
    roundsPlayed!: number;
    roundsWon!: number;
    numPoints!: number;
}

export class RiotMatchInfo {
    matchId!: string;
    mapId!: string;
    queueID!: string;
    gameVersion!: string;
    gameLengthMillis!: number;
    gameStartMillis!: number;
    isRanked!: boolean;
    isReplayRecorded!: boolean;
}

export class Location {
    x!: number;
    y!: number;
}

export class Kill {
    gameTime!: number;
    roundTime!: number;
    killer!: UUID
    victim!: UUID
    victimLocation!: Location
    round!: number
    assistants!: UUID[]
    playerLocations!: {
        subject: UUID
        viewRadians: number
        location: Location
    }[]
    finishingDamage!: {
        damageType: string,
        damageItem: UUID
        isSecondaryFireMode: boolean
    }
}

export class Economy {
    loadoutValue!: number;
    weapon!: UUID
    armor!: UUID
    remaining!: number
    spent!: number
}

export class RoundResult {
    roundNum!: number;
    roundResult!: string;
    roundCeremony!: string;
    roundResultCode!: string;
    winningTeam!: TWO_TEAMS_TEAM_ID | string;
    winningTeamRole!: TWO_TEAMS_ROLE_ID | string;
    bombPlanter?: UUID;
    plantRoundTime?: number;
    plantPlayerLocations?: {
        subject: UUID,
        viewRadians: number;
        location: Location
    }[];
    plantLocation?: Location;
    plantSite?: string;
    defuseRoundTime?: number;
    defusePlayerLocations?: {
        subject: UUID,
        viewRadians: number;
        location: Location;
    }[];
    defuseLocation?: Location;
    playerStats!: {
        subject: UUID;
        score: number;
        kills: Kill[]
        damage: {
            receiver: UUID
            damage: number
            legshots: number,
            bodyshots: number,
            headshots: number
        }[]
        wasAfk: boolean
        wasPenalized: boolean
        stayedInSpawn: boolean
        economy: Economy
    }[];
    playerEconomies!: ({ subject: UUID } & Economy)[];
    playerScores!: {
        subject: UUID;
        score: number;
    }[];
}

export class RiotMatchApiResponseDTO {
    matchInfo!: RiotMatchInfo;
    players!: RiotMatchPlayer[];
    teams!: RiotMatchTeam[] | null;
    roundResults!: RoundResult[];
    kills!: Kill[];
}
