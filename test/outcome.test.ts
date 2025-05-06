import { expect, test, describe } from "vitest";
import { Outcome, SuccessOutcome, FailureOutcome } from "~/outcome";
import { success, failure, fromOutcome, isSuccess, isFailure } from "~/result";

describe("Outcome", () => {
    describe("Type definitions", () => {
        test("SuccessOutcome has correct shape", () => {
            const successOutcome: SuccessOutcome<number> = [undefined, 42];

            expect(successOutcome[0]).toBeUndefined();
            expect(successOutcome[1]).toBe(42);
        });

        test("SuccessOutcome can have null as first element", () => {
            const successOutcome: SuccessOutcome<number> = [null, 42];

            expect(successOutcome[0]).toBeNull();
            expect(successOutcome[1]).toBe(42);
        });

        test("FailureOutcome has correct shape", () => {
            const error = new Error("test error");
            const failureOutcome: FailureOutcome<Error> = [error, undefined];

            expect(failureOutcome[0]).toBe(error);
            expect(failureOutcome[1]).toBeUndefined();
        });

        test("Outcome type properly represents both success and failure", () => {
            const successOutcome: Outcome<number> = [undefined, 42];
            const failureOutcome: Outcome<number, Error> = [new Error("test error"), undefined];

            expect(successOutcome[0]).toBeUndefined();
            expect(successOutcome[1]).toBe(42);

            expect(failureOutcome[0]).toBeInstanceOf(Error);
            expect(failureOutcome[1]).toBeUndefined();
        });
    });

    describe("Conversion to Result", () => {
        test("Success outcome converts to success result", () => {
            const outcome: Outcome<number> = [undefined, 42];
            const result = fromOutcome(outcome);

            expect(isSuccess(result)).toBe(true);
            expect(result).toEqual(success(42));
        });

        test("Failure outcome converts to failure result", () => {
            const error = new Error("test error");
            const outcome: Outcome<number, Error> = [error, undefined];
            const result = fromOutcome(outcome);

            expect(isFailure(result)).toBe(true);
            expect(result).toEqual(failure(error));
        });
    });

    describe("Practical usage", () => {
        test("Outcome can be used as a union type in functions", () => {
            function processOutcome(outcome: Outcome<string, Error>): string {
                if (outcome[0] === null || outcome[0] === undefined) {
                    return `Success: ${outcome[1]}`;
                } else {
                    return `Failure: ${outcome[0].message}`;
                }
            }

            const successValue: Outcome<string, Error> = [null, "it worked"];
            const failureValue: Outcome<string, Error> = [new Error("it failed"), undefined];

            expect(processOutcome(successValue)).toBe("Success: it worked");
            expect(processOutcome(failureValue)).toBe("Failure: it failed");
        });
    });
});
