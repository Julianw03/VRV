import { Module } from '@nestjs/common';
import { RiotClientModule } from '@/riotclient/RiotClientModule';
import { ValorantGameSessionManager } from '@/caching/ValorantGameSessionModule/ValorantGameSessionManager';
import { EventBusModule } from '@/events/EventBusModule';
import { ValorantGameSessionController } from '@/caching/ValorantGameSessionModule/ValorantGameSessionController';
import { ValorantGameChampSelectRCUAdapter } from '@/caching/ValorantGameSessionModule/ValorantGameChampSelectRCUAdapter';
import { ValorantMatchEndedRCUAdapter } from '@/caching/ValorantGameSessionModule/ValorantMatchEndedRCUAdapter';
import { ValorantGameInProgressRCUAdapter } from '@/caching/ValorantGameSessionModule/ValorantGameInProgressRCUAdapter';
import { ProductSessionModule } from '@/caching/ProductSessionManager/ProductSessionModule';

@Module({
    imports: [RiotClientModule, EventBusModule, ProductSessionModule],
    controllers: [ValorantGameSessionController],
    providers: [
        ValorantGameSessionManager,
        ValorantGameChampSelectRCUAdapter,
        ValorantMatchEndedRCUAdapter,
        ValorantGameInProgressRCUAdapter,
    ],
    exports: [ValorantGameSessionManager],
})
export class ValorantGameSessionModule {}
