import { Module } from '@nestjs/common';
import { RiotClientModule } from '@/riotclient/RiotClientModule';
import { AccountNameAndTagLineManager } from '@/caching/AccountNameAndTagLineModule/AccountNameAndTagLineManager';
import { EventBusModule } from '@/events/EventBusModule';
import { AccountNameAndTagLineController } from '@/caching/AccountNameAndTagLineModule/AccountNameAndTagLineController';
import { AccountNameAndTagLineRCUAdapter } from '@/caching/AccountNameAndTagLineModule/AccountNameAndTagLineRCUAdapter';

@Module({
    imports: [RiotClientModule, EventBusModule],
    controllers: [AccountNameAndTagLineController],
    providers: [AccountNameAndTagLineManager, AccountNameAndTagLineRCUAdapter],
    exports: [AccountNameAndTagLineManager],
})
export class AccountNameAndTagLineModule {}
