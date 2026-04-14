import { ObjectDataManager } from '@/caching/base/ObjectDataManager';
import type { RiotClientService } from '@/riotclient/RiotClientService';
import { SimpleEventBus } from '@/events/SimpleEventBus';
import { StateUpdatedEventImpl } from '@/events/impl/StateUpdatedEventImpl';

export abstract class EmittingObjectDataManager<T, E> extends ObjectDataManager<
    T,
    E
> {
    protected constructor(protected readonly eventBus: SimpleEventBus) {
        super();
    }

    protected setState(data: T | null) {
        const prev = this.getState();
        super.setState(data);
        const newView = this.getViewFor(data);
        if (this.getViewFor(prev) !== newView) {
            this.eventBus.publish(
                StateUpdatedEventImpl.of(this.constructor.name, newView),
            );
        }
    }
}
