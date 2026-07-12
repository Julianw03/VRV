import { RCUDataAdapter } from '@/core/data/adapters/RCUDataAdapter';
import { AccountPuuidManager } from '@/modules/Account/AccountPuuidModule/AccountPuuidManager';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AnyPathPattern, parsePatternString } from '@/core/riotclient/messaging/path/PatternParser';
import { RIOT_CLIENT_SERVICE, RIOT_CLIENT_STATE_DISPATCHING_SERVICE } from '@/core/riotclient/RiotClientTokens';
import type { RiotClientStateDispatcher } from '@/core/riotclient/RiotClientStateDispatcher';
import { ForwardedMessage, TrieRCUMessageDispatcher } from '@/core/riotclient/messaging/trie/TrieRCUMessageDispatcher';
import type { RiotClientService } from '@/core/riotclient/RiotClientService';
import { EntitlementsToken, PluginEntitlementsApi } from '../../../../gen';
import { RCUMessageType } from '@/core/riotclient/messaging/RCUMessage';

@Injectable()
export class AccountPuuidRCUAdapter extends RCUDataAdapter<AccountPuuidManager> {
    private static PATH_PATTERNS = parsePatternString('/entitlements/v1/token');

    constructor(
        @Inject(RIOT_CLIENT_SERVICE)
        rcService: RiotClientService,
        manager: AccountPuuidManager,
        @Inject(RIOT_CLIENT_STATE_DISPATCHING_SERVICE)
        stateDispatcher: RiotClientStateDispatcher,
        messageDispatcher: TrieRCUMessageDispatcher
    ) {
        super(rcService, manager, stateDispatcher, messageDispatcher);
    }

    protected getPathParts(): AnyPathPattern[] {
        return AccountPuuidRCUAdapter.PATH_PATTERNS;
    }

    protected async handleRCUEvent(forwarded: ForwardedMessage): Promise<void> {
        const type = forwarded.message.type;
        const data = forwarded.message.data;
        switch (type) {
            case RCUMessageType.CREATE:
            case RCUMessageType.UPDATE:
                const typedData = data as unknown as EntitlementsToken
                this.manager.updateValue(typedData);
                break;
            case RCUMessageType.DELETE:
                this.manager.deleteState()
        }
    }

    protected async handleConnected() {
        const api = this.rcService.getCachedApi(PluginEntitlementsApi);
        const resp = await api.entitlementsV1TokenGet().catch((e) => {
            this.logger.warn(
                'Failed to fetch entitlement token',
                e.response?.data || e,
            );
            return null;
        });
        if (!resp || resp.status !== HttpStatus.OK) return;
        if (this.manager.getView() === null) {
            this.manager.updateValue(resp.data);
        }
    }
}