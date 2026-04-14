import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { RCUDataAdapter } from '@/riotclient/adapters/RCUDataAdapter';
import { RCUMessageType } from '@/riotclient/messaging/RCUMessage';
import { RIOT_CLIENT_SERVICE } from '@/riotclient/RiotClientTokens';
import { type RiotClientService } from '@/riotclient/RiotClientService';
import { AresSessionPayload, ValorantGameLoopManager } from '@/caching/ValorantGameLoop/ValorantGameLoopManager';
import { RiotValorantAPI } from '@/api/riot/RiotValorantAPI';
import { filter, startWith, Subject, Subscription, switchMap, tap } from 'rxjs';
import { SimpleEventBus } from '@/events/SimpleEventBus';
import { onSource } from '@/events/adapters/rxjsAdapters';
import { ProductSessionManager } from '@/caching/ProductSessionManager/ProductSessionManager';
import { EventType } from '@/events/EventTypes';
import { SimpleUUID } from '@/caching/ValorantMatchStatsModule/RiotMatchApiResponseDTO';
import { StateUpdatedEvent } from '@/events/BasicEvent';

interface RmsEnvelope {
    ackRequired: boolean;
    id: string;
    payload: string;
    resource: string;
    service: string;
    timestamp: number;
    version: string;
}

@Injectable()
export class ValorantGameLoopRCUAdapter
    extends RCUDataAdapter<ValorantGameLoopManager>
    implements OnModuleDestroy {
    private static readonly ENDPOINT_REGEX =
        /^\/riot-messaging-service\/v1\/message\/ares-session\/v1\/sessions\/.+$/;

    private readonly reset$ = new Subject<void>();
    private sub?: Subscription;

    constructor(
        @Inject(RIOT_CLIENT_SERVICE)
        protected readonly rcService: RiotClientService,
        protected readonly manager: ValorantGameLoopManager,
        protected readonly eventBus: SimpleEventBus,
        protected readonly valApi: RiotValorantAPI,
    ) {
        super(rcService, manager);

        this.sub = this.reset$
            .pipe(
                startWith(void 0),
                switchMap(() =>
                    onSource(this.eventBus, ProductSessionManager.name).pipe(
                        tap((evt) => {
                            this.logger.log(evt);
                        }),
                        filter((evt) => evt.type === EventType.StateUpdated),
                        filter(
                            (evt: StateUpdatedEvent<Map<SimpleUUID, any>>) =>
                                evt.payload.value?.size !== 0,
                        ),
                    ),
                ),
                tap(() => {
                    this.logger.log('Fetching initial game loop state');
                    this.fetchAndSetGameLoop().then(() => {
                        this.logger.log('Done');
                    });
                }),
            )
            .subscribe();
    }

    protected getEndpointRegex(): RegExp {
        return ValorantGameLoopRCUAdapter.ENDPOINT_REGEX;
    }

    protected async handleRCUEvent(
        type: RCUMessageType,
        match: RegExpExecArray,
        data: JsonNode,
    ): Promise<void> {
        switch (type) {
            case RCUMessageType.UPDATE:
            case RCUMessageType.CREATE:
                break;
            case RCUMessageType.DELETE:
                return;
        }
        const envelope = data as unknown as RmsEnvelope;

        this.logger.log(envelope);

        let payload: AresSessionPayload = JSON.parse(
            envelope.payload,
        ) as unknown as AresSessionPayload;

        this.setState(payload.loopState);
    }

    private async fetchAndSetGameLoop(): Promise<void> {
        try {
            const data = await this.valApi.getGameLoopState();
            this.setState(data.loopState);
        } catch (error) {
            this.logger.warn('Failed to fetch game loop state', error);
        }
    }

    async handleDisconnected(): Promise<void> {
        this.reset$.next();
    }

    onModuleDestroy(): any {
        this.sub?.unsubscribe();
    }
}
