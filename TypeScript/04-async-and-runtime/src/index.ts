/**
 * Project 04 — Async & Runtime.
 * Run with:  npm run start:04
 */
import {
  AbortedError,
  TimeoutError,
  combinators,
  deferred,
  delay,
  mapLimit,
  retry,
  withTimeout,
  type PoolStats,
} from "./concurrency.js";
import {
  Counter,
  Countdown,
  Playlist,
  accumulator,
  chain,
  collect,
  fibonacci,
  range,
  resetToken,
  symbolFacts,
  take,
  tickTimes,
} from "./generators.js";
import { Connection, Span, asyncScope, cleanupLog, nestedScopes, toDisposable } from "./disposables.js";
import { JsonFile, TempDir, readLines } from "./files.js";

async function main(): Promise<void> {
  console.log("── 04 · Async & Runtime ─────────────────────────────");

  // §31 generators & iterators
  console.log("range           ", [...range(0, 10, 3)].join(","));
  console.log("fibonacci       ", take(fibonacci(), 8).join(","));
  console.log("chain           ", [...chain([1, 2], [3], [4, 5])].join(","));
  const acc = accumulator();
  acc.next();
  acc.next(5);
  console.log("accumulator     ", acc.next(7).value);

  const playlist = new Playlist().add("a").add("b").add("c");
  console.log("iterable class  ", [...playlist].join(","), "| spread size:", playlist.size);
  console.log("well-known syms ", Object.prototype.toString.call(playlist), "| number hint:", +playlist);
  console.log("symbols         ", JSON.stringify(symbolFacts));
  const counter = new Counter();
  counter.increment();
  counter[resetToken]();
  console.log("symbol method   ", "count after reset:", counter.count);
  console.log("async iterate   ", (await collect(new Countdown(3))).join(","), "| ticks:", (await collect(tickTimes(2))).length);

  // §32 promises
  const stats: PoolStats = { peak: 0 };
  const doubled = await mapLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
    await delay(5);
    return n * 2;
  }, stats);
  console.log("mapLimit        ", doubled.join(","), "| peak concurrency:", stats.peak);

  let attempts = 0;
  const value = await retry(
    async () => {
      attempts++;
      if (attempts < 3) throw new Error(`attempt ${attempts} failed`);
      return "ok on attempt 3";
    },
    { attempts: 5, baseDelayMs: 1 },
  );
  console.log("retry           ", value);

  try {
    await withTimeout(delay(500), 20);
  } catch (error) {
    console.log("timeout         ", error instanceof TimeoutError ? error.message : "unexpected");
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5);
  try {
    await delay(500, controller.signal);
  } catch (error) {
    console.log("abort           ", error instanceof AbortedError ? error.name : "unexpected");
  }

  const gate = deferred<string>();
  void gate.promise.then((v) => console.log("deferred        ", `resolved with ${v}`));
  // `combinators` eagerly builds all four promises, so all four must be handled
  // — leaving `all` unawaited would crash the process on an unhandled rejection.
  const report = combinators([Promise.resolve(1), Promise.reject(new Error("x"))]);
  const settled = await report.allSettled;
  const raced = await report.race;
  const any = await report.any;
  const allFailed = await report.all.then(
    () => "resolved",
    (e: unknown) => `rejected: ${(e as Error).message}`,
  );
  gate.resolve("done");
  console.log("combinators     ", settled.map((r) => r.status).join(","), `| race=${raced} any=${any} all=${allFailed}`);

  // §42 using / await using
  console.log("disposal order  ", nestedScopes().join(" → "));
  console.log("async disposal  ", (await asyncScope()).join(" → "));
  {
    using legacy = toDisposable("legacy-stream", () => undefined);
    console.log("wrapped legacy  ", "inside scope", legacy[Symbol.dispose].name || "(anonymous)");
  }
  {
    await using connection = new Connection("postgres://localhost/demo");
    console.log("connection      ", (await connection.query("SELECT 1"))[0]);
  }

  // Node file APIs
  await using dir = await TempDir.create();
  const logPath = await dir.write("events.jsonl", "");
  await using file = await JsonFile.create<{ id: number; name: string }>(logPath);
  await file.append({ id: 1, name: "first" });
  await file.append({ id: 2, name: "second" });
  console.log("jsonl file      ", (await file.readAll()).map((e) => e.name).join(","), `(${await file.sizeBytes()} bytes)`);
  console.log("stream lines    ", (await collect(readLines(logPath))).length, "lines via async generator");
  console.log("tempdir         ", await dir.list());

  const span = new Span("manual");
  span[Symbol.dispose]();
  console.log("manual dispose  ", "closed:", span.isClosed, "| total log entries:", cleanupLog.length);
}

void main();
