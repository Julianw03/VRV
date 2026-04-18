import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { appConfig } from '@/config/configLoader';
import { type ConfigType } from '@nestjs/config';

@Injectable()
export class ConfigLogger implements OnModuleInit {
    private readonly logger = new Logger(this.constructor.name);

    constructor(
        @Inject(appConfig.KEY)
        private readonly config: ConfigType<typeof appConfig>
    ) {
    }

    onModuleInit() {
        this.logger.log('Init with config', this.config)
    }
}