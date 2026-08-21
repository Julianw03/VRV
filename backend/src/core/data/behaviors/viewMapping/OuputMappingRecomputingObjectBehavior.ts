import { IObjectDataManager } from '@/core/data/interfaces/IObjectDataManager';
import { OutputMappingObjectBehavior } from '@/core/data/behaviors/viewMapping/OutputMappingObjectBehavior';

export class OuputMappingRecomputingObjectBehavior<S, From, To> extends OutputMappingObjectBehavior<S, From, To> {
    public constructor(
        stateManager: IObjectDataManager<S, From>,
        mappingFn: (from: From) => To,
    ) {
        super(
            stateManager,
            mappingFn,
        );
    }

    getView(): To | null {
        const backingEntry = this.stateManager.getView();
        if (backingEntry === null) {
            return null;
        }
        return this.mappingFn(backingEntry);
    }

}