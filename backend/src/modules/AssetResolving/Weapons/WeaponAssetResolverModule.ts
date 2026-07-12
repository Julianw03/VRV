import { Module } from '@nestjs/common';
import { ValorantAssetAPIModule } from '@/integrations/NotOfficer/ValorantAssetAPIModule';
import { WeaponAssetResolverManager } from '@/modules/AssetResolving/Weapons/WeaponAssetResolverManager';
import { WeaponAssetResolverController } from '@/modules/AssetResolving/Weapons/WeaponAssetResolverController';

@Module({
    imports: [ValorantAssetAPIModule],
    controllers: [WeaponAssetResolverController],
    providers: [WeaponAssetResolverManager],
    exports: [WeaponAssetResolverManager],
})
export class WeaponAssetResolverModule {
}