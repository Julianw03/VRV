import { Module } from '@nestjs/common';
import { RiotClientModule } from '@/riotclient/RiotClientModule';
import { EventBusModule } from '@/events/EventBusModule';
import { ValorantGameLoopRCUAdapter } from '@/caching/ValorantGameLoop/ValorantGameLoopRCUAdapter';
import { ValorantGameLoopController } from '@/caching/ValorantGameLoop/ValorantGameLoopController';
import { ValorantGameLoopManager } from '@/caching/ValorantGameLoop/ValorantGameLoopManager';
import { RiotValorantAPIModule } from '@/api/riot/RiotValorantAPIModule';

@Module({
    imports: [RiotClientModule, EventBusModule, RiotValorantAPIModule],
    controllers: [ValorantGameLoopController],
    providers: [ValorantGameLoopManager, ValorantGameLoopRCUAdapter],
    exports: [ValorantGameLoopManager],
})
export class ValorantGameLoopModule {}
