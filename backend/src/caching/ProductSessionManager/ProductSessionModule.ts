import { ProductSessionManager } from './ProductSessionManager';
import { Module } from '@nestjs/common';
import { RiotClientModule } from '@/riotclient/RiotClientModule';
import { ProductSessionRCUAdapter } from '@/caching/ProductSessionManager/ProductSessionRCUAdapter';

@Module({
    imports: [RiotClientModule],
    providers: [ProductSessionManager, ProductSessionRCUAdapter],
    exports: [ProductSessionManager],
})
export class ProductSessionModule {}
