import * as RiotclientParametersAcquisitionStrategy from './connection/RiotClientParametersAcquisitionStrategy';
import { RiotClientService } from './RiotClientService';
import { RiotServiceEvent } from './RiotClientServiceEventEmitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RiotClientConnectionParameters } from './connection/RiotClientConnectionParameters';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import * as https from 'node:https';
import Websocket from 'ws';
import { RCUMessage } from './messaging/RCUMessage';
import { RIOT_CLIENT_PARAMETER_ACQUISITION_STRATEGY } from './RiotClientTokens';
import { AppInfo, Configuration, PluginRiotclientApi } from '../../gen';
import { AxiosResponse } from 'axios';
import { BaseAPI } from '../../gen/base';

enum ConnectionState {
    DISCONNECTED = 'disconnected',
    WAITING_FOR_PARAMETERS = 'waiting_for_parameters',
    WAITING_FOR_REST_READY = 'waiting_for_rest_ready',
    WAITING_FOR_WEBSOCKET_CONNECTION = 'waiting_for_websocket_connection',
    CONNECTED = 'connected',
}

@Injectable()
export class RiotClientServiceImpl implements RiotClientService {
    private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
    private connectionParameters: RiotClientConnectionParameters | null = null;
    private configuration: Configuration | null = null;
    private httpsAgent: https.Agent | null = null;
    private Websocket: Websocket | null = null;
    private apiCache: Map<string, any> = new Map();

    private readonly logger = new Logger(RiotClientServiceImpl.name);
    private readonly simpleHttpsAgentOptions = {
        rejectUnauthorized: false, // Disable SSL certificate validation as Riot Client uses self-signed certificates
    };

    constructor(
        @Inject(RIOT_CLIENT_PARAMETER_ACQUISITION_STRATEGY)
        private readonly connectionStrategy: RiotclientParametersAcquisitionStrategy.RiotClientParametersAcquisitionStrategy,
        private readonly eventEmitter: EventEmitter2, //TODO: Maybe use the centralized event bus ?
    ) {}

    getCachedApi<T extends BaseAPI>(
        ApiClass: new (config: Configuration) => T,
    ): T {
        if (!this.configuration) {
            throw new Error('Not connected');
        }

        const key = ApiClass.name;

        if (!this.apiCache.has(key)) {
            const instance = new ApiClass(this.configuration);
            this.apiCache.set(key, instance);
        }

        return this.apiCache.get(key);
    }

    async doConnect(): Promise<void> {
        if (
            !this.compareAndSetConnectionState(
                ConnectionState.DISCONNECTED,
                ConnectionState.WAITING_FOR_PARAMETERS,
            )
        ) {
            return;
        }
        let tempParameters: RiotClientConnectionParameters | null = null;
        try {
            tempParameters = await this.connectionStrategy.connect();
            if (!tempParameters) {
                throw new Error('Connection parameters are null');
            }
        } catch (e) {
            this.logger.error(
                'Failed to acquire connection parameters with given strategy',
                e,
            );
            this.connectionState = ConnectionState.DISCONNECTED;
            throw Error(
                'Failed to acquire connection parameters with given strategy',
            );
        }

        if (
            !this.compareAndSetConnectionState(
                ConnectionState.WAITING_FOR_PARAMETERS,
                ConnectionState.WAITING_FOR_REST_READY,
            )
        ) {
            throw new Error('Expected to be in WAITING_FOR_PARAMETERS state');
        }

        const tempAgent = this.setupAgent(tempParameters);
        const tempConfig = new Configuration({
            basePath: `https://127.0.1:${tempParameters.port}`,
            username: 'riot',
            password: tempParameters.authSecret,
            baseOptions: {
                headers: {
                    Accept: 'application/json',
                },
                httpsAgent: tempAgent,
                transformResponse: [(data) => JSON.parse(data)],
            },
        });

        const coreSdkApi = new PluginRiotclientApi(tempConfig);

        let axiosReponse: AxiosResponse<AppInfo, any>;
        try {
            axiosReponse = await coreSdkApi.riotclientV1AppInfoGet();
        } catch (e) {
            if (e.response) {
                if (e.response.status === HttpStatus.NOT_FOUND.valueOf()) {
                    this.logger.warn(
                        "Riot Client REST API returned 404 for App-Info, most likely its in 'AppBackground' mode",
                    );
                }
            }

            throw new Error(
                'Unable to connect to Riot Client REST API: ' + e.message,
            );
        }

        this.logger.debug('Riot Client App Info', axiosReponse.data);

        if (
            !this.compareAndSetConnectionState(
                ConnectionState.WAITING_FOR_REST_READY,
                ConnectionState.WAITING_FOR_WEBSOCKET_CONNECTION,
            )
        ) {
            throw new Error('Expected to be in WAITING_FOR_REST_READY state');
        }

        const wsConnection = await this.awaitWsOpen(tempParameters);

        this.emit('rcuConnected', undefined);

        wsConnection.on('close', (close) => {
            this.disconnect();
        });
        wsConnection.on('message', (data) => {
            if (data === null || data === undefined || data.toString() === '')
                return;
            let parsedData;
            try {
                parsedData = JSON.parse(data.toString());
            } catch (e) {
                this.logger.error('Failed to parse WebSocket message', e);
                return;
            }
            if (!Array.isArray(parsedData) || parsedData.length !== 3) {
                this.logger.error(
                    'Received malformed WebSocket message',
                    parsedData,
                );
                return;
            }

            const [, , eventData] = parsedData;
            const message: RCUMessage = new RCUMessage(
                eventData.eventType,
                eventData.uri,
                eventData.data,
            );

            this.emit('rcuMessage', message);
        });

        this.logger.debug(
            'WebSocket connection established, we are now connected',
        );

        this.connectionParameters = tempParameters;
        this.configuration = tempConfig;
        this.httpsAgent = tempAgent;
        this.Websocket = wsConnection;

        if (
            !this.compareAndSetConnectionState(
                ConnectionState.WAITING_FOR_WEBSOCKET_CONNECTION,
                ConnectionState.CONNECTED,
            )
        ) {
            throw new Error(
                'Expected to be in WAITING_FOR_WEBSOCKET_CONNECTION state',
            );
        }
    }

