# 04 · Async & Runtime

The asynchronous and runtime half: promises with cancellation, retries, bounded
concurrency, generators and iterators, symbols, explicit resource management
with `using`, and Node's file APIs.

**Covers** §30 Symbols · §31 Iterators & Generators · §32 Async/Await & Promises
· §42 `using` (Disposable Resources) · §16 Generics

```bash
npm run start:04      # run the demo
npm test              # 22 tests
```

| File | What it demonstrates |
| --- | --- |
| `src/concurrency.ts` | `AbortSignal` cancellation, timeouts, exponential-backoff retry, a `p-limit`-style concurrency pool, all four promise combinators, deferred promises |
| `src/generators.ts` | generator functions (including infinite ones), `yield*`, two-way `next(value)`, a class with `[Symbol.iterator]`, `[Symbol.toStringTag]`, `[Symbol.toPrimitive]`, the symbol registry vs local symbols, async generators and `[Symbol.asyncIterator]` |
| `src/disposables.ts` | `Disposable` / `AsyncDisposable`, `[Symbol.dispose]`, `await using`, reverse-order disposal that survives a thrown error, wrapping a legacy close callback |
| `src/files.ts` | `fs/promises`, a generic JSON-lines file as an `AsyncDisposable`, a self-deleting temp directory, streaming a file through an async generator |
| `src/runtime.test.ts` | 22 tests |

### Three details worth reading

- **Unhandled rejections kill the process.** `combinators()` builds all four
  promises eagerly; the demo and the test both await every one of them, because
  leaving `Promise.all` unhandled crashes Node *after* the test has finished.
- **`const s = Symbol.for("x")` infers `unique symbol`**, so comparing two of
  them is a compile error (TS2367). `registeredA`/`registeredB` are annotated
  `symbol` to show the registry really is shared.
- **`using` runs on every exit path**, including `throw` — `nestedScopes()`
  asserts the exact order: `open outer → open inner → caught → close inner →
  close outer`.
