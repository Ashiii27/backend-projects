/**
 * 03 · Generics & Advanced Types — `infer`, recursive types, structural typing
 * and variance annotations.
 *
 * Guide sections covered: §29 Type Compatibility & Structural Typing,
 * §38 The `infer` keyword, §39 Recursive Types, §40 Variance Annotations.
 */

// ─────────────────────────────────────────────────────────────────────────────
// §38 `infer` — declaring a type variable inside a conditional type
// ─────────────────────────────────────────────────────────────────────────────

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
export type DeepUnwrapPromise<T> = T extends Promise<infer U> ? DeepUnwrapPromise<U> : T;

export type ElementOf<T> = T extends readonly (infer U)[] ? U : never;
export type FirstArg<F> = F extends (first: infer A, ...rest: never[]) => unknown ? A : never;
export type ReturnOf<F> = F extends (...args: never[]) => infer R ? R : never;
export type ConstructorArgs<C> = C extends new (...args: infer A) => unknown ? A : never;

/** Split a string on a delimiter, recursively. */
export type Split<S extends string, D extends string> = S extends `${infer Head}${D}${infer Tail}`
  ? [Head, ...Split<Tail, D>]
  : [S];

/** The return type of an async function, with the Promise peeled off. */
async function loadUser(): Promise<{ id: string; name: string }> {
  return { id: "u1", name: "Ada" };
}
type LoadedUser = UnwrapPromise<ReturnType<typeof loadUser>>;
export const loadedUserCheck: LoadedUser = { id: "u1", name: "Ada" };

export type SplitDot = Split<"a.b.c", ".">; // ["a", "b", "c"]

// ─────────────────────────────────────────────────────────────────────────────
// §39 Recursive types
// ─────────────────────────────────────────────────────────────────────────────

/** The canonical recursive type: any JSON value. */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

/** Flatten arbitrarily nested arrays down to their element type. */
export type DeepFlatten<T> = T extends readonly (infer U)[] ? DeepFlatten<U> : T;

/** A recursive *interface* — a file tree. */
export interface TreeNode {
  readonly name: string;
  readonly children?: readonly TreeNode[];
}

export function sumDepth(node: TreeNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(sumDepth));
}

/** Recursive conditional type: turn a tuple into a union of its elements. */
export type TupleToUnion<T extends readonly unknown[]> = T extends readonly [
  infer Head,
  ...infer Tail,
]
  ? Head | TupleToUnion<Tail>
  : never;

/** Recursive mapped type: make an object's nested keys camelCase-typed. */
export type DeepKeys<T> = T extends object
  ? {
      [K in keyof T]: K extends string ? `${K}.${DeepKeys<T[K]> & string}` | K : K;
    }[keyof T]
  : never;

// ─────────────────────────────────────────────────────────────────────────────
// §29 Structural typing — compatibility is about *shape*, not name
// ─────────────────────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}
interface Vector {
  x: number;
  y: number;
  z: number;
}

/**
 * A `Vector` is structurally assignable to `Point`: it has everything `Point`
 * needs, and the extra `z` is simply ignored.
 */
export function distance(p: Point): number {
  return Math.hypot(p.x, p.y);
}

/**
 * ...but a *fresh object literal* additionally goes through excess property
 * checking, which rejects unknown keys. This is the single most confusing rule
 * in structural typing, so both halves are shown side by side.
 */
// @ts-expect-error 'z' does not exist in type 'Point' — fresh literals are checked
export const rejected: number = distance({ x: 3, y: 4, z: 0 });

/** Route the same object through a variable and it is perfectly fine. */
const vector: Vector = { x: 3, y: 4, z: 0 };
export const throughVariable: number = distance(vector);

/** Spreading also drops the "fresh literal" status. */
export const throughSpread: number = distance({ ...vector });

/** `satisfies` keeps the narrow type while proving it matches `Vector`. */
export const unitVector = { x: 0, y: 0, z: 1 } satisfies Vector;

// ─────────────────────────────────────────────────────────────────────────────
// §40 Variance annotations (`in` / `out`) — TS 4.7+
// ─────────────────────────────────────────────────────────────────────────────

/** `out` — T only ever appears in output position (covariant). */
export interface Producer<out T> {
  produce(): T;
}

/** `in` — T only ever appears in input position (contravariant). */
export interface Consumer<in T> {
  consume(value: T): void;
}

/** `in out` — T appears on both sides (invariant). */
export interface Cell<in out T> {
  get(): T;
  set(value: T): void;
}

export class NumberProducer implements Producer<number> {
  constructor(private readonly value: number) {}
  produce(): number {
    return this.value;
  }
}

export class AnyProducer implements Producer<unknown> {
  produce(): unknown {
    return null;
  }
}

export class NumberCell implements Cell<number> {
  #value = 0;
  get(): number {
    return this.#value;
  }
  set(value: number): void {
    this.#value = value;
  }
}

/** Covariance: a `Producer<number>` is usable where a `Producer<unknown>` is. */
export const widened: Producer<unknown> = new NumberProducer(42);
/** ...but a `Cell<number>` is NOT a `Cell<unknown>` — it is invariant. */
export const invariant: Cell<number> = new NumberCell();

export type _InferChecks = [
  DeepUnwrapPromise<Promise<Promise<string>>>,
  ElementOf<readonly number[]>,
  FirstArg<(a: string, b: number) => void>,
  ReturnOf<() => boolean>,
  ConstructorArgs<typeof NumberProducer>,
  SplitDot,
  DeepFlatten<number[][][]>,
  TupleToUnion<[1, "two", true]>,
  DeepKeys<{ a: { b: string } }>,
];
