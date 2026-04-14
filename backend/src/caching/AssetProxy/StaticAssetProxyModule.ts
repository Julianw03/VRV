import { Module } from '@nestjs/common';
import { StaticAssetProxyController } from '@/caching/AssetProxy/StaticAssetProxyController';
import { StaticAssetProxyService } from '@/caching/AssetProxy/StaticAssetProxyService';

@Module({
    providers: [StaticAssetProxyService],
    controllers: [StaticAssetProxyController],
})
export class StaticAssetProxyModule {}
