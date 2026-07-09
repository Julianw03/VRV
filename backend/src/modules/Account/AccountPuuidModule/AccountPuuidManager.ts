import { Injectable } from '@nestjs/common';
import { IObjectDataManager } from '@/core/data/interfaces/IObjectDataManager';
import { EntitlementsToken } from '../../../../gen';
import { SimpleObjectDataManager } from '@/core/data/SimpleObjectDataManager';
import { RecomputingObjectMappingBehavior } from '@/core/data/behaviors/viewMapping/RecomputingObjectMappingBehavior';
import { PlayerUuidDTO } from '#/dto/PlayerUuidDTO';
import { EmittingObjectDataBehavior } from '@/core/data/behaviors/emission/EmittingObjectDataBehavior';
import { SimpleEventBus } from '@/core/events/SimpleEventBus';

@Injectable()
export class AccountPuuidManager implements IObjectDataManager<EntitlementsToken, PlayerUuidDTO> {
    private readonly manager: IObjectDataManager<EntitlementsToken, PlayerUuidDTO>;

    constructor(protected readonly eventBus: SimpleEventBus) {
        const store = new SimpleObjectDataManager<EntitlementsToken>();
        const compute = new RecomputingObjectMappingBehavior(store, AccountPuuidManager.map);
        this.manager = new EmittingObjectDataBehavior(compute, eventBus, AccountPuuidManager.name);
    }

    private static map(state: EntitlementsToken): PlayerUuidDTO {
        return {
            uuid: state.subject as UUID,
        };
    }

    deleteState(): void {
        this.manager.deleteState();
    }

    getView(): PlayerUuidDTO | null {
        return this.manager.getView();
    }

    updateValue(value: EntitlementsToken): void {
        this.manager.updateValue(value);
    }

}