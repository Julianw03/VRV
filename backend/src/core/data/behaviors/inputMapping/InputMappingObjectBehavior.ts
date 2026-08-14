import { IObjectDataManager } from '@/core/data/interfaces/IObjectDataManager';

export class InputMappingObjectDataBehavior<From, To, V>
    implements IObjectDataManager<From, V> {
    public constructor(
        protected readonly stateManager: IObjectDataManager<To, V>,
        protected readonly mappingFn: (from: From) => To,
    ) {
    }

    updateValue(value: From): void {
        this.stateManager.updateValue(this.mappingFn(value));
    }

    deleteState(): void {
        this.stateManager.deleteState();
    }

    getView(): V | null {
        return this.stateManager.getView();
    }
}