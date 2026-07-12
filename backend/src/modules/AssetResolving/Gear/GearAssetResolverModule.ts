import { Module } from '@nestjs/common';
import { ValorantAssetAPIModule } from '@/integrations/NotOfficer/ValorantAssetAPIModule';
import { GearAssetResolverManager } from '@/modules/AssetResolving/Gear/GearAssetResolverManager';
import { GearAssetResolverController } from '@/modules/AssetResolving/Gear/GearAssetResolverController';

@Module({
    imports: [ValorantAssetAPIModule],
    controllers: [GearAssetResolverController],
    providers: [GearAssetResolverManager],
    exports: [GearAssetResolverManager],
})
export class GearAssetResolverModule {
}
