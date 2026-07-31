import fs from 'node:fs';
import merge from 'lodash.merge';
import path from 'path';
import os from 'node:os';
import { registerAs } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { getPackageAwarePath } from '@/utils/PackagedPath';
import { EnvConfigV1DTO, EnvConfigV1DTOSchema, OverridableConfigV1Schema } from '@/config/ConfigV1.schema';

export const SYMBOL_CONFIG = Symbol('CONFIG');

class ConfigLoader {
    private readonly logger = new Logger(this.constructor.name);

    public getPersistentPath(): string {
        const localAppData =
            process.env.LOCALAPPDATA ??
            path.join(os.homedir(), 'AppData', 'Local');
        return path.join(localAppData, 'ValorantReplayViewer');
    }

    public getConfigOverridesPath(): string {
        return path.join(this.getPersistentPath(), 'config-overrides.json');
    }

    public load(): EnvConfigV1DTO {
        const defaultConfig = JSON.parse(fs.readFileSync(getPackageAwarePath('config.json'), 'utf8'));
        let configToUse: any = merge({}, defaultConfig);

        try {
            const configPath = this.getConfigOverridesPath();
            this.logger.log(`Attempting to load config overrides from ${configPath}`);

            if (fs.existsSync(configPath)) {
                const overrides = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                OverridableConfigV1Schema.parse(overrides);
                configToUse = merge({}, defaultConfig, overrides);
                return EnvConfigV1DTOSchema.parse(configToUse);
            } else {
                this.logger.log(`No config overrides found at ${configPath}`);
            }
        } catch (e) {
            this.logger.warn('Failed to load config overrides, using default config.', e);
        }

        return EnvConfigV1DTOSchema.parse(defaultConfig);
    }
}

const configLoader = new ConfigLoader();

export const getPersistentPath = () => configLoader.getPersistentPath();
export const getConfigOverridesPath = () => configLoader.getConfigOverridesPath();

export const appConfig = registerAs(SYMBOL_CONFIG, () => configLoader.load());