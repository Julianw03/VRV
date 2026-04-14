import { RCUMessage, RCUMessageType } from '@/riotclient/messaging/RCUMessage';
import {
    _INTERNALS_READ_STATE,
    _INTERNALS_RESET_STATE,
    _INTERNALS_WRITE_STATE,
    GenericDataManager,
} from '@/caching/base/GenericDataManager';
import { OnEvent } from '@nestjs/event-emitter';
import { RiotClientService } from '@/riotclient/RiotClientService';
import { Logger } from '@nestjs/common';

type InferState<M> = M extends GenericDataManager<infer T, any> ? T : never;

type InferView<M> = M extends GenericDataManager<any, infer E> ? E : never;

export const _DISCONNECT_HANDLER = Symbol('DISCONNECT_HANDLER');
export const _CONNECT_HANDLER = Symbol('CONNECT_HANDLER');

export abstract class RCUDataAdapter<M extends GenericDataManager<any, any>> {
    protected readonly logger = new Logger(this.constructor.name);

    protected constructor(
        protected readonly rcService: RiotClientService,
        protected readonly manager: M,
    ) {}

    protected abstract getEndpointRegex(): RegExp;

    protected abstract handleRCUEvent(
        type: RCUMessageType,
        match: RegExpExecArray,
        data: JsonNode,
    ): Promise<void>;

    @OnEvent('rcuMessage', { async: true })
    async onMessage(message: RCUMessage) {
        const regex = this.getEndpointRegex();
        const match = regex.exec(message.uri);
        if (!match) return;

        await this.handleRCUEvent(
            message.type,
            match,
            message.data as JsonNode,
        );
    }

    protected setState(data: InferState<M> | null) {
        this.manager[_INTERNALS_WRITE_STATE](data);
    }

    protected getState(): InferState<M> {
        return this.manager[_INTERNALS_READ_STATE]();
    }

    protected async handleConnected(): Promise<void> {}

    protected async handleDisconnected(): Promise<void> {}

    @OnEvent('rcuConnected', { async: true })
    private async onConnected() {
        await this.handleConnected();
    }

    @OnEvent('rcuDisconnected', { async: true })
    private async onDisconnected() {
        await this.handleDisconnected();
        await this.manager[_INTERNALS_RESET_STATE]();
    }

    public [_DISCONNECT_HANDLER](): Promise<void> {
        return this.onDisconnected();
    }

    public [_CONNECT_HANDLER](): Promise<void> {
        return this.onConnected();
    }
}
