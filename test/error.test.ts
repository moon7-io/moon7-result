import { expect, test, describe } from "vitest";
import { raise, safely, attempt, must, strictMust, assert, assertNever } from "~/error";
import { isSuccess, isFailure, success, failure, Success, Failure } from "~/result";

describe("Error utilities", () => {
    describe("raise", () => {
        test("raise throws the provided error", () => {
            const error = new Error("Test error");
            expect(() => raise(error)).toThrow(error);
        });

        test("raise can throw without an argument", () => {
            expect(() => raise()).toThrow();
        });
    });

    describe("safely", () => {
        test("safely returns the result of a function if it succeeds", () => {
            const result = safely(() => "success", "default");
            expect(result).toBe("success");
        });

        test("safely returns the default value if the function throws", () => {
            const result = safely(() => {
                throw new Error("Test error");
            }, "default");
            expect(result).toBe("default");
        });

        test("safely handles promise-returning functions that succeed", async () => {
            const result = await safely(async () => "success", "default");
            expect(result).toBe("success");
        });

        test("safely handles promises that resolve", async () => {
            const result = await safely(Promise.resolve("success"), "default");
            expect(result).toBe("success");
        });

        test("safely handles promises that reject", async () => {
            const result = await safely(Promise.reject(new Error("Test error")), "default");
            expect(result).toBe("default");
        });

        test("safely handles promise-returning functions that fail", async () => {
            try {
                const result = await safely(() => Promise.reject(new Error("Test error")), "default");
                expect(result).toBe("default");
            } catch (_e) {
                console.log(">>>", _e);
                expect(true).toBe(false);
            }
        });
    });

    describe("attempt", () => {
        test("attempt returns a success result if the function succeeds", () => {
            const result = attempt(() => "success");
            expect(isSuccess(result)).toBe(true);
            expect(result).toEqual(success("success"));
        });

        test("attempt returns a failure result if the function throws", () => {
            const error = new Error("Test error");
            const result = attempt(() => {
                throw error;
            });
            expect(isFailure(result)).toBe(true);
            expect(result).toEqual(failure(error));
        });

        test("attempt handles promises that resolve", async () => {
            const result = await attempt(Promise.resolve("success"));
            expect(isSuccess(result)).toBe(true);
            expect(result).toEqual(success("success"));
        });

        test("attempt handles promises that reject", async () => {
            const error = new Error("Test error");
            const result = await attempt(Promise.reject(error));
            expect(isFailure(result)).toBe(true);
            expect(result).toEqual(failure(error));
        });

        test("attempt handles promise-returning functions that succeed", async () => {
            const resultPromise = attempt<string>(() => Promise.resolve("success"));
            const result = await resultPromise;
            expect(isSuccess(result)).toBe(true);
            expect((result as Success<string>).value).toBe("success");
        });

        test("attempt handles promise-returning functions that fail", async () => {
            const error = new Error("Test error");
            const resultPromise = attempt<never>(() => Promise.reject(error));
            const result = await resultPromise;
            expect(isFailure(result)).toBe(true);
            expect((result as Failure<Error>).error).toBe(error);
        });
    });

    describe("must", () => {
        test("must returns the value if it's not null or undefined", () => {
            expect(must("value")).toBe("value");
            expect(must(0)).toBe(0);
            expect(must(false)).toBe(false);
        });

        test("must throws if value is undefined", () => {
            expect(() => must(undefined)).toThrow("Value is undefined or null");
        });

        test("must throws if value is null", () => {
            expect(() => must(null)).toThrow("Value is undefined or null");
        });

        test("must allows custom error messages", () => {
            expect(() => must(undefined, "Custom message")).toThrow("Custom message");
        });
    });

    describe("strictMust", () => {
        test("strictMust returns the value if it's not undefined", () => {
            expect(strictMust("value")).toBe("value");
            expect(strictMust(0)).toBe(0);
            expect(strictMust(false)).toBe(false);
            expect(strictMust(null)).toBe(null);
        });

        test("strictMust throws if value is undefined", () => {
            expect(() => strictMust(undefined)).toThrow("Value is undefined");
        });

        test("strictMust allows custom error messages", () => {
            expect(() => strictMust(undefined, "Custom message")).toThrow("Custom message");
        });
    });

    describe("assert", () => {
        test("assert does not throw if condition is truthy", () => {
            expect(() => assert(true)).not.toThrow();
            expect(() => assert("value")).not.toThrow();
            expect(() => assert(1)).not.toThrow();
            expect(() => assert({})).not.toThrow();
        });

        test("assert throws if condition is falsy", () => {
            expect(() => assert(false)).toThrow("Assertion failed");
            expect(() => assert(0)).toThrow("Assertion failed");
            expect(() => assert("")).toThrow("Assertion failed");
            expect(() => assert(null)).toThrow("Assertion failed");
            expect(() => assert(undefined)).toThrow("Assertion failed");
        });

        test("assert allows custom error messages", () => {
            expect(() => assert(false, "Custom message")).toThrow("Custom message");
        });
    });

    describe("assertNever", () => {
        test("assertNever always throws an error", () => {
            // @ts-expect-error - This is intentional for the test
            expect(() => assertNever("impossible")).toThrow("Unhandled value: impossible");
        });
    });
});
