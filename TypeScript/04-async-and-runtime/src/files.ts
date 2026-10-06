/**
 * 04 · Async & Runtime — Node's file APIs, fully typed, plus `using` on a
 * real file handle.
 *
 * Guide sections covered: §16 Generics, §32 Async/Await, §42 `using`.
 */
import { randomUUID } from "node:crypto";
import { open, readFile, writeFile, appendFile, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** §42 — a file handle that also implements `AsyncDisposable`. */
export class JsonFile<T> implements AsyncDisposable {
  #handle: Awaited<ReturnType<typeof open>> | undefined;

  private constructor(
    readonly path: string,
    readonly id: string,
  ) {}

  static async create<T>(path: string): Promise<JsonFile<T>> {
    const file = new JsonFile<T>(path, randomUUID());
    file.#handle = await open(path, "a+");
    return file;
  }

  /** Read every JSON line, skipping blanks. */
  async readAll(): Promise<T[]> {
    const raw = await readFile(this.path, "utf8");
    return raw
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as T);
  }

  async append(value: T): Promise<void> {
    await appendFile(this.path, `${JSON.stringify(value)}\n`, "utf8");
  }

  async sizeBytes(): Promise<number> {
    return (await stat(this.path)).size;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.#handle?.close();
    this.#handle = undefined;
  }
}

/** A scratch directory that deletes itself when it goes out of scope. */
export class TempDir implements AsyncDisposable {
  readonly #files = new Set<string>();

  private constructor(readonly path: string) {}

  static async create(prefix = "ts-04-"): Promise<TempDir> {
    const { mkdtemp } = await import("node:fs/promises");
    return new TempDir(await mkdtemp(join(tmpdir(), prefix)));
  }

  /** Track a path inside this directory. */
  file(name: string): string {
    const full = join(this.path, name);
    this.#files.add(full);
    return full;
  }

  async write(name: string, contents: string): Promise<string> {
    const full = this.file(name);
    await writeFile(full, contents, "utf8");
    return full;
  }

  async list(): Promise<string[]> {
    return (await readdir(this.path)).sort();
  }

  async [Symbol.asyncDispose](): Promise<void> {
    const { rm } = await import("node:fs/promises");
    await rm(this.path, { recursive: true, force: true });
  }
}

/** Reading a file line by line without buffering the whole thing. */
export async function* readLines(path: string): AsyncGenerator<string, void, unknown> {
  const handle = await open(path, "r");
  try {
    const stream = handle.createReadStream({ encoding: "utf8" });
    let buffer = "";
    for await (const chunk of stream) {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) yield line;
    }
    if (buffer.length > 0) yield buffer;
  } finally {
    await handle.close();
  }
}
