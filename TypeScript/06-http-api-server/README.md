# 06 · HTTP API Server

A typed REST API built directly on Node's `http` module — no framework, no
runtime dependencies. The router types each handler's `params` from the route
pattern string alone.

**Covers** §8 Literal Types · §11 Functions · §16 Generics · §18 Narrowing ·
§22 Template Literal Types · §32 Async/Await · §36 Discriminated Unions ·
§37 Overloading · §38 `infer`

```bash
npm run start:06                          # listens on 0.0.0.0:3000
npm test                                  # 15 tests, incl. real HTTP requests
```

```bash
curl localhost:3000/health
curl -X POST localhost:3000/notes -H 'content-type: application/json' \
     -d '{"title":"Learn TS","tags":["ts"]}'
curl localhost:3000/notes?tag=ts
```

| File | What it demonstrates |
| --- | --- |
| `src/types.ts` | `HttpResult` discriminated union with typed status codes, `RoutePattern = \`/${string}\``, `ExtractParams` built from `infer` |
| `src/router.ts` | `Path extends RoutePattern` so `ctx.params` is typed from the pattern; runtime pattern compilation; 404 vs 405 resolution |
| `src/validation.ts` | `unknown` → typed request bodies, collecting every problem at once |
| `src/repository.ts` | generic async repository with an injected timestamp function |
| `src/server.ts` | overloaded `send()`, body streaming with a size limit, content negotiation, `assertNever` exhaustiveness, ephemeral-port startup |
| `src/index.ts` | barrel re-exports + graceful shutdown |
| `src/server.test.ts` | boots the server on port 0 and drives it with `fetch` |

### Three details worth reading

- **`ctx.params.id` is a `string` and `ctx.params.nope` is a compile error**,
  derived purely from `"/notes/:id"`. Add a `:commentId` segment and the
  handler's parameter type follows.
- **405 vs 404 is decided by the router**, which reports every method registered
  for a matched path so the `Allow` header is accurate (`GET, POST`).
- **A handler can override `Content-Type`.** `GET /` returns JSON by default and
  HTML when `Accept: text/html` is sent; `send()` applies the caller's headers
  after the JSON default so the override wins.
