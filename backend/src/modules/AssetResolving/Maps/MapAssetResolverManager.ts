import { Inject, Injectable } from '@nestjs/common';
import { ValorantAssetAPI } from '@/integrations/NotOfficer/ValorantAssetAPI';
import { appConfig } from '@/config/configLoader';
import type { ConfigType } from '@nestjs/config';
import { AssetResolverManager } from '@/modules/AssetResolving/common/AssetResolverManager';
import { MapAssetDTO } from '#/schemas/assets/MapAssetDTO';

export type MapId = string;

@Injectable()
export class MapAssetResolverManager extends AssetResolverManager<MapId, MapAssetDTO, MapAssetDTO> {
    constructor(
        valorantAssetAPI: ValorantAssetAPI,
        @Inject(appConfig.KEY)
        config: ConfigType<typeof appConfig>,
    ) {
        super(valorantAssetAPI, config);
    }

    protected keyOf(entry: MapAssetDTO): MapId {
        return entry.mapUrl;
    }

    protected fetchEntries(): Promise<MapAssetDTO[]> {
        return this.valorantAssetAPI.getMapList();
    }
}
