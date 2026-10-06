/**
 * 01 · Type Foundations — interfaces, objects and functions, built around a
 * tiny geometry domain.
 *
 * Guide sections covered: §5 Interfaces, §11 Functions, §12 Objects,
 * §36 Discriminated Unions, §37 Overloading (intro).
 */

// ─────────────────────────────────────────────────────────────────────────────
// §5 Interfaces — basic, optional, readonly
// ─────────────────────────────────────────────────────────────────────────────

export interface Shape {
  readonly id: string; // cannot be reassigned after creation
  name: string;
  /** Optional property — may simply be absent (§5). */
  color?: string;
}

/**
 * With `exactOptionalPropertyTypes: true` (tsconfig.base.json) there is a real
 * difference between "missing" and "present but undefined":
 *
 *   const a: Shape = { id: "1", name: "box" };                  // ok
 *   const b: Shape = { id: "2", name: "box", color: undefined } // ERROR
 *
 * To allow an explicit `undefined` you would write `color?: string | undefined`.
 */

// ── Extending interfaces (single and multiple inheritance) ───────────────────

interface Measurable {
  /** Square units. */
  area(): number;
  /** Linear units. */
  perimeter(): number;
}

interface Printable {
  describe(): string;
}

export interface Polygon extends Shape, Measurable, Printable {
  readonly sides: number;
}

// ── Interface describing a function (call signature) ─────────────────────────

/**
 * An interface with a *call signature* — the object is itself callable, and can
 * also carry extra properties. Handy for "function + metadata" pairs.
 */
export interface AreaCalculator {
  (shape: GeometricShape): number;
  unit: string;
}

export const naiveArea: AreaCalculator = Object.assign(
  (shape: GeometricShape) => area(shape),
  { unit: "sq units" },
);

// ── Interface with an index signature (indexable types) ──────────────────────

export interface ShapeRegistry {
  [id: string]: Polygon | undefined; // `| undefined` keeps lookups honest
}

// ── Declaration merging: two interfaces with the same name are merged (§5) ───

export interface ShapeMeta {
  author: string;
}
export interface ShapeMeta {
  revision: number;
}

export const shapeMeta: ShapeMeta = { author: "Ada", revision: 3 };

// ─────────────────────────────────────────────────────────────────────────────
// §36 Discriminated unions — one literal "tag" field per member
// ─────────────────────────────────────────────────────────────────────────────

export interface Circle extends Shape {
  kind: "circle";
  radius: number;
}

export interface Rectangle extends Shape {
  kind: "rectangle";
  width: number;
  height: number;
}

export interface Triangle extends Shape {
  kind: "triangle";
  base: number;
  height: number;
}

export type GeometricShape = Circle | Rectangle | Triangle;

/**
 * The union member is narrowed by a single `switch` on the tag. TypeScript then
 * knows exactly which properties exist in each branch, and `assertNever` proves
 * at compile time that every case is handled.
 */
export function area(shape: GeometricShape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      return assertNever(shape);
  }
}

export function perimeter(shape: GeometricShape): number {
  switch (shape.kind) {
    case "circle":
      return 2 * Math.PI * shape.radius;
    case "rectangle":
      return 2 * (shape.width + shape.height);
    case "triangle":
      return shape.base + 2 * Math.hypot(shape.base / 2, shape.height);
    default:
      return assertNever(shape);
  }
}

/** If a new member is added to the union above, this call stops compiling. */
function assertNever(value: never): never {
  throw new Error(`Unhandled shape: ${JSON.stringify(value)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// §11 Functions — optional, default, rest, overload, never/void returns
// ─────────────────────────────────────────────────────────────────────────────

export function formatShape(shape: GeometricShape, decimals = 2): string {
  return `${shape.name}: ${area(shape).toFixed(decimals)} sq units`;
}

export function joinNames(...shapes: readonly GeometricShape[]): string {
  return shapes.map((s) => s.name).join(", ");
}

export function pickShapes(
  shapes: readonly GeometricShape[],
  options?: { kind?: GeometricShape["kind"]; minArea?: number },
): GeometricShape[] {
  return shapes.filter((s) => {
    if (options?.kind !== undefined && s.kind !== options.kind) return false;
    if (options?.minArea !== undefined && area(s) < options.minArea) return false;
    return true;
  });
}

// Overload signatures: two precise shapes instead of one loose union (§37).
export function scale(shape: Circle, factor: number): Circle;
export function scale(shape: Rectangle, factor: number): Rectangle;
export function scale(shape: Circle | Rectangle, factor: number): Circle | Rectangle {
  return shape.kind === "circle"
    ? { ...shape, radius: shape.radius * factor }
    : { ...shape, width: shape.width * factor, height: shape.height * factor };
}

// ─────────────────────────────────────────────────────────────────────────────
// §12 Objects — readonly views and record types
// ─────────────────────────────────────────────────────────────────────────────

export const UNIT_CIRCLE: Readonly<Circle> = Object.freeze({
  id: "unit",
  name: "unit circle",
  kind: "circle",
  radius: 1,
});

export type ShapeSummary = Record<"id" | "name" | "area", string | number>;

export function summarise(shape: GeometricShape): ShapeSummary {
  return { id: shape.id, name: shape.name, area: Number(area(shape).toFixed(4)) };
}

/** Index access on a union: `GeometricShape["kind"]` is the union of all tags. */
export const ALL_KINDS: readonly GeometricShape["kind"][] = ["circle", "rectangle", "triangle"];
