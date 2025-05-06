# @moon7/result

[![npm version](https://img.shields.io/npm/v/@moon7/result.svg)](https://www.npmjs.com/package/@moon7/result)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A lightweight, zero-dependency TypeScript library for handling operations that might fail in a functional way. 

## Features

- 🛡️ **Type-safe error handling** - Handle success and failure states without exceptions
- 🧩 **Composable operations** - Chain operations that might fail with clean, readable code
- 🔄 **Async support** - Full support for asynchronous operations with promises
- 🧪 **Pattern matching** - Elegant pattern matching for handling different result states
- 📦 **Zero dependencies** - Lightweight and focused utility

## Installation

```bash
# npm
npm install @moon7/result

# yarn
yarn add @moon7/result

# pnpm
pnpm add @moon7/result
```

## Core Concepts

### Result Type

The core of the library is the `Result<V, E>` type, which can be either a `Success<V>` or a `Failure<E>`:

```typescript
type Result<V, E = any> = Success<V> | Failure<E>;

interface Success<V> {
    readonly status: "success";
    readonly value: V;
}

interface Failure<E> {
    readonly status: "failure";
    readonly error: E;
}
```

### Basic Usage

```typescript
import { success, failure, isSuccess, unwrapOr } from '@moon7/result';

// Creating Results
const successResult = success(42);
const failureResult = failure(new Error("Something went wrong"));

// Checking result type
if (isSuccess(successResult)) {
    console.log(successResult.value); // 42
}

// Safely extracting values with fallbacks
const value = unwrapOr(failureResult, 0); // 0
```

### Safe Operations

```typescript
import { fromTry, fromPromise } from '@moon7/result';

// Safe synchronous operations
const result = fromTry(() => JSON.parse(someInput));

// Safe asynchronous operations
const asyncResult = await fromPromise(fetch('https://api.example.com/data'));
```

### Working with Results

```typescript
import { 
    match, map, flatMap, recover, all, any,
    unwrapOr, unwrapOrElse
} from '@moon7/result';

// Pattern matching
const message = match(result, {
    success: value => `Got value: ${value}`,
    failure: error => `Error: ${error.message}`
});

// Transforming successful results
const doubled = map(result, x => x * 2);

// Chaining operations
const final = flatMap(result, value => {
    return someOtherOperationThatMightFail(value);
});

// Recovering from errors
const recovered = recover(result, error => {
    console.log(`Recovering from: ${error.message}`);
    return defaultValue;
});

// Working with multiple results
const combined = all([result1, result2, result3]); // Success only if ALL succeed
const any = any([result1, result2, result3]); // Success if ANY succeeds
```

### Async Support

The library provides full support for asynchronous operations:

```typescript
import { fromTryAsync, fromPromise } from '@moon7/result';

// Creating async results
const result = await fromTryAsync(async () => {
    const response = await fetch('https://api.example.com/data');
    return response.json();
});

// TypeScript narrows the type for safe value access
const value = isSuccess(result) ? result.value : defaultValue;

// Or use match pattern
const data = match(result, {
    success: value => value,
    failure: error => defaultValue
});
```

### AsyncResult for Loading States

The library also provides an `AsyncResult` type that adds a third "pending" state to represent loading operations:

```typescript
import { 
    AsyncResult, pending, success, failure, matchAsync
} from '@moon7/result';

// Component that displays user data with loading states
function UserProfile({ userId }: { userId: string }) {
    // State to hold the AsyncResult
    const [state, setState] = useState<AsyncResult<User, Error>>(pending);

    // Fetch user data when component mounts or userId changes
    useEffect(() => {
        async function fetchUser() {
            // Start with pending state
            setState(pending);
            
            try {
                // Simulate API call
                const response = await fetch(`/api/users/${userId}`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        setState(failure(new Error("User not found")));
                    } else {
                        setState(failure(new Error(`API error: ${response.status}`)));
                    }
                    return;
                }
                
                const userData = await response.json();
                setState(success(userData));
            } catch (error) {
                setState(failure(error instanceof Error ? error : new Error("Unknown error")));
            }
        }
        
        fetchUser();
    }, [userId]);
    
    // Render different UI based on the AsyncResult state
    return (
        <div className="user-profile">
            {matchAsync(state, {
                pending: () => (
                    <div className="loading-spinner">Loading user data...</div>
                ),
                success: (user) => (
                    <div className="user-data">
                        <h2>{user.name}</h2>
                        <p>Email: {user.email}</p>
                        <p>Role: {user.role}</p>
                    </div>
                ),
                failure: (error) => (
                    <div className="error-message">
                        <h2>Could not load user</h2>
                        <p>{error.message}</p>
                        <button onClick={() => fetchUser()}>Retry</button>
                    </div>
                )
            })}
        </div>
    );
}
```

### Additional Utilities

The library also provides utilities for assertions and nullable handling:

```typescript
import { must, strictMust, assert, assertNever } from '@moon7/result';

// Check for null or undefined
const value = must(maybeNull, "Value cannot be null");

// Type assertions
assert(condition, "Condition must be true");

// Exhaustive type checking with assertNever
type Shape = Circle | Square | Triangle;

function processShape(shape: Shape) {
    switch (shape.type) {
        case 'circle':
            return calculateCircleArea(shape);
        case 'square':
            return calculateSquareArea(shape);
        case 'triangle':
            return calculateTriangleArea(shape);
        default:
            // This ensures compiler error if you add a new shape type
            // but forget to handle it in this switch statement
            return assertNever(shape);
    }
}
```

The `assertNever` function is particularly valuable for exhaustiveness checking in TypeScript. If you add a new variant to the `Shape` type but forget to handle it in the switch statement, TypeScript will give you a compile-time error, preventing potential bugs.

### Error Raising

The library provides convenient ways to throw errors as expressions:

```typescript
import { raise } from '@moon7/result';

// Throw an error as an expression in a ternary
const value = condition ? computeValue() : raise(new Error("Condition failed"));

// Use in place of default values
const item = items.find(i => i.id === id) ?? raise(new Error(`Item ${id} not found`));
```

## Examples

### HTTP Request Example

```typescript
import { fromPromise, match } from '@moon7/result';

async function fetchUser(id: string) {
    const result = await fromPromise(fetch(`https://api.example.com/users/${id}`));
    
    return match(result, {
        success: async (response) => {
            if (response.status === 404) {
                return failure({ type: 'NOT_FOUND', message: 'User not found' });
            }
            if (!response.ok) {
                return failure({ type: 'API_ERROR', status: response.status });
            }
            return fromPromise(response.json());
        },
        failure: (error) => failure({ type: 'NETWORK_ERROR', error })
    });
}

// Usage
const userResult = await fetchUser('123');
const userDisplay = match(userResult, {
    success: (user) => renderUser(user),
    failure: (error) => renderError(error)
});
```

### File Operations Example

```typescript
import { fromNodeCallback, match } from '@moon7/result';
import { readFile } from 'fs';

async function readConfig() {
    const result = await fromNodeCallback((cb) => 
        readFile('config.json', { encoding: 'utf-8' }, cb)
    );
    
    return match(result, {
        success: (content) => fromTry(() => JSON.parse(content)),
        failure: (error) => failure({
            message: 'Failed to read config',
            cause: error
        })
    });
}
```

## API Reference

### Core Types

- `Result<V, E>`: Union type of `Success<V>` and `Failure<E>`
- `Success<V>`: Represents a successful operation with a value
- `Failure<E>`: Represents a failed operation with an error
- `Outcome<V, E>`: Tuple-based alternative to `Result` as `[error, value]`

### Type Guards

- `isSuccess<V, E>(result)`: Checks if a result is a `Success<V>`
- `isFailure<V, E>(result)`: Checks if a result is a `Failure<E>`

### Constructors

- `success<V>(value)`: Creates a `Success<V>` result
- `failure<E>(error)`: Creates a `Failure<E>` result

### Unwrapping Functions

- `unwrap<V, E>(result)`: Extracts the value or throws the error
- `unwrapOr<V, E>(result, defaultValue)`: Extracts the value or returns a default
- `unwrapOrUndefined<V, E>(result)`: Extracts the value or returns undefined
- `unwrapOrElse<V, E>(result, fn)`: Extracts the value or computes a fallback

### Error Recovery

- `recover<V, E>(result, fn)`: Transforms a failure into a success by recovering from the error

### Result Creation

- `fromTry<V, E>(fn)`: Creates a result from a function that might throw
- `fromTryAsync<V, E>(fn)`: Creates a result from an async function that might throw
- `fromPromise<V, E>(promise)`: Creates a result from a promise
- `fromNullable<V, E>(value, error)`: Creates a result from a nullable value
- `fromNodeCallback<V, E>(fn)`: Creates a result from a Node.js style callback
- `fromOutcome<V, E>(outcome)`: Converts an `Outcome<V, E>` to a `Result<V, E>`

### Collection Operations

- `all<V, E>(results)`: Succeeds if all results succeed, fails on first failure
- `any<V, E>(results)`: Succeeds on first success, fails if all fail

### Pattern Matching

- `match<V, E, T>(result, patterns)`: Applies success or failure function based on result
- `matchAsync<V, E, T>(result, patterns)`: Async version of `match`

### Transformations

- `map<V, U, E>(result, fn)`: Maps a success value, preserves failure
- `flatMap<V, U, E>(result, fn)`: Maps a success to another result, preserves failure

### Utility Functions

- `must<T>(value, errorMessage?)`: Ensures a value is not null or undefined
- `strictMust<T>(value, errorMessage?)`: Ensures a value is not undefined
- `assert<T>(condition, message?)`: Throws if condition is false
- `assertNever(value)`: Used for exhaustive checks in switch statements
- `safely<T>(x, defaultValue)`: Safely executes a function returning a default on error
- `attempt<T>(x)`: Similar to `safely` but returns a `Result` instead
- `raise<E>(error?)`: Throws an error as an expression

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Munir Hussin](https://github.com/moon7-io)