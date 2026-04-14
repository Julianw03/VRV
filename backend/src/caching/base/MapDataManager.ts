import { GenericDataManager } from './GenericDataManager';

export const _INTERNALS_MAP_GET_ENTRY = Symbol('INTERNALS_MAP_GET_ENTRY');
export const _INTERNALS_MAP_SET_KEY_VALUE = Symbol(
    'INTERNALS_MAP_SET_KEY_VALUE',
);
export const _INTERNALS_MAP_DELETE_KEY = Symbol('INTERNALS_MAP_DELETE_KEY');

export abstract class MapDataManager<
    K extends PropertyKey,
    V,
    E,
> extends GenericDataManager<Map<K, V>, Map<K, E | null>> {
    private state: Map<K, V> = new Map<K, V>();

    protected constructor() {
        super();
    }

    protected abstract getViewForValue(value: V | null): E | null;

    public getViewFor(val: Map<K, V>): Map<K, E | null> | null {
        if (val === null) {
            return null;
        }

        return new Map<K, E | null>(
            Array.from(val.entries()).map(([key, value]) => {
                return [key, this.getViewForValue(value)] as [K, E | null];
            }),
        );
    }

    public getEntryView(key: K): E | null {
        const value = this.get(key);
        return this.getViewForValue(value);
    }

    protected getState(): Map<K, V> | null {
        return this.state;
    }

    protected setState(state: Map<K, V>): void {
        this.state = state;
    }

    protected get(key: K): V | null {
        return this.state.get(key) ?? null;
    }

    protected setKeyValue(key: K, value: V): void {
        this.state.set(key, value);
    }

    protected deleteKey(key: K): void {
        this.state.delete(key);
    }

    public [_INTERNALS_MAP_GET_ENTRY](key: K): V | null {
        return this.get(key);
    }

    public [_INTERNALS_MAP_SET_KEY_VALUE](key: K, value: V): void {
        this.setKeyValue(key, value);
    }

    public [_INTERNALS_MAP_DELETE_KEY](key: K): void {
        this.deleteKey(key);
    }
}
