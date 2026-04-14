import { StateUpdatedEvent } from '@/events/BasicEvent';
import { EventType } from '@/events/EventTypes';

export class StateUpdatedEventImpl<T> implements StateUpdatedEvent<T> {
    public readonly type = EventType.StateUpdated;
    public readonly timestamp = Date.now();

    constructor(
        public readonly source: string,
        public readonly payload: {
            value: T | null;
        },
    ) {}

    static of<T>(source: string, value: T | null): StateUpdatedEventImpl<T> {
        return new StateUpdatedEventImpl<T>(source, { value });
    }
}
