import { Inject, Injectable } from '@nestjs/common';
import { ValorantAssetAPI, WeaponEntry } from '@/integrations/NotOfficer/ValorantAssetAPI';
import { appConfig } from '@/config/configLoader';
import type { ConfigType } from '@nestjs/config';
import { WeaponAssetDTO } from '#/dto/assets/WeaponAssetDTO';
import { AssetResolverManager } from '@/modules/AssetResolving/common/AssetResolverManager';

export type WeaponId = string;

@Injectable()
export class WeaponAssetResolverManager extends AssetResolverManager<WeaponId, WeaponEntry, WeaponAssetDTO> {
    constructor(
        valorantAssetAPI: ValorantAssetAPI,
        @Inject(appConfig.KEY)
        config: ConfigType<typeof appConfig>,
    ) {
        super(valorantAssetAPI, config);
    }

    protected keyOf(entry: WeaponEntry): WeaponId {
        return entry.uuid;
    }

    protected fetchEntries(): Promise<WeaponEntry[]> {
        return this.valorantAssetAPI.getWeaponList();
    }
}
