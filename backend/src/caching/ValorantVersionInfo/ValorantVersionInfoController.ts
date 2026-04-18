import { Controller, Get } from '@nestjs/common';
import { ValorantVersionInfoManager } from '@/caching/ValorantVersionInfo/ValorantVersionInfoManager';

@Controller({
    path: 'caching/valorant-version-info',
    version: '1',
})
export class ValorantVersionInfoController {
    constructor(protected readonly versionInfoManager: ValorantVersionInfoManager) {
    }

    @Get('')
    public async getVersionInfo() {
        return this.versionInfoManager.getView();
    }
}