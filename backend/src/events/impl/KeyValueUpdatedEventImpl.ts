import { KeyValueUpdatedEvent } from '@/events/BasicEvent';
import { EventType } from '@/events/EventTypes';

export class KeyValueUpdatedEventImpl<K extends PropertyKey, V>
    implements KeyValueUpdatedEvent<K, V>
{
    public readonly type = EventType.KeyValueUpdated;
    public readonly timestamp = Date.now();

    constructor(
        public readonly source: string,
        public readonly payload: {
            key: K;
            value: V | null;
        },
    ) {}

    static of<K extends PropertyKey, T>(
        source: string,
        key: K,
        value: T | null,
    ): KeyValueUpdatedEventImpl<K, T> {
        return new KeyValueUpdatedEventImpl<K, T>(source, {
            key,
            value,
        });
    }
}
