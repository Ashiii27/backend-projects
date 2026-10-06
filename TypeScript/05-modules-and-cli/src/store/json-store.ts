/**
 * 05 · Modules & CLI — a tiny generic JSON persistence layer.
 *
 * Guide sections covered: §16 Generics, §25 Modules, §32 Async/Await.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface JsonStoreOptions {
  /** Pretty-print the file. Off by default to keep the store compact. */
  indent?: number;
}

/**
 * `T` is the shape of a single record; the file holds `T[]`. The store knows
 * nothing about tasks — that is the point of making it generic.
 */
export class JsonStore<T> {
  readonly #path: string;
  readonly #indent: number;

  constructor(path: string, options: JsonStoreOptions = {}) {
    this.#path = path;
    this.#indent = options.indent ?? 0;
  }

  get path(): string {
    return this.#path;
  }

  async load(): Promise<T[]> {
    try {
      const raw = await readFile(this.#path, "utf8");
      if (raw.trim().length === 0) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch (error) {
      // ENOENT just means "first run" — anything else is a real problem.
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  async save(rows: readonly T[]): Promise<void> {
    await mkdir(dirname(this.#path), { recursive: true });
    const body = JSON.stringify(rows, null, this.#indent) + "\n";
    await writeFile(this.#path, body, "utf8");
  }

  /** Read-modify-write in one call. */
  async update(transform: (rows: T[]) => T[]): Promise<T[]> {
    const rows = await this.load();
    const next = transform(rows);
    await this.save(next);
    return next;
  }
}
