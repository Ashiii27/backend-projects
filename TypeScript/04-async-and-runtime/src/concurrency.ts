/**
 * 04 · Async & Runtime — promises, cancellation, retries and bounded
 * concurrency.
 *
 * Guide section covered: §32 Async/Await & Promises.
 */

export class TimeoutError extends Error {
  constructor(readonly ms: number) {
    super(`Operation timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

export class AbortedError extends Error {
  constructor() {
    super("Operation was aborted");
    this.name = "AbortedError";
  }
}

/** A promise-based sleep that can be cancelled through an AbortSignal. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new AbortedError());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort(): void {
      clearTimeout(timer);
      reject(new AbortedError());
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Races a promise against a timer. `Promise.race` is typed as
 * `Promise<Awaited<T> | Awaited<U>>`, so the result type stays useful.
 */
export function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  signal?: AbortSignal;
  /** Return false to stop retrying for this particular error. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

/** Exponential backoff: base * 2^(attempt-1). */
export async function retry<T>(work: (attempt: number) => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { attempts = 3, baseDelayMs = 10, signal, shouldRetry, onRetry } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await work(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      if (shouldRetry && !shouldRetry(error, attempt)) break;
      onRetry?.(error, attempt);
      await delay(baseDelayMs * 2 ** (attempt - 1), signal);
    }
  }
  throw lastError;
}

/** Filled in by `mapLimit` so callers (and tests) can observe the real peak. */
export interface PoolStats {
  peak: number;
}

/**
 * Runs `work` over `items` with at most `limit` operations in flight.
 * This is the pattern behind `p-limit` / `p-map`, written from scratch.
 */
export async function mapLimit<T, U>(
  items: readonly T[],
  limit: number,
  work: (item: T, index: number) => Promise<U>,
  stats?: PoolStats,
): Promise<U[]> {
  if (limit < 1) throw new RangeError("limit must be at least 1");

  const results: U[] = new Array<U>(items.length);
  let cursor = 0;
  let inFlight = 0;

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      inFlight++;
      if (stats) stats.peak = Math.max(stats.peak, inFlight);
      try {
        // `items[index]` is `T | undefined` under noUncheckedIndexedAccess; the
        // loop condition above already proved the index is in range.
        results[index] = await work(items[index] as T, index);
      } finally {
        inFlight--;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/** The four combinators, with their differing failure semantics. */
export interface CombinatorReport<T> {
  all: Promise<T[]>;
  allSettled: Promise<PromiseSettledResult<T>[]>;
  any: Promise<T>;
  race: Promise<T>;
}

export function combinators<T>(promises: readonly Promise<T>[]): CombinatorReport<T> {
  return {
    all: Promise.all(promises), // rejects on the first failure
    allSettled: Promise.allSettled(promises), // never rejects
    any: Promise.any(promises), // rejects only if *all* fail
    race: Promise.race(promises), // settles with whichever finishes first
  };
}

/** A deferred promise — handy for tests and for bridging callbacks. */
export interface Deferred<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(reason?: unknown): void;
}

export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
