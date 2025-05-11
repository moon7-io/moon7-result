import { expect, test, describe, vi } from "vitest";
import {
    success,
    failure,
    isSuccess,
    isFailure,
    AsyncResult,
    isPending,
    isResult,
    pending,
    isAsyncResult,
    matchAsync,
} from "~/index";

describe("AsyncResult", () => {
    describe("Type identification", () => {
        test("isPending returns true for pending results", () => {
            expect(isPending(pending)).toBe(true);
        });

        test("isPending returns false for success results", () => {
            const result: AsyncResult<string, Error> = success("test");
            expect(isPending(result)).toBe(false);
        });

        test("isPending returns false for failure results", () => {
            const result: AsyncResult<string, Error> = failure(new Error("test"));
            expect(isPending(result)).toBe(false);
        });

        test("isResult returns false for pending results", () => {
            expect(isResult(pending)).toBe(false);
        });

        test("isResult returns true for success results", () => {
            const result: AsyncResult<string, Error> = success("test");
            expect(isResult(result)).toBe(true);
        });

        test("isResult returns true for failure results", () => {
            const result: AsyncResult<string, Error> = failure(new Error("test"));
            expect(isResult(result)).toBe(true);
        });
    });

    describe("Type identification additional checks", () => {
        test("isResult correctly identifies non-Result values", () => {
            expect(isResult(null)).toBe(false);
            expect(isResult(undefined)).toBe(false);
            expect(isResult({})).toBe(false);
            expect(isResult({ value: 42 })).toBe(true); // This should be detected as a Success
            expect(isResult({ error: new Error() })).toBe(true); // This should be detected as a Failure
            expect(isResult({ status: "pending" })).toBe(false); // Pending is not a Result
        });

        test("isAsyncResult correctly identifies AsyncResult values", () => {
            expect(isAsyncResult(success(42))).toBe(true);
            expect(isAsyncResult(failure(new Error()))).toBe(true);
            expect(isAsyncResult(pending)).toBe(true);
            expect(isAsyncResult(null)).toBe(false);
            expect(isAsyncResult(undefined)).toBe(false);
            expect(isAsyncResult({})).toBe(false);
        });

        test("isAsyncResult with additional edge cases", () => {
            // Testing more edge cases to ensure full coverage
            expect(isAsyncResult(123)).toBe(false);
            expect(isAsyncResult("string")).toBe(false);
            expect(isAsyncResult(true)).toBe(false);
            expect(isAsyncResult({ random: "object" })).toBe(false);
            expect(isAsyncResult([])).toBe(false);
            expect(isAsyncResult(function () {})).toBe(false);

            // Objects that might be confused for AsyncResult types
            expect(isAsyncResult({ status: "other" })).toBe(false);
            expect(isAsyncResult({ status: "pending", extra: true })).toBe(true);
            expect(isAsyncResult({ value: 42, status: "success" })).toBe(true);
        });

        test("isAsyncResult properly identifies all AsyncResult variants", () => {
            // Test all three possible AsyncResult types
            expect(isAsyncResult(success(42))).toBe(true);
            expect(isAsyncResult(failure(new Error()))).toBe(true);
            expect(isAsyncResult(pending)).toBe(true);

            // Test non-AsyncResult values
            expect(isAsyncResult(null)).toBe(false);
            expect(isAsyncResult(undefined)).toBe(false);
            expect(isAsyncResult({})).toBe(false);
            expect(isAsyncResult({ status: "other" })).toBe(false);
        });
    });

    describe("matchAsync", () => {
        test("matchAsync calls the pending handler for pending results", async () => {
            const pendingResult = pending;
            const pendingFn = vi.fn().mockReturnValue("pending");
            const successFn = vi.fn().mockReturnValue("success");
            const failureFn = vi.fn().mockReturnValue("failure");

            const result = await matchAsync(pendingResult, {
                pending: pendingFn,
                success: successFn,
                failure: failureFn,
            });

            expect(result).toBe("pending");
            expect(pendingFn).toHaveBeenCalled();
            expect(successFn).not.toHaveBeenCalled();
            expect(failureFn).not.toHaveBeenCalled();
        });

        test("matchAsync calls the success handler for success results", async () => {
            const successResult = success(42);
            const pendingFn = vi.fn().mockReturnValue("pending");
            const successFn = vi.fn().mockReturnValue("success");
            const failureFn = vi.fn().mockReturnValue("failure");

            const result = await matchAsync(successResult, {
                pending: pendingFn,
                success: successFn,
                failure: failureFn,
            });

            expect(result).toBe("success");
            expect(pendingFn).not.toHaveBeenCalled();
            expect(successFn).toHaveBeenCalledWith(42);
            expect(failureFn).not.toHaveBeenCalled();
        });

        test("matchAsync calls the failure handler for failure results", async () => {
            const error = new Error("test error");
            const failureResult = failure(error);
            const pendingFn = vi.fn().mockReturnValue("pending");
            const successFn = vi.fn().mockReturnValue("success");
            const failureFn = vi.fn().mockReturnValue("failure");

            const result = await matchAsync(failureResult, {
                pending: pendingFn,
                success: successFn,
                failure: failureFn,
            });

            expect(result).toBe("failure");
            expect(pendingFn).not.toHaveBeenCalled();
            expect(successFn).not.toHaveBeenCalled();
            expect(failureFn).toHaveBeenCalledWith(error);
        });
    });

    describe("Creation", () => {
        test("pending creates a result with status 'pending'", () => {
            expect(pending.status).toBe("pending");
        });
    });

    describe("Type compatibility", () => {
        test("AsyncResult can be a success Result", () => {
            const successResult = success("test");
            const asyncResult: AsyncResult<string, Error> = successResult;
            expect(isSuccess(asyncResult)).toBe(true);
        });

        test("AsyncResult can be a failure Result", () => {
            const error = new Error("test");
            const failureResult = failure(error);
            const asyncResult: AsyncResult<string, Error> = failureResult;
            expect(isFailure(asyncResult)).toBe(true);
        });

        test("AsyncResult discriminated union works with switch statements", () => {
            const pendingResult: AsyncResult<string, Error> = pending;
            const successResult: AsyncResult<string, Error> = success("test");
            const failureResult: AsyncResult<string, Error> = failure(new Error("test"));

            function processResult(result: AsyncResult<string, Error>): string {
                if (isPending(result)) {
                    return "pending";
                } else if (isSuccess(result)) {
                    return `success: ${result.value}`;
                } else if (isFailure(result)) {
                    return `failure: ${result.error.message}`;
                }
                return "unknown";
            }

            expect(processResult(pendingResult)).toBe("pending");
            expect(processResult(successResult)).toBe("success: test");
            expect(processResult(failureResult)).toBe("failure: test");
        });
    });
});
