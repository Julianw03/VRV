export interface WeaponAssetDTO {
    uuid: UUID
    displayName: string,
    category: string,
    defaultSkinUuid: UUID,
    displayIcon: ExternalURL,
    killStreamIcon: ExternalURL,
    weaponStats: {
        fireRate: number,
        magazineSize: number,
        runSpeedMultiplier: number,
        equipTimeSeconds: number,
        firstBulletAccuracy: number,
        wallPenetration: string
        feature: string | null,
        fireMode: string | null,
        altFireType: string | null
        adsStats: {
            zoomMultiplier: number,
            fireRate: number,
            runSpeedMultiplier: number
            burstCount: number,
            firstBulletAccuracy: number,
        } | null,
        altShotgunStats: null,
        airBurstStats: null
    }
    shopData: unknown
    skins: unknown[]
}