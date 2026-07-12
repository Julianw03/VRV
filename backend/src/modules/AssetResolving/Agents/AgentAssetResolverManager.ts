import { Inject, Injectable } from '@nestjs/common';
import { AgentEntry, ValorantAssetAPI } from '@/integrations/NotOfficer/ValorantAssetAPI';
import { appConfig } from '@/config/configLoader';
import type { ConfigType } from '@nestjs/config';
import { AgentAssetDTO } from '#/dto/assets/AgentAssetDTO';
import { AssetResolverManager } from '@/modules/AssetResolving/common/AssetResolverManager';

export type AgentId = UUID;

@Injectable()
export class AgentAssetResolverManager extends AssetResolverManager<AgentId, AgentEntry, AgentAssetDTO> {
    constructor(
        valorantAssetAPI: ValorantAssetAPI,
        @Inject(appConfig.KEY)
        config: ConfigType<typeof appConfig>,
    ) {
        super(valorantAssetAPI, config);
    }

    protected keyOf(entry: AgentEntry): AgentId {
        return entry.uuid;
    }

    protected fetchEntries(): Promise<AgentEntry[]> {
        return this.valorantAssetAPI.getAgentList();
    }
}
