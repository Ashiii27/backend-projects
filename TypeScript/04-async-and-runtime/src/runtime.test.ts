import assert from "node:assert/strict";
import { describe, it } from "node:test";

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
  localSymbol,
  range,
  registeredA,
  registeredB,
  resetToken,
  symbolFacts,
  take,
  tickTimes,
} from "./generators.js";
import { Connection, Span, asyncScope, cleanupLog, nestedScopes, toDisposable } from "./disposables.js";
import { JsonFile, TempDir, readLines } from "./files.js";

describe("concurrency.ts — §32 promises", () => {
  it("sleeps, and cancels through an AbortSignal", async () => {
    const started = Date.now();
    await delay(20);
    assert.ok(Date.now() - started >= 15);

    const controller = new AbortController();
    controller.abort();
    await assert.rejects(delay(1000, controller.signal), AbortedError);

    const late = new AbortController();
    setTimeout(() => late.abort(), 5);
    await assert.rejects(delay(1000, late.signal), AbortedError);
  });

  it("times a promise out", async () => {
    await assert.rejects(withTimeout(delay(1000), 10), TimeoutError);
    assert.equal(await withTimeout(Promise.resolve(7), 100), 7);
  });

  it("retries with backoff then succeeds", async () => {
    let attempts = 0;
    const retries: number[] = [];
    const value = await retry(
      async (attempt) => {
        attempts = attempt;
        if (attempt < 3) throw new Error("nope");
        return "finally";
      },
      { attempts: 5, baseDelayMs: 1, onRetry: (_e, attempt) => retries.push(attempt) },
    );
    assert.equal(value, "finally");
    assert.equal(attempts, 3);
    assert.deepEqual(retries, [1, 2]);
  });

  it("gives up after the configured number of attempts", async () => {
    let attempts = 0;
    await assert.rejects(
      retry(
        async () => {
          attempts++;
          throw new Error("always");
        },
        { attempts: 3, baseDelayMs: 1 },
      ),
      /always/,
    );
    assert.equal(attempts, 3);
  });

  it("stops retrying when shouldRetry says no", async () => {
    let attempts = 0;
    await assert.rejects(
      retry(
        async () => {
          attempts++;
          throw new TypeError("fatal");
        },
        { attempts: 5, baseDelayMs: 1, shouldRetry: (e) => !(e instanceof TypeError) },
      ),
      /fatal/,
    );
    assert.equal(attempts, 1);
  });

  it("never exceeds the concurrency limit and preserves order", async () => {
    const stats: PoolStats = { peak: 0 };
    const items = [30, 10, 20, 5, 25, 15];
    const out = await mapLimit(items, 2, async (ms) => {
      await delay(ms / 10);
      return ms;
    }, stats);
    assert.deepEqual(out, items); // results come back in input order
    assert.ok(stats.peak <= 2, `peak was ${stats.peak}`);
    assert.ok(stats.peak >= 1);
  });

  it("rejects a nonsensical limit", async () => {
    await assert.rejects(mapLimit([1], 0, async (n) => n), RangeError);
  });

  it("exposes the four combinators and a deferred", async () => {
    const report = combinators([Promise.resolve(1), Promise.reject(new Error("x"))]);

    // Every promise `combinators` builds must be awaited, otherwise Node reports
    // an unhandled rejection after the test has already finished.
    const settled = await report.allSettled; // never rejects
    assert.deepEqual(settled.map((r) => r.status), ["fulfilled", "rejected"]);
    await assert.rejects(report.all, /x/); // rejects on the first failure
    assert.equal(await report.race, 1); // whichever settles first
    assert.equal(await report.any, 1); // a single failure is ignored

    // When *all* of them fail, `any` is the one that rejects with AggregateError.
    const failing = combinators([Promise.reject(new Error("a"))]);
    await assert.rejects(failing.any, AggregateError);
    await assert.rejects(failing.all, /a/);
    await assert.rejects(failing.race, /a/);
    assert.deepEqual((await failing.allSettled).map((r) => r.status), ["rejected"]);

    const gate = deferred<number>();
    gate.resolve(42);
    assert.equal(await gate.promise, 42);
  });
});

