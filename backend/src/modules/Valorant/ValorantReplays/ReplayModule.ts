import { Module } from '@nestjs/common';
import { RiotClientModule } from '@/core/riotclient/RiotClientModule';
import { EntitlementTokenModule } from '@/modules/EntitlementTokenModule/EntitlementTokenModule';
import { ProductSessionModule } from '@/modules/ProductSessionModule/ProductSessionModule';
import { ReplayFetchManager } from '@/modules/Valorant/ValorantReplays/remote/ReplayFetchManager';
import { EventBusModule } from '@/core/events/EventBusModule';
import { ReplayRemoteController } from '@/modules/Valorant/ValorantReplays/remote/ReplayRemoteController';
import { ReplayInjectController } from '@/modules/Valorant/ValorantReplays/injector/ReplayInjectController';
import { ValorantGameLoopModule } from '@/modules/Valorant/ValorantGameLoopModule/ValorantGameLoopModule';
import { RiotValorantAPIModule } from '@/integrations/riot/RiotValorantAPIModule';
import { ValorantMatchStatsModule } from '@/modules/Valorant/ValorantMatchStatsModule/ValorantMatchStatsModule';
import { ConfigModule } from '@nestjs/config';
import { ReplayIOManager } from '@/modules/Valorant/ValorantReplays/storage/ReplayIOManager';
import { ReplayIOController } from '@/modules/Valorant/ValorantReplays/storage/ReplayIOController';
import { PuuidToPlayerAliasModule } from '@/modules/PuuidToPlayerAliasModule/PuuidToPlayerAliasModule';
import { ValorantMatchHistoryModule } from '@/modules/Valorant/MatchHistory/MatchHistoryModule';
import { ReplayInjectManagerV2 } from '@/modules/Valorant/ValorantReplays/injector/ReplayInjectManagerV2';

@Module({
    imports: [
        RiotClientModule,
        EntitlementTokenModule,
        ProductSessionModule,
        ValorantMatchStatsModule,
        ValorantMatchHistoryModule,
        EventBusModule,
        ValorantGameLoopModule,
        PuuidToPlayerAliasModule,
        RiotValorantAPIModule,
        ConfigModule,
    ],
    providers: [ReplayIOManager, ReplayFetchManager, ReplayInjectManagerV2],
    controllers: [
        ReplayIOController,
        ReplayRemoteController,
        ReplayInjectController,
    ],
})
export class ReplayModule {
}
