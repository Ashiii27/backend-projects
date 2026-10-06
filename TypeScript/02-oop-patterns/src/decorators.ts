/**
 * 02 · OOP Patterns — decorators.
 *
 * Guide section covered: §27 Decorators.
 *
 * These are the **standard ECMAScript decorators** shipped in TypeScript 5.0+.
 * They need NO `experimentalDecorators` flag. The older, TypeScript-only form
 * (`experimentalDecorators: true`, `reflect-metadata`) still exists in the wild
 * — Angular and NestJS use it — but new code should use this form.
 *
 * What standard decorators can decorate:
 *   classes, methods, getters/setters, `accessor` fields, and plain fields.
 * What they cannot decorate (unlike the legacy form):
 *   constructor *parameters*, and a `constructor` itself.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyFunction = (...args: any[]) => any;

/** Every decorator receives the decorated value plus a context object. */
export const decoratorLog: string[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// 1. Method decorator (used directly, no factory)
// ─────────────────────────────────────────────────────────────────────────────

export function traced(target: AnyFunction, context: ClassMethodDecoratorContext): AnyFunction {
  const name = String(context.name);
  decoratorLog.push(`decorated method ${name}`);

  return function replacement(this: unknown, ...args: unknown[]): unknown {
    decoratorLog.push(`→ ${name}(${args.map(String).join(", ")})`);
    return target.apply(this, args);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Decorator *factory* — a function returning the decorator, so it can take
//    arguments: `@retry(3)`
// ─────────────────────────────────────────────────────────────────────────────

export function retry(attempts: number) {
  return function retryDecorator(target: AnyFunction, context: ClassMethodDecoratorContext): AnyFunction {
    const name = String(context.name);
    return async function replacement(this: unknown, ...args: unknown[]): Promise<unknown> {
      let lastError: unknown;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await target.apply(this, args);
        } catch (error) {
          lastError = error;
          decoratorLog.push(`${name} attempt ${attempt} failed`);
        }
      }
      throw lastError;
    };
  };
}

/** Counts how many times a method has been called, per instance. */
export function counted(target: AnyFunction, context: ClassMethodDecoratorContext): AnyFunction {
  const key = Symbol(`calls:${String(context.name)}`);
  return function replacement(this: Record<symbol, number>, ...args: unknown[]): unknown {
    this[key] = (this[key] ?? 0) + 1;
    return target.apply(this, args);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. `accessor` decorator — the standard replacement for a getter/setter pair
//    that needs validation. `accessor` creates a private field plus get/set.
// ─────────────────────────────────────────────────────────────────────────────

export function clamp(min: number, max: number) {
  return function clampDecorator(
    target: ClassAccessorDecoratorTarget<object, number>,
    _context: ClassAccessorDecoratorContext<object, number>,
  ): ClassAccessorDecoratorResult<object, number> {
    const limit = (value: number): number => Math.min(max, Math.max(min, value));
    return {
      // `init` runs on the *initial* value at construction time.
      init: limit,
      set(value: number) {
        target.set.call(this, limit(value));
      },
    };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Class decorator — can replace the class or register side effects.
// ─────────────────────────────────────────────────────────────────────────────

export const registry = new Map<string, unknown>();

export function registered(name: string) {
  return function registerDecorator<T extends new (...args: any[]) => object>(
    target: T,
    context: ClassDecoratorContext,
  ): T {
    decoratorLog.push(`registered class ${String(context.name)} as "${name}"`);
    registry.set(name, target);
    return target;
  };
}

/** `addInitializer` defers work until the class is fully defined. */
export function sealed<T extends new (...args: any[]) => object>(
  target: T,
  context: ClassDecoratorContext,
): T {
  // In a class decorator, initializers run after the class is fully defined and
  // `this` is the class itself.
  context.addInitializer(function sealIt(this: unknown) {
    Object.freeze((this as { prototype: object }).prototype);
  });
  return target;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. A class that puts all of the above to work
// ─────────────────────────────────────────────────────────────────────────────

@registered("player")
@sealed
export class Player {
  /** `accessor` + a decorator = a validated, auto-generated get/set pair. */
  @clamp(0, 100)
  accessor health = 100;

  @clamp(0, 10)
  accessor level = 1;

  #flakyCalls = 0;

  @traced
  heal(amount: number): number {
    this.health += amount; // clamped by the accessor decorator
    return this.health;
  }

  @counted
  @traced
  hit(damage: number): number {
    this.health -= damage;
    return this.health;
  }

  /** Fails twice, then succeeds — proves `@retry` really re-runs the method. */
  @retry(3)
  async connect(): Promise<string> {
    this.#flakyCalls += 1;
    if (this.#flakyCalls < 3) throw new Error("socket closed");
    return "connected";
  }

  get calls(): number {
    // `@counted` stored the tally on a symbol key of the instance.
    const key = Object.getOwnPropertySymbols(this).find((s) =>
      s.description?.startsWith("calls:"),
    );
    return key ? (this as unknown as Record<symbol, number>)[key] ?? 0 : 0;
  }
}
