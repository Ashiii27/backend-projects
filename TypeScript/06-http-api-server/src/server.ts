/**
 * 06 · HTTP API — the server itself, on Node's built-in `http` module (no
 * framework, no dependencies).
 *
 * Guide sections covered: §11 Functions, §18 Narrowing, §32 Async/Await,
 * §36 Discriminated Unions, §37 Overloading.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { createNoteRepository, type Repository } from "./repository.js";
import { Router, type RouteContext } from "./router.js";
import { isId, parseNoteInput, parseNotePatch } from "./validation.js";
import {
  METHODS,
  badRequest,
  created,
  noContent,
  notFound,
  ok,
  serverError,
  unprocessable,
  type HttpResult,
  type Method,
  type Note,
  type Status,
} from "./types.js";

const STARTED_AT = Date.now();

/** Thrown when the request body is not valid JSON. */
export class MalformedBodyError extends Error {
  constructor(cause: unknown) {
    super(`Malformed JSON body: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = "MalformedBodyError";
  }
}

const MAX_BODY_BYTES = 64 * 1024;

/** Streams the request body and parses it. Rejects anything over 64 kB. */
export function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise<unknown>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new MalformedBodyError(new Error(`body exceeds ${MAX_BODY_BYTES} bytes`)));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (raw.length === 0) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw) as unknown);
      } catch (cause) {
        reject(new MalformedBodyError(cause));
      }
    });
    req.on("error", (cause: unknown) => reject(new MalformedBodyError(cause)));
  });
}

// ── §37 Overloads: call it with a result, or with a raw status + body ────────
export function send(res: ServerResponse, result: HttpResult): void;
export function send(res: ServerResponse, status: Status, body: unknown): void;
export function send(res: ServerResponse, first: HttpResult | Status, second?: unknown): void {
  const result: HttpResult =
    typeof first === "number" ? { kind: "ok", status: first as 200 | 201, body: second } : first;

  switch (result.kind) {
    case "empty":
      res.writeHead(result.status).end();
      return;

    case "error": {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.writeHead(result.status).end(JSON.stringify(result.body));
      return;
    }

    case "ok": {
      // A handler may override Content-Type (the HTML index does), so the
      // caller's headers win over the JSON default.
      const headers = result.headers ?? {};
      const body =
        typeof result.body === "string" ? result.body : JSON.stringify(result.body);
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
      res.setHeader("Content-Length", Buffer.byteLength(body));
      res.writeHead(result.status).end(body);
      return;
    }

    default:
      // Exhaustiveness: an unhandled `kind` fails to compile.
      return assertNever(result);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled result kind: ${JSON.stringify(value)}`);
}

/** §18 — narrows the raw header to one of the known methods. */
function toMethod(raw: string | undefined): Method | undefined {
  const upper = raw?.toUpperCase();
  return METHODS.includes(upper as Method) ? (upper as Method) : undefined;
}

/** §18 — narrows the raw `Accept` header into a decision. */
export const wantsHtmlHeader = (accept: string | undefined): boolean =>
  (accept ?? "").includes("text/html");

const ENDPOINTS = [
  "GET    /            this document",
  "GET    /health      liveness probe",
  "GET    /notes       list notes (?tag=ts to filter)",
  "POST   /notes       create a note  { title, body?, tags? }",
  "GET    /notes/:id   read one note",
  "PATCH  /notes/:id   update a note  { title?, body?, tags? }",
  "DELETE /notes/:id   delete a note",
] as const;

const INDEX_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>06 · Notes API</title>
<style>body{font:16px/1.6 ui-monospace,Menlo,monospace;max-width:46rem;margin:3rem auto;padding:0 1rem}
h1{font-size:1.3rem}li{margin:.2rem 0}code{background:#f2f2f2;padding:.1rem .3rem;border-radius:3px}</style></head>
<body><h1>06 · Notes API</h1><p>TypeScript on Node's <code>http</code> module — no framework.</p>
<ul>${ENDPOINTS.map((line) => `<li><code>${line}</code></li>`).join("")}</ul>
<p>Try <a href="/notes"><code>/notes</code></a> or <a href="/health"><code>/health</code></a>.</p>
</body></html>`;

export function createRouter(repository: Repository<Note>): Router {
  const router = new Router();

  router.get("/", ({ headers }) => {
    if (wantsHtmlHeader(headers.accept)) {
      return {
        kind: "ok",
        status: 200,
        body: INDEX_HTML,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      } satisfies HttpResult;
    }
    return ok({ name: "notes-api", version: "1.0.0", endpoints: [...ENDPOINTS] });
  });

  router.get("/health", () => ok({ status: "ok", uptimeMs: Date.now() - STARTED_AT }));

  router.get("/notes", async ({ query }) => {
    const tag = query.get("tag");
    const notes = await repository.all();
    return ok(tag === null ? notes : notes.filter((note) => note.tags.includes(tag)));
  });

  router.post("/notes", async ({ body }) => {
    const parsed = parseNoteInput(body);
    if (!parsed.ok) return unprocessable("Invalid note", [...parsed.problems]);
    const note = await repository.create({
      id: "",
      title: parsed.value.title,
      body: parsed.value.body,
      tags: parsed.value.tags,
      createdAt: "",
      updatedAt: "",
    });
    return created(note, `/notes/${note.id}`);
  });

  router.get("/notes/:id", async ({ params }) => {
    if (!isId(params.id)) return badRequest("Invalid id");
    const note = await repository.find(params.id);
    return note === undefined ? notFound(`No note ${params.id}`) : ok(note);
  });

  router.patch("/notes/:id", async ({ params, body }) => {
    if (!isId(params.id)) return badRequest("Invalid id");
    const parsed = parseNotePatch(body);
    if (!parsed.ok) return unprocessable("Invalid patch", [...parsed.problems]);

    const updated = await repository.update(params.id, (existing) => ({
      ...existing,
      ...parsed.value,
      tags: parsed.value.tags ?? existing.tags,
    }));
    return updated === undefined ? notFound(`No note ${params.id}`) : ok(updated);
  });

  router.delete("/notes/:id", async ({ params }) => {
    if (!isId(params.id)) return badRequest("Invalid id");
    return (await repository.remove(params.id)) ? noContent() : notFound(`No note ${params.id}`);
  });

  // Nested params: `ctx.params` is typed as { id, commentId } from the pattern.
  router.get("/notes/:id/comments/:commentId", ({ params }) =>
    notFound(`Note ${params.id} has no comment ${params.commentId}`),
  );

  return router;
}

export function createApp(repository: Repository<Note> = createNoteRepository()): Server {
  const router = createRouter(repository);

  return createServer((req, res) => {
    void handle(req, res, router);
  });
}

async function handle(req: IncomingMessage, res: ServerResponse, router: Router): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const method = toMethod(req.method);

  if (method === undefined) {
    send(res, badRequest(`Unsupported method "${req.method ?? ""}"`));
    return;
  }

  try {
    const match = router.resolve(method, url.pathname);
    if (match.kind === "not-found") {
      send(res, notFound(`No route for ${method} ${url.pathname}`));
      return;
    }
    if (match.kind === "method-not-allowed") {
      res.setHeader("Allow", match.allow.join(", "));
      send(res, { kind: "error", status: 405, body: { error: "Method not allowed" } });
      return;
    }

    const context: RouteContext<string> = {
      method,
      path: url.pathname,
      params: match.params,
      query: url.searchParams,
      body: method === "GET" || method === "DELETE" ? undefined : await readBody(req),
      headers: req.headers,
    };
    send(res, await match.handler(context));
  } catch (error) {
    if (error instanceof MalformedBodyError) {
      send(res, badRequest(error.message));
      return;
    }
    console.error(error);
    send(res, serverError());
  }
}

export interface RunningServer {
  readonly url: string;
  readonly port: number;
  readonly repository: Repository<Note>;
  close(): Promise<void>;
}

export interface StartOptions {
  readonly port?: number;
  /** Bind 0.0.0.0 by default so the server is reachable from outside the host. */
  readonly host?: string;
  readonly repository?: Repository<Note>;
}

export function startServer(options: StartOptions = {}): Promise<RunningServer> {
  const repository = options.repository ?? createNoteRepository();
  const server = createApp(repository);
  const host = options.host ?? "0.0.0.0";

  return new Promise<RunningServer>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 0, host, () => {
      const address = server.address() as AddressInfo;
      const shown = host === "0.0.0.0" ? "localhost" : host;
      resolve({
        url: `http://${shown}:${address.port}`,
        port: address.port,
        repository,
        close: () =>
          new Promise<void>((done) => {
            server.closeAllConnections();
            server.close(() => done());
          }),
      });
    });
  });
}

