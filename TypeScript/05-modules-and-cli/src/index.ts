/**
 * Project 05 — Modules & CLI.
 * Run with:  npm run start:05 -- add "Write the guide" --priority high --tag docs
 */

// §25 Modules — a "barrel": one place that re-exports the public surface.
export { HELP_TEXT, UsageError, main, parseArgs, runCommand, type CliDeps, type Command } from "./cli.js";
export { ConfigError, DEFAULTS, LOG_LEVELS, loadConfig, storePath, type AppConfig, type LogLevel } from "./config/env.js";
export {
  PRIORITIES,
  STATUSES,
  completeTask,
  createTask,
  parseTask,
  reopenTask,
  sortByPriority,
  type NewTask,
  type Priority,
  type Status,
  type Task,
} from "./domain/task.js";
export { JsonStore } from "./store/json-store.js";
export { Validation, mergedShape, namespaceKeys } from "./namespaces.js";
export { fromRoman, toRoman } from "./legacy/roman.js";

// §25 — three kinds of import, all in one file.
import "./build-info.js"; // side effects only: installs the ambient globals
import { pathToFileURL } from "node:url"; // a normal runtime import
import { main } from "./cli.js"; // another runtime import
import type { Command } from "./cli.js"; // type-only: fully erased at compile time

/** Uses the type-only import above — `Command` never reaches the emitted JS. */
export function isMutating(command: Command): boolean {
  return (
    command.kind === "add" ||
    command.kind === "done" ||
    command.kind === "reopen" ||
    command.kind === "remove"
  );
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main(process.argv.slice(2))
    .then((output) => console.log(output))
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
