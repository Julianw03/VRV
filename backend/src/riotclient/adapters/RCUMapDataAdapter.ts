import { RCUDataAdapter } from './RCUDataAdapter';
import {
    _INTERNALS_MAP_DELETE_KEY,
    _INTERNALS_MAP_GET_ENTRY,
    _INTERNALS_MAP_SET_KEY_VALUE,
    MapDataManager,
} from '@/caching/base/MapDataManager';

type InferKey<M> = M extends MapDataManager<infer K, any, any> ? K : never;

type InferValue<M> = M extends MapDataManager<any, infer V, any> ? V : never;

type InferViewValue<M> =
    M extends MapDataManager<any, any, infer E> ? E : never;

export abstract class RCUMapDataAdapter<
    M extends MapDataManager<any, any, any>,
> extends RCUDataAdapter<M> {
    protected getEntry(key: InferKey<M>): InferValue<M> | null {
        return this.manager[_INTERNALS_MAP_GET_ENTRY](key);
    }

    protected setKeyValue(key: InferKey<M>, value: InferValue<M>): void {
        this.manager[_INTERNALS_MAP_SET_KEY_VALUE](key, value);
    }

    protected deleteKey(key: InferKey<M>): void {
        this.manager[_INTERNALS_MAP_DELETE_KEY](key);
    }
}
