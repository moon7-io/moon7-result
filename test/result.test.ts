import { expect, test, describe, vi } from "vitest";
import { pending } from "~/async";
import { Outcome } from "~/outcome";
import {
    Failure,
    isSuccess,
    isFailure,
    success,
    failure,
    unwrap,
    unwrapOr,
    unwrapOrElse,
    recover,
    fromTry,
    fromTryAsync,
    fromPromise,
    fromNullable,
    fromNodeCallback,
    fromOutcome,
    all,
    any,
    match,
    matchAsync,
    map,
    flatMap,
    unwrapOrUndefined,
} from "~/result";

describe("Result", () => {
    describe("Type guards", () => {
        test("isSuccess identifies success results correctly", () => {
            const successResult = success(42);
            const failureResult = failure(new Error("test"));

            expect(isSuccess(successResult)).toBe(true);
            expect(isSuccess(failureResult)).toBe(false);
        });

        test("isFailure identifies failure results correctly", () => {
            const successResult = success(42);
            const failureResult = failure(new Error("test"));

            expect(isFailure(successResult)).toBe(false);
            expect(isFailure(failureResult)).toBe(true);
        });
    });

    describe("Creation", () => {
        test("success creates a proper success result", () => {
            const value = 42;
            const result = success(value);

            expect(result.status).toBe("success");
            expect(result.value).toBe(value);
            expect(isSuccess(result)).toBe(true);
        });

        test("failure creates a proper failure result", () => {
            const error = new Error("test error");
            const result = failure(error);

            expect(result.status).toBe("failure");
            expect((result as Failure<Error>).error).toBe(error);
            expect(isFailure(result)).toBe(true);
        });
    });

    describe("Unwrapping", () => {
        test("unwrap returns the value for success results", () => {
            const value = 42;
            const result = success(value);

            expect(unwrap(result)).toBe(value);
        });

        test("unwrap throws the error for failure results", () => {
            const error = new Error("test error");
            const result = failure(error);

            expect(() => unwrap(result)).toThrow(error);
        });

        test("unwrapOr returns the value for success results", () => {
            const value = 42;
            const result = success(value);

            expect(unwrapOr(result, 0)).toBe(value);
        });

        test("unwrapOr returns the default value for failure results", () => {
            const error = new Error("test error");
            const result = failure(error);
            const defaultValue = 0;

            expect(unwrapOr(result, defaultValue)).toBe(defaultValue);
        });

        test("unwrapOrElse returns the value for success results", () => {
            const value = 42;
            const result = success(value);
            const fallbackFn = vi.fn().mockReturnValue(0);

            expect(unwrapOrElse(result, fallbackFn)).toBe(value);
            expect(fallbackFn).not.toHaveBeenCalled();
        });

        test("unwrapOrElse calls the function with the error for failure results", () => {
            const error = new Error("test error");
            const result = failure(error);
            const fallbackValue = 0;
            const fallbackFn = vi.fn().mockReturnValue(fallbackValue);

            expect(unwrapOrElse(result, fallbackFn)).toBe(fallbackValue);
            expect(fallbackFn).toHaveBeenCalledWith(error);
        });

        test("unwrapOrUndefined returns the value for success results", () => {
            const value = 42;
            const result = success(value);

            expect(unwrapOrUndefined(result)).toBe(value);
        });

        test("unwrapOrUndefined returns undefined for failure results", () => {
            const error = new Error("test error");
            const result = failure(error);

            expect(unwrapOrUndefined(result)).toBeUndefined();
        });
    });

    describe("Recovery", () => {
        test("recover returns the original success result", () => {
            const value = 42;
            const result = success(value);
            const fn = vi.fn().mockReturnValue(0);
            const recovered = recover(result, fn);

            expect(isSuccess(recovered)).toBe(true);
            expect(unwrap(recovered)).toBe(value);
            expect(fn).not.toHaveBeenCalled();
        });

        test("recover transforms a failure into a success with the return value of the function", () => {
            const error = new Error("test error");
            const fallbackValue = 42;
            const result = failure(error);
            const fn = vi.fn().mockReturnValue(fallbackValue);
            const recovered = recover(result, fn);

            expect(isSuccess(recovered)).toBe(true);
            expect(unwrap(recovered)).toBe(fallbackValue);
            expect(fn).toHaveBeenCalledWith(error);
        });
    });

    describe("Creation utilities", () => {
        test("fromTry returns success for successful execution", () => {
            const value = 42;
            const result = fromTry(() => value);

            expect(isSuccess(result)).toBe(true);
            expect(unwrap(result)).toBe(value);
        });

        test("fromTry returns failure for thrown errors", () => {
            const error = new Error("test error");
            const result = fromTry(() => {
                throw error;
            });

            expect(isFailure(result)).toBe(true);
            expect((result as Failure<Error>).error).toBe(error);
        });

        test("fromTryAsync returns success for successful async execution", async () => {
            const value = 42;
            const result = await fromTryAsync(async () => value);

            expect(isSuccess(result)).toBe(true);
            expect(unwrap(result)).toBe(value);
        });

        test("fromTryAsync returns failure for thrown errors in async execution", async () => {
            const error = new Error("test error");
            const result = await fromTryAsync(async () => {
                throw error;
            });

            expect(isFailure(result)).toBe(true);
            expect((result as Failure<Error>).error).toBe(error);
        });

        test("fromPromise returns success for resolved promises", async () => {
            const value = 42;
            const result = await fromPromise(Promise.resolve(value));

            expect(isSuccess(result)).toBe(true);
            expect(unwrap(result)).toBe(value);
        });

        test("fromPromise returns failure for rejected promises", async () => {
            const error = new Error("test error");
            const result = await fromPromise(Promise.reject(error));

            expect(isFailure(result)).toBe(true);
            expect((result as Failure<Error>).error).toBe(error);
        });

        test("fromNullable returns success for non-null values", () => {
            const value = 42;
            const result = fromNullable(value, "Value was null");

            expect(isSuccess(result)).toBe(true);
            expect(unwrap(result)).toBe(value);
        });

        test("fromNullable returns failure for null values", () => {
            const errorMsg = "Value was null";
            const result = fromNullable(null, errorMsg);

            expect(isFailure(result)).toBe(true);
            expect((result as Failure<string>).error).toBe(errorMsg);
        });

        test("fromNullable returns failure for undefined values", () => {
            const errorMsg = "Value was undefined";
            const result = fromNullable(undefined, errorMsg);

            expect(isFailure(result)).toBe(true);
            expect((result as Failure<string>).error).toBe(errorMsg);
        });

        test("fromNodeCallback returns success for callback with no error", async () => {
            const value = { id: 1, name: "Test" };
            const nodeStyleFn = (cb: (err: Error | null, value?: any) => void) => {
                cb(null, value);
            };
            const result = await fromNodeCallback(nodeStyleFn);
            expect(isSuccess(result)).toBe(true);
            expect(unwrap(result)).toBe(value);
        });

        test("fromNodeCallback returns failure for callback with error", async () => {
            const error = new Error("Test error");
            const nodeStyleFn = (cb: (err: Error | null, value?: any) => void) => {
                cb(error);
            };
            const result = await fromNodeCallback(nodeStyleFn);
            expect(isFailure(result)).toBe(true);
            expect((result as Failure<Error>).error).toBe(error);
        });

        test("fromOutcome converts success outcome to success result", () => {
            const value = 42;
            const outcome: Outcome<number> = [undefined, value];
            const result = fromOutcome(outcome);

            expect(isSuccess(result)).toBe(true);
            expect(unwrap(result)).toBe(value);
        });

        test("fromOutcome converts failure outcome to failure result", () => {
            const error = new Error("test error");
            const outcome: Outcome<number, Error> = [error, undefined];
            const result = fromOutcome(outcome);

            expect(isFailure(result)).toBe(true);
            expect((result as Failure<Error>).error).toBe(error);
        });
    });

    describe("Collection operations", () => {
        test("all returns success with array of values when all results are successful", () => {
            const results = [success(1), success(2), success(3)];
            const result = all(results);

            expect(isSuccess(result)).toBe(true);
            expect(unwrap(result)).toEqual([1, 2, 3]);
        });

        test("all returns the first failure when any result is a failure", () => {
            const error = new Error("test error");
            const results = [success(1), failure(error), success(3)];
            const result = all(results);

            expect(isFailure(result)).toBe(true);
            expect((result as Failure<Error>).error).toBe(error);
        });

        test("any returns the first success when any result is successful", () => {
            const results = [failure(new Error("error 1")), success(2), failure(new Error("error 3"))];
            const result = any(results);

            expect(isSuccess(result)).toBe(true);
            expect(unwrap(result)).toBe(2);
        });

        test("any returns failure with array of errors when all results are failures", () => {
            const error1 = new Error("error 1");
            const error2 = new Error("error 2");
            const error3 = new Error("error 3");
            const results = [failure(error1), failure(error2), failure(error3)];
            const result = any(results);

            expect(isFailure(result)).toBe(true);
            expect((result as Failure<Error[]>).error).toEqual([error1, error2, error3]);
        });
    });

    describe("Pattern matching", () => {
        test("match calls the success handler for success results", () => {
            const value = 42;
            const result = success(value);
            const successFn = vi.fn().mockReturnValue("success");
            const failureFn = vi.fn().mockReturnValue("failure");

            const matchResult = match(result, {
                success: successFn,
                failure: failureFn,
            });

            expect(matchResult).toBe("success");
            expect(successFn).toHaveBeenCalledWith(value);
            expect(failureFn).not.toHaveBeenCalled();
        });

        test("match calls the failure handler for failure results", () => {
            const error = new Error("test error");
            const result = failure(error);
            const successFn = vi.fn().mockReturnValue("success");
            const failureFn = vi.fn().mockReturnValue("failure");

            const matchResult = match(result, {
                success: successFn,
                failure: failureFn,
            });

            expect(matchResult).toBe("failure");
            expect(successFn).not.toHaveBeenCalled();
            expect(failureFn).toHaveBeenCalledWith(error);
        });

        test("matchAsync calls the success handler for success results", async () => {
            const value = 42;
            const result = success(value);
            const pendingFn = vi.fn().mockResolvedValue("pending");
            const successFn = vi.fn().mockResolvedValue("success");
            const failureFn = vi.fn().mockResolvedValue("failure");

            const matchResult = await matchAsync(result, {
                pending: pendingFn,
                success: successFn,
                failure: failureFn,
            });

            expect(matchResult).toBe("success");
            expect(pendingFn).not.toHaveBeenCalled();
            expect(successFn).toHaveBeenCalledWith(value);
            expect(failureFn).not.toHaveBeenCalled();
        });

        test("matchAsync calls the failure handler for failure results", async () => {
            const error = new Error("test error");
            const result = failure(error);
            const pendingFn = vi.fn().mockResolvedValue("pending");
            const successFn = vi.fn().mockResolvedValue("success");
            const failureFn = vi.fn().mockResolvedValue("failure");

            const matchResult = await matchAsync(result, {
                pending: pendingFn,
                success: successFn,
                failure: failureFn,
            });

            expect(matchResult).toBe("failure");
            expect(pendingFn).not.toHaveBeenCalled();
            expect(successFn).not.toHaveBeenCalled();
            expect(failureFn).toHaveBeenCalledWith(error);
        });

        test("matchAsync calls the pending handler for pending results", async () => {
            const pendingResult = pending;
            const pendingFn = vi.fn().mockResolvedValue("pending");
            const successFn = vi.fn().mockResolvedValue("success");
            const failureFn = vi.fn().mockResolvedValue("failure");

            const matchResult = await matchAsync(pendingResult, {
                pending: pendingFn,
                success: successFn,
                failure: failureFn,
            });

            expect(matchResult).toBe("pending");
            expect(pendingFn).toHaveBeenCalled();
            expect(successFn).not.toHaveBeenCalled();
            expect(failureFn).not.toHaveBeenCalled();
        });
    });

    describe("Mapping", () => {
        test("map transforms success values", () => {
            const value = 21;
            const result = success(value);
            const mapped = map(result, (x) => x * 2);

            expect(isSuccess(mapped)).toBe(true);
            expect(unwrap(mapped)).toBe(42);
        });

        test("map doesn't transform failure results", () => {
            const error = new Error("test error");
            const result = failure(error);
            const fn = vi.fn((x) => x * 2);
            const mapped = map(result, fn);

            expect(isFailure(mapped)).toBe(true);
            expect((mapped as Failure<Error>).error).toBe(error);
            expect(fn).not.toHaveBeenCalled();
        });

        test("flatMap transforms success with functions returning results", () => {
            const value = 21;
            const result = success(value);
            const flatMapped = flatMap(result, (x) => success(x * 2));

            expect(isSuccess(flatMapped)).toBe(true);
            expect(unwrap(flatMapped)).toBe(42);
        });

        test("flatMap can transform success to failure", () => {
            const value = 21;
            const error = new Error("test error");
            const result = success(value);
            const flatMapped = flatMap(result, () => failure(error));

            expect(isFailure(flatMapped)).toBe(true);
            expect((flatMapped as Failure<Error>).error).toBe(error);
        });

        test("flatMap doesn't transform failure results", () => {
            const error = new Error("test error");
            const result = failure(error);
            const fn = vi.fn((x) => success(x * 2));
            const flatMapped = flatMap(result, fn);

            expect(isFailure(flatMapped)).toBe(true);
            expect((flatMapped as Failure<Error>).error).toBe(error);
            expect(fn).not.toHaveBeenCalled();
        });
    });
});