describe("generators.ts — §30 symbols, §31 iterators", () => {
  it("generates ranges, fibonaccis and chains", () => {
    assert.deepEqual([...range(0, 10, 3)], [0, 3, 6, 9]);
    assert.deepEqual(take(fibonacci(), 7), [0, 1, 1, 2, 3, 5, 8]);
    assert.deepEqual(take(fibonacci(), 0), []);
    assert.deepEqual([...chain([1, 2], [], [3])], [1, 2, 3]);
  });

  it("receives values back through next()", () => {
    const acc = accumulator();
    assert.equal(acc.next().value, 0);
    assert.equal(acc.next(5).value, 5);
    assert.equal(acc.next(7).value, 12);
  });

  it("makes a class iterable and customises built-ins via symbols", () => {
    const playlist = new Playlist().add("a").add("b");
    assert.deepEqual([...playlist], ["a", "b"]);
    assert.equal(playlist.size, 2);
    assert.equal(Object.prototype.toString.call(playlist), "[object Playlist]");
    assert.equal(+playlist, 2);
    assert.equal(`${playlist}`, "2 tracks");
    assert.equal(typeof playlist.key, "symbol");
  });

  it("distinguishes local symbols from the registry", () => {
    assert.equal(registeredA, registeredB);
    assert.notEqual(localSymbol, registeredA);
    assert.equal(symbolFacts.keyFor, "app.cache");
    assert.equal(symbolFacts.keyForLocal, undefined);
    assert.equal(symbolFacts.sameDescriptionButDifferent, true);
  });

  it("guards a method behind a symbol", () => {
    const counter = new Counter();
    counter.increment();
    counter.increment();
    assert.equal(counter.count, 2);
    counter[resetToken]();
    assert.equal(counter.count, 0);
    assert.equal(resetToken.description, "resetToken");
  });

  it("iterates asynchronously", async () => {
    assert.deepEqual(await collect(new Countdown(3)), [3, 2, 1]);
    assert.deepEqual(await collect(new Countdown(0)), []);
    const ticks = await collect(tickTimes(3));
    assert.equal(ticks.length, 3);
    assert.ok(ticks.every((t) => t instanceof Date));
  });
});

describe("disposables.ts — §42 using / await using", () => {
  it("disposes in reverse order, even when the scope throws", () => {
    const log = nestedScopes();
    assert.deepEqual(log, [
      "open outer",
      "open inner",
      "inside outer/inner",
      "caught",
      "close inner",
      "close outer",
    ]);
  });

  it("awaits async disposal", async () => {
    const log = await asyncScope();
    assert.deepEqual(log, ["connect postgres://localhost/demo", "disconnect postgres://localhost/demo"]);
  });

  it("refuses queries after disposal", async () => {
    const connection = new Connection("postgres://localhost/x");
    assert.deepEqual(await connection.query("SELECT 1"), ["result of: SELECT 1"]);
    await connection[Symbol.asyncDispose]();
    assert.equal(connection.isOpen, false);
    await assert.rejects(connection.query("SELECT 1"), /closed/);
  });

  it("wraps a legacy close callback", () => {
    let closed = false;
    {
      using resource = toDisposable("legacy", () => {
        closed = true;
      });
      assert.equal(closed, false);
      assert.equal(typeof resource[Symbol.dispose], "function");
    }
    assert.equal(closed, true);
  });

  it("tracks its own closed state", () => {
    const span = new Span("s");
    assert.equal(span.isClosed, false);
    span[Symbol.dispose]();
    assert.equal(span.isClosed, true);
    assert.ok(cleanupLog.length > 0);
  });
});

describe("files.ts — typed Node file APIs", () => {
  it("appends and reads JSON lines through a disposable handle", async () => {
    await using dir = await TempDir.create();
    const path = await dir.write("log.jsonl", "");
    await using file = await JsonFile.create<{ id: number; name: string }>(path);

    await file.append({ id: 1, name: "first" });
    await file.append({ id: 2, name: "second" });

    assert.deepEqual(await file.readAll(), [
      { id: 1, name: "first" },
      { id: 2, name: "second" },
    ]);
    assert.ok((await file.sizeBytes()) > 0);
    assert.equal(file.id.length, 36);
    assert.deepEqual(await dir.list(), ["log.jsonl"]);
  });

  it("streams lines through an async generator", async () => {
    await using dir = await TempDir.create();
    const path = await dir.write("lines.txt", "one\ntwo\nthree");
    assert.deepEqual(await collect(readLines(path)), ["one", "two", "three"]);
  });

  it("removes the temp directory on disposal", async () => {
    const { existsSync } = await import("node:fs");
    let captured = "";
    {
      await using dir = await TempDir.create();
      captured = dir.path;
      await dir.write("a.txt", "a");
      assert.ok(existsSync(captured));
    }
    assert.equal(existsSync(captured), false);
  });
});
