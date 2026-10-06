import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

import { ConfigError, DEFAULTS, LOG_LEVELS, loadConfig, storePath } from "./config/env.js";
import {
  PRIORITIES,
  completeTask,
  createTask,
  parseTask,
  reopenTask,
  sortByPriority,
  type Task,
} from "./domain/task.js";
import { JsonStore } from "./store/json-store.js";
import { Validation, mergedShape, namespaceKeys } from "./namespaces.js";
import { fromRoman, toRoman } from "./legacy/roman.js";
import { HELP_TEXT, UsageError, flag, main, parseArgs, runCommand } from "./cli.js";

const homes: string[] = [];

/** Each stateful test gets its own directory so nothing leaks between them. */
async function freshHome(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "task-cli-"));
  homes.push(dir);
  return dir;
}

after(async () => {
  await Promise.all(homes.map((dir) => rm(dir, { recursive: true, force: true })));
});

const cli = (home: string) => ({ config: loadConfig({ TASK_CLI_HOME: home }) });

describe("config/env.ts — §8/§41 typed configuration", () => {
  it("falls back to defaults", () => {
    const config = loadConfig({});
    assert.equal(config.logLevel, "info");
    assert.equal(config.maxTasks, 500);
    assert.equal(config.home, DEFAULTS.home);
    assert.equal(DEFAULTS.logLevel, "info");
    assert.deepEqual([...LOG_LEVELS], ["debug", "info", "warn", "error"]);
  });

  it("reads valid overrides", () => {
    const config = loadConfig({
      TASK_CLI_HOME: "/tmp/x",
      TASK_CLI_LOG_LEVEL: "debug",
      TASK_CLI_MAX_TASKS: "10",
    });
    assert.deepEqual(config, { home: "/tmp/x", logLevel: "debug", maxTasks: 10 });
  });

  it("rejects bad values with a named error", () => {
    assert.throws(() => loadConfig({ TASK_CLI_LOG_LEVEL: "shout" }), ConfigError);
    assert.throws(() => loadConfig({ TASK_CLI_MAX_TASKS: "abc" }), /positive integer/);
    assert.throws(() => loadConfig({ TASK_CLI_MAX_TASKS: "0" }), ConfigError);
    const error = new ConfigError("X", "bad");
    assert.equal(error.variable, "X");
    assert.equal(error.message, "X: bad");
  });

  it("derives the store path", () => {
    assert.equal(storePath(loadConfig({ TASK_CLI_HOME: "/tmp/x" })), "/tmp/x/tasks.json");
  });
});

describe("domain/task.ts — §5/§36 the model", () => {
  it("creates immutable tasks with defaults", () => {
    const task = createTask({ title: "  write docs  " });
    assert.equal(task.title, "write docs");
    assert.equal(task.priority, "medium");
    assert.deepEqual(task.tags, []);
    assert.equal(task.status, "open");
    assert.equal(task.completedAt, null);
    assert.match(task.id, /^t\d{3}$/);
    assert.throws(() => createTask({ title: "   " }), TypeError);
  });

  it("transitions without mutating", () => {
    const open = createTask({ title: "a" });
    const done = completeTask(open);
    assert.equal(open.status, "open");
    assert.equal(done.status, "done");
    assert.notEqual(done.completedAt, null);
    assert.equal(completeTask(done), done); // idempotent
    const reopened = reopenTask(done);
    assert.equal(reopened.status, "open");
    assert.equal(reopened.completedAt, null);
  });

  it("sorts high → medium → low", () => {
    const tasks = [
      createTask({ title: "l", priority: "low" }),
      createTask({ title: "h", priority: "high" }),
      createTask({ title: "m", priority: "medium" }),
    ];
    assert.deepEqual(sortByPriority(tasks).map((t) => t.priority), ["high", "medium", "low"]);
    assert.deepEqual([...PRIORITIES], ["low", "medium", "high"]);
  });

  it("validates untrusted rows", () => {
    const good: Task = { ...createTask({ title: "ok" }) };
    const parsed = parseTask(good);
    assert.ok(parsed.ok); // narrows to the success arm below
    if (parsed.ok) assert.equal(parsed.task.title, "ok");

    assert.deepEqual(parseTask(null), { ok: false, reason: "not an object" });
    assert.deepEqual(parseTask({ ...good, priority: "urgent" }), {
      ok: false,
      reason: "priority must be one of low/medium/high",
    });
    assert.deepEqual(parseTask({ ...good, tags: [1] }), {
      ok: false,
      reason: "tags must be an array of strings",
    });
    assert.deepEqual(parseTask({ ...good, status: "wip" }), {
      ok: false,
      reason: "status must be open or done",
    });
  });
});

