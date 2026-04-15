import { Inject, Injectable } from '@nestjs/common';
import { SimpleUUID } from '@/caching/ValorantMatchStatsModule/RiotMatchApiResponseDTO';
import type { RiotClientService } from '@/riotclient/RiotClientService';
import { ValorantGameSessionManager } from '@/caching/ValorantGameSessionModule/ValorantGameSessionManager';
import { RCUMessageType } from '@/riotclient/messaging/RCUMessage';
import { MatchStatus } from '@/caching/ValorantGameSessionModule/MatchStatus';
import { RCUMapDataAdapter } from '@/riotclient/adapters/RCUMapDataAdapter';
import { RIOT_CLIENT_SERVICE } from '@/riotclient/RiotClientTokens';

@Injectable()
export class ValorantGameInProgressRCUAdapter extends RCUMapDataAdapter<ValorantGameSessionManager> {
    constructor(
        @Inject(RIOT_CLIENT_SERVICE)
        protected readonly rcService: RiotClientService,
        protected readonly gameSessionManager: ValorantGameSessionManager,
    ) {
        super(rcService, gameSessionManager);
    }

    private static readonly REGEX = new RegExp(
        '/riot-messaging-service/v1/messages/ares-core-game/core-game/v1/matches/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})',
    );

    protected getEndpointRegex(): RegExp {
        return ValorantGameInProgressRCUAdapter.REGEX;
    }

    protected async handleRCUEvent(
        type: RCUMessageType,
        match: RegExpExecArray,
        data: JsonNode,
    ): Promise<void> {
        const matchId = match[1] as SimpleUUID;

        switch (type) {
            case RCUMessageType.UPDATE:
            case RCUMessageType.CREATE:
                this.logger.log('Received match in progress', data);
                this.setKeyValue(matchId, MatchStatus.IN_PROGRESS);
                break;
            case RCUMessageType.DELETE:
            default:
                break;
        }
    }
}
