import { isFailure, isSuccess, match, Result } from "~/result";
import { AsyncMatch } from "~/types";

export interface Pending {
    status: "pending";
}

export type AsyncResult<V, E> = Pending | Result<V, E>;

export const pending: Pending = { status: "pending" };

export function isPending<V, E>(result: AsyncResult<V, E>): result is Pending {
    return result != null && typeof result === "object" && "status" in result && result.status === "pending";
}

export function isResult<V, E>(result: any): result is Result<V, E> {
    return isSuccess(result) || isFailure(result);
}

export function isAsyncResult<V, E>(result: any): result is AsyncResult<V, E> {
    return isPending(result) || isResult(result);
}

export async function matchAsync<V, E, T>(result: AsyncResult<V, E>, patterns: AsyncMatch<V, E, T>): Promise<T> {
    return isPending(result) ? patterns.pending() : match(result, patterns);
}
