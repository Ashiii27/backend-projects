/**
 * 03 · Generics & Advanced Types — generic functions, classes, constraints,
 * defaults, `const` type parameters and a reusable Result type.
 *
 * Guide sections covered: §16 Generics, §36 Discriminated Unions.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Generic functions
// ─────────────────────────────────────────────────────────────────────────────

/** The classic: identity keeps the exact type instead of collapsing to `unknown`. */
export function identity<T>(value: T): T {
  return value;
}

/** `keyof T` as a constraint keeps the key and the value types in sync. */
export function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

/** A type parameter *default* — callers may omit it. */
export function parseJson<T = unknown>(text: string): T {
  return JSON.parse(text) as T;
}

/** §16 — `const` type parameters (TS 5.0) preserve literal types at call sites. */
export function asTuple<const T extends readonly unknown[]>(values: T): T {
  return values;
}

/** `NoInfer` (TS 5.4) stops one argument from driving inference. */
export function firstMatch<T>(candidates: readonly T[], fallback: NoInfer<T>): T {
  return candidates[0] ?? fallback;
}

/** Variadic tuple types: the parameter list itself is generic. */
export function curry2<A, B, R>(fn: (a: A, b: B) => R): (a: A) => (b: B) => R {
  return (a) => (b) => fn(a, b);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Generic constraints against a shape
// ─────────────────────────────────────────────────────────────────────────────

export interface HasId {
  readonly id: string;
}

export interface HasTimestamp {
  readonly createdAt: Date;
}

/** `T extends HasId & HasTimestamp` — T must satisfy *both*. */
export function newest<T extends HasId & HasTimestamp>(rows: readonly T[]): T | undefined {
  return rows.reduce<T | undefined>(
    (best, row) => (best === undefined || row.createdAt > best.createdAt ? row : best),
    undefined,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. A generic in-memory repository (class + interface, both generic)
// ─────────────────────────────────────────────────────────────────────────────

export interface Repository<T extends HasId> {
  find(id: string): T | undefined;
  all(): readonly T[];
  save(entity: T): T;
  remove(id: string): boolean;
}

export class InMemoryRepository<T extends HasId> implements Repository<T> {
  readonly #rows = new Map<string, T>();

  /** Constructor generic default: an optional seed list. */
  constructor(seed: readonly T[] = []) {
    for (const row of seed) this.#rows.set(row.id, row);
  }

  find(id: string): T | undefined {
    return this.#rows.get(id);
  }

  all(): readonly T[] {
    return [...this.#rows.values()];
  }

  save(entity: T): T {
    this.#rows.set(entity.id, entity);
    return entity;
  }

  remove(id: string): boolean {
    return this.#rows.delete(id);
  }

  get size(): number {
    return this.#rows.size;
  }

  /** A generic *method*: its own type parameter, independent of the class's. */
  project<U>(mapper: (entity: T) => U): U[] {
    return this.all().map(mapper);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Result<T, E> — errors as values, typed as a discriminated union (§36)
// ─────────────────────────────────────────────────────────────────────────────

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

export type Result<T, E = Error> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

/** Type guard so `result.value` only exists after narrowing. */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

/**
 * `map` keeps the error type and transforms only the success type.
 *
 * Inference caveat worth knowing: `T` is inferred from a value whose static type
 * is a *single* arm (`Ok<number>`), but not from one whose static type is the
 * whole union (`Result<number>`). TypeScript cannot pick which arm of
 * `Ok<T> | Err<E>` to read `T` out of. Either narrow first with `isOk(...)`, or
 * pass the type arguments explicitly:
 *
 *     mapResult(ok(4), (n) => n * 2);                    // T inferred
 *     mapResult<number, number, Error>(maybe, (n) => n); // T supplied
 */
export function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

/** Turns a throwing function into a Result — the boundary between the two styles. */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/** Chaining: the callback returns a Result too, so failures short-circuit.
 *  Same inference caveat as `mapResult` above. */
export function flatMap<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}
