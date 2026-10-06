/**
 * Project 03 — Generics & Advanced Types.
 * Run with:  npm run start:03
 */
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
} from "./generics.js";
import {
  ARTICLE_KEYS,
  createArticle,
  distributed,
  goodLength,
  notDistributed,
  userRouteParams,
} from "./utility-types.js";
import { NumberCell, NumberProducer, distance, sumDepth, widened, type JSONValue } from "./infer.js";
import { TypedEventBus, registerAll, type OrderEvents } from "./event-bus.js";

interface Row extends HasId {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
}

console.log("── 03 · Generics & Advanced Types ───────────────────");

console.log("identity        ", identity(42), identity("keeps its type"));
console.log("pluck           ", pluck([{ id: "a", n: 1 }, { id: "b", n: 2 }], "id").join(","));
console.log("parseJson<T>    ", parseJson<{ ok: boolean }>('{"ok":true}').ok);
console.log("const type param", asTuple([1, "two", true] as const));
console.log("firstMatch      ", firstMatch([1, 2, 3], 0));
console.log("curry2          ", curry2((a: number, b: number) => a + b)(2)(3));

const rows: Row[] = [
  { id: "a", name: "older", createdAt: new Date("2024-01-01") },
  { id: "b", name: "newer", createdAt: new Date("2025-06-01") },
];
console.log("newest          ", newest(rows)?.name);

const repo = new InMemoryRepository<Row>(rows);
repo.save({ id: "c", name: "third", createdAt: new Date() });
console.log("repository      ", repo.size, "rows |", repo.project((r) => r.name).join(", "));

const parsed = tryCatch(() => JSON.parse("{not json}") as unknown);
console.log("tryCatch        ", isOk(parsed) ? "ok" : `error: ${parsed.error.message.slice(0, 28)}`);
const chained = flatMap(ok(4), (n) => (n > 0 ? ok(n * 10) : err(new Error("negative"))));
// `chained` is a union-typed value, so the type arguments are supplied by hand.
console.log("result chain    ", JSON.stringify(mapResult<number, string, Error>(chained, (n) => `${n}!`)));

console.log("mapped/cond     ", goodLength, "| distributed:", distributed, "| non-distributed:", notDistributed);
console.log("template literal", JSON.stringify(userRouteParams));
console.log("article keys    ", ARTICLE_KEYS.join(","));
console.log("createArticle   ", createArticle({ title: "Hello" }, "u1").title);

const vector = { x: 3, y: 4, z: 0 };
console.log("structural      ", distance(vector), "| widened producer:", widened.produce());
const cell = new NumberCell();
cell.set(7);
console.log("variance        ", `Cell<number> holds ${cell.get()}, Producer<number> → ${new NumberProducer(5).produce()}`);

const tree: JSONValue = { name: "root", children: [{ name: "leaf" }] };
console.log("recursive json  ", JSON.stringify(tree), "| depth:", sumDepth({ name: "r", children: [{ name: "a" }, { name: "b", children: [{ name: "c" }] }] }));

const bus = new TypedEventBus<OrderEvents>();
registerAll(bus, {
  "order:created": ({ orderId, total }) => console.log("event           ", `created ${orderId} for ${total}`),
  "order:paid": ({ orderId }) => console.log("event           ", `paid ${orderId}`),
});
bus.once("order:cancelled", ({ reason }) => console.log("event           ", `cancelled: ${reason}`));
bus.emit("order:created", { orderId: "o1", total: 99 });
bus.emit("order:paid", { orderId: "o1", paidAt: new Date() });
bus.emit("order:cancelled", { orderId: "o1", reason: "changed mind" });
bus.emit("order:cancelled", { orderId: "o1", reason: "again" }); // once() already unsubscribed
console.log("bus events      ", [...bus].join(", "));