    async connect(): Promise<void> {
        try {
            await this.doConnect();
        } catch (error) {
            this.logger.error(
                'Error during connection, forcing disconnect logic',
                error,
            );
            this.disconnect();
            throw new Error(
                'Failed to connect to Riot Client: ' + error.message,
            );
        }
    }

    async disconnect(): Promise<void> {
        if (this.connectionState === ConnectionState.DISCONNECTED) {
            this.logger.debug('Already disconnected, nothing to do');
            return;
        }

        this.logger.debug('Disconnect called, cleaning up resources');
        this.connectionState = ConnectionState.DISCONNECTED;
        this.emit('rcuDisconnected', undefined);
        if (this.Websocket) {
            this.Websocket.close();
            this.Websocket.removeAllListeners();
            this.Websocket = null;
        }
        if (this.httpsAgent) {
            this.httpsAgent.destroy();
            this.httpsAgent = null;
        }
        this.apiCache.clear();
        if (this.configuration) {
            this.configuration = null;
        }
        this.connectionParameters = null;

        await this.connectionStrategy.disconnect();
    }

    async awaitWsOpen(
        params: RiotClientConnectionParameters,
    ): Promise<Websocket> {
        return new Promise((resolve, reject) => {
            let handled = false;
            const ws = new Websocket(`wss://127.0.0.1:${params.port}/`, {
                headers: {
                    Authorization: params.authHeader,
                },
                agent: this.setupAgent(params),
            });

            ws.once('open', () => {
                if (handled) {
                    return;
                }
                handled = true;
                ws.send(JSON.stringify([5, 'OnJsonApiEvent']));
                resolve(ws);
            });

            ws.once('error', (error) => {
                if (handled) {
                    return;
                }
                handled = true;
                reject(error);
            });

            ws.once('close', () => {
                if (handled) {
                    return;
                }
                handled = true;
                reject(new Error('WebSocket connection closed before open'));
            });

            setTimeout(() => {
                if (handled) {
                    return;
                }
                handled = true;
                ws.close(1000);
                reject(new Error('WebSocket connection timed out'));
            }, 5_000);
        });
    }

    isConnected(): boolean {
        return this.connectionState === ConnectionState.CONNECTED;
    }

    on<Event extends keyof RiotServiceEvent>(
        event: Event,
        listener: (payload: RiotServiceEvent[Event]) => void,
    ): void {
        this.eventEmitter.on(event, listener);
    }

    off<Event extends keyof RiotServiceEvent>(
        event: Event,
        listener: (payload: RiotServiceEvent[Event]) => void,
    ): void {
        this.eventEmitter.off(event, listener);
    }

    emit<Event extends keyof RiotServiceEvent>(
        event: Event,
        payload: RiotServiceEvent[Event],
    ): boolean {
        return this.eventEmitter.emit(event, payload);
    }

    onModuleDestroy(): any {
        this.logger.debug('Module is being destroyed, disconnecting');
        this.disconnect().catch((err) => {
            this.logger.error('Error during module destruction', err);
        });
    }

    onModuleInit(): any {}

    getConfiguration(): Configuration | null {
        if (!this.isConnected()) {
            this.logger.warn('Cannot get configuration, not connected');
            return null;
        }

        return this.configuration;
    }

    private compareAndSetConnectionState(
        expectedState: ConnectionState,
        newState: ConnectionState,
    ): boolean {
        if (expectedState !== this.connectionState) {
            return false;
        }
        this.connectionState = newState;
        return true;
    }

    private setupAgent(params: RiotClientConnectionParameters) {
        const agentOptions = {
            ...this.simpleHttpsAgentOptions,
            port: params.port,
            defaultPort: params.port,
        };
        return new https.Agent(agentOptions);
    }
}
