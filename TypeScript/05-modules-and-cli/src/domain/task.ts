/**
 * 05 · Modules & CLI — the domain model, in its own module.
 *
 * Guide sections covered: §5 Interfaces, §8 Literal Types, §25 Modules,
 * §36 Discriminated Unions.
 */

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ["open", "done"] as const;
export type Status = (typeof STATUSES)[number];

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly priority: Priority;
  readonly tags: readonly string[];
  readonly status: Status;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface NewTask {
  readonly title: string;
  readonly priority?: Priority;
  readonly tags?: readonly string[];
  /** Supply this when the id must be unique against already-stored tasks. */
  readonly id?: string;
}

/**
 * Fallback counter for in-process use only. A CLI restarts on every command, so
 * a module-level counter would hand out the same id twice — that is what
 * `nextTaskId` below is for.
 */
let sequence = 0;

/** `t007` + existing ids → `t008`. Derived from the data, not from memory. */
export function nextTaskId(tasks: readonly Task[]): string {
  const highest = tasks.reduce((max, task) => {
    const n = Number.parseInt(task.id.replace(/^t/, ""), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `t${(highest + 1).toString().padStart(3, "0")}`;
}

export function createTask(input: NewTask): Task {
  if (input.title.trim().length === 0) throw new TypeError("A task needs a title");
  sequence += 1;
  return {
    id: input.id ?? `t${sequence.toString().padStart(3, "0")}`,
    title: input.title.trim(),
    priority: input.priority ?? "medium",
    tags: [...(input.tags ?? [])],
    status: "open",
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}

/** Returns a *new* task — the model is immutable, so nothing is mutated in place. */
export function completeTask(task: Task): Task {
  return task.status === "done"
    ? task
    : { ...task, status: "done", completedAt: new Date().toISOString() };
}

export function reopenTask(task: Task): Task {
  return task.status === "open" ? task : { ...task, status: "open", completedAt: null };
}

const RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function sortByPriority(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => RANK[a.priority] - RANK[b.priority] || a.id.localeCompare(b.id));
}

export function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (PRIORITIES as readonly string[]).includes(value);
}

/** §36 — a discriminated union for the outcome of validating unknown input. */
export type ParseResult =
  | { readonly ok: true; readonly task: Task }
  | { readonly ok: false; readonly reason: string };

export function parseTask(input: unknown): ParseResult {
  if (typeof input !== "object" || input === null) return { ok: false, reason: "not an object" };
  const row = input as Record<string, unknown>;

  if (typeof row.id !== "string") return { ok: false, reason: "id must be a string" };
  if (typeof row.title !== "string") return { ok: false, reason: "title must be a string" };
  if (!isPriority(row.priority)) return { ok: false, reason: `priority must be one of ${PRIORITIES.join("/")}` };
  if (!Array.isArray(row.tags) || !row.tags.every((t) => typeof t === "string")) {
    return { ok: false, reason: "tags must be an array of strings" };
  }
  if (row.status !== "open" && row.status !== "done") return { ok: false, reason: "status must be open or done" };
  if (typeof row.createdAt !== "string") return { ok: false, reason: "createdAt must be a string" };

  return {
    ok: true,
    task: {
      id: row.id,
      title: row.title,
      priority: row.priority,
      tags: row.tags as string[],
      status: row.status,
      createdAt: row.createdAt,
      completedAt: typeof row.completedAt === "string" ? row.completedAt : null,
    },
  };
}
