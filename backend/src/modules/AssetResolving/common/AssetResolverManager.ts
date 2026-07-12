import { Logger, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ValorantAssetAPI } from '@/integrations/NotOfficer/ValorantAssetAPI';
import { appConfig } from '@/config/configLoader';
import { IMapDataManager } from '@/core/data/interfaces/IMapDataManager';
import { SimpleMapDataManager } from '@/core/data/SimpleMapDataManager';
import { RecomputingMapMappingBehavior } from '@/core/data/behaviors/viewMapping/RecomputingMapMappingBehavior';
import { KeyDataViewable } from '@/core/data/interfaces/capabilities/KeyDataViewable';

/**
 * Base for asset resolver managers: fetches a list of entries from the
 * ValorantAssetAPI, rewrites any external resource URL to go through the
 * local asset proxy, and keeps the result queryable by key. Subclasses only
 * need to say how to fetch entries and how to key them.
 */
export abstract class AssetResolverManager<TId extends PropertyKey, TEntry, TDto = TEntry>
    implements KeyDataViewable<TId, TDto>, OnModuleInit {
    protected readonly manager: IMapDataManager<TId, TEntry, TDto>;
    protected readonly logger = new Logger(this.constructor.name);

    protected constructor(
        protected readonly valorantAssetAPI: ValorantAssetAPI,
        protected readonly config: ConfigType<typeof appConfig>,
    ) {
        const base = new SimpleMapDataManager<TId, TEntry>();
        this.manager = new RecomputingMapMappingBehavior(base, (entry) => this.mapEntry(entry));
    }

    protected abstract keyOf(entry: TEntry): TId;

    protected abstract fetchEntries(): Promise<TEntry[]>;

    protected mapEntry(entry: TEntry): TDto {
        return entry as unknown as TDto;
    }

    private proxyAssetUrl(externalUrl: string): string {
        //TODO: This should be inferred at runtime.
        return `http://127.0.0.1:${this.config.configurations.app.port}/api/v1/assets/proxy?url=${encodeURIComponent(externalUrl)}`;
    }

    private overrideProxyResourcesFor(entry: TEntry): TEntry {
        for (const [key, value] of Object.entries(entry as Record<string, unknown>)) {
            if (typeof value === 'string' && value.startsWith('http')) {
                (entry as Record<string, unknown>)[key] = this.proxyAssetUrl(value);
            }
        }
        return entry;
    }

    onModuleInit() {
        this.fetchEntries()
            .then((data) => {
                const map = {} as Record<TId, TEntry>;
                for (const entry of data) {
                    map[this.keyOf(entry)] = this.overrideProxyResourcesFor(entry);
                }
                this.logger.log(`Fetched ${data.length} entries and updated state.`);
                this.manager.updateKeyValueBatch(map);
            })
            .catch((err) => {
                this.logger.error('Failed to fetch entries on initialization', err);
            });
    }

    getKeyView(key: TId): TDto | null {
        return this.manager.getKeyView(key);
    }

    getView(): Record<TId, TDto> | null {
        return this.manager.getView();
    }
}
