import { Module } from '@nestjs/common';
import { EntitlementTokenModule } from '@/caching/EntitlementTokenManager/EntitlementTokenModule';
import { ProductSessionModule } from '@/caching/ProductSessionManager/ProductSessionModule';
import { RiotValorantAPI } from '@/api/riot/RiotValorantAPI';
import { VersionInfoModule } from '@/caching/VersionInfo/VersionInfoModule';

@Module({
    imports: [EntitlementTokenModule, ProductSessionModule, VersionInfoModule],
    providers: [RiotValorantAPI],
    exports: [RiotValorantAPI],
})
export class RiotValorantAPIModule {}
