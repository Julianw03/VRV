import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AgentEntry, ValorantAssetAPI } from '@/integrations/NotOfficer/ValorantAssetAPI';
import { appConfig } from '@/config/configLoader';
import type { ConfigType } from '@nestjs/config';
import { IMapDataManager } from '@/core/data/interfaces/IMapDataManager';
import { SimpleMapDataManager } from '@/core/data/SimpleMapDataManager';
import { RecomputingMapMappingBehavior } from '@/core/data/behaviors/viewMapping/RecomputingMapMappingBehavior';
import { KeyDataViewable } from '@/core/data/interfaces/capabilities/KeyDataViewable';
import { AgentAssetDTO } from '#/dto/assets/AgentAssetDTO';


export type AgentId = UUID;

@Injectable()
export class AgentAssetResolverManager implements KeyDataViewable<AgentId, AgentAssetDTO>, OnModuleInit {
    protected readonly manager: IMapDataManager<AgentId, AgentEntry, AgentAssetDTO>;
    protected readonly logger = new Logger(this.constructor.name);

    constructor(
        protected readonly valorantAssetAPI: ValorantAssetAPI,
        @Inject(appConfig.KEY)
        protected readonly config: ConfigType<typeof appConfig>,
    ) {
        const base = new SimpleMapDataManager();
        this.manager = new RecomputingMapMappingBehavior(base, AgentAssetResolverManager.map);
    }

    private proxyAssetUrl(externalUrl: string): string {
        //TODO: This should be inferred at runtime.
        return `http://127.0.0.1:${this.config.configurations.app.port}/api/v1/assets/proxy?url=${encodeURIComponent(externalUrl)}`;
    }

    private overrideProxyResourcesFor(entry: AgentEntry) {
        for (const [key, value] of Object.entries(entry)) {
            if (typeof value === 'string' && value.startsWith('http')) {
                entry[key] = this.proxyAssetUrl(value);
            }
        }
        return entry;
    }

    onModuleInit() {
        this.valorantAssetAPI.getAgentList()
            .then(data => {
                const map = {};
                for (const entry of data) {
                    map[entry.uuid] = this.overrideProxyResourcesFor(entry);
                }
                this.logger.log('Fetched map list and updated state.');
                this.manager.updateKeyValueBatch(map);
            })
            .catch(err => {
                this.logger.error('Failed to fetch map list on initialization', err);
            });
    }

    protected static map(
        state: AgentEntry,
    ): AgentAssetDTO {
        return state;
    }

    getKeyView(key: AgentId): AgentAssetDTO | null {
        return this.manager.getKeyView(key);
    }

    getView(): Record<AgentId, AgentAssetDTO> | null {
        return this.manager.getView();
    }
}