import { Module } from '@nestjs/common';
import { RiotClientModule } from '@/riotclient/RiotClientModule';
import { EventBusModule } from '@/events/EventBusModule';
import { ValorantGameLoopRCUAdapter } from '@/caching/ValorantGameLoop/ValorantGameLoopRCUAdapter';
import { ValorantGameLoopController } from '@/caching/ValorantGameLoop/ValorantGameLoopController';
import { ValorantGameLoopManager } from '@/caching/ValorantGameLoop/ValorantGameLoopManager';
import { RiotValorantAPIModule } from '@/api/riot/RiotValorantAPIModule';
import { ProductSessionModule } from '@/caching/ProductSessionManager/ProductSessionModule';

@Module({
    imports: [RiotClientModule, EventBusModule, RiotValorantAPIModule, ProductSessionModule],
    controllers: [ValorantGameLoopController],
    providers: [ValorantGameLoopManager, ValorantGameLoopRCUAdapter],
    exports: [ValorantGameLoopManager],
})
export class ValorantGameLoopModule {}