describe("store/json-store.ts — §16 generic persistence", () => {
  it("round-trips and survives a missing file", async () => {
    const home = await freshHome();
    const store = new JsonStore<{ n: number }>(join(home, "nested", "nums.json"));
    assert.deepEqual(await store.load(), []); // ENOENT → []
    await store.save([{ n: 1 }, { n: 2 }]);
    assert.deepEqual(await store.load(), [{ n: 1 }, { n: 2 }]);
    const updated = await store.update((rows) => [...rows, { n: 3 }]);
    assert.equal(updated.length, 3);
    assert.equal(store.path, join(home, "nested", "nums.json"));
  });

  it("treats malformed JSON as a real error", async () => {
    const path = join(await freshHome(), "broken.json");
    const store = new JsonStore<unknown>(path);
    await import("node:fs/promises").then(({ writeFile }) => writeFile(path, "{not json", "utf8"));
    await assert.rejects(store.load(), SyntaxError);
  });
});

describe("namespaces.ts — §25 namespaces and declaration merging", () => {
  it("validates through the namespace object", () => {
    assert.equal(Validation.required("x", "field"), "x");
    assert.throws(() => Validation.required("", "field"), Validation.FieldError);
    assert.equal(Validation.Text.minLength("abc", 2, "f"), "abc");
    assert.throws(() => Validation.Text.minLength("a", 2, "f"), /at least 2/);
    assert.equal(Validation.Text.matches("abc", /^[a-z]+$/, "f"), "abc");
    assert.throws(() => Validation.Text.matches("ABC", /^[a-z]+$/, "f"), /must match/);
    assert.equal(Validation.Numbers.between(5, 1, 10, "f"), 5);
    assert.throws(() => Validation.Numbers.between(11, 1, 10, "f"), /between 1 and 10/);
    assert.equal(Validation.VERSION, "1.0");
  });

  it("merges interfaces and exposes a runtime object", () => {
    assert.deepEqual(mergedShape, { name: "square", sides: 4 });
    assert.deepEqual(namespaceKeys, ["FieldError", "Numbers", "Text", "VERSION", "required"].sort());
  });
});

describe("legacy/roman.js + roman.d.ts — §26 declaration files", () => {
  it("types untyped JavaScript", () => {
    assert.equal(toRoman(1994), "MCMXCIV");
    assert.equal(toRoman(4), "IV");
    assert.equal(toRoman(3999), "MMMCMXCIX");
    assert.equal(fromRoman("MCMXCIV"), 1994);
  });

  it("round-trips and reports errors", () => {
    for (const n of [1, 9, 40, 90, 400, 1000, 2026]) {
      assert.equal(fromRoman(toRoman(n)), n);
    }
    assert.throws(() => toRoman(0), RangeError);
    assert.throws(() => toRoman(4000), RangeError);
    assert.throws(() => fromRoman("ABC"), TypeError);
  });
});

