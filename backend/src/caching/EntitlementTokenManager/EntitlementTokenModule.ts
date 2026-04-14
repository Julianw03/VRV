import { Module } from '@nestjs/common';
import { RiotClientModule } from '@/riotclient/RiotClientModule';
import { EntitlementTokenManager } from '@/caching/EntitlementTokenManager/EntitlementTokenManager';
import { EntitlementTokenRCUAdapter } from '@/caching/EntitlementTokenManager/EntitlementTokenRCUAdapter';

@Module({
    imports: [RiotClientModule],
    providers: [EntitlementTokenManager, EntitlementTokenRCUAdapter],
    exports: [EntitlementTokenManager],
})
export class EntitlementTokenModule {}
