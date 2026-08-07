export const AsyncResultType = {
    PENDING: "PENDING",
    SUCCESS: "SUCCESS",
    FAILURE: "FAILURE",
} as const;

export type AsyncResultType =
    (typeof AsyncResultType)[keyof typeof AsyncResultType];

export abstract class AsyncResult<T, E extends Error> {
    abstract readonly type: AsyncResultType;

    static pending<T, E extends Error = Error>(): Pending<T, E> {
        return new Pending();
    }

    static success<T, E extends Error = Error>(value: T): Success<T, E> {
        return new Success(value);
    }

    static failure<T, E extends Error = Error>(error: E): Failure<T, E> {
        return new Failure(error);
    }

    static async fromPromiseWithGuaranteedErrorType<T, E extends Error>(
        promise: Promise<T>,
    ): Promise<AsyncResult<T, E>> {
        try {
            return AsyncResult.success(await promise);
        } catch (e) {
            return AsyncResult.failure(e);
        }
    }

    isPending(): this is Pending<T, E> {
        return this instanceof Pending;
    }

    isSuccess(): this is Success<T, E> {
        return this instanceof Success;
    }

    isFailure(): this is Failure<T, E> {
        return this instanceof Failure;
    }

    abstract map<U>(fn: (value: T) => U): AsyncResult<U, E>;

    abstract flatMap<U>(
        fn: (value: T) => AsyncResult<U, E>,
    ): AsyncResult<U, E>;

    abstract flatMapAsync<U>(
        fn: (value: T) => Promise<AsyncResult<U, E>>,
    ): Promise<AsyncResult<U, E>>;

    abstract mapError<F extends Error>(
        fn: (error: E) => F,
    ): AsyncResult<T, F>;

    abstract unwrapOr(defaultValue: T): T;

    abstract match<R>(
        success: (value: T) => R,
        failure: (error: E) => R,
        pending: () => R,
    ): R;

    abstract toPromise(): Promise<T>;
}

export class Pending<T, E extends Error> extends AsyncResult<T, E> {
    readonly type = AsyncResultType.PENDING;

    map<U>(): AsyncResult<U, E> {
        return new Pending();
    }

    flatMap<U>(): AsyncResult<U, E> {
        return new Pending();
    }

    async flatMapAsync<U>(): Promise<AsyncResult<U, E>> {
        return new Pending();
    }

    mapError<F extends Error>(): AsyncResult<T, F> {
        return new Pending();
    }

    unwrapOr(defaultValue: T): T {
        return defaultValue;
    }

    match<R>(
        _: (value: T) => R,
        __: (error: E) => R,
        pending: () => R,
    ): R {
        return pending();
    }

    toPromise(): Promise<T> {
        return Promise.reject(
            new Error("Cannot convert Pending to Promise"),
        );
    }
}

export class Success<T, E extends Error> extends AsyncResult<T, E> {
    readonly type = AsyncResultType.SUCCESS;

    constructor(public readonly data: T) {
        super();
    }

    map<U>(fn: (value: T) => U): AsyncResult<U, E> {
        return new Success(fn(this.data));
    }

    flatMap<U>(fn: (value: T) => AsyncResult<U, E>): AsyncResult<U, E> {
        return fn(this.data);
    }

    flatMapAsync<U>(
        fn: (value: T) => Promise<AsyncResult<U, E>>,
    ): Promise<AsyncResult<U, E>> {
        return fn(this.data);
    }

    mapError<F extends Error>(): AsyncResult<T, F> {
        return this as unknown as Success<T, F>;
    }

    unwrapOr(): T {
        return this.data;
    }

    match<R>(
        success: (value: T) => R,
    ): R {
        return success(this.data);
    }

    toPromise(): Promise<T> {
        return Promise.resolve(this.data);
    }
}

export class Failure<T, E extends Error> extends AsyncResult<T, E> {
    readonly type = AsyncResultType.FAILURE;

    constructor(public readonly error: E) {
        super();
    }

    map<U>(): AsyncResult<U, E> {
        return new Failure(this.error);
    }

    flatMap<U>(): AsyncResult<U, E> {
        return new Failure(this.error);
    }

    async flatMapAsync<U>(): Promise<AsyncResult<U, E>> {
        return new Failure(this.error);
    }

    mapError<F extends Error>(fn: (error: E) => F): AsyncResult<T, F> {
        return new Failure(fn(this.error));
    }

    unwrapOr(defaultValue: T): T {
        return defaultValue;
    }

    match<R>(
        _: (value: T) => R,
        failure: (error: E) => R,
    ): R {
        return failure(this.error);
    }

    toPromise(): Promise<T> {
        return Promise.reject(this.error);
    }
}