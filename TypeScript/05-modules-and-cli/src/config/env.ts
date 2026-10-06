/**
 * 05 · Modules & CLI — typed configuration read from the environment.
 *
 * Guide sections covered: §8 Literal Types, §35 Strict Mode (in action),
 * §41 The `satisfies` operator.
 */
import { homedir } from "node:os";
import { join } from "node:path";

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export interface AppConfig {
  readonly home: string;
  readonly logLevel: LogLevel;
  readonly maxTasks: number;
}

/**
 * `as const satisfies AppConfig` does two jobs at once:
 *   - `satisfies` proves the object matches `AppConfig`
 *   - `as const` keeps `logLevel` as the literal `"info"` instead of `string`
 */
export const DEFAULTS = {
  home: join(homedir(), ".task-cli"),
  logLevel: "info",
  maxTasks: 500,
} as const satisfies AppConfig;

export class ConfigError extends Error {
  constructor(
    readonly variable: string,
    message: string,
  ) {
    super(`${variable}: ${message}`);
    this.name = "ConfigError";
  }
}

function isLogLevel(value: string): value is LogLevel {
  return (LOG_LEVELS as readonly string[]).includes(value);
}

/**
 * Reads and validates the environment. `NodeJS.ProcessEnv` is augmented in
 * `types/env.d.ts`, so `env.TASK_CLI_HOME` is known and correctly optional.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const logLevel = env.TASK_CLI_LOG_LEVEL ?? DEFAULTS.logLevel;
  if (!isLogLevel(logLevel)) {
    throw new ConfigError("TASK_CLI_LOG_LEVEL", `must be one of ${LOG_LEVELS.join("/")}`);
  }

  const rawMax = env.TASK_CLI_MAX_TASKS;
  // The annotation matters: without it, `as const` gives maxTasks the literal
  // type `500` and the assignment below is rejected.
  let maxTasks: number = DEFAULTS.maxTasks;
  if (rawMax !== undefined) {
    const parsed = Number.parseInt(rawMax, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      throw new ConfigError("TASK_CLI_MAX_TASKS", "must be a positive integer");
    }
    maxTasks = parsed;
  }

  return {
    home: env.TASK_CLI_HOME ?? DEFAULTS.home,
    logLevel,
    maxTasks,
  };
}

export function storePath(config: AppConfig): string {
  return join(config.home, "tasks.json");
}
