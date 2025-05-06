import { Outcome } from "./outcome";
import { AsyncMatch, Match, NodeCallback, Recover } from "./types";
import { AsyncResult, isPending } from "~/async";

export interface Success<V> {
    readonly status: "success";
    readonly value: V;
}

export interface Failure<E> {
    readonly status: "failure";
    readonly error: E;
}

export type Result<V, E = any> = Success<V> | Failure<E>;

export function isSuccess<V, E>(result: Result<V, E>): result is Success<V> {
    return result.status === "success";
}

export function isFailure<V, E>(result: Result<V, E>): result is Failure<E> {
    return result.status === "failure";
}

export function success<V>(value: V): Success<V> {
    return { status: "success", value };
}

export function failure<E>(error: E): Failure<E> {
    return { status: "failure", error };
}

export function unwrap<V, E>(result: Result<V, E>): V {
    if (isSuccess(result)) {
        return result.value;
    }
    throw result.error;
}

export function unwrapOr<V, E>(result: Result<V, E>, defaultValue: V): V {
    return isSuccess(result) ? result.value : defaultValue;
}

export function unwrapOrUndefined<V, E>(result: Result<V, E>): V | undefined {
    return unwrapOr(result, undefined);
}

export function unwrapOrElse<V, E>(result: Result<V, E>, fn: Recover<V, E>): V {
    return isSuccess(result) ? result.value : fn(result.error);
}

export function recover<V, E>(result: Result<V, E>, fn: Recover<V, E>): Success<V> {
    return isSuccess(result) ? result : success(fn(result.error));
}

export function fromTry<V, E>(fn: () => V): Result<V, E> {
    try {
        return success<V>(fn());
    } catch (error) {
        return failure<E>(error as E);
    }
}

export async function fromTryAsync<V, E>(fn: () => Promise<V> | V): Promise<Result<V, E>> {
    try {
        return success<V>(await fn());
    } catch (error) {
        return failure<E>(error as E);
    }
}

export async function fromPromise<V, E>(promise: Promise<V>): Promise<Result<V, E>> {
    try {
        const value = await promise;
        return success<V>(value);
    } catch (error) {
        return failure<E>(error as E);
    }
}

export function fromNullable<V, E>(value: V | null | undefined, error: E): Result<V, E> {
    return value != null ? success(value) : failure(error);
}

// const text = await fromNodeCallback<NonSharedBuffer, NodeJS.ErrnoException>((cb) => readFile("package.json", cb));
export function fromNodeCallback<V, E>(fn: (callback: NodeCallback<V, E>) => void): Promise<Result<V, E>> {
    return new Promise<Result<V, E>>((resolve) => {
        fn((error, result) => {
            if (error) {
                resolve(failure(error));
            } else {
                resolve(success(result));
            }
        });
    });
}

export function fromOutcome<V, E>(outcome: Outcome<V, E>): Result<V, E> {
    const [error, value] = outcome;
    if (error != null) {
        return failure(error);
    }
    return success(value!);
}

export function all<V, E>(many: Result<V, E>[]): Result<V[], E> {
    const values: V[] = [];
    for (const item of many) {
        if (!isSuccess(item)) {
            return item;
        }
        values.push(item.value);
    }
    return success(values);
}

export function any<V, E>(many: Result<V, E>[]): Result<V, E[]> {
    const errors: E[] = [];
    for (const item of many) {
        if (isSuccess(item)) {
            return item;
        }
        errors.push(item.error);
    }
    return failure(errors);
}

export function match<V, E, T>(result: Result<V, E>, patterns: Match<V, E, T>): T {
    return isSuccess(result) ? patterns.success(result.value) : patterns.failure(result.error);
}

export async function matchAsync<V, E, T>(result: AsyncResult<V, E>, patterns: AsyncMatch<V, E, T>): Promise<T> {
    return isPending(result) ? patterns.pending() : match(result, patterns);
}

export function map<V, U, E>(result: Result<V, E>, fn: (value: V) => U): Result<U, E> {
    return isSuccess(result) ? success(fn(result.value)) : result;
}

export function flatMap<V, U, E>(result: Result<V, E>, fn: (value: V) => Result<U, E>): Result<U, E> {
    return isSuccess(result) ? fn(result.value) : result;
}
