import { IObjectDataManager } from '@/core/data/interfaces/IObjectDataManager';
import { OutputMappingObjectBehavior } from '@/core/data/behaviors/viewMapping/OutputMappingObjectBehavior';
import { SimpleObjectDataManager } from '@/core/data/SimpleObjectDataManager';

export class OutputMappingCachingObjectBehavior<S, From, To> extends OutputMappingObjectBehavior<S, From, To> {
    private cache: IObjectDataManager<To, To> = new SimpleObjectDataManager<To>();

    public constructor(
        stateManager: IObjectDataManager<S, From>,
        mappingFn: (from: From) => To,
    ) {
        super(
            stateManager,
            mappingFn,
        );
    }

    deleteState() {
        this.stateManager.deleteState();
        this.cache.deleteState();
    }

    updateValue(value: S): void {
        this.stateManager.updateValue(value);
        this.cache.updateValue(this.mappingFn(this.stateManager.getView()!));
    }

    getView(): To | null {
        return this.cache.getView();
    }
}