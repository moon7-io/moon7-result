export type SuccessOutcome<V> = [undefined | null, V];
export type FailureOutcome<E> = [E, undefined];
export type Outcome<V, E = any> = SuccessOutcome<V> | FailureOutcome<E>;
