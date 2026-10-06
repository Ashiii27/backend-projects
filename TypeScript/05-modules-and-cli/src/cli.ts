/**
 * 05 · Modules & CLI — argument parsing and command handling.
 *
 * Guide sections covered: §11 Functions (overloads), §18 Narrowing,
 * §26 Declaration Files (the legacy roman module), §36 Discriminated Unions,
 * §37 Overloading.
 */
import "./build-info.js";
import { fromRoman, toRoman } from "./legacy/roman.js";
import { loadConfig, storePath, type AppConfig } from "./config/env.js";
import {
  PRIORITIES,
  STATUSES,
  completeTask,
  createTask,
  isPriority,
  nextTaskId,
  parseTask,
  reopenTask,
  sortByPriority,
  type Priority,
  type Status,
  type Task,
} from "./domain/task.js";
import { JsonStore } from "./store/json-store.js";

// ─────────────────────────────────────────────────────────────────────────────
// §36 One member per command, tagged by `kind`
// ─────────────────────────────────────────────────────────────────────────────

export type Command =
  | { readonly kind: "help" }
  | { readonly kind: "version" }
  | { readonly kind: "add"; readonly title: string; readonly priority: Priority; readonly tags: string[] }
  | { readonly kind: "list"; readonly status?: Status; readonly priority?: Priority }
  | { readonly kind: "done"; readonly id: string }
  | { readonly kind: "reopen"; readonly id: string }
  | { readonly kind: "remove"; readonly id: string }
  | { readonly kind: "stats" }
  | { readonly kind: "unknown"; readonly name: string };

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

// ── §37 Overloads ────────────────────────────────────────────────────────────
// Two call signatures for one implementation: without a fallback the function
// throws on a missing flag, with one it always returns a string. Note that the
// overload signatures must sit immediately above the implementation.
export function flag(args: readonly string[], name: string): string;
export function flag(args: readonly string[], name: string, fallback: string): string;
export function flag(args: readonly string[], name: string, fallback?: string): string {
  const index = args.indexOf(`--${name}`);
  if (index === -1 || index + 1 >= args.length) {
    if (fallback !== undefined) return fallback;
    throw new UsageError(`--${name} requires a value`);
  }
  return args[index + 1] as string;
}

function flags(args: readonly string[], name: string): string[] {
  const found: string[] = [];
  args.forEach((arg, index) => {
    if (arg === `--${name}`) {
      const value = args[index + 1];
      if (value !== undefined) found.push(value);
    }
  });
  return found;
}

function positional(args: readonly string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    if (arg.startsWith("--")) {
      i++; // skip the flag's value as well
      continue;
    }
    out.push(arg);
  }
  return out;
}

