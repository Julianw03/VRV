import { Module } from '@nestjs/common';
import { ValorantAssetAPIModule } from '@/api/NotOfficer/ValorantAssetAPIModule';
import { VersionInfoManager } from '@/caching/VersionInfo/VersionInfoManager';

@Module({
    imports: [ValorantAssetAPIModule],
    providers: [VersionInfoManager],
    exports: [VersionInfoManager]
})
export class VersionInfoModule {}