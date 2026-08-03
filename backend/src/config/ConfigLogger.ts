import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { type AppConfig, InjectConfig } from '@/config/configLoader';

@Injectable()
export class ConfigLogger implements OnModuleInit {
    private readonly logger = new Logger(this.constructor.name);

    constructor(
        @InjectConfig()
        private readonly config: AppConfig,
    ) {
    }

    onModuleInit() {
        this.logger.log('Init with config', this.config);
    }
}
