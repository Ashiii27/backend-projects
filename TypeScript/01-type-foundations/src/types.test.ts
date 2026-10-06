import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  Direction,
  Priority,
  SUPPORTED_LOCALES,
  asMeters,
  describeUnknown,
  doubleDistance,
  fail,
  firstOr,
  logOnly,
  midpoint,
  pointFromTriple,
  primitiveSamples,
  toTriple,
} from "./types.js";
import {
  assertDefined,
  explainError,
  isString,
  isStringArray,
  label,
  parseUser,
  routes,
  sideLength,
  shout,
  ValidationError,
  type RouteName,
} from "./narrowing.js";
import {
  UNIT_CIRCLE,
  ALL_KINDS,
  area,
  formatShape,
  joinNames,
  naiveArea,
  perimeter,
  pickShapes,
  scale,
  shapeMeta,
  summarise,
  type GeometricShape,
} from "./shapes.js";

describe("types.ts — §3 basic types, §4 inference, §6 aliases, §8 literals, §9 enums, §10 tuples", () => {
  it("keeps bigint precision past Number.MAX_SAFE_INTEGER", () => {
    assert.equal(primitiveSamples.bigInt + 1n, 9_007_199_254_740_994n);
    assert.equal(primitiveSamples.hex, 61453);
    assert.equal(primitiveSamples.binary, 10);
  });

  it("narrows unknown with typeof guards", () => {
    assert.equal(describeUnknown(42), "number:42");
    assert.equal(describeUnknown("x"), "string:x");
    assert.equal(describeUnknown(true), "other:boolean");
  });

  it("treats enums and `as const` objects alike at runtime", () => {
    assert.equal(Priority.High, "HIGH");
    assert.equal(Direction.Down, "DOWN");
    assert.deepEqual([...SUPPORTED_LOCALES], ["en-GB", "en-US", "de-DE"]);
  });

  it("computes tuple helpers", () => {
    assert.deepEqual(midpoint([0, 0], [4, 6]), [2, 3]);
    assert.deepEqual(toTriple([1, 2]), [1, 2, 0]);
    assert.deepEqual(toTriple([1, 2], 7), [1, 2, 7]);
    assert.deepEqual(pointFromTriple([1, 2, 3]), { x: 1, y: 2, z: 3 });
  });

  it("brands numbers so a plain number is not a distance", () => {
    const meters = asMeters(21);
    assert.equal(doubleDistance(meters), 42);
  });

  it("survives noUncheckedIndexedAccess via firstOr", () => {
    assert.equal(firstOr([], "none"), "none");
    assert.equal(firstOr(["a"], "none"), "a");
  });

  it("throws from a `never`-returning function", () => {
    assert.throws(() => fail("boom"), /boom/);
    assert.equal(logOnly("quiet"), undefined);
  });
});

