import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { AgentAssetResolverManager } from '@/modules/AssetResolving/Agents/AgentAssetResolverManager';

@Controller({
    path: 'assets/agents',
    version: '1'
})
export class AgentAssetResolverController {
    constructor(
        protected readonly assetResolver: AgentAssetResolverManager
    ) {}


    @Get('/:agentId')
    public async getAgentAsset(@Param('agentId') agentId: UUID) {
        const mapAsset = this.assetResolver.getKeyView(agentId);
        if (!mapAsset) {
            throw new NotFoundException(`Map asset not found for path: ${agentId}`);
        }
        return mapAsset;
    }

    @Get('/')
    public async getAllAgentAssets() {
        const allAssets = this.assetResolver.getView();
        if (!allAssets) {
            throw new NotFoundException(`Map assets not ready yet.`);
        }
        return allAssets;
    }
}