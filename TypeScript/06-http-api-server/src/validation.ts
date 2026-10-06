/**
 * 06 · HTTP API — turning `unknown` request bodies into typed values.
 *
 * Guide sections covered: §17 Assertions, §18 Narrowing, §19 Utility Types,
 * §36 Discriminated Unions.
 */
import type { NoteInput, NotePatch } from "./types.js";

export type ValidationResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly problems: readonly string[] };

const valid = <T>(value: T): ValidationResult<T> => ({ ok: true, value });
const invalid = (problems: string[]): ValidationResult<never> => ({ ok: false, problems });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `Required<NoteInput>` — every field present and correctly typed (§19). */
export function parseNoteInput(input: unknown): ValidationResult<Required<NoteInput>> {
  if (!isRecord(input)) return invalid(["body must be a JSON object"]);

  const problems: string[] = [];
  if (typeof input.title !== "string" || input.title.trim().length === 0) {
    problems.push("title must be a non-empty string");
  }
  if (input.body !== undefined && typeof input.body !== "string") {
    problems.push("body must be a string");
  }
  if (input.tags !== undefined && (!Array.isArray(input.tags) || input.tags.some((t) => typeof t !== "string"))) {
    problems.push("tags must be an array of strings");
  }
  if (problems.length > 0) return invalid(problems);

  // Every field has now been proven, so this assertion is sound.
  return valid({
    title: (input.title as string).trim(),
    body: typeof input.body === "string" ? input.body : "",
    tags: Array.isArray(input.tags) ? (input.tags as string[]) : [],
  });
}

/** `Partial<NoteInput>` for PATCH — but at least one field must be present. */
export function parseNotePatch(input: unknown): ValidationResult<NotePatch> {
  if (!isRecord(input)) return invalid(["body must be a JSON object"]);

  const problems: string[] = [];
  const patch: Record<string, unknown> = {};

  if (input.title !== undefined) {
    if (typeof input.title !== "string" || input.title.trim().length === 0) {
      problems.push("title must be a non-empty string");
    } else patch.title = input.title.trim();
  }
  if (input.body !== undefined) {
    if (typeof input.body !== "string") problems.push("body must be a string");
    else patch.body = input.body;
  }
  if (input.tags !== undefined) {
    if (!Array.isArray(input.tags) || input.tags.some((t) => typeof t !== "string")) {
      problems.push("tags must be an array of strings");
    } else patch.tags = input.tags as string[];
  }

  if (problems.length > 0) return invalid(problems);
  if (Object.keys(patch).length === 0) return invalid(["at least one field must be provided"]);
  return valid(patch as NotePatch);
}

/** A URL-safe id is anything non-empty without a slash in it. */
export function isId(value: string): boolean {
  return value.length > 0 && !value.includes("/");
}
