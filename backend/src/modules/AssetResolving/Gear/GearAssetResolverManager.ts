import { Inject, Injectable } from '@nestjs/common';
import { GearEntry, ValorantAssetAPI } from '@/integrations/NotOfficer/ValorantAssetAPI';
import { appConfig } from '@/config/configLoader';
import type { ConfigType } from '@nestjs/config';
import { GearAssetDTO } from '#/dto/assets/GearAssetDTO';
import { AssetResolverManager } from '@/modules/AssetResolving/common/AssetResolverManager';

export type GearId = UUID;

@Injectable()
export class GearAssetResolverManager extends AssetResolverManager<GearId, GearEntry, GearAssetDTO> {
    constructor(
        valorantAssetAPI: ValorantAssetAPI,
        @Inject(appConfig.KEY)
        config: ConfigType<typeof appConfig>,
    ) {
        super(valorantAssetAPI, config);
    }

    protected keyOf(entry: GearEntry): GearId {
        return entry.uuid;
    }

    protected fetchEntries(): Promise<GearEntry[]> {
        return this.valorantAssetAPI.getGearList();
    }
}
