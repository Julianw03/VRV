import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EmittingObjectDataManager } from '@/caching/base/EmittingObjectDataManager';
import { SimpleEventBus } from '@/events/SimpleEventBus';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import * as readline from 'node:readline';

export interface MinimalVersionInfo {
    version: string;
}

@Injectable()
export class VersionInfoManager extends EmittingObjectDataManager<MinimalVersionInfo, MinimalVersionInfo> implements OnModuleInit, OnModuleDestroy {

    constructor(
        protected readonly eventBus: SimpleEventBus,
    ) {
        super(eventBus);
    }

    private static readonly VERSION_EXTRACT_REGEX = /CI server version: (\S*)/gm;

    private async loadAndSetState() {
        try {
            const localAppData =
                process.env.LOCALAPPDATA ??
                path.join(os.homedir(), 'AppData', 'Local');

            const filePath = path.join(localAppData, 'VALORANT', 'Saved', 'Logs', 'ShooterGame.log');
            const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
            const rl = readline.createInterface({
                input: stream,
                crlfDelay: Infinity,
            });
            for await (const line of rl) {
                const match = VersionInfoManager.VERSION_EXTRACT_REGEX.exec(line);
                if (match && match[1]) {
                    const version = match[1];
                    console.log('Extracted version:', version);
                    this.setState({
                        version: version,
                    });
                    return;
                }
            }
        } catch (error) {
            this.logger.error('Failed to fetch version info', error);
        }
    }

    onModuleInit() {
        this.loadAndSetState();
    }


    protected getViewFor(state: MinimalVersionInfo | null): MinimalVersionInfo | null {
        if (!state) return null;
        return state;
    }

    protected async resetInternalState(): Promise<void> {
        this.setState(null);
    }

    onModuleDestroy() {
    }
}