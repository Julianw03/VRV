import { Inject, Injectable } from '@nestjs/common';
import { SimpleUUID } from '@/caching/ValorantMatchStatsModule/RiotMatchApiResponseDTO';
import type { RiotClientService } from '@/riotclient/RiotClientService';
import { ValorantGameSessionManager } from '@/caching/ValorantGameSessionModule/ValorantGameSessionManager';
import { RCUMessageType } from '@/riotclient/messaging/RCUMessage';
import { MatchStatus } from '@/caching/ValorantGameSessionModule/MatchStatus';
import { RCUMapDataAdapter } from '@/riotclient/adapters/RCUMapDataAdapter';
import { RIOT_CLIENT_SERVICE } from '@/riotclient/RiotClientTokens';

interface RMSMessage {
    ackRequired: boolean;
    id: string;
    payload: JsonNode;
    ressource: string;
    service: string;
    timestamp: number;
    version: string;
}

@Injectable()
export class ValorantMatchEndedRCUAdapter extends RCUMapDataAdapter<ValorantGameSessionManager> {
    private static readonly REGEX = RegExp(
        '^/riot-messaging-service/v1/messages/ares-match-details/match-details/v1/matches$',
        'gm',
    );

    constructor(
        @Inject(RIOT_CLIENT_SERVICE)
        protected readonly rcService: RiotClientService,
        protected readonly gameSessionManager: ValorantGameSessionManager,
    ) {
        super(rcService, gameSessionManager);
    }

    protected getEndpointRegex(): RegExp {
        return ValorantMatchEndedRCUAdapter.REGEX;
    }

    protected async handleRCUEvent(
        type: RCUMessageType,
        match: RegExpExecArray,
        data: JsonNode,
    ): Promise<void> {
        switch (type) {
            case RCUMessageType.UPDATE:
            case RCUMessageType.CREATE:
                this.logger.log('Received match ended message', data);
                const typedData = data as unknown as RMSMessage;
                const matchId = typedData.payload as SimpleUUID;
                this.logger.log('Received match ended message', data);
                this.gameSessionManager.setKeyValue(matchId, MatchStatus.ENDED);
                break;
            case RCUMessageType.DELETE:
            default:
                break;
        }
    }
}
