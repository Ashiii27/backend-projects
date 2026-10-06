/**
 * 04 · Async & Runtime — explicit resource management with `using`.
 *
 * Guide section covered: §42 The `using` keyword (Disposable Resources).
 *
 * Needs TypeScript 5.2+ and `lib: ["ESNext.Disposable"]` (see tsconfig.base.json).
 * The idea: any object with a `[Symbol.dispose]()` method can be bound with
 * `using`, and the runtime calls that method when the scope exits — including
 * when it exits by throwing. `await using` does the same for async cleanup.
 */

export const cleanupLog: string[] = [];

/** A synchronous resource. */
export class Span implements Disposable {
  readonly startedAt = Date.now();
  #closed = false;

  constructor(readonly name: string) {
    cleanupLog.push(`open ${name}`);
  }

  get isClosed(): boolean {
    return this.#closed;
  }

  /** `[Symbol.dispose]` is what makes `using span = ...` legal. */
  [Symbol.dispose](): void {
    this.#closed = true;
    cleanupLog.push(`close ${this.name}`);
  }
}

/** An async resource — cleanup itself needs to await. */
export class Connection implements AsyncDisposable {
  #open = true;

  constructor(readonly dsn: string) {
    cleanupLog.push(`connect ${dsn}`);
  }

  get isOpen(): boolean {
    return this.#open;
  }

  async query(sql: string): Promise<string[]> {
    if (!this.#open) throw new Error("Connection is closed");
    return [`result of: ${sql}`];
  }

  async [Symbol.asyncDispose](): Promise<void> {
    this.#open = false;
    // Real drivers close sockets here; we just yield to the event loop.
    await new Promise((resolve) => setImmediate(resolve));
    cleanupLog.push(`disconnect ${this.dsn}`);
  }
}

/** Wraps any "close" callback so legacy APIs work with `using`. */
export function toDisposable(name: string, close: () => void): Disposable {
  cleanupLog.push(`open ${name}`);
  return {
    [Symbol.dispose]() {
      cleanupLog.push(`close ${name}`);
      close();
    },
  };
}

/**
 * Disposal runs in reverse order of declaration, and it runs even when the
 * scope throws — exactly like `defer` in Go or `with` in Python.
 */
export function nestedScopes(): string[] {
  const before = cleanupLog.length;
  {
    using outer = new Span("outer");
    using inner = new Span("inner");
    cleanupLog.push(`inside ${outer.name}/${inner.name}`);
    try {
      throw new Error("boom");
    } catch {
      cleanupLog.push("caught");
    }
  }
  return cleanupLog.slice(before);
}

export async function asyncScope(): Promise<string[]> {
  const before = cleanupLog.length;
  {
    await using connection = new Connection("postgres://localhost/demo");
    await connection.query("SELECT 1");
  }
  return cleanupLog.slice(before);
}
