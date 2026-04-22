import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MapDataManager } from '@/caching/base/MapDataManager';
import { MapEntry, ValorantAssetAPI } from '@/api/NotOfficer/ValorantAssetAPI';
import { appConfig } from '@/config/configLoader';
import type { ConfigType } from '@nestjs/config';


export type MapId = string;

export type MapAsset = Omit<MapEntry, 'uuid'>;

@Injectable()
export class MapAssetResolverManager extends MapDataManager<MapId, MapEntry, MapAsset> implements OnModuleInit {
    protected readonly logger = new Logger(this.constructor.name);

    constructor(
        protected readonly valorantAssetAPI: ValorantAssetAPI,
        @Inject(appConfig.KEY)
        protected readonly config: ConfigType<typeof appConfig>
    ) {
        super();
    }

    private proxyAssetUrl(externalUrl: string): string {
        //TODO: This should be inferred at runtime.
        return `http://127.0.0.1:${this.config.configurations.app.port}/api/v1/assets/proxy?url=${encodeURIComponent(externalUrl)}`;
    }

    private overrideProxyRessourcesFor(entry: MapEntry) {
        for (const [key, value] of Object.entries(entry)) {
            if (typeof value === 'string' && value.startsWith('http')) {
                entry[key as keyof MapAsset] = this.proxyAssetUrl(value);
            }
        }
        return entry;
    }

    onModuleInit() {
        this.valorantAssetAPI.getMapList()
            .then(data => {
                const map = new Map<string, MapEntry>();
                for (const entry of data) {
                    map.set(entry.mapUrl, this.overrideProxyRessourcesFor(entry));
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