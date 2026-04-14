const REGION_TO_SGP_HOST: Record<string, string> = {
    na: 'usw2.pp.sgp.pvp.net',
    eu: 'euc1.pp.sgp.pvp.net',
    ap: 'apse1.pp.sgp.pvp.net',
    kr: 'kr.pp.sgp.pvp.net',
    latam: 'usw2.pp.sgp.pvp.net',
    br: 'usw2.pp.sgp.pvp.net',
    pbe: 'usw2.pp.sgp.pvp.net',
};

export function getPdApiBase(deploymentRegion: string): string {
    return `https://pd.${deploymentRegion}.a.pvp.net`;
}

export function getSgpApiBase(deploymentRegion: string): string {
    const host = REGION_TO_SGP_HOST[deploymentRegion] ?? REGION_TO_SGP_HOST.na;
    return `https://${host}`;
}

export function getGlzApiBase(deploymentRegion: string): string {
    return `https://glz-${deploymentRegion}-1.${deploymentRegion}.a.pvp.net`;
}
