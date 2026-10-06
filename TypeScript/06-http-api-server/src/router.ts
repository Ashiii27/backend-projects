/**
 * 06 · HTTP API — a router whose route patterns type their own parameters.
 *
 * Guide sections covered: §16 Generics, §22 Template Literal Types,
 * §36 Discriminated Unions, §38 `infer`.
 */
import type { IncomingHttpHeaders } from "node:http";
import {
  methodNotAllowed,
  notFound,
  type HttpResult,
  type Method,
  type RoutePattern,
  type ExtractParams,
} from "./types.js";

export interface RouteContext<P extends string> {
  readonly method: Method;
  readonly path: string;
  readonly params: Readonly<Record<P, string>>;
  readonly query: URLSearchParams;
  readonly body: unknown;
  readonly headers: IncomingHttpHeaders;
}

export type Handler<P extends string> = (ctx: RouteContext<P>) => HttpResult | Promise<HttpResult>;

interface Route {
  readonly method: Method;
  readonly pattern: string;
  readonly regex: RegExp;
  readonly keys: readonly string[];
  // The public `on()` signature keeps this precise; internally one erased
  // handler type is enough because `params` is rebuilt at runtime anyway.
  readonly handler: Handler<string>;
}

/** `/notes/:id/comments/:commentId` → a regex plus the list of captured names. */
export function compilePattern(pattern: string): { regex: RegExp; keys: string[] } {
  const keys: string[] = [];
  const source = pattern
    .split("/")
    .map((segment) => {
      if (!segment.startsWith(":")) return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      keys.push(segment.slice(1));
      return "([^/]+)";
    })
    .join("/");
  return { regex: new RegExp(`^${source}$`), keys };
}

export type MatchResult =
  | { readonly kind: "match"; readonly params: Readonly<Record<string, string>>; readonly handler: Handler<string> }
  | { readonly kind: "method-not-allowed"; readonly allow: readonly Method[] }
  | { readonly kind: "not-found" };

export class Router {
  readonly #routes: Route[] = [];

  /**
   * `Path extends RoutePattern` + `ExtractParams<Path>` means the handler's
   * `ctx.params` is typed from the pattern string alone — write `"/notes/:id"`
   * and `ctx.params.id` is a `string`, while `ctx.params.nope` is an error.
   */
  on<Path extends RoutePattern>(method: Method, path: Path, handler: Handler<ExtractParams<Path>>): this {
    const { regex, keys } = compilePattern(path);
    this.#routes.push({ method, pattern: path, regex, keys, handler: handler as Handler<string> });
    return this;
  }

  get<Path extends RoutePattern>(path: Path, handler: Handler<ExtractParams<Path>>): this {
    return this.on("GET", path, handler);
  }

  post<Path extends RoutePattern>(path: Path, handler: Handler<ExtractParams<Path>>): this {
    return this.on("POST", path, handler);
  }

  patch<Path extends RoutePattern>(path: Path, handler: Handler<ExtractParams<Path>>): this {
    return this.on("PATCH", path, handler);
  }

  delete<Path extends RoutePattern>(path: Path, handler: Handler<ExtractParams<Path>>): this {
    return this.on("DELETE", path, handler);
  }

  get patterns(): string[] {
    return this.#routes.map((route) => `${route.method} ${route.pattern}`);
  }

  resolve(method: string, path: string): MatchResult {
    let pathMatched = false;
    const allow: Method[] = [];

    for (const route of this.#routes) {
      const captured = route.regex.exec(path);
      if (captured === null) continue;
      pathMatched = true;

      if (route.method !== method) {
        allow.push(route.method);
        continue;
      }

      const params: Record<string, string> = {};
      route.keys.forEach((key, index) => {
        params[key] = captured[index + 1] ?? "";
      });
      return { kind: "match", params, handler: route.handler };
    }

    return pathMatched ? { kind: "method-not-allowed", allow } : { kind: "not-found" };
  }

  /** Convenience for callers that want an `HttpResult` rather than a match. */
  resolveOrFail(method: string, path: string): MatchResult | HttpResult {
    const match = this.resolve(method, path);
    if (match.kind === "match") return match;
    return match.kind === "method-not-allowed" ? methodNotAllowed(match.allow) : notFound(`No route for ${path}`);
  }
}
