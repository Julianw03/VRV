import { Injectable } from '@nestjs/common';
import { ValorantAssetAPI } from '@/integrations/NotOfficer/ValorantAssetAPI';
import { AssetResolverManager } from '@/modules/AssetResolving/common/AssetResolverManager';
import { GUID } from '#/schemas/GUIDSchema';
import { AgentAssetDTO } from '#/schemas/assets/AgentAssetDTO';
import { type AppConfig, InjectConfig } from '@/config/configLoader';

export type AgentId = GUID;

@Injectable()
export class AgentAssetResolverManager extends AssetResolverManager<AgentId, AgentAssetDTO, AgentAssetDTO> {
    constructor(
        valorantAssetAPI: ValorantAssetAPI,
        @InjectConfig()
        config: AppConfig,
    ) {
        super(valorantAssetAPI, config);
    }

    protected keyOf(entry: AgentAssetDTO): AgentId {
        return entry.uuid;
    }

    protected fetchEntries(): Promise<AgentAssetDTO[]> {
        return this.valorantAssetAPI.getAgentList();
    }
}
