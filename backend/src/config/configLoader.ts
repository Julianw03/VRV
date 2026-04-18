import { EnvConfigV1DTO } from '@/config/ConfigV1DTO';
import { plainToInstance } from 'class-transformer';
import yaml from 'js-yaml';
import fs from 'node:fs';
import merge from 'lodash.merge'
import path from 'path';
import os from 'node:os';
import { validateSync } from 'class-validator';
import { registerAs } from '@nestjs/config';
import { getPackageAwarePath } from '@/utils/PackagedPath';

export const SYMBOL_CONFIG = Symbol('CONFIG');

export const getPersistentPath = () => {
    const localAppData =
        process.env.LOCALAPPDATA ??
        path.join(os.homedir(), 'AppData', 'Local');
    return path.join(localAppData, 'ValorantReplayViewer');
}

export const getConfigOverridesPath = () => {
    return path.join(getPersistentPath(), 'config-overrides.yml');
}

export const appConfig = registerAs(SYMBOL_CONFIG, () => {
    return configLoader();
});

const configLoader =  (): EnvConfigV1DTO => {
    let configToUse: any;
    const defaultConfig = yaml.load(fs.readFileSync(getPackageAwarePath( "config.yml"), 'utf8'));
    configToUse = merge({}, defaultConfig);
    try {
        const configPath = getConfigOverridesPath();
        console.info(`Attempting to load config overrides from ${configPath}`);
        const overrides = yaml.load(fs.readFileSync(configPath, 'utf8'));
        configToUse = merge({}, defaultConfig, overrides);
    } catch (e) {
        console.info("Failed to load config overrides, using default config.");
    }

    const instance = plainToInstance(EnvConfigV1DTO, configToUse, {
        enableImplicitConversion: true,
    });

    const errors = validateSync(instance, {
        whitelist: true,
        forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }

    return instance;
}