import { ValorantAssetAPIModule } from '@/api/NotOfficer/ValorantAssetAPIModule';
import { Module } from '@nestjs/common';
import { MapAssetResolverManager } from '@/caching/AssetResolving/MapAssetResolverManager';
import { MapAssetResolverController } from '@/caching/AssetResolving/MapAssetResolverController';

@Module({
    imports: [ValorantAssetAPIModule],
    providers: [MapAssetResolverManager, MapAssetResolverController],
    controllers: [MapAssetResolverController],
    exports: [MapAssetResolverManager]
})
export class MapAssetResolverModule {}