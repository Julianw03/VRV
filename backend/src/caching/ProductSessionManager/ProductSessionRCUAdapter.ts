import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { RCUMapDataAdapter } from '@/riotclient/adapters/RCUMapDataAdapter';
import { ProductSessionManager } from '@/caching/ProductSessionManager/ProductSessionManager';
import { RCUMessageType } from '@/riotclient/messaging/RCUMessage';
import { PluginProductSessionApi, ProductSessionSession } from '../../../gen';
import type { RiotClientService } from '@/riotclient/RiotClientService';
import { RIOT_CLIENT_SERVICE } from '@/riotclient/RiotClientTokens';

@Injectable()
export class ProductSessionRCUAdapter extends RCUMapDataAdapter<ProductSessionManager> {
    constructor(
        @Inject(RIOT_CLIENT_SERVICE)
        protected readonly rcService: RiotClientService,
        protected readonly manager: ProductSessionManager,
    ) {
        super(rcService, manager);
    }

    private static readonly REGEX = RegExp(
        '^/product-session/v1/sessions/(\\S[^/]+)$',
        'gm',
    );

    protected getEndpointRegex(): RegExp {
        return ProductSessionRCUAdapter.REGEX;
    }

    protected async handleRCUEvent(
        type: RCUMessageType,
        match: RegExpExecArray,
        data: JsonNode,
    ): Promise<void> {
        switch (type) {
            case RCUMessageType.CREATE:
            case RCUMessageType.UPDATE: {
                const typedData = data as unknown as ProductSessionSession;
                const sessionId = match[1];
                if (this.getEntry(sessionId) === null) {
                    this.logger.log(
                        `Registering new product session with ID: ${sessionId}`,
                        typedData,
                    );
                }
                this.setKeyValue(sessionId, typedData);
                break;
            }
            case RCUMessageType.DELETE: {
                const sessionId = match[1];
                this.logger.log(
                    `Unregistering product session with ID: ${sessionId}`,
                );
                this.deleteKey(sessionId);
                break;
            }
            default:
                throw new Error(`Unsupported message type: ${type}`);
        }
    }

    protected async handleConnected(): Promise<void> {
        const api = this.rcService.getCachedApi(PluginProductSessionApi);
        const resp = await api.productSessionV1SessionsGet();
        if (!resp || resp.status !== HttpStatus.OK) {
            this.logger.warn(
                'Failed to fetch initial product session data on RCU connection',
                resp?.status,
            );
            return;
        }

        const data = resp.data;
        const currentState = this.getState();
        const newState = new Map([
            ...currentState,
            ...Object.entries(data),
        ]);
        this.logger.log(newState);

        this.setState(newState);
    }
}
