/// <reference path="./globals.d.ts" />

/**
 * §33 Triple-slash directives.
 *
 * The `/// <reference path="..." />` above pulls `globals.d.ts` into this file's
 * compilation *before* it is parsed. The three forms are:
 *
 *   /// <reference path="./file.d.ts" />   — include another file
 *   /// <reference types="node" />          — include a package from @types
 *   /// <reference lib="es2020" />          — include a built-in lib
 *
 * They must appear at the very top of the file, before any statements.
 *
 * Module augmentation needs module scope, hence the `export {}` below: adding it
 * turns this file into a module, which is what makes `declare global` legal.
 */
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** Where the CLI keeps its JSON store. */
      readonly TASK_CLI_HOME?: string;
      /** One of debug | info | warn | error. */
      readonly TASK_CLI_LOG_LEVEL?: string;
      /** Hard cap on how many tasks are stored. */
      readonly TASK_CLI_MAX_TASKS?: string;
    }
  }
}
