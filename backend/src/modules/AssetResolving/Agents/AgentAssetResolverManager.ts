import { Inject, Injectable } from '@nestjs/common';
import { ValorantAssetAPI } from '@/integrations/NotOfficer/ValorantAssetAPI';
import { appConfig } from '@/config/configLoader';
import type { ConfigType } from '@nestjs/config';
import { AssetResolverManager } from '@/modules/AssetResolving/common/AssetResolverManager';
import { GUID } from '#/schemas/GUIDSchema';
import { AgentAssetDTO } from '#/schemas/assets/AgentAssetDTO';

export type AgentId = GUID;

@Injectable()
export class AgentAssetResolverManager extends AssetResolverManager<AgentId, AgentAssetDTO, AgentAssetDTO> {
    constructor(
        valorantAssetAPI: ValorantAssetAPI,
        @Inject(appConfig.KEY)
        config: ConfigType<typeof appConfig>,
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
