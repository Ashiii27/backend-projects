/**
 * 05 · Modules & CLI — namespaces.
 *
 * Guide section covered: §25 Modules & Namespaces.
 *
 * Namespaces predate ES modules and are mostly obsolete for application code —
 * `import` / `export` is what you want. They are still useful for two things:
 * grouping related declarations under one name, and *declaration merging*
 * (adding members to a type you do not own). Both are shown here.
 */

/** An instantiable namespace: it produces a real object at runtime. */
export namespace Validation {
  export class FieldError extends Error {
    constructor(
      readonly field: string,
      message: string,
    ) {
      super(`${field}: ${message}`);
      this.name = "FieldError";
    }
  }

  export function required<T>(value: T | null | undefined, field: string): T {
    if (value === null || value === undefined || value === "") {
      throw new FieldError(field, "is required");
    }
    return value;
  }

  /** Nested namespaces keep growing the same object. */
  export namespace Text {
    export function minLength(value: string, min: number, field: string): string {
      if (value.length < min) throw new FieldError(field, `must be at least ${min} characters`);
      return value;
    }

    export function matches(value: string, pattern: RegExp, field: string): string {
      if (!pattern.test(value)) throw new FieldError(field, `must match ${pattern}`);
      return value;
    }
  }

  export namespace Numbers {
    export function between(value: number, min: number, max: number, field: string): number {
      if (value < min || value > max) throw new FieldError(field, `must be between ${min} and ${max}`);
      return value;
    }
  }
}

// ── Declaration merging: extend a namespace from outside its definition ──────
export namespace Validation {
  export const VERSION = "1.0";
}

// ── Declaration merging on an *interface* declared inside a namespace ────────
export namespace Rules {
  export interface Shape {
    name: string;
  }
}
export namespace Rules {
  export interface Shape {
    sides: number;
  }
}

/** Merged: `Shape` now has both members. */
export const mergedShape: Rules.Shape = { name: "square", sides: 4 };

/** The runtime object the namespace compiled to. */
export const namespaceKeys: string[] = Object.keys(Validation).sort();
