import { Injectable } from '@nestjs/common';
import { EmittingObjectDataManager } from '@/caching/base/EmittingObjectDataManager';
import { SimpleEventBus } from '@/events/SimpleEventBus';

export interface AresSessionPayload {
    subject: string;
    loopState: string;
    loopStateMetadata: string;
    cxnState: string;
    clientVersion: string;
    version: number;
}

@Injectable()
export class ValorantGameLoopManager extends EmittingObjectDataManager<
    string,
    string
> {
    constructor(protected readonly eventBus: SimpleEventBus) {
        super(eventBus);
    }

    protected getViewFor(state: string | null): string | null {
        return state ?? null;
    }

    protected async resetInternalState(): Promise<void> {
        this.setState(null);
    }
}