describe("narrowing.ts — §17 assertions, §18 type guards, §41 satisfies", () => {
  it("writes and reads type predicates", () => {
    assert.ok(isString("yes"));
    assert.ok(!isString(1));
    assert.ok(isStringArray(["a", "b"]));
    assert.ok(!isStringArray(["a", 2]));
  });

  it("specialises errors with instanceof", () => {
    assert.equal(explainError(new ValidationError("id", "missing")), 'field "id": missing');
    assert.equal(explainError(new Error("plain")), "plain");
    assert.equal(explainError("oops"), "oops");
  });

  it("narrows with `in`, truthiness and equality", () => {
    assert.equal(sideLength({ radius: 3 }), 3);
    assert.equal(sideLength({ side: 4 }), 4);
    assert.equal(shout(null), "(silence)");
    assert.equal(shout(undefined), "(silence)");
    assert.equal(shout("hi"), "HI");
    assert.equal(label(""), "empty");
    assert.equal(label(0), "zero");
    assert.equal(label("x"), "value");
  });

  it("asserts presence at runtime and compile time", () => {
    const value: string | undefined = "here";
    assertDefined(value, "value");
    assert.equal(value.length, 4); // narrowed to `string` by the assertion
    assert.throws(() => assertDefined(undefined, "x"), ValidationError);
    assert.throws(() => assertDefined(null, "x"), ValidationError);
  });

  it("parses unknown JSON into a typed DTO", () => {
    assert.deepEqual(parseUser({ id: 1, name: "Ada", role: "admin", email: "ada@example.com" }), {
      id: 1,
      name: "Ada",
      role: "admin",
      email: "ada@example.com",
    });
    assert.equal(parseUser({ id: 2, name: "Bob", role: "member" }).email, undefined);
    assert.throws(() => parseUser({ id: "1", name: "Ada", role: "admin" }), /expected a number/);
    assert.throws(() => parseUser({ id: 1, name: 7, role: "admin" }), /expected a string/);
    assert.throws(() => parseUser({ id: 1, name: "Ada", role: "root" }), /admin.*member/);
    assert.throws(() => parseUser("nope"), /expected an object/);
  });

  it("keeps narrow literal types with `satisfies`", () => {
    const name: RouteName = "home";
    assert.equal(routes[name].path, "/");
    assert.equal(routes[name].methods[0], "GET");
    assert.equal(routes.create.auth, true);
    assert.deepEqual(Object.keys(routes), ["home", "create"]);
  });
});

describe("shapes.ts — §5 interfaces, §11 functions, §12 objects, §36 unions, §37 overloads", () => {
  const circle: GeometricShape = { id: "c", name: "coin", kind: "circle", radius: 2 };
  const rect: GeometricShape = { id: "r", name: "tile", kind: "rectangle", width: 3, height: 4 };
  const tri: GeometricShape = { id: "t", name: "roof", kind: "triangle", base: 6, height: 4 };

  it("computes areas through a discriminated union", () => {
    assert.equal(area(circle), Math.PI * 4);
    assert.equal(area(rect), 12);
    assert.equal(area(tri), 12);
  });

  it("computes perimeters", () => {
    assert.equal(perimeter(rect), 14);
    assert.equal(perimeter(circle), 4 * Math.PI);
  });

  it("formats, filters and joins", () => {
    assert.equal(formatShape(rect, 1), "tile: 12.0 sq units");
    // circle area = pi * 2^2 ≈ 12.57, so it clears a 12-unit threshold too.
    assert.deepEqual(pickShapes([circle, rect, tri], { minArea: 12 }).map((s) => s.id), [
      "c",
      "r",
      "t",
    ]);
    assert.deepEqual(pickShapes([circle, rect, tri], { minArea: 12.5 }).map((s) => s.id), ["c"]);
    assert.deepEqual(pickShapes([circle, rect, tri], { minArea: 13 }).map((s) => s.id), []);
    assert.deepEqual(pickShapes([circle, rect, tri], { kind: "circle" }).map((s) => s.id), ["c"]);
    assert.equal(joinNames(circle, rect), "coin, tile");
  });

  it("keeps overload return types precise", () => {
    const bigger = scale({ id: "c", name: "coin", kind: "circle", radius: 2 }, 3);
    assert.equal(bigger.radius, 6);
    const wider = scale({ id: "r", name: "tile", kind: "rectangle", width: 1, height: 2 }, 2);
    assert.deepEqual([wider.width, wider.height], [2, 4]);
  });

  it("exposes readonly objects, call signatures and merged interfaces", () => {
    assert.equal(UNIT_CIRCLE.radius, 1);
    assert.equal(naiveArea(rect), 12);
    assert.equal(naiveArea.unit, "sq units");
    assert.equal(shapeMeta.author, "Ada");
    assert.equal(shapeMeta.revision, 3);
    assert.deepEqual(summarise(rect), { id: "r", name: "tile", area: 12 });
    assert.deepEqual([...ALL_KINDS], ["circle", "rectangle", "triangle"]);
  });
});
