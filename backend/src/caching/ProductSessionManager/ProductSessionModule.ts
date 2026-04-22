import { ProductSessionManager } from './ProductSessionManager';
import { Module } from '@nestjs/common';
import { RiotClientModule } from '@/riotclient/RiotClientModule';
import { ProductSessionRCUAdapter } from '@/caching/ProductSessionManager/ProductSessionRCUAdapter';
import { ProductSessionGuard } from '@/caching/ProductSessionManager/ProductSessionGuard';
import { EventBusModule } from '@/events/EventBusModule';
import { ProductSessionController } from '@/caching/ProductSessionManager/ProductSessionController';

@Module({
    imports: [RiotClientModule, EventBusModule],
    providers: [ProductSessionManager, ProductSessionRCUAdapter, ProductSessionGuard],
    controllers: [ProductSessionController],
    exports: [ProductSessionManager, ProductSessionGuard],
})
export class ProductSessionModule {}
