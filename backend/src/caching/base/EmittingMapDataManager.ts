import { MapDataManager } from '@/caching/base/MapDataManager';
import type { RiotClientService } from '@/riotclient/RiotClientService';
import { SimpleEventBus } from '@/events/SimpleEventBus';
import { EventType } from '@/events/EventTypes';
import { StateUpdatedEventImpl } from '@/events/impl/StateUpdatedEventImpl';
import { KeyValueUpdatedEventImpl } from '@/events/impl/KeyValueUpdatedEventImpl';

export abstract class EmittingMapDataManager<
    K extends PropertyKey,
    V,
    E,
> extends MapDataManager<K, V, E> {
    protected constructor(protected readonly eventBus: SimpleEventBus) {
        super();
    }

    setState(state: Map<K, V>) {
        super.setState(state);
        this.eventBus.publish<EventType.StateUpdated>(
            StateUpdatedEventImpl.of(
                this.constructor.name,
                this.getViewFor(state),
            ),
        );
    }

    deleteKey(key: K) {
        const prev = this.get(key);
        super.deleteKey(key);
        const newView = this.getViewForValue(null);
        const prevView = this.getViewForValue(prev);
        if (this.getViewForValue(prev) !== null) {
            this.eventBus.publish<EventType.KeyValueUpdated>(
                KeyValueUpdatedEventImpl.ofDiff(
                    this.constructor.name,
                    key,
                    newView,
                    prevView
                ),
            );
        }
    }

    setKeyValue(key: K, value: V) {
        const prev = this.get(key) ?? null;
        super.setKeyValue(key, value);
        const newView = this.getViewForValue(value);
        const prevView = this.getViewForValue(prev);
        if (prevView !== newView) {
            this.eventBus.publish<EventType.KeyValueUpdated>(
                KeyValueUpdatedEventImpl.ofDiff(
                    this.constructor.name,
                    key,
                    newView,
                    prevView
                ),
            );
        }
    }
}
