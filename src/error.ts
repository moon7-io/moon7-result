import { fromPromise, fromTry, isSuccess, Result, success, unwrapOr } from "./result";
import { Fn } from "./types";

/** Allows you to throw an error as an expression */
export function raise<E>(error?: E): never {
    throw error;
}

export function safely<T>(x: Fn<T>, defaultValue: T): T;
export function safely<T>(x: Fn<Promise<T>>, defaultValue: T): Promise<T>;
export function safely<T>(x: Promise<T>, defaultValue: T): Promise<T>;
export function safely<T>(x: Fn<T | Promise<T>> | Promise<T>, defaultValue: T): T | Promise<T> {
    if (typeof x === "function") {
        const result = fromTry(x);
        if (isSuccess(result)) {
            if (result.value instanceof Promise) {
                return fromPromise(result.value).then(value => unwrapOr(value, defaultValue));
            }
            return result.value;
        }
        return defaultValue;
    }
    return fromPromise(x).then(value => unwrapOr(value, defaultValue));
}

export function attempt<T>(x: Fn<T>): Result<T>;
export function attempt<T>(x: Fn<Promise<T>>): Promise<Result<T>>;
export function attempt<T>(x: Promise<T>): Promise<Result<T>>;
export function attempt<T>(x: Fn<T | Promise<T>> | Promise<T>): Result<T> | Promise<Result<T>> {
    if (typeof x === "function") {
        const result = fromTry(x);
        if (isSuccess(result)) {
            if (result.value instanceof Promise) {
                return fromPromise(result.value);
            }
            return success(result.value);
        }
        return result;
    }
    return fromPromise(x);
}

export function must<T>(value: T | undefined | null, errorMessage = "Value is undefined or null"): T {
    if (value == null) {
        throw new Error(errorMessage);
    }
    return value;
}

export function strictMust<T>(value: T | undefined, errorMessage = "Value is undefined"): T {
    if (value === undefined) {
        throw new Error(errorMessage);
    }
    return value;
}

export function assert<T>(cond: T, message: string = "Assertion failed"): asserts cond {
    if (!cond) {
        throw new Error(message);
    }
}

export function assertNever(value: never): never {
    throw new Error(`Unhandled value: ${value}`);
}
