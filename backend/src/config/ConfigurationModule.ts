import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigLogger } from '@/config/ConfigLogger';
import { ConfigController } from '@/config/ConfigController';

@Module({
    imports: [ConfigModule],
    providers: [ConfigLogger, ConfigController],
    controllers: [ConfigController],
    exports: [ConfigLogger]
})
export class ConfigurationModule {}