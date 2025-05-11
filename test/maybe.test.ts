import { expect, test, describe, vi } from "vitest";
import { none, some, isSome, isNone, Maybe } from "~/maybe";
import { failure, success, unwrap, unwrapOr, unwrapOrElse, map, chain } from "~/result";

describe("Maybe", () => {
    describe("Type guards", () => {
        test("isSome identifies Some values correctly", () => {
            const someValue = some(42);
            const noneValue = none;

            expect(isSome(someValue)).toBe(true);
            expect(isSome(noneValue)).toBe(false);
        });

        test("isNone identifies None values correctly", () => {
            const someValue = some(42);
            const noneValue = none;

            expect(isNone(someValue)).toBe(false);
            expect(isNone(noneValue)).toBe(true);
        });
    });

    describe("Creation", () => {
        test("some creates a proper Some value", () => {
            const value = 42;
            const maybe = some(value);

            expect(maybe.value).toBe(value);
            expect(isSome(maybe)).toBe(true);
        });

        test("none is a proper None value", () => {
            expect(isNone(none)).toBe(true);
        });
    });

    describe("Compatibility with Result", () => {
        test("Maybe<T> can be used where Result<T, null> is expected", () => {
            const someValue = some(42);
            const noneValue = none;

            // Should work with Result functions
            expect(unwrap(someValue)).toBe(42);
            expect(() => unwrap(noneValue)).toThrow();

            expect(unwrapOr(someValue, 0)).toBe(42);
            expect(unwrapOr(noneValue, 0)).toBe(0);

            const fn = vi.fn().mockReturnValue(99);
            expect(unwrapOrElse(someValue, fn)).toBe(42);
            expect(fn).not.toHaveBeenCalled();

            expect(unwrapOrElse(noneValue, fn)).toBe(99);
            expect(fn).toHaveBeenCalledWith(null);
        });

        test("Maybe works with Result transformations", () => {
            const someValue = some(21);
            const noneValue = none as Maybe<number>;

            const mappedSome = map(someValue, x => x * 2);
            expect(isSome(mappedSome)).toBe(true);
            expect(unwrap(mappedSome)).toBe(42);

            const mappedNone = map(noneValue, x => x * 2);
            expect(isNone(mappedNone)).toBe(true);

            const chainedSome = chain(someValue, x => some(x * 2));
            expect(isSome(chainedSome)).toBe(true);
            expect(unwrap(chainedSome)).toBe(42);

            const chainedToNone = chain(someValue, () => none);
            expect(isNone(chainedToNone)).toBe(true);

            const chainedNone = chain(noneValue, x => some(x * 2));
            expect(isNone(chainedNone)).toBe(true);
        });

        test("Maybe can be constructed from Result functions", () => {
            // Test that Maybe values can be constructed using Result functions
            const someFromSuccess: Maybe<number> = success(42);
            const noneFromFailure: Maybe<number> = failure(null);

            expect(isSome(someFromSuccess)).toBe(true);
            expect(unwrap(someFromSuccess)).toBe(42);
            expect(isNone(noneFromFailure)).toBe(true);
        });
    });
});
