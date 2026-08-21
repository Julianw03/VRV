import { OutputMappingMapBehavior } from '@/core/data/behaviors/viewMapping/OutputMappingMapBehavior';
import { IMapDataManager } from '@/core/data/interfaces/IMapDataManager';

export class OutputMappingRecomputingMapBehavior<K extends PropertyKey, S, From, To> extends OutputMappingMapBehavior<K, S, From, To> {
    public constructor(
        stateManager: IMapDataManager<K, S, From>,
        mappingFn: (from: From) => To,
    ) {
        super(
            stateManager,
            mappingFn,
        );
    }

    deleteState(): void {
        this.stateManager.deleteState();
    }

    getKeyView(key: K): To | null {
        const backingEntry = this.stateManager.getKeyView(key);
        if (backingEntry === null) {
            return null;
        }
        return this.mappingFn(backingEntry);
    }

    getView(): Record<K, To> | null {
        const backingState = this.stateManager.getView();
        if (backingState === null) {
            return null;
        }
        const mappedState: Record<K, To> = {} as Record<K, To>;
        for (const key in backingState) {
            mappedState[key] = this.mappingFn(backingState[key]);
        }
        return mappedState;
    }

    deleteKey(key: K): void {
        this.stateManager.deleteKey(key);
    }
}