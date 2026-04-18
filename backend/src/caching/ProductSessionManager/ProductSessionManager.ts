import { Injectable } from '@nestjs/common';
import { ProductSessionSession } from '@/../gen';
import { ProductSessionDTO } from '@/caching/ProductSessionManager/ProductSessionDTO';
import { EmittingMapDataManager } from '@/caching/base/EmittingMapDataManager';
import { SimpleEventBus } from '@/events/SimpleEventBus';
import { EventType } from '@/events/EventTypes';
import { KeyUpdateActionType, KeyValueUpdatedEvent, StateUpdatedEvent } from '@/events/BasicEvent';

export type SessionId = string;

export type SessionLaunchSubscriptionParams = {
    eventBus: SimpleEventBus;
    productId: string;
    callback: (sessionId: string, session: ProductSessionDTO) => void;
}

@Injectable()
export class ProductSessionManager extends EmittingMapDataManager<
    SessionId,
    ProductSessionSession,
    ProductSessionDTO
> {
    public static readonly onNewSessionLaunch = ({
                                                     eventBus,
                                                     productId,
                                                     callback,
                                                 }: SessionLaunchSubscriptionParams) => {
        return eventBus.subscribeOnSource(ProductSessionManager.name, (event) => {
            switch (event.type) {
                case EventType.StateUpdated: {
                    const stateUpdatedEvent = event as StateUpdatedEvent<Record<string, ProductSessionDTO>>
                    const updatedSessionMap = stateUpdatedEvent.payload.value;
                    const res = Array.from(Object.entries(updatedSessionMap ?? {})).find(
                        ([_, session]) => session?.productId === productId,
                    );

                    if (res) {
                        const [sessionId, updatedSession] = res;
                        callback(sessionId, updatedSession);
                    }
                }
                    break;
                case EventType.KeyValueUpdated:
                    const evt = event as KeyValueUpdatedEvent<string, ProductSessionDTO>;
                    const type = evt.payload.action;
                    const updatedSessionEntry = evt.payload.value;
                    const updatedSessionId = evt.payload.key;
                    if (type === KeyUpdateActionType.CREATED && updatedSessionEntry?.productId === productId) {
                        callback(updatedSessionId, updatedSessionEntry);
                    }
                    break;
                default:
                    break;
            }
        });
    };

    constructor(
        protected readonly eventBus: SimpleEventBus,
    ) {
        super(eventBus);
    }

    protected getViewForValue(
        value: ProductSessionSession | null,
    ): ProductSessionDTO | null {
        if (value === null) {
            return null;
        }

        const launchConfiguration = value.launchConfiguration!;

        return {
            productId: value.productId!,
            isInternal: value.isInternal!,
            launchConfiguration: {
                arguments: [...launchConfiguration.arguments!],
                executable: launchConfiguration.executable!,
                workingDirectory: launchConfiguration?.workingDirectory!,
                locale: launchConfiguration.locale!,
            },
        };
    }

    protected async resetInternalState(): Promise<void> {
        this.setState(new Map());
    }

    public getSessionByProductId(productId: string): ProductSessionDTO | null {
        const sessions = this.getView();
        if (!sessions) return null;

        const eligibleSession = Array.from(Object.values(sessions)).find(
            (s) => s?.productId === productId,
        ) as ProductSessionDTO | undefined;

        return eligibleSession ?? null;
    }
}
