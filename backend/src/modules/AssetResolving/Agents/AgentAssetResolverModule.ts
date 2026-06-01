import { ValorantAssetAPIModule } from '@/integrations/NotOfficer/ValorantAssetAPIModule';
import { Module } from '@nestjs/common';
import { MapAssetResolverManager } from '@/modules/AssetResolving/Maps/MapAssetResolverManager';
import { MapAssetResolverController } from '@/modules/AssetResolving/Maps/MapAssetResolverController';
import { AgentAssetResolverManager } from '@/modules/AssetResolving/Agents/AgentAssetResolverManager';
import { AgentAssetResolverController } from '@/modules/AssetResolving/Agents/AgentAssetResolverController';

@Module({
    imports: [ValorantAssetAPIModule],
    providers: [AgentAssetResolverManager, AgentAssetResolverController],
    controllers: [AgentAssetResolverController],
    exports: [AgentAssetResolverManager]
})
export class AgentAssetResolverModule {}