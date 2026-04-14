import { Module } from '@nestjs/common';
import { RiotClientModule } from '@/riotclient/RiotClientModule';
import { ProductSessionModule } from '@/caching/ProductSessionManager/ProductSessionModule';
import { ValorantGameSessionModule } from '@/caching/ValorantGameSessionModule/ValorantGameSessionModule';
import { AccountNameAndTagLineModule } from '@/caching/AccountNameAndTagLineModule/AccountNameAndTagLineModule';
import { EntitlementTokenModule } from '@/caching/EntitlementTokenManager/EntitlementTokenModule';
import { ValorantMatchStatsModule } from '@/caching/ValorantMatchStatsModule/ValorantMatchStatsModule';
import { EventBusModule } from '@/events/EventBusModule';
import { ConfigModule } from '@nestjs/config';
import { ReplayModule } from '@/plugins/replay/ReplayModule';
import { ValorantGameLoopModule } from '@/caching/ValorantGameLoop/ValorantGameLoopModule';
import { RiotValorantAPIModule } from '@/api/riot/RiotValorantAPIModule';
import { ValorantAssetAPIModule } from '@/api/NotOfficer/ValorantAssetAPIModule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MapAssetResolverModule } from '@/caching/AssetResolving/MapAssetResolverModule';
import { StaticAssetProxyModule } from '@/caching/AssetProxy/StaticAssetProxyModule';
import { VersionInfoModule } from '@/caching/VersionInfo/VersionInfoModule';


@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'public'),
            serveRoot: '/',
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        RiotClientModule,
        ProductSessionModule,
        AccountNameAndTagLineModule,
        ValorantGameSessionModule,
        EntitlementTokenModule,
        ValorantMatchStatsModule,
        ValorantGameLoopModule,
        RiotValorantAPIModule,
        ValorantAssetAPIModule,
        MapAssetResolverModule,
        StaticAssetProxyModule,
        VersionInfoModule,
        EventBusModule,
        ReplayModule,
    ],
})
export class AppModule {
}
