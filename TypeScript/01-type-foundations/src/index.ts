/**
 * Project 01 — Type Foundations.
 * Run with:  npm run start:01
 * Test with: npm test
 */
import {
  Direction,
  Priority,
  SUPPORTED_LOCALES,
  asMeters,
  describeUnknown,
  doubleDistance,
  firstOr,
  midpoint,
  pointFromTriple,
  primitiveSamples,
  toTriple,
} from "./types.js";
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

const shapes: GeometricShape[] = [
  { id: "c1", name: "coin", kind: "circle", radius: 2 },
  { id: "r1", name: "tile", kind: "rectangle", width: 3, height: 4 },
  { id: "t1", name: "roof", kind: "triangle", base: 6, height: 4 },
];

console.log("── 01 · Type Foundations ────────────────────────────");
console.log("primitives        ", primitiveSamples.string, primitiveSamples.bigInt, primitiveSamples.hex);
console.log("locales (as const)", SUPPORTED_LOCALES.join(" | "));
console.log("enum + const obj  ", Priority.High, Direction.Up);
console.log("unknown narrowing ", describeUnknown(42), describeUnknown("x"), describeUnknown(true));
console.log("branded meters    ", doubleDistance(asMeters(21)));
console.log("tuples            ", midpoint([0, 0], [4, 6]), toTriple([1, 2]), pointFromTriple([1, 2, 3]));
console.log("index safety      ", firstOr([], "none"));

console.log("\nshapes:");
for (const shape of shapes) {
  console.log(
    `  ${formatShape(shape)}  (perimeter ${perimeter(shape).toFixed(2)}, ${naiveArea.unit}: ${naiveArea(shape).toFixed(2)})`,
  );
}
console.log("scaled circle     ", scale(UNIT_CIRCLE, 2).radius);
console.log("rectangles > 6    ", joinNames(...pickShapes(shapes, { kind: "rectangle", minArea: 6 })));
console.log("summary           ", summarise(UNIT_CIRCLE), "raw area:", area(UNIT_CIRCLE).toFixed(4));
console.log("known kinds       ", ALL_KINDS.join(", "));
console.log("merged interface  ", shapeMeta.author, "r" + shapeMeta.revision);
