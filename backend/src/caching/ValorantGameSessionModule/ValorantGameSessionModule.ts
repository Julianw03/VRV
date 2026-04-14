import { Module } from '@nestjs/common';
import { RiotClientModule } from '@/riotclient/RiotClientModule';
import { ValorantGameSessionManager } from '@/caching/ValorantGameSessionModule/ValorantGameSessionManager';
import { EventBusModule } from '@/events/EventBusModule';
import { ValorantGameSessionController } from '@/caching/ValorantGameSessionModule/ValorantGameSessionController';
import { ValorantGameChampSelectRCUAdapter } from '@/caching/ValorantGameSessionModule/ValorantGameChampSelectRCUAdapter';
import { ValorantMatchEndedRCUAdapter } from '@/caching/ValorantGameSessionModule/ValorantMatchEndedRCUAdapter';
import { ValorantGameInProgressChampSelectRCUAdapter } from '@/caching/ValorantGameSessionModule/ValorantGameInProgressChampSelectRCUAdapter';

@Module({
    imports: [RiotClientModule, EventBusModule],
    controllers: [ValorantGameSessionController],
    providers: [
        ValorantGameSessionManager,
        ValorantGameChampSelectRCUAdapter,
        ValorantMatchEndedRCUAdapter,
        ValorantGameInProgressChampSelectRCUAdapter,
    ],
    exports: [ValorantGameSessionManager],
})
export class ValorantGameSessionModule {}
