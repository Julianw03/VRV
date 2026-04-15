import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
    OnModuleDestroy,
} from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { ReplayIOManager } from '@/plugins/replay/storage/ReplayIOManager';
import { ReplayFetchManager } from '@/plugins/replay/remote/ReplayFetchManager';
import { SimpleEventBus } from '@/events/SimpleEventBus';
import { EventType } from '@/events/EventTypes';
import { StateUpdatedEvent } from '@/events/BasicEvent';
import { StateUpdatedEventImpl } from '@/events/impl/StateUpdatedEventImpl';
import { ValorantGameLoopManager } from '@/caching/ValorantGameLoop/ValorantGameLoopManager';
import { RiotValorantAPI } from '@/api/riot/RiotValorantAPI';

export enum InjectState {
    IDLE = 'IDLE',
    DOWNLOADING_PLACEHOLDER = 'DOWNLOADING_PLACEHOLDER',
    AWAITING_REPLAY_START = 'AWAITING_REPLAY_START',
    INJECTED = 'INJECTED',
    RESTORING_ORIGINAL_REPLAY = 'RESTORING_ORIGINAL_REPLAY',
    FAILED = 'FAILED',
}

export interface InjectStatus {
    state: InjectState;
    targetMatchId: string | null;
}

//TODO: Instead get metadata
const VALID_QUEUE_IDS = ['competitive', 'unrated', 'spikerush', 'swiftplay'];

@Injectable()
export class ReplayInjectManager implements OnModuleDestroy {
    private readonly logger = new Logger(ReplayInjectManager.name);

    private state: InjectState = InjectState.IDLE;
    private targetMatchId: string | null = null;
    private placeholderMatchId: string | null = null;
    private unsubscribeFromSession: (() => void) | null = null;

    private readonly demosDir: string;

    constructor(
        private readonly apiClient: RiotValorantAPI,
        private readonly ioManager: ReplayIOManager,
        private readonly fetchManager: ReplayFetchManager,
        private readonly eventBus: SimpleEventBus,
        private readonly aresSessionManager: ValorantGameLoopManager,
    ) {
        const localAppData =
            process.env.LOCALAPPDATA ??
            path.join(os.homedir(), 'AppData', 'Local');
        this.demosDir = path.join(localAppData, 'VALORANT', 'Saved', 'Demos');
    }

    setInjectState(newState: InjectState) {
        this.eventBus.publish(
            StateUpdatedEventImpl.of(ReplayInjectManager.name, newState),
        );
        this.state = newState;
    }

    getInjectState(): InjectState {
        return this.state;
    }

    getStatus(): InjectStatus {
        return { state: this.state, targetMatchId: this.targetMatchId };
    }

    async startInject(matchId: string): Promise<void> {
        if (this.getInjectState() !== InjectState.IDLE) {
            throw new ConflictException('An inject process is already running');
        }
        if (!(await this.ioManager.matchExists(matchId))) {
            throw new NotFoundException(
                `Match ${matchId} is not in persistent storage`,
            );
        }

        this.targetMatchId = matchId;
        this.setInjectState(InjectState.DOWNLOADING_PLACEHOLDER);

        try {
            const history = await this.apiClient.getMatchHistory(0, 10);
            if (!history.length)
                throw new Error(
                    'No recent match history available for placeholder',
                );

            const validPlaceholder = history.find((entry) =>
                VALID_QUEUE_IDS.includes(entry.QueueID.toLowerCase()),
            );

            if (!validPlaceholder) {
                throw new Error(
                    'No valid placeholder match found in recent history',
                );
            }

            this.placeholderMatchId = validPlaceholder.MatchID;
            this.logger.log(
                `Using ${this.placeholderMatchId} as inject placeholder`,
            );

            if (!this.placeholderMatchId) {
                throw new Error(
                    'No valid placeholder match ID found in recent history',
                );
            }

            // Ensure the placeholder is in persistent storage, downloading only if necessary.
            await this.fetchManager.downloadAndSave(this.placeholderMatchId);

            // TODO: Move to IO Manager
            await fs.mkdir(this.demosDir, { recursive: true });
            await fs.copyFile(
                this.ioManager.replayFilePath(this.placeholderMatchId),
                path.join(this.demosDir, `${this.placeholderMatchId}.vrf`),
            );

            this.setInjectState(InjectState.AWAITING_REPLAY_START);

            this.unsubscribeFromSession = this.eventBus.subscribeOnSource(
                ValorantGameLoopManager.name,
                (event: StateUpdatedEvent<string>) => {
                    if (event.payload.value === 'REPLAY') {
                        this.unsubscribeFromSession?.();
                        this.unsubscribeFromSession = null;
                        this.performInject().catch((e) => {
                            this.logger.error(
                                'File swap during inject failed',
                                e,
                            );
                            this.state = InjectState.FAILED;
                        });
                    }
                },
            );

            this.logger.log(
                `Inject for ${matchId} ready — open ${this.placeholderMatchId} in VALORANT to trigger`,
            );
        } catch (e) {
            this.logger.error('Inject setup failed', e);
            this.unsubscribeFromSession?.();
            this.unsubscribeFromSession = null;
            this.setInjectState(InjectState.FAILED);
            this.targetMatchId = null;
            this.placeholderMatchId = null;
        }
    }

    cancelInject(): void {
        this.unsubscribeFromSession?.();
        this.unsubscribeFromSession = null;
        this.reset();
        this.logger.log('Inject cancelled');
    }

    onModuleDestroy() {
        this.unsubscribeFromSession?.();
        this.unsubscribeFromSession = null;
    }

    private async performInject(): Promise<void> {
        if (!this.targetMatchId || !this.placeholderMatchId) return;

        const targetData = await fs.readFile(
            this.ioManager.replayFilePath(this.targetMatchId),
        );
        await fs.writeFile(
            path.join(this.demosDir, `${this.placeholderMatchId}.vrf`),
            targetData,
        );
        this.logger.log(
            `Injected ${this.targetMatchId} over placeholder ${this.placeholderMatchId}`,
        );
        this.setInjectState(InjectState.INJECTED);
        this.unsubscribeFromSession =
            this.eventBus.subscribeOnSource<EventType.StateUpdated>(
                ValorantGameLoopManager.name,
                (event: StateUpdatedEvent<string>) => {
                    if (event.payload.value === 'MENUS') {
                        this.unsubscribeFromSession?.();
                        this.unsubscribeFromSession = null;
                        this.restoreOriginalReplayFile(this.placeholderMatchId)
                        .then(() => {
                            this.reset();
                        })
                        .catch((e) => {
                            this.logger.error(
                                'Failed to restore original replay file after inject',
                                e,
                            );
                            this.state = InjectState.FAILED;
                        });
                    }
                },
            );
    }

    private async restoreOriginalReplayFile(targetMatchId: string | null): Promise<void> {
        if (!targetMatchId) return;
        const targetData = await fs.readFile(
            this.ioManager.replayFilePath(targetMatchId),
        );
        await fs.writeFile(
            path.join(this.demosDir, `${targetMatchId}.vrf`),
            targetData,
        );
        return;
    }

    private reset(): void {
        this.setInjectState(InjectState.IDLE);
        this.targetMatchId = null;
        this.placeholderMatchId = null;
    }
}
