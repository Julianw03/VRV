import { Logger } from '@nestjs/common';

export const _INTERNALS_READ_STATE = Symbol('INTERNALS_READ_STATE');
export const _INTERNALS_WRITE_STATE = Symbol('INTERNALS_WRITE_STATE');
export const _INTERNALS_RESET_STATE = Symbol('INTERNALS_RESET_STATE');

export abstract class GenericDataManager<T, E> {
    protected logger = new Logger(this.constructor.name);

    public getView(): E | null {
        return this.getViewFor(this.getState());
    }

    protected abstract getViewFor(state: T | null): E | null;

    protected abstract getState(): T | null;

    protected abstract setState(data: T | null): void;

    protected abstract resetInternalState(): Promise<void>;

    // We expose these internal methods via symbols to avoid accidental misuse
    // while still allowing Adapters to interact with the internal state when necessary.

    public [_INTERNALS_READ_STATE] = this.getState.bind(this);

    public [_INTERNALS_WRITE_STATE] = this.setState.bind(this);

    public [_INTERNALS_RESET_STATE] = this.resetInternalState.bind(this);
}
