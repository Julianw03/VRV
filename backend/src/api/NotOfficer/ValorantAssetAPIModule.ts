import { Module } from '@nestjs/common';
import { ValorantAssetAPI } from '@/api/NotOfficer/ValorantAssetAPI';
import { VALORANT_API_BASE_URL } from '@/api/NotOfficer/ValorantAPITokens';

@Module({
    imports: [],
    providers: [
        {
            provide: VALORANT_API_BASE_URL,
            useValue: 'https://valorant-api.com',
        },
        ValorantAssetAPI],
    exports: [ValorantAssetAPI],
})
export class ValorantAssetAPIModule {
}