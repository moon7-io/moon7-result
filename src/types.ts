export type NodeCallback<V, E> = (error: E | null | undefined, result: V) => void;
export type Recover<V, E> = (error: E) => V;
export type Fn<T> = () => T;

export interface Match<V, E, T> {
    success: (value: V) => T;
    failure: (error: E) => T;
}

export interface AsyncMatch<V, E, T> {
    pending: () => Promise<T> | T;
    success: (value: V) => Promise<T> | T;
    failure: (error: E) => Promise<T> | T;
}
