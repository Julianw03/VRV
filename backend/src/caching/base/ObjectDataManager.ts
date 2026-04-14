import { GenericDataManager } from './GenericDataManager';

export abstract class ObjectDataManager<T, E> extends GenericDataManager<T, E> {
    private state: T | null = null;

    protected constructor() {
        super();
    }

    protected getState(): T | null {
        return this.state;
    }

    protected setState(data: T | null): void {
        this.state = data;
    }
}
