import { Module } from '@nestjs/common';
import { ValorantAssetAPIModule } from '@/api/NotOfficer/ValorantAssetAPIModule';
import { ValorantVersionInfoManager } from '@/caching/ValorantVersionInfo/ValorantVersionInfoManager';
import { EventBusModule } from '@/events/EventBusModule';
import { ValorantVersionInfoController } from '@/caching/ValorantVersionInfo/ValorantVersionInfoController';

@Module({
    imports: [ValorantAssetAPIModule, EventBusModule],
    providers: [ValorantVersionInfoManager, ValorantVersionInfoController],
    controllers: [ValorantVersionInfoController],
    exports: [ValorantVersionInfoManager],
})
export class ValorantVersionInfoModule {
}