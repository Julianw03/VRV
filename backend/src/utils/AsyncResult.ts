import { ApiProperty, getSchemaPath } from '@nestjs/swagger';

export enum AsyncResultType {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE',
}

export type AsyncResultUnion<T> = Pending<T> | Success<T> | Failure<T>;

export abstract class AsyncResult<T> {
    @ApiProperty({ enum: AsyncResultType, enumName: 'AsyncResultType' })
    abstract readonly type: AsyncResultType;

    static ofPending<T>() {
        return new Pending<T>();
    }

    static ofSuccess<T>(data: T) {
        return new Success<T>(data);
    }

    static ofFailure<T>(error: Error) {
        return new Failure<T>(error);
    }
}

export class Pending<T> extends AsyncResult<T> {
    @ApiProperty({
        enum: AsyncResultType,
        enumName: 'AsyncResultType',
        default: AsyncResultType.PENDING,
    })
    readonly type = AsyncResultType.PENDING;
}

export class Success<T> extends AsyncResult<T> {
    @ApiProperty({
        enum: AsyncResultType,
        enumName: 'AsyncResultType',
        default: AsyncResultType.SUCCESS,
    })
    readonly type = AsyncResultType.SUCCESS;
    @ApiProperty()
    readonly data: T;

    constructor(data: T) {
        super();
        this.data = data;
    }
}

export class Failure<T> extends AsyncResult<T> {
    @ApiProperty({
        enum: AsyncResultType,
        enumName: 'AsyncResultType',
        default: AsyncResultType.FAILURE,
    })
    readonly type = AsyncResultType.FAILURE;
    @ApiProperty()
    readonly error: Error;

    constructor(error: Error) {
        super();
        this.error = error;
    }
}

export const AsyncResultSchema = (payloadRef: string) => {
    return {
        oneOf: [
            { $ref: getSchemaPath(Pending) },
            {
                allOf: [
                    { $ref: getSchemaPath(Success) },
                    {
                        type: 'object',
                        properties: { data: { $ref: payloadRef } },
                    },
                ],
            },
            {
                allOf: [
                    { $ref: getSchemaPath(Failure) },
                    {
                        type: 'object',
                        properties: {
                            error: {
                                type: 'object',
                                properties: { message: { type: 'string' } },
                                required: ['message'],
                            },
                        },
                    },
                ],
            },
        ],
        discriminator: {
            propertyName: 'type',
            mapping: {
                [AsyncResultType.PENDING]: getSchemaPath(Pending),
                [AsyncResultType.SUCCESS]: getSchemaPath(Success),
                [AsyncResultType.FAILURE]: getSchemaPath(Failure),
            },
        },
    };
};
