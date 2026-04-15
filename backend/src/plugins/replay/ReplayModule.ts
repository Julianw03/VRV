import { Module } from '@nestjs/common';
import { RiotClientModule } from '@/riotclient/RiotClientModule';
import { EntitlementTokenModule } from '@/caching/EntitlementTokenManager/EntitlementTokenModule';
import { ProductSessionModule } from '@/caching/ProductSessionManager/ProductSessionModule';
import { ReplayIOManager } from '@/plugins/replay/storage/ReplayIOManager';
import { ReplayFetchManager } from '@/plugins/replay/remote/ReplayFetchManager';
import { ReplayInjectManager } from '@/plugins/replay/injector/ReplayInjectManager';
import { EventBusModule } from '@/events/EventBusModule';
import { ReplayIOController } from '@/plugins/replay/storage/ReplayIOController';
import { ReplayRemoteController } from '@/plugins/replay/remote/ReplayRemoteController';
import { ReplayInjectController } from '@/plugins/replay/injector/ReplayInjectController';
import { ValorantGameLoopModule } from '@/caching/ValorantGameLoop/ValorantGameLoopModule';
import { RiotValorantAPIModule } from '@/api/riot/RiotValorantAPIModule';
import { ValorantMatchStatsModule } from '@/caching/ValorantMatchStatsModule/ValorantMatchStatsModule';
import { AccountNameAndTagLineModule } from '@/caching/AccountNameAndTagLineModule/AccountNameAndTagLineModule';

@Module({
    imports: [
        RiotClientModule,
        EntitlementTokenModule,
        ProductSessionModule,
        ValorantMatchStatsModule,
        EventBusModule,
        ValorantGameLoopModule,
        RiotValorantAPIModule
    ],
    providers: [ReplayIOManager, ReplayFetchManager, ReplayInjectManager],
    controllers: [
        ReplayIOController,
        ReplayRemoteController,
        ReplayInjectController,
    ],
})
export class ReplayModule {}
