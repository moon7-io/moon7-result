import { failure, Failure, isFailure, isSuccess, Success } from "~/result";

export type Maybe<T> = Some<T> | None;
export type Some<T> = Success<T>;
export type None = Failure<any>;

export function some<T>(value: T): Some<T> {
    return { value };
}

export const none: None = failure(null);

export function isSome<T>(maybe: Maybe<T>): maybe is Some<T> {
    return isSuccess(maybe);
}

export function isNone<T>(maybe: Maybe<T>): maybe is None {
    return isFailure(maybe);
}
