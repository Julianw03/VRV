import { PlayerAccountGameNameAndTagLine } from '../../../gen';
import { Injectable } from '@nestjs/common';
import { EmittingObjectDataManager } from '@/caching/base/EmittingObjectDataManager';
import { SimpleEventBus } from '@/events/SimpleEventBus';
import { PlayerAliasDTO } from '@/caching/AccountNameAndTagLineModule/PlayerAliasDTO';

@Injectable()
export class AccountNameAndTagLineManager extends EmittingObjectDataManager<
    PlayerAccountGameNameAndTagLine,
    PlayerAliasDTO
> {
    protected getViewFor(
        state: PlayerAccountGameNameAndTagLine | null,
    ): PlayerAliasDTO | null {
        if (state === null) return null;
        return {
            tagLine: state.tagLine!,
            gameName: state.gameName!,
        };
    }

    constructor(protected readonly eventBus: SimpleEventBus) {
        super(eventBus);
    }

    protected async resetInternalState(): Promise<void> {
        this.setState(null);
    }
}
