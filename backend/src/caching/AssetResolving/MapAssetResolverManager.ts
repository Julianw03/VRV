import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MapDataManager } from '@/caching/base/MapDataManager';
import { MapEntry, ValorantAssetAPI } from '@/api/NotOfficer/ValorantAssetAPI';


export type MapId = string;

export type MapAsset = Omit<MapEntry, 'uuid'>;

@Injectable()
export class MapAssetResolverManager extends MapDataManager<MapId, MapEntry, MapAsset> implements OnModuleInit {
    protected readonly logger = new Logger(this.constructor.name);

    constructor(
        protected readonly valorantAssetAPI: ValorantAssetAPI,
    ) {
        super();
    }

    onModuleInit() {
        this.valorantAssetAPI.getMapList()
            .then(data => {
                const map = new Map<string, MapEntry>();
                for (const entry of data) {
                    map.set(entry.mapUrl, entry);
                }
                this.logger.log('Fetched map list and updated state.');
                this.setState(map);
            })
            .catch(err => {
                this.logger.error('Failed to fetch map list on initialization', err);
            });
    }

    protected getViewForValue(
        state: MapEntry | null,
    ): MapAsset | null {
        return state ?? null;
    }

    protected async resetInternalState(): Promise<void> {
        this.setState(new Map);
    }
}