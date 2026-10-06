/**
 * 01 · Type Foundations — primitives, annotations, inference, unions,
 * literal types, enums, arrays and tuples.
 *
 * Guide sections covered: §3 Basic Types, §4 Annotations & Inference,
 * §6 Type Aliases, §7 Union & Intersection, §8 Literal Types, §9 Enums,
 * §10 Arrays & Tuples.
 */

// ─────────────────────────────────────────────────────────────────────────────
// §3 Basic / primitive types
// ─────────────────────────────────────────────────────────────────────────────

export const primitiveSamples = {
  string: "Ada",
  number: 36,
  float: 19.99,
  hex: 0xf00d,
  binary: 0b1010,
  octal: 0o744,
  boolean: true,
  bigInt: 9_007_199_254_740_993n, // `bigint` survives past Number.MAX_SAFE_INTEGER
  nothing: null,
  notDefined: undefined,
} as const;

// `symbol` — unique at runtime even with the same description (§30)
export const idKey: unique symbol = Symbol("id");

/**
 * §3 Special types, side by side so the difference is obvious:
 * - `any`     → type checking is switched off for this value
 * - `unknown` → safe; you must narrow before using it
 * - `never`   → a value that can never exist (throws / infinite loops)
 * - `void`    → the function has no meaningful return value
 */
export function describeUnknown(value: unknown): string {
  // `value.toFixed()` here would be an error — that is the point of `unknown`.
  if (typeof value === "number") return `number:${value}`;
  if (typeof value === "string") return `string:${value}`;
  return `other:${typeof value}`;
}

export function fail(message: string): never {
  throw new Error(message);
}

export function logOnly(message: string): void {
  console.log(message);
}

// ─────────────────────────────────────────────────────────────────────────────
// §4 Annotations vs. inference
// ─────────────────────────────────────────────────────────────────────────────

// Inference does the job when the value is on the same line...
const inferredCity = "Lovelace"; // string
const inferredCount = 42; // number

// ...but an annotation is required when the value arrives later, or when you
// want a type *wider* than the first value you happen to assign.
let delayedValue: number;
delayedValue = 100;

let idOrName: string | number;
idOrName = 101;
idOrName = "user-101";

// `as const` widens nothing: the array below is a readonly tuple of literals,
// not `string[]`.
export const SUPPORTED_LOCALES = ["en-GB", "en-US", "de-DE"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number]; // "en-GB" | "en-US" | "de-DE"

export { inferredCity, inferredCount, delayedValue, idOrName };

// ─────────────────────────────────────────────────────────────────────────────
// §6 Type aliases — a *name* for a type (not a new type at runtime)
// ─────────────────────────────────────────────────────────────────────────────

export type Meters = number;
export type Kilograms = number;
export type Identifier = string | number; // unions inside aliases (§7)
export type Formatter = (value: number) => string;

// "Branded" alias: structurally this is still a number, but the brand stops you
// from passing a plain number where a Meters is expected. A pragmatic fix for
// TypeScript's structural typing (§29).
declare const brand: unique symbol;
export type Branded<T, B extends string> = T & { readonly [brand]: B };
export type SafeMeters = Branded<number, "meters">;

export function asMeters(value: number): SafeMeters {
  return value as SafeMeters;
}

export function doubleDistance(m: SafeMeters): SafeMeters {
  return asMeters(m * 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// §7 Union & intersection types
// ─────────────────────────────────────────────────────────────────────────────

export type LengthUnit = "m" | "cm" | "mm"; // union of literals
export type MassUnit = "kg" | "g";
export type AnyUnit = LengthUnit | MassUnit; // union of unions

interface Timestamped {
  createdAt: Date;
}
interface Owned {
  ownerId: string;
}
/** Intersection: must satisfy *both* shapes. */
export type AuditRecord = Timestamped & Owned & { action: string };

export function makeAuditRecord(ownerId: string, action: string): AuditRecord {
  return { createdAt: new Date(), ownerId, action };
}

// ─────────────────────────────────────────────────────────────────────────────
// §8 Literal types
// ─────────────────────────────────────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type Toggle = true; // even booleans can be narrowed to one literal

export function isSafeMethod(method: HttpMethod): boolean {
  return method === "GET";
}

// ─────────────────────────────────────────────────────────────────────────────
// §9 Enums (and why an `as const` object is often the better choice)
// ─────────────────────────────────────────────────────────────────────────────

export enum Priority {
  Low = "LOW",
  Medium = "MEDIUM",
  High = "HIGH",
}

export const Direction = { Up: "UP", Down: "DOWN" } as const;
export type DirectionValue = (typeof Direction)[keyof typeof Direction];

// NOTE: `const enum` would be inlined to zero runtime cost (§43), but it is
// rejected under `isolatedModules: true` (which every bundler wants), so this
// repo uses string enums + `as const` objects instead.

// ─────────────────────────────────────────────────────────────────────────────
// §10 Arrays & tuples
// ─────────────────────────────────────────────────────────────────────────────

export type Point2D = [x: number, y: number]; // labelled tuple
export type Point3D = [x: number, y: number, z: number];
export type Pair = [first: string, second: string];
export type RgbTriplet = [r: number, g: number, b: number];
export type WithRest = [id: string, ...tags: string[]]; // rest element in a tuple

export function midpoint(a: Point2D, b: Point2D): Point2D {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export function toTriple(point: Point2D, z = 0): Point3D {
  return [point[0], point[1], z];
}

/** Tuple → object, using a const-asserted key list so the shape is derived. */
const COORD_KEYS = ["x", "y", "z"] as const;

export function pointFromTriple(triple: Point3D): Record<(typeof COORD_KEYS)[number], number> {
  return { x: triple[0], y: triple[1], z: triple[2] };
}

export const coordKeys: readonly ["x", "y", "z"] = COORD_KEYS;

/**
 * `noUncheckedIndexedAccess: true` (see tsconfig.base.json) means `list[i]`
 * is `T | undefined` — you have to prove it exists before using it.
 */
export function firstOr(list: readonly string[], fallback: string): string {
  const head = list[0];
  return head === undefined ? fallback : head;
}
