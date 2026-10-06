/**
 * Project 06 — a typed REST API on node:http.
 * Run with:  npm run start:06      (listens on 0.0.0.0:3000)
 *
 * The public surface is re-exported here, so `import { ... } from "./index.js"`
 * gives a consumer everything without knowing the internal file layout (§25).
 */
export {
  MalformedBodyError,
  createApp,
  createRouter,
  readBody,
  send,
  startServer,
  type RunningServer,
  type StartOptions,
} from "./server.js";
export { Router, compilePattern, type Handler, type MatchResult, type RouteContext } from "./router.js";
export { Repository, createNoteRepository } from "./repository.js";
export { isId, parseNoteInput, parseNotePatch, type ValidationResult } from "./validation.js";
export * from "./types.js";

import { startServer } from "./server.js";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const server = await startServer({ port, host: process.env.HOST ?? "0.0.0.0" });
console.log(`── 06 · Notes API listening on ${server.url} (port ${server.port}) ──`);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void server.close().then(() => process.exit(0));
  });
}
