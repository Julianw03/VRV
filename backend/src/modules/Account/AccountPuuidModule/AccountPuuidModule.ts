import { Module } from '@nestjs/common';
import { EventBusModule } from '@/core/events/EventBusModule';
import { RiotClientModule } from '@/core/riotclient/RiotClientModule';
import { AccountPuuidController } from '@/modules/Account/AccountPuuidModule/AccountPuuidController';
import { AccountPuuidManager } from '@/modules/Account/AccountPuuidModule/AccountPuuidManager';
import { AccountPuuidRCUAdapter } from '@/modules/Account/AccountPuuidModule/AccountPuuidRCUAdapter';

@Module({
    imports: [RiotClientModule, EventBusModule],
    controllers: [AccountPuuidController],
    providers: [AccountPuuidManager, AccountPuuidRCUAdapter],
    exports: [AccountPuuidManager],
})
export class AccountPuuidModule {
}