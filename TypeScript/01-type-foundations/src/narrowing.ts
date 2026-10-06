/**
 * 01 · Type Foundations — narrowing `unknown` input down to real types.
 *
 * Guide sections covered: §17 Type Assertions, §18 Type Guards & Narrowing,
 * §41 The `satisfies` operator.
 */

// ─────────────────────────────────────────────────────────────────────────────
// A realistic problem: data crossing a boundary (JSON, an HTTP body, a file)
// is `unknown`. Every technique below is one way to make it usable again.
// ─────────────────────────────────────────────────────────────────────────────

export interface UserDto {
  id: number;
  name: string;
  role: "admin" | "member";
  email?: string;
}

/** §18 — `typeof` guard for primitives. */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/** §18 — `Array.isArray` narrows to `any[]`, so a type predicate is nicer. */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/** §18 — `instanceof` guard for classes. */
export class ValidationError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export function explainError(error: unknown): string {
  // `useUnknownInCatchVariables` (part of strict) makes caught errors `unknown`,
  // so `instanceof` is the idiomatic way to specialise on them.
  if (error instanceof ValidationError) return `field "${error.field}": ${error.message}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

/** §18 — `in` operator narrows by property presence. */
type Circleish = { radius: number };
type Squareish = { side: number };

export function sideLength(shape: Circleish | Squareish): number {
  return "radius" in shape ? shape.radius : shape.side;
}

/** §18 — truthiness narrowing removes `null | undefined | "" | 0`. */
export function shout(value: string | null | undefined): string {
  if (!value) return "(silence)";
  return value.toUpperCase(); // value is `string` here
}

/** §18 — equality narrowing works for literals too. */
export function label(value: string | number): "empty" | "zero" | "value" {
  if (value === "") return "empty";
  if (value === 0) return "zero";
  return "value";
}

/**
 * §18 — an assertion function. Callers get a *compile-time* guarantee after the
 * call, and a runtime throw if the guarantee does not hold.
 */
export function assertDefined<T>(value: T | undefined | null, field: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new ValidationError(field, "value is required");
  }
}

/** A hand-written parser: `unknown` in, `UserDto` out, errors collected. */
export function parseUser(input: unknown): UserDto {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("user", "expected an object");
  }
  // `in` + property checks; `record` is narrowed to a concrete object shape.
  const record = input as Record<string, unknown>;

  if (typeof record.id !== "number") throw new ValidationError("id", "expected a number");
  if (!isString(record.name)) throw new ValidationError("name", "expected a string");
  if (record.role !== "admin" && record.role !== "member") {
    throw new ValidationError("role", 'expected "admin" or "member"');
  }

  const user: UserDto = { id: record.id, name: record.name, role: record.role };
  // `exactOptionalPropertyTypes` — only set the key when there is a value.
  if (isString(record.email)) user.email = record.email;
  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// §41 `satisfies` — validate against a type WITHOUT widening the value.
// ─────────────────────────────────────────────────────────────────────────────

type RouteConfig = {
  path: string;
  auth: boolean;
  methods: readonly ("GET" | "POST" | "DELETE")[];
};

/**
 * Annotating `const routes: Record<string, RouteConfig>` would erase the exact
 * paths and methods. `satisfies` checks the shape and keeps the narrow types,
 * so `routes.home.methods` is still `readonly ["GET"]`.
 */
export const routes = {
  home: { path: "/", auth: false, methods: ["GET"] },
  create: { path: "/users", auth: true, methods: ["POST"] },
} as const satisfies Record<string, RouteConfig>;

export type RouteName = keyof typeof routes; // "home" | "create"

/** §17 — assertions (`as`) tell the compiler what you already know. */
export function firstMethod(route: RouteName): string {
  const methods = routes[route].methods;
  return (methods[0] ?? "GET") as string;
}
