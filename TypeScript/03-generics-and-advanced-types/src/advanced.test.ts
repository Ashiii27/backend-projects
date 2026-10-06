import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  InMemoryRepository,
  asTuple,
  curry2,
  err,
  firstMatch,
  flatMap,
  identity,
  isOk,
  mapResult,
  newest,
  ok,
  parseJson,
  pluck,
  tryCatch,
  type HasId,
  type Result,
} from "./generics.js";
import { createArticle, userRouteParams } from "./utility-types.js";
import { NumberCell, NumberProducer, distance, sumDepth, widened, unitVector } from "./infer.js";
import { TypedEventBus, registerAll, type OrderEvents } from "./event-bus.js";

interface Row extends HasId {
  readonly name: string;
  readonly createdAt: Date;
}

const rows: Row[] = [
  { id: "a", name: "older", createdAt: new Date("2024-01-01") },
  { id: "b", name: "newer", createdAt: new Date("2025-06-01") },
];

describe("generics.ts — §16 generics, §36 Result union", () => {
  it("infers through generic functions", () => {
    assert.equal(identity(42), 42);
    assert.deepEqual(pluck(rows, "name"), ["older", "newer"]);
    assert.deepEqual(parseJson<number[]>("[1,2,3]"), [1, 2, 3]);
    assert.deepEqual(asTuple([1, "two"] as const), [1, "two"]);
    assert.equal(firstMatch([1, 2], 99), 1);
    assert.equal(firstMatch([] as number[], 99), 99); // NoInfer stops `99` widening T
    assert.equal(curry2((a: number, b: number) => a * b)(3)(4), 12);
  });

  it("applies constraints across two type parameters", () => {
    assert.equal(newest(rows)?.id, "b");
    assert.equal(newest([]), undefined);
  });

  it("behaves as a generic repository", () => {
    const repo = new InMemoryRepository<Row>(rows);
    assert.equal(repo.size, 2);
    assert.equal(repo.find("a")?.name, "older");
    repo.save({ id: "c", name: "third", createdAt: new Date() });
    assert.equal(repo.size, 3);
    assert.deepEqual(repo.project((r) => r.id), ["a", "b", "c"]);
    assert.ok(repo.remove("a"));
    assert.ok(!repo.remove("a"));
    assert.equal(repo.all().length, 2);
  });

  it("models failures as values", () => {
    const success: Result<number> = ok(4);
    const failure: Result<number> = err(new Error("nope"));
    assert.ok(isOk(success));
    assert.equal(mapResult(success, (n) => n * 2).ok, true); // narrowed by assert.ok
    assert.equal(isOk(failure), false);
    // `failure`'s static type is the whole union, so T cannot be inferred — the
    // type arguments are supplied explicitly (see the note on mapResult).
    assert.equal(mapResult<number, number, Error>(failure, (n) => n * 2), failure);
    assert.equal(mapResult(ok(4), (n) => n * 2).ok, true); // inferred from a single arm
    assert.equal(flatMap(ok(2), (n) => ok(n + 1)).ok, true);
    assert.equal(flatMap<number, number, Error>(failure, (n) => ok(n + 1)).ok, false);
  });

  it("converts thrown errors at the boundary", () => {
    const good = tryCatch(() => 1 + 1);
    assert.equal(isOk(good) && good.value, 2);
    const bad = tryCatch(() => JSON.parse("{oops}"));
    assert.equal(isOk(bad), false);
    if (!isOk(bad)) assert.match(bad.error.message, /JSON/);
  });
});

describe("utility-types.ts / infer.ts — §19-§24, §29, §38-§40", () => {
  it("derives values from derived types", () => {
    const article = createArticle({ title: "Hello", views: 5 }, "u1");
    assert.equal(article.title, "Hello");
    assert.equal(article.views, 5);
    assert.equal(article.publishedAt, null);
    assert.equal(article.authorId, "u1");
    assert.deepEqual(article.tags, []);
    assert.deepEqual(userRouteParams, { userId: "u1", postId: "p1" });
  });

  it("accepts structurally compatible objects", () => {
    const vector = { x: 3, y: 4, z: 0 };
    assert.equal(distance(vector), 5); // a fresh literal would be rejected
    assert.equal(widened.produce(), 42);
    assert.deepEqual(unitVector, { x: 0, y: 0, z: 1 });
  });

  it("keeps variance annotations honest", () => {
    const cell = new NumberCell();
    cell.set(7);
    assert.equal(cell.get(), 7);
    assert.equal(new NumberProducer(9).produce(), 9);
  });

  it("recurses over a tree", () => {
    assert.equal(sumDepth({ name: "leaf" }), 1);
    assert.equal(
      sumDepth({ name: "r", children: [{ name: "a" }, { name: "b", children: [{ name: "c" }] }] }),
      3,
    );
  });
});

describe("event-bus.ts — §16/§20/§30/§31 typed event bus", () => {
  it("delivers payloads to registered handlers", () => {
    const bus = new TypedEventBus<OrderEvents>();
    const seen: string[] = [];
    bus.on("order:created", ({ orderId }) => seen.push(`created:${orderId}`));
    bus.on("order:paid", () => seen.push("paid"));

    assert.equal(bus.emit("order:created", { orderId: "o1", total: 10 }), 1);
    assert.equal(bus.emit("order:paid", { orderId: "o1", paidAt: new Date() }), 1);
    assert.equal(bus.emit("order:cancelled", { orderId: "o1", reason: "x" }), 0);
    assert.deepEqual(seen, ["created:o1", "paid"]);
  });

  it("unsubscribes, counts and fires once", () => {
    const bus = new TypedEventBus<OrderEvents>();
    let calls = 0;
    const off = bus.on("order:paid", () => calls++);
    assert.equal(bus.listenerCount("order:paid"), 1);
    bus.emit("order:paid", { orderId: "o1", paidAt: new Date() });
    off();
    bus.emit("order:paid", { orderId: "o1", paidAt: new Date() });
    assert.equal(calls, 1);

    let onceCalls = 0;
    bus.once("order:cancelled", () => onceCalls++);
    bus.emit("order:cancelled", { orderId: "o2", reason: "a" });
    bus.emit("order:cancelled", { orderId: "o2", reason: "b" });
    assert.equal(onceCalls, 1);
  });

  it("registers a bag of handlers and iterates event names", () => {
    const bus = new TypedEventBus<OrderEvents>();
    const hits: string[] = [];
    const offAll = registerAll(bus, {
      "order:created": ({ total }) => hits.push(`total=${total}`),
      "order:paid": () => hits.push("paid"),
    });
    bus.emit("order:created", { orderId: "o3", total: 42 });
    offAll();
    bus.emit("order:paid", { orderId: "o3", paidAt: new Date() });

    assert.deepEqual(hits, ["total=42"]);
    assert.deepEqual([...bus].sort(), ["order:created", "order:paid"]);
    assert.equal(typeof bus.busId, "symbol");
  });
});
