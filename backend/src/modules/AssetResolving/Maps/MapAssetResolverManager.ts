import { Inject, Injectable } from '@nestjs/common';
import { MapEntry, ValorantAssetAPI } from '@/integrations/NotOfficer/ValorantAssetAPI';
import { appConfig } from '@/config/configLoader';
import type { ConfigType } from '@nestjs/config';
import { MapAssetDTO } from '#/dto/assets/MapAssetDTO';
import { AssetResolverManager } from '@/modules/AssetResolving/common/AssetResolverManager';

export type MapId = string;

@Injectable()
export class MapAssetResolverManager extends AssetResolverManager<MapId, MapEntry, MapAssetDTO> {
    constructor(
        valorantAssetAPI: ValorantAssetAPI,
        @Inject(appConfig.KEY)
        config: ConfigType<typeof appConfig>,
    ) {
        super(valorantAssetAPI, config);
    }

    protected keyOf(entry: MapEntry): MapId {
        return entry.mapUrl;
    }

    protected fetchEntries(): Promise<MapEntry[]> {
        return this.valorantAssetAPI.getMapList();
    }
}
