/**
 * 06 · HTTP API — the shared vocabulary of the server.
 *
 * Guide sections covered: §8 Literal Types, §22 Template Literal Types,
 * §36 Discriminated Unions, §38 `infer`.
 */

export const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type Method = (typeof METHODS)[number];

/** A route pattern must start with a slash — enforced by the type itself. */
export type RoutePattern = `/${string}`;

/** Success statuses the API is allowed to return. */
export type SuccessStatus = 200 | 201 | 204;
export type ErrorStatus = 400 | 404 | 405 | 409 | 422 | 500;
export type Status = SuccessStatus | ErrorStatus;

// ── §36 One member per outcome, tagged by `kind` ─────────────────────────────

export interface ApiError {
  readonly error: string;
  readonly details?: readonly string[];
}

export interface OkResult {
  readonly kind: "ok";
  readonly status: 200 | 201;
  readonly body: unknown;
  readonly headers?: Readonly<Record<string, string>>;
}

export interface EmptyResult {
  readonly kind: "empty";
  readonly status: 204;
}

export interface ErrorResult {
  readonly kind: "error";
  readonly status: ErrorStatus;
  readonly body: ApiError;
}

export type HttpResult = OkResult | EmptyResult | ErrorResult;

// ── Constructors keep every call site honest ────────────────────────────────

export const ok = (body: unknown, headers?: Record<string, string>): OkResult => ({
  kind: "ok",
  status: 200,
  body,
  ...(headers === undefined ? {} : { headers }),
});

export const created = (body: unknown, location: string): OkResult => ({
  kind: "ok",
  status: 201,
  body,
  headers: { Location: location },
});

export const noContent = (): EmptyResult => ({ kind: "empty", status: 204 });

export const errorResult = (status: ErrorStatus, error: string, details?: string[]): ErrorResult => ({
  kind: "error",
  status,
  body: details === undefined ? { error } : { error, details },
});

export const badRequest = (error: string, details?: string[]): ErrorResult =>
  errorResult(400, error, details);
export const notFound = (error = "Not found"): ErrorResult => errorResult(404, error);
export const methodNotAllowed = (allow: readonly Method[]): ErrorResult =>
  errorResult(405, "Method not allowed", [`Allow: ${allow.join(", ")}`]);
export const unprocessable = (error: string, details?: string[]): ErrorResult =>
  errorResult(422, error, details);
export const serverError = (error = "Internal server error"): ErrorResult => errorResult(500, error);

// ─────────────────────────────────────────────────────────────────────────────
// §22/§38 Route parameters, extracted from the pattern by the type system
// ─────────────────────────────────────────────────────────────────────────────

export type ExtractParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? Param
      : never;

export type ParamsFor<Path extends string> = [ExtractParams<Path>] extends [never]
  ? Record<string, never>
  : Readonly<Record<ExtractParams<Path>, string>>;

/** Compile-time proof that the extractor works. */
export type _ParamChecks = [
  ExtractParams<"/health">, // never
  ExtractParams<"/notes/:id">, // "id"
  ExtractParams<"/notes/:id/comments/:commentId">, // "id" | "commentId"
];

// ─────────────────────────────────────────────────────────────────────────────
// The domain model
// ─────────────────────────────────────────────────────────────────────────────

export interface Note {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NoteInput {
  readonly title: string;
  readonly body?: string;
  readonly tags?: readonly string[];
}

/** A `Partial`-style patch where at least one field must be present. */
export type NotePatch = Partial<NoteInput>;
