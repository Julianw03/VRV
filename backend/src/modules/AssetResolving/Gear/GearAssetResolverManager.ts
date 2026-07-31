import { Inject, Injectable } from '@nestjs/common';
import { ValorantAssetAPI } from '@/integrations/NotOfficer/ValorantAssetAPI';
import { appConfig } from '@/config/configLoader';
import type { ConfigType } from '@nestjs/config';
import { AssetResolverManager } from '@/modules/AssetResolving/common/AssetResolverManager';
import { GUID } from '#/schemas/GUIDSchema';
import { GearAssetDTO } from '#/schemas/assets/GearAssetDTO';

export type GearId = GUID;

@Injectable()
export class GearAssetResolverManager extends AssetResolverManager<GearId, GearAssetDTO, GearAssetDTO> {
    constructor(
        valorantAssetAPI: ValorantAssetAPI,
        @Inject(appConfig.KEY)
        config: ConfigType<typeof appConfig>,
    ) {
        super(valorantAssetAPI, config);
    }

    protected keyOf(entry: GearAssetDTO): GearId {
        return entry.uuid;
    }

    protected fetchEntries(): Promise<GearAssetDTO[]> {
        return this.valorantAssetAPI.getGearList();
    }
}
