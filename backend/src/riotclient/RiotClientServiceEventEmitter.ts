import { RCUMessage } from './messaging/RCUMessage';

export interface RiotServiceEvent {
    rcuMessage: RCUMessage;
    rcuConnected: void;
    rcuDisconnected: void;
}

export interface RiotClientServiceEventEmitter {
    on<Event extends keyof RiotServiceEvent>(
        event: Event,
        listener: (payload: RiotServiceEvent[Event]) => void,
    ): void;

    off<Event extends keyof RiotServiceEvent>(
        event: Event,
        listener: (payload: RiotServiceEvent[Event]) => void,
    ): void;

    emit<Event extends keyof RiotServiceEvent>(
        event: Event,
        payload: RiotServiceEvent[Event],
    ): boolean;
}
