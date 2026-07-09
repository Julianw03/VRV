import { Module } from '@nestjs/common';
import { RiotClientModule } from '@/core/riotclient/RiotClientModule';
import { AccountNameAndTagLineManager } from '@/modules/Account/AccountNameAndTagLineModule/AccountNameAndTagLineManager';
import { EventBusModule } from '@/core/events/EventBusModule';
import { AccountNameAndTagLineController } from '@/modules/Account/AccountNameAndTagLineModule/AccountNameAndTagLineController';
import { AccountNameAndTagLineRCUAdapter } from '@/modules/Account/AccountNameAndTagLineModule/AccountNameAndTagLineRCUAdapter';

@Module({
    imports: [RiotClientModule, EventBusModule],
    controllers: [AccountNameAndTagLineController],
    providers: [AccountNameAndTagLineManager, AccountNameAndTagLineRCUAdapter],
    exports: [AccountNameAndTagLineManager],
})
export class AccountNameAndTagLineModule {}
