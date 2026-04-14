import { type RiotClientService } from '@/riotclient/RiotClientService';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { RIOT_CLIENT_SERVICE } from '@/riotclient/RiotClientTokens';
import { RCUDataAdapter } from '@/riotclient/adapters/RCUDataAdapter';
import { AccountNameAndTagLineManager } from '@/caching/AccountNameAndTagLineModule/AccountNameAndTagLineManager';
import { RCUMessageType } from '@/riotclient/messaging/RCUMessage';
import {
    PlayerAccountGameNameAndTagLine,
    PluginPlayerAccountApi,
} from '../../../gen';

@Injectable()
export class AccountNameAndTagLineRCUAdapter extends RCUDataAdapter<AccountNameAndTagLineManager> {
    private static readonly REGEX = new RegExp(
        '^/player-account/aliases/v1/display-name$',
        'gm',
    );
    protected logger = new Logger(this.constructor.name);

    constructor(
        @Inject(RIOT_CLIENT_SERVICE)
        rcService: RiotClientService,
        manager: AccountNameAndTagLineManager,
    ) {
        super(rcService, manager);
    }

    protected getEndpointRegex(): RegExp {
        return AccountNameAndTagLineRCUAdapter.REGEX;
    }

    protected async handleRCUEvent(
        type: RCUMessageType,
        match: RegExpExecArray,
        data: JsonNode,
    ): Promise<void> {
        switch (type) {
            case RCUMessageType.CREATE:
            case RCUMessageType.UPDATE: {
                this.setState(data as PlayerAccountGameNameAndTagLine);
                break;
            }
            case RCUMessageType.DELETE: {
                this.setState(null);
                break;
            }
        }
    }

    protected async handleConnected(): Promise<void> {
        this.logger.log('Handle connected for AccountNameAndTagLineManager');
        const config = this.rcService.getConfiguration();
        if (config === null) throw Error('Configuration is null');
        const api = new PluginPlayerAccountApi(config);
        const resp = await api
            .playerAccountAliasesV1DisplayNameGet()
            .catch((e) => {
                this.logger.warn(
                    'Failed to fetch initial account name and tag line',
                    e.response?.data || e,
                );
                return null;
            });
        if (!resp || resp.status !== HttpStatus.OK) return;
        if (this.getState() === null) {
            this.logger.log(
                'Setting initial entitlement token state',
                resp.data,
            );
            this.setState(resp.data);
        }
    }

    protected async handleDisconnected(): Promise<void> {}
}
