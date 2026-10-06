/**
 * Ambient *global* declarations (§26 Declaration Files).
 *
 * This file has no top-level `import` or `export`, which makes it a global
 * script rather than a module — so everything declared here is visible in every
 * file of the project without importing anything.
 */

interface AppBuildInfo {
  readonly version: string;
  readonly commit: string;
  readonly builtAt: string;
}

/**
 * Injected at start-up by `build-info.ts`. TypeScript now knows the name and
 * the shape, so `__BUILD__.version` autocompletes everywhere.
 */
declare const __BUILD__: AppBuildInfo;

/** A global function, the same way `console` or `fetch` are declared. */
declare function appVersion(): string;
