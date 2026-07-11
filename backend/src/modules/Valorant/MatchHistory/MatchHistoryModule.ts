import { Module } from '@nestjs/common';
import { ProductSessionModule } from '@/modules/ProductSessionModule/ProductSessionModule';
import { EventBusModule } from '@/core/events/EventBusModule';
import { MatchHistoryController } from '@/modules/Valorant/MatchHistory/MatchHistoryController';
import { MatchHistoryManager } from '@/modules/Valorant/MatchHistory/MatchHistoryManager';
import { RiotValorantAPIModule } from '@/integrations/riot/RiotValorantAPIModule';
import { ValorantMatchStatsModule } from '@/modules/Valorant/ValorantMatchStatsModule/ValorantMatchStatsModule';

@Module({
    imports: [
        ValorantMatchStatsModule,
        ProductSessionModule,
        RiotValorantAPIModule,
        EventBusModule,
    ],
    controllers: [
        MatchHistoryController,
    ],
    providers: [
        MatchHistoryController,
        MatchHistoryManager,
    ],
    exports: [
        MatchHistoryManager,
    ],
})
export class ValorantMatchHistoryModule {
}