export function parseArgs(argv: readonly string[]): Command {
  const [name, ...rest] = argv;

  switch (name) {
    case undefined:
    case "help":
      return { kind: "help" };
    case "version":
      return { kind: "version" };
    case "stats":
      return { kind: "stats" };
    case "done":
    case "reopen":
    case "remove": {
      const id = positional(rest)[0];
      if (id === undefined) throw new UsageError(`${name} needs a task id`);
      return { kind: name, id };
    }
    case "add": {
      const title = positional(rest).join(" ");
      if (title.trim().length === 0) throw new UsageError("add needs a title");
      const rawPriority = flag(rest, "priority", "medium");
      if (!isPriority(rawPriority)) {
        throw new UsageError(`--priority must be one of ${PRIORITIES.join("/")}`);
      }
      return { kind: "add", title, priority: rawPriority, tags: flags(rest, "tag") };
    }
    case "list": {
      const command: { kind: "list"; status?: Status; priority?: Priority } = { kind: "list" };
      const rawStatus = flag(rest, "status", "");
      if (rawStatus !== "") {
        if (!(STATUSES as readonly string[]).includes(rawStatus)) {
          throw new UsageError(`--status must be one of ${STATUSES.join("/")}`);
        }
        command.status = rawStatus as Status;
      }
      const rawPriority = flag(rest, "priority", "");
      if (rawPriority !== "") {
        if (!isPriority(rawPriority)) {
          throw new UsageError(`--priority must be one of ${PRIORITIES.join("/")}`);
        }
        command.priority = rawPriority;
      }
      return command;
    }
    default:
      return { kind: "unknown", name };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Execution — returns text instead of printing, so it is easy to test
// ─────────────────────────────────────────────────────────────────────────────

export interface CliDeps {
  readonly config: AppConfig;
  readonly now?: () => Date;
}

export const HELP_TEXT = `task — a tiny TypeScript CLI

Usage:
  task add <title...> [--priority low|medium|high] [--tag <tag>]...
  task list [--status open|done] [--priority low|medium|high]
  task done <id>
  task reopen <id>
  task remove <id>
  task stats
  task version
`;

function render(task: Task): string {
  const mark = task.status === "done" ? "[x]" : "[ ]";
  const tags = task.tags.length > 0 ? ` #${task.tags.join(" #")}` : "";
  return `${mark} ${task.id}  ${task.title}  (${task.priority})${tags}`;
}

/** Loads stored rows and validates each one, refusing to trust the file. */
async function loadTasks(store: JsonStore<unknown>): Promise<Task[]> {
  const rows = await store.load();
  const tasks: Task[] = [];
  for (const row of rows) {
    const parsed = parseTask(row);
    if (parsed.ok) tasks.push(parsed.task);
  }
  return tasks;
}

export async function runCommand(command: Command, deps: CliDeps): Promise<string> {
  const store = new JsonStore<unknown>(storePath(deps.config));

  switch (command.kind) {
    case "help":
      return HELP_TEXT;

    case "version":
      // `__BUILD__` and `appVersion()` come from the ambient globals.d.ts.
      return `task ${appVersion()} — built ${__BUILD__.builtAt}`;

    case "add": {
      const tasks = await loadTasks(store);
      if (tasks.length >= deps.config.maxTasks) {
        throw new UsageError(`Refusing to exceed maxTasks=${deps.config.maxTasks}`);
      }
      // The id comes from the stored rows, so it stays unique across processes.
      const task = createTask({
        id: nextTaskId(tasks),
        title: command.title,
        priority: command.priority,
        tags: command.tags,
      });
      await store.save([...tasks, task]);
      return `added ${render(task)}`;
    }

    case "list": {
      const tasks = sortByPriority(await loadTasks(store)).filter((task) => {
        if (command.status !== undefined && task.status !== command.status) return false;
        if (command.priority !== undefined && task.priority !== command.priority) return false;
        return true;
      });
      return tasks.length === 0 ? "(no tasks)" : tasks.map(render).join("\n");
    }

    case "done":
    case "reopen": {
      const tasks = await loadTasks(store);
      const index = tasks.findIndex((task) => task.id === command.id);
      if (index === -1) throw new UsageError(`no task with id ${command.id}`);
      const current = tasks[index] as Task;
      const updated = command.kind === "done" ? completeTask(current) : reopenTask(current);
      tasks[index] = updated;
      await store.save(tasks);
      return `${command.kind === "done" ? "completed" : "reopened"} ${render(updated)}`;
    }

    case "remove": {
      const tasks = await loadTasks(store);
      const remaining = tasks.filter((task) => task.id !== command.id);
      if (remaining.length === tasks.length) throw new UsageError(`no task with id ${command.id}`);
      await store.save(remaining);
      return `removed ${command.id} (${remaining.length} left)`;
    }

    case "stats": {
      const tasks = await loadTasks(store);
      const open = tasks.filter((t) => t.status === "open").length;
      const done = tasks.length - open;
      // The untyped legacy module, used with full type safety via roman.d.ts.
      const total = toRoman(Math.max(1, Math.min(3999, tasks.length)));
      return `${tasks.length} task(s) — open ${open}, done ${done}, total ${total} (parsed back: ${fromRoman(total)})`;
    }

    case "unknown":
      throw new UsageError(`unknown command "${command.name}" — try "task help"`);

    default:
      // Compile-time exhaustiveness: add a Command member and this line errors.
      return assertNever(command);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled command: ${JSON.stringify(value)}`);
}

/** Entry point used by `index.ts`. */
export async function main(argv: readonly string[], env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const config = loadConfig(env);
  return runCommand(parseArgs(argv), { config });
}
