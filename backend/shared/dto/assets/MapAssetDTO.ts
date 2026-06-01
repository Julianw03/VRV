export interface MapAssetDTO {
    uuid: UUID,
    displayName: string,
    narrativeDescription: string | null,
    coordinates: string | null,
    displayIcon: ExternalURL,
    listViewIcon: ExternalURL,
    listViewIconTall: ExternalURL,
    splash: ExternalURL,
    stylizedBackgroundImage: ExternalURL,
    premierBackgroundImage: ExternalURL,
    assetPath: string,
    mapUrl: string,
}