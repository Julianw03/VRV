import { Module } from '@nestjs/common';
import { ValorantAssetAPIModule } from '@/api/NotOfficer/ValorantAssetAPIModule';
import { VersionInfoManager } from '@/caching/VersionInfo/VersionInfoManager';
import { EventBusModule } from '@/events/EventBusModule';
import { VersionInfoController } from '@/caching/VersionInfo/VersionInfoController';

@Module({
    imports: [ValorantAssetAPIModule, EventBusModule],
    providers: [VersionInfoManager, VersionInfoController],
    controllers: [VersionInfoController],
    exports: [VersionInfoManager],
})
export class VersionInfoModule {
}