/**
 * 02 · OOP Patterns — mixins: adding behaviour to a class without inheritance.
 *
 * Guide section covered: §28 Mixins (and §16 Generics, since a mixin is a
 * generic function over a constructor type).
 */

/** The constraint every mixin needs: "anything I can `new`". */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = object> = new (...args: any[]) => T;

// ── Mixin 1: adds a creation timestamp ───────────────────────────────────────
export function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class Timestamped extends Base {
    readonly createdAt = new Date();

    ageInMs(): number {
      return Date.now() - this.createdAt.getTime();
    }
  };
}

// ── Mixin 2: adds serialisation ─────────────────────────────────────────────
export function Serializable<TBase extends Constructor>(Base: TBase) {
  return class Serializable extends Base {
    toJSONString(): string {
      return JSON.stringify(this);
    }
  };
}

// ── Mixin 3: adds a tiny observer, constrained to bases that have an `id` ───
interface HasId {
  readonly id: string;
}

export function Observable<TBase extends Constructor<HasId>>(Base: TBase) {
  return class Observable extends Base {
    readonly #listeners = new Set<(id: string) => void>();

    onChange(listener: (id: string) => void): () => void {
      this.#listeners.add(listener);
      return () => this.#listeners.delete(listener);
    }

    /**
     * Public rather than protected: an exported *anonymous* class type cannot
     * carry private/protected members when declarations are emitted (TS4094).
     * Name a class explicitly if you need to keep it protected.
     */
    notifyChange(): void {
      for (const listener of this.#listeners) listener(this.id);
    }
  };
}

// ── The classes that get mixed into ─────────────────────────────────────────
export class Entity {
  constructor(public readonly id: string) {}
}

export class Document extends Entity {
  constructor(
    id: string,
    public title: string,
  ) {
    super(id);
  }
}

// ── Composing mixins: order matters, each one wraps the previous ─────────────
export class TrackedDocument extends Timestamped(Serializable(Observable(Document))) {
  rename(title: string): void {
    this.title = title;
    this.notifyChange();
  }
}

/**
 * Extracting the *instance type* of a mixed class is a common need — this is
 * what `InstanceType` does (§19 Utility Types).
 */
export type TrackedDocumentInstance = InstanceType<typeof TrackedDocument>;

/** A helper that works on any mixin stack, thanks to the `Constructor` type. */
export function describe(Ctor: Constructor): string {
  let chain: string[] = [];
  let current: unknown = Ctor;
  while (typeof current === "function" && current.name !== "") {
    chain.unshift(current.name);
    current = Object.getPrototypeOf(current);
  }
  return chain.join(" → ");
}
