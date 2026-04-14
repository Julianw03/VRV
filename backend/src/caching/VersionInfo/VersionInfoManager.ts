import { Injectable, OnModuleInit } from '@nestjs/common';
import { ObjectDataManager } from '@/caching/base/ObjectDataManager';
import { ValorantAssetAPI, VersionInfo } from '@/api/NotOfficer/ValorantAssetAPI';

@Injectable()
export class VersionInfoManager extends ObjectDataManager<VersionInfo, string> implements OnModuleInit {

    constructor(
        protected readonly valorantAssetApi: ValorantAssetAPI,
    ) {
        super();
    }

    onModuleInit() {
        this.valorantAssetApi.getVersionInfo()
            .then((data) => {
                this.setState(data);
            })
            .catch((err) => {
                this.logger.error('Failed to fetch version info on initialization', err);
            })
    }


    protected getViewFor(state: VersionInfo | null): string | null {
        return state ? state.riotClientVersion : null;
    }

    protected async resetInternalState(): Promise<void> {
        this.setState(null)
    }
}