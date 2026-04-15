import { Controller, Get } from '@nestjs/common';
import { VersionInfoManager } from '@/caching/VersionInfo/VersionInfoManager';

@Controller({
    path: 'caching/version-info',
    version: '1',
})
export class VersionInfoController {
    constructor(protected readonly versionInfoManager: VersionInfoManager) {
    }

    @Get('')
    public async getVersionInfo() {
        return this.versionInfoManager.getView();
    }
}