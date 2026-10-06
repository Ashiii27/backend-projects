/**
 * 04 · Async & Runtime — generators, iterators and symbols.
 *
 * Guide sections covered: §30 Symbols, §31 Iterators & Generators.
 */

// ─────────────────────────────────────────────────────────────────────────────
// §31 Generator functions — a function that can pause and resume
// ─────────────────────────────────────────────────────────────────────────────

/** `Generator<Yield, Return, Next>` — the three type parameters matter. */
export function* range(start: number, end: number, step = 1): Generator<number, void, unknown> {
  for (let i = start; i < end; i += step) yield i;
}

/** Infinite generators are fine — the consumer decides when to stop. */
export function* fibonacci(): Generator<number, never, unknown> {
  let [a, b] = [0, 1];
  for (;;) {
    yield a;
    [a, b] = [b, a + b];
  }
}

/**
 * Take the first `n` values from any iterable. The `n <= 0` guard matters:
 * without it, an infinite source such as `fibonacci()` would never stop.
 */
export function take<T>(source: Iterable<T>, n: number): T[] {
  const out: T[] = [];
  if (n <= 0) return out;
  for (const value of source) {
    out.push(value);
    if (out.length === n) break;
  }
  return out;
}

/** Generators compose: `yield*` delegates to another iterable. */
export function* chain<T>(...sources: readonly Iterable<T>[]): Generator<T, void, unknown> {
  for (const source of sources) yield* source;
}

/** A generator can *receive* values back through `next(value)`. */
export function* accumulator(): Generator<number, string, number> {
  let total = 0;
  for (;;) {
    const delta: number = yield total;
    total += delta;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// §30/§31 A class that is itself iterable
// ─────────────────────────────────────────────────────────────────────────────

export class Playlist implements Iterable<string> {
  readonly #tracks: string[] = [];
  /** §30 — a symbol as an object key: collision-proof and hidden from JSON. */
  readonly #secret = Symbol("playlist");

  add(track: string): this {
    this.#tracks.push(track);
    return this;
  }

  get size(): number {
    return this.#tracks.length;
  }

  get key(): symbol {
    return this.#secret;
  }

  /** Implementing `[Symbol.iterator]` makes `for...of` and spread work. */
  [Symbol.iterator](): Iterator<string> {
    let index = 0;
    const tracks = this.#tracks;
    return {
      next(): IteratorResult<string> {
        return index < tracks.length
          ? { value: tracks[index++] as string, done: false }
          : { value: undefined, done: true };
      },
    };
  }

  /** §30 — well-known symbols customise built-in behaviour. */
  get [Symbol.toStringTag](): string {
    return "Playlist";
  }

  [Symbol.toPrimitive](hint: string): string | number {
    return hint === "number" ? this.#tracks.length : `${this.#tracks.length} tracks`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// §30 The global symbol registry vs. module-local symbols
// ─────────────────────────────────────────────────────────────────────────────

export const localSymbol = Symbol("cache");
/**
 * Both of these are the *same* symbol at runtime. They are annotated `symbol`
 * rather than left to infer, because `const s = Symbol.for(...)` infers a
 * `unique symbol` and TypeScript would then refuse to compare them (TS2367).
 */
export const registeredA: symbol = Symbol.for("app.cache");
export const registeredB: symbol = Symbol.for("app.cache");

export const symbolFacts = {
  sameDescriptionButDifferent: Symbol("x") !== Symbol("x"),
  registryIsShared: registeredA === registeredB,
  keyFor: Symbol.keyFor(registeredA), // "app.cache"
  keyForLocal: Symbol.keyFor(localSymbol), // undefined — never registered
};

/** A symbol-keyed method: reachable only from code that holds the symbol. */
export const resetToken: unique symbol = Symbol("resetToken");

export class Counter {
  #count = 0;

  increment(): number {
    return ++this.#count;
  }

  [resetToken](): void {
    this.#count = 0;
  }

  get count(): number {
    return this.#count;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// §31 Async iteration
// ─────────────────────────────────────────────────────────────────────────────

/** An async generator: `for await...of` consumes it. */
export async function* tickTimes(count: number, intervalMs = 1): AsyncGenerator<Date, void, unknown> {
  for (let i = 0; i < count; i++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    yield new Date();
  }
}

/** A class with `[Symbol.asyncIterator]`. */
export class Countdown implements AsyncIterable<number> {
  constructor(private readonly from: number) {}

  async *[Symbol.asyncIterator](): AsyncIterator<number> {
    for (let i = this.from; i > 0; i--) yield i;
  }
}

export async function collect<T>(source: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const value of source) out.push(value);
  return out;
}
