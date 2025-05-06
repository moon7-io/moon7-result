import { expect, test, describe } from "vitest";
import { success, failure, isSuccess, isFailure, AsyncResult, isPending, isResult, pending } from "~/index";

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

    describe("Creation", () => {
        test("pending creates a result with status 'pending'", () => {
            expect(pending.status).toBe("pending");
        });
    });

    describe("Type compatibility", () => {
        test("AsyncResult can be a success Result", () => {
            const successResult = success("test");
            const asyncResult: AsyncResult<string, Error> = successResult;
            expect(asyncResult.status).toBe("success");
            expect(isSuccess(asyncResult as any)).toBe(true);
        });

        test("AsyncResult can be a failure Result", () => {
            const error = new Error("test");
            const failureResult = failure(error);
            const asyncResult: AsyncResult<string, Error> = failureResult;
            expect(asyncResult.status).toBe("failure");
            expect(isFailure(asyncResult as any)).toBe(true);
        });

        test("AsyncResult discriminated union works with switch statements", () => {
            const pendingResult: AsyncResult<string, Error> = pending;
            const successResult: AsyncResult<string, Error> = success("test");
            const failureResult: AsyncResult<string, Error> = failure(new Error("test"));

            function processResult(result: AsyncResult<string, Error>): string {
                switch (result.status) {
                    case "pending":
                        return "pending";
                    case "success":
                        return `success: ${result.value}`;
                    case "failure":
                        return `failure: ${result.error.message}`;
                }
            }

            expect(processResult(pendingResult)).toBe("pending");
            expect(processResult(successResult)).toBe("success: test");
            expect(processResult(failureResult)).toBe("failure: test");
        });
    });
});
