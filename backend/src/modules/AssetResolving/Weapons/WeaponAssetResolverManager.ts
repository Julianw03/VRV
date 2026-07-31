import { Inject, Injectable } from '@nestjs/common';
import { ValorantAssetAPI } from '@/integrations/NotOfficer/ValorantAssetAPI';
import { appConfig } from '@/config/configLoader';
import type { ConfigType } from '@nestjs/config';
import { AssetResolverManager } from '@/modules/AssetResolving/common/AssetResolverManager';
import { WeaponAssetDTO } from '#/schemas/assets/WeaponAssetDTO';

export type WeaponId = string;

@Injectable()
export class WeaponAssetResolverManager extends AssetResolverManager<WeaponId, WeaponAssetDTO, WeaponAssetDTO> {
    constructor(
        valorantAssetAPI: ValorantAssetAPI,
        @Inject(appConfig.KEY)
        config: ConfigType<typeof appConfig>,
    ) {
        super(valorantAssetAPI, config);
    }

    protected keyOf(entry: WeaponAssetDTO): WeaponId {
        return entry.uuid;
    }

    protected fetchEntries(): Promise<WeaponAssetDTO[]> {
        return this.valorantAssetAPI.getWeaponList();
    }
}
