import { Result } from "~/result";

export interface Pending {
    status: "pending";
}

export type AsyncResult<V, E> = Pending | Result<V, E>;

export function isPending<V, E>(result: AsyncResult<V, E>): result is Pending {
    return result.status === "pending";
}

export function isResult<V, E>(result: AsyncResult<V, E>): result is Result<V, E> {
    return result.status !== "pending";
}

export const pending: Pending = { status: "pending" };
