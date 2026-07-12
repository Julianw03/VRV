export interface GearAssetDetail {
    name: string,
    value: string,
}

export interface GearShopData {
    cost: number,
    category: string | null,
    shopOrderPriority: number,
    categoryText: string | null,
    gridPosition: unknown | null,
    canBeTrashed: boolean,
    image: ExternalURL | null,
    newImage: ExternalURL | null,
    newImage2: ExternalURL | null,
    assetPath: string,
}

export interface GearAssetDTO {
    uuid: UUID,
    displayName: string,
    description: string,
    descriptions: string[],
    details: GearAssetDetail[],
    displayIcon: ExternalURL,
    assetPath: string,
    shopData: GearShopData | null,
}
