import { GenericDataManager } from './GenericDataManager';

export abstract class ObjectDataManager<T, E> extends GenericDataManager<T, E> {
    private state: T | null = null;
    private view: E | null = null;

    protected constructor() {
        super();
    }

    protected getState(): T | null {
        return this.state;
    }

    protected setState(data: T | null): void {
        this.state = data;
        this.view = this.getViewFor(data);
    }

    public getView(): E | null {
        return this.view;
    }
}
