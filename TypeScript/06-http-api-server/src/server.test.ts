import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { createNoteRepository } from "./repository.js";
import { Router, compilePattern } from "./router.js";
import { startServer, wantsHtmlHeader, type RunningServer } from "./server.js";
import { isId, parseNoteInput, parseNotePatch } from "./validation.js";
import type { Note } from "./types.js";

let server: RunningServer;

before(async () => {
  server = await startServer({ port: 0, host: "127.0.0.1" });
});

after(async () => {
  await server.close();
});

// `exactOptionalPropertyTypes` means `{ headers: undefined }` is not the same as
// `{}`, so the property is only added when there is something to send.
const get = (path: string, headers?: Record<string, string>): Promise<Response> =>
  fetch(`${server.url}${path}`, headers === undefined ? {} : { headers });

const send = (method: string, path: string, body?: unknown): Promise<Response> =>
  fetch(`${server.url}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });

describe("router.ts — pattern compilation and resolution", () => {
  it("compiles patterns into regexes plus key names", () => {
    assert.deepEqual(compilePattern("/health"), { regex: /^\/health$/, keys: [] });
    const nested = compilePattern("/notes/:id/comments/:commentId");
    assert.deepEqual(nested.keys, ["id", "commentId"]);
    assert.ok(nested.regex.test("/notes/abc/comments/xyz"));
    assert.ok(!nested.regex.test("/notes/abc/comments"));
  });

  it("distinguishes no-match from method-not-allowed", () => {
    const router = new Router()
      .get("/things/:id", () => ({ kind: "ok", status: 200, body: null }))
      .post("/things", () => ({ kind: "ok", status: 200, body: null }));

    const match = router.resolve("GET", "/things/42");
    assert.equal(match.kind, "match");
    if (match.kind === "match") assert.deepEqual(match.params, { id: "42" });

    const wrong = router.resolve("GET", "/things");
    assert.equal(wrong.kind, "method-not-allowed");
    if (wrong.kind === "method-not-allowed") assert.deepEqual([...wrong.allow], ["POST"]);

    assert.equal(router.resolve("GET", "/nope").kind, "not-found");
    assert.deepEqual(router.patterns, ["GET /things/:id", "POST /things"]);
  });
});

describe("validation.ts — request bodies", () => {
  it("accepts a complete note and fills defaults", () => {
    const parsed = parseNoteInput({ title: "  hi  " });
    assert.ok(parsed.ok);
    if (parsed.ok) assert.deepEqual(parsed.value, { title: "hi", body: "", tags: [] });
  });

  it("collects every problem at once", () => {
    const parsed = parseNoteInput({ title: 42, body: [], tags: "nope" });
    assert.ok(!parsed.ok);
    if (!parsed.ok) {
      assert.deepEqual([...parsed.problems], [
        "title must be a non-empty string",
        "body must be a string",
        "tags must be an array of strings",
      ]);
    }
    assert.deepEqual(parseNoteInput("nope"), { ok: false, problems: ["body must be a JSON object"] });
  });

  it("requires at least one field on a patch", () => {
    assert.deepEqual(parseNotePatch({}), { ok: false, problems: ["at least one field must be provided"] });
    const parsed = parseNotePatch({ title: "new" });
    assert.ok(parsed.ok);
    if (parsed.ok) assert.deepEqual(parsed.value, { title: "new" });
  });

  it("validates ids", () => {
    assert.ok(isId("abc-123"));
    assert.ok(!isId(""));
    assert.ok(!isId("a/b"));
  });
});

describe("server.ts — content negotiation helper", () => {
  it("reads the Accept header", () => {
    assert.ok(wantsHtmlHeader("text/html,application/json"));
    assert.ok(!wantsHtmlHeader("application/json"));
    assert.ok(!wantsHtmlHeader(undefined));
  });
});

describe("the running HTTP API", () => {
  it("serves a JSON index, and HTML when asked", async () => {
    const json = await get("/");
    assert.equal(json.status, 200);
    assert.match(json.headers.get("content-type") ?? "", /application\/json/);
    const payload = (await json.json()) as { name: string; endpoints: string[] };
    assert.equal(payload.name, "notes-api");
    assert.ok(payload.endpoints.length >= 7);

    const html = await get("/", { Accept: "text/html" });
    assert.match(html.headers.get("content-type") ?? "", /text\/html/);
    assert.match(await html.text(), /Notes API/);
  });

  it("answers the health probe", async () => {
    const res = await get("/health");
    assert.equal(res.status, 200);
    const body = (await res.json()) as { status: string; uptimeMs: number };
    assert.equal(body.status, "ok");
    assert.ok(body.uptimeMs >= 0);
  });

  it("runs a full CRUD lifecycle", async () => {
    const empty = await get("/notes");
    const initial = (await empty.json()) as Note[];

    const create = await send("POST", "/notes", { title: "Learn TS", body: "generics", tags: ["ts"] });
    assert.equal(create.status, 201);
    assert.match(create.headers.get("location") ?? "", /^\/notes\/[0-9a-f-]{36}$/);
    const note = (await create.json()) as Note;
    assert.equal(note.title, "Learn TS");
    assert.deepEqual(note.tags, ["ts"]);
    assert.notEqual(note.createdAt, "");

    const one = await get(`/notes/${note.id}`);
    assert.equal(one.status, 200);
    assert.equal(((await one.json()) as Note).id, note.id);

    const filtered = await get("/notes?tag=ts");
    assert.equal(((await filtered.json()) as Note[]).length, initial.length + 1);
    const none = (await (await get("/notes?tag=nope")).json()) as Note[];
    assert.equal(none.length, 0);

    const patched = await send("PATCH", `/notes/${note.id}`, { title: "Learn TS well", tags: ["ts", "deep"] });
    assert.equal(patched.status, 200);
    const updated = (await patched.json()) as Note;
    assert.equal(updated.title, "Learn TS well");
    assert.deepEqual(updated.tags, ["ts", "deep"]);
    assert.equal(updated.body, "generics"); // untouched fields survive
    assert.notEqual(updated.updatedAt, note.updatedAt);

    const deleted = await send("DELETE", `/notes/${note.id}`);
    assert.equal(deleted.status, 204);
    assert.equal(deleted.headers.get("content-length"), null);
    assert.equal((await get(`/notes/${note.id}`)).status, 404);
    assert.equal((await send("DELETE", `/notes/${note.id}`)).status, 404);
  });

  it("rejects invalid input with 422 and a list of problems", async () => {
    const res = await send("POST", "/notes", { title: "" });
    assert.equal(res.status, 422);
    const body = (await res.json()) as { error: string; details: string[] };
    assert.equal(body.error, "Invalid note");
    assert.deepEqual(body.details, ["title must be a non-empty string"]);

    const patch = await send("PATCH", "/notes/whatever", {});
    assert.equal(patch.status, 422);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await send("POST", "/notes", "{not json");
    assert.equal(res.status, 400);
    assert.match(((await res.json()) as { error: string }).error, /Malformed JSON body/);
  });

  it("returns 404 and 405 with an Allow header", async () => {
    const missing = await get("/nope");
    assert.equal(missing.status, 404);
    assert.equal(((await missing.json()) as { error: string }).error, "No route for GET /nope");

    const wrong = await send("PUT", "/notes", {});
    assert.equal(wrong.status, 405);
    // Every method registered for that path is advertised, not just one.
    assert.equal(wrong.headers.get("allow"), "GET, POST");
  });

  it("types nested route parameters all the way to the response", async () => {
    const res = await get("/notes/abc/comments/xyz");
    assert.equal(res.status, 404);
    assert.equal(
      ((await res.json()) as { error: string }).error,
      "Note abc has no comment xyz",
    );
  });

  it("seeds the repository directly, bypassing HTTP", async () => {
    const repository = createNoteRepository();
    const note = await repository.create({
      id: "",
      title: "direct",
      body: "",
      tags: [],
      createdAt: "",
      updatedAt: "",
    });
    assert.equal(note.id.length, 36);
    assert.equal(repository.size, 1);
    assert.equal((await repository.find(note.id))?.title, "direct");
    assert.equal(await repository.update("missing", (n) => n), undefined);
    assert.equal(await repository.remove(note.id), true);
    assert.equal(repository.size, 0);
  });
});