describe("cli.ts — §11/§18/§36/§37 parsing and execution", () => {
  it("parses every command into a discriminated union", () => {
    assert.equal(parseArgs([]).kind, "help");
    assert.equal(parseArgs(["help"]).kind, "help");
    assert.equal(parseArgs(["version"]).kind, "version");
    assert.equal(parseArgs(["stats"]).kind, "stats");
    assert.deepEqual(parseArgs(["done", "t001"]), { kind: "done", id: "t001" });
    assert.deepEqual(parseArgs(["add", "write", "docs", "--priority", "high", "--tag", "a", "--tag", "b"]), {
      kind: "add",
      title: "write docs",
      priority: "high",
      tags: ["a", "b"],
    });
    assert.deepEqual(parseArgs(["list", "--status", "open"]), { kind: "list", status: "open" });
    assert.deepEqual(parseArgs(["list"]), { kind: "list" });
    assert.deepEqual(parseArgs(["frobnicate"]), { kind: "unknown", name: "frobnicate" });
  });

  it("rejects bad usage", () => {
    assert.throws(() => parseArgs(["done"]), UsageError);
    assert.throws(() => parseArgs(["add"]), /needs a title/);
    assert.throws(() => parseArgs(["add", "x", "--priority", "urgent"]), /--priority/);
    assert.throws(() => parseArgs(["list", "--status", "wip"]), /--status/);
    assert.throws(() => flag(["--priority"], "priority"), /requires a value/);
    assert.equal(flag(["--priority"], "priority", "medium"), "medium");
  });

  it("runs a whole session against a temporary store", async () => {
    const home = await freshHome();
    const deps = cli(home);

    assert.match(await runCommand(parseArgs(["help"]), deps), /Usage:/);
    assert.equal(HELP_TEXT.startsWith("task — a tiny TypeScript CLI"), true);
    assert.match(await runCommand(parseArgs(["version"]), deps), /^task 1\.0\.0 \(899e85a\)/);

    assert.match(await runCommand(parseArgs(["add", "write the guide", "--priority", "high"]), deps), /^added/);
    assert.match(await runCommand(parseArgs(["add", "ship it", "--tag", "release"]), deps), /^added/);

    const listed = await runCommand(parseArgs(["list"]), deps);
    assert.match(listed, /\[ \] t\d{3}\s+write the guide\s+\(high\)/);
    assert.match(listed, /#release/);

    const highOnly = await runCommand(parseArgs(["list", "--priority", "high"]), deps);
    assert.equal(highOnly.split("\n").length, 1);

    const id = /\bt(\d{3})\b/.exec(listed)?.[0] ?? "";
    assert.match(await runCommand(parseArgs(["done", id]), deps), /^completed/);
    assert.match(await runCommand(parseArgs(["list", "--status", "done"]), deps), /\[x\]/);
    assert.match(await runCommand(parseArgs(["reopen", id]), deps), /^reopened/);

    assert.match(await runCommand(parseArgs(["stats"]), deps), /2 task\(s\) — open 2, done 0, total II/);
    // `list` sorts by priority, so pick the id that is NOT the one already held.
    const listed2 = await runCommand(parseArgs(["list"]), deps);
    const other = [...listed2.matchAll(/\bt\d{3}\b/g)].map((m) => m[0]).find((c) => c !== id) ?? "";
    assert.notEqual(other, "");
    assert.match(await runCommand(parseArgs(["remove", id]), deps), /^removed .*1 left/);
    assert.match(await runCommand(parseArgs(["remove", other]), deps), /^removed .*0 left/);
    assert.equal(await runCommand(parseArgs(["list"]), deps), "(no tasks)");
    assert.match(await runCommand(parseArgs(["stats"]), deps), /0 task\(s\) — open 0, done 0, total I/);

    await assert.rejects(runCommand(parseArgs(["done", "t999"]), deps), UsageError);
    await assert.rejects(runCommand(parseArgs(["nope"]), deps), /unknown command/);
  });

  it("keeps ids unique across separate CLI runs", async () => {
    // Each `main()` call is a fresh process in real life, so ids must come from
    // the stored rows rather than from an in-memory counter.
    const home = await freshHome();
    const env = { TASK_CLI_HOME: home };
    const first = await main(["add", "first"], env);
    const second = await main(["add", "second"], env);
    const third = await main(["add", "third"], env);
    assert.match(first, /\bt001\b/);
    assert.match(second, /\bt002\b/);
    assert.match(third, /\bt003\b/);

    // ...and `done` therefore targets exactly one task.
    assert.match(await main(["done", "t002"], env), /completed \[x\] t002/);
    const listed = await main(["list"], env);
    assert.equal(listed.split("\n").filter((line) => line.startsWith("[x]")).length, 1);
  });

  it("enforces maxTasks from the environment", async () => {
    const strict = { config: loadConfig({ TASK_CLI_HOME: await freshHome(), TASK_CLI_MAX_TASKS: "1" }) };
    assert.match(await runCommand(parseArgs(["add", "first"]), strict), /^added/);
    await assert.rejects(runCommand(parseArgs(["add", "second"]), strict), /maxTasks=1/);
  });

  it("exposes main() as the single entry point", async () => {
    const home = await freshHome();
    const output = await main(["add", "via main"], { TASK_CLI_HOME: home });
    assert.match(output, /^added .*via main/);
  });

  it("really writes JSON to disk", async () => {
    const home = await freshHome();
    await runCommand(parseArgs(["add", "persisted"]), cli(home));
    const raw = await readFile(storePath(loadConfig({ TASK_CLI_HOME: home })), "utf8");
    const rows = JSON.parse(raw) as unknown[];
    assert.ok(Array.isArray(rows));
    assert.ok(rows.length > 0);
  });
});
