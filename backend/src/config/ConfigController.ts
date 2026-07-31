import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    Post,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { appConfig, getConfigOverridesPath, getPersistentPath } from '@/config/configLoader';
import { unlink } from 'node:fs/promises';
import fs from 'node:fs';
import { type ConfigType } from '@nestjs/config';
import { type EnvConfigV1DTO, EnvConfigV1DTOSchema } from '@/config/ConfigV1.schema';
import { ZodValidationPipe } from 'nestjs-zod';

@Controller({
    path: 'configuration',
    version: '1',
})
export class ConfigController {
    private readonly logger = new Logger(this.constructor.name);

    constructor(
        @Inject(appConfig.KEY)
        private readonly config: ConfigType<typeof appConfig>,
    ) {
    }

    @ApiOperation({
        summary: 'Check if a provided configuration is valid',
        description: 'Can be used to validate a configuration file before saving it. This does not change the current configuration.',
    })
    @Post('validate')
    @ApiBadRequestResponse(
        {
            description: 'Invalid configuration',
        },
    )
    @ApiOkResponse(
        {
            description: 'The config that would be saved.',
        },
    )
    public async validateConfig(@Body(new ZodValidationPipe(EnvConfigV1DTOSchema)) config: EnvConfigV1DTO): Promise<EnvConfigV1DTO> {
        return config;
    }

    @Delete('overrides')
    public async restoreDefaultConfiguration(): Promise<void> {
        try {
            await unlink(getConfigOverridesPath());
        } catch (e) {
            this.logger.error('Failed to delete config overrides file', e);
            throw new InternalServerErrorException('Failed to delete config overrides file');
        }
    }

    @Post('overrides')
    @ApiBadRequestResponse(
        {
            description: 'Invalid configuration',
        },
    )
    @ApiOkResponse(
        {
            description: 'Can be used to validate a configuration file before saving it. This does not change the current configuration.',
        },
    )
    public async updateCurrentConfiguration(@Body(new ZodValidationPipe(EnvConfigV1DTOSchema)) config: EnvConfigV1DTO): Promise<EnvConfigV1DTO> {
        try {
            const content = JSON.stringify(config);
            await fs.promises.mkdir(getPersistentPath(), { recursive: true });
            await fs.promises.writeFile(getConfigOverridesPath(), content, 'utf8');
            return config;
        } catch (e) {
            this.logger.error('Failed to write config overrides file', e);
            throw new InternalServerErrorException('Failed to write config overrides file');
        }
    }

    @Get('overrides')
    @ApiNotFoundResponse(
        {
            description: 'No configuration overrides found',
        },
    )
    public async readCurrentConfiguration(): Promise<EnvConfigV1DTO> {
        try {
            const content = await fs.promises.readFile(getConfigOverridesPath(), 'utf8');
            return JSON.parse(content) as EnvConfigV1DTO;
        } catch (e) {
            this.logger.error('Failed to read config overrides file', e);
            throw new NotFoundException('No configuration overrides found');
        }
    }

    @Get('current')
    public async getEffectiveConfiguration(): Promise<EnvConfigV1DTO> {
        return this.config;
    }
}