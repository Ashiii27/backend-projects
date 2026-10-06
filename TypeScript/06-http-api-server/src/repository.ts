/**
 * 06 · HTTP API — a generic async repository.
 *
 * Guide sections covered: §16 Generics, §32 Async/Await.
 */
import { randomUUID } from "node:crypto";
import type { Note } from "./types.js";

export interface Entity {
  readonly id: string;
}

export class Repository<T extends Entity> {
  readonly #rows = new Map<string, T>();
  readonly #stamp: (row: T, now: string) => T;

  /** `stamp` lets the entity type decide how timestamps are applied. */
  constructor(stamp: (row: T, now: string) => T) {
    this.#stamp = stamp;
  }

  async all(): Promise<T[]> {
    return [...this.#rows.values()];
  }

  async find(id: string): Promise<T | undefined> {
    return this.#rows.get(id);
  }

  async create(row: T): Promise<T> {
    const stamped = this.#stamp(row, new Date().toISOString());
    this.#rows.set(stamped.id, stamped);
    return stamped;
  }

  /** Returns `undefined` when the id does not exist, so callers can 404. */
  async update(id: string, patch: (existing: T) => T): Promise<T | undefined> {
    const existing = this.#rows.get(id);
    if (existing === undefined) return undefined;
    const next = this.#stamp(patch(existing), new Date().toISOString());
    this.#rows.set(id, next);
    return next;
  }

  async remove(id: string): Promise<boolean> {
    return this.#rows.delete(id);
  }

  get size(): number {
    return this.#rows.size;
  }
}

/** A repository pre-configured for notes: fills in the id and the timestamps. */
export function createNoteRepository(): Repository<Note> {
  return new Repository<Note>((row, now) => ({
    ...row,
    id: row.id === "" ? randomUUID() : row.id,
    createdAt: row.createdAt === "" ? now : row.createdAt,
    updatedAt: now,
  }));
}
