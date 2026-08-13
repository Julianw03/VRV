import { Global, Module } from '@nestjs/common';
import { ConfigLoader, SYMBOL_CONFIG } from '@/config/configLoader';
import { ConfigController } from '@/config/ConfigController';
import { ConfigLogger } from '@/config/ConfigLogger';

@Global()
@Module({
    controllers: [ConfigController],
    providers: [
        ConfigLoader,
        {
            // Async provider: Nest awaits this during NestFactory.create(),
            // so nothing downstream can observe an unresolved config.
            provide: SYMBOL_CONFIG,
            useFactory: (loader: ConfigLoader) => loader.getEffectiveConfig(),
            inject: [ConfigLoader],
        },
        ConfigLogger,
    ],
    exports: [ConfigLoader, SYMBOL_CONFIG],
})
export class ConfigurationModule {}
