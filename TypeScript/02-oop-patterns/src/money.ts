/**
 * 02 · OOP Patterns — an immutable value object.
 *
 * Guide sections covered: §13 Classes, §14 Access Modifiers, §30 Symbols.
 */

export type Currency = "GBP" | "USD" | "EUR";

/** An interface a class can promise to fulfil (§5 + §13). */
export interface Comparable<T> {
  equals(other: T): boolean;
}

export interface MoneyLike {
  readonly amount: number;
  readonly currency: Currency;
}

/**
 * A value object:
 * - `readonly` properties  → no reassignment after construction (§14)
 * - `#cents`               → a *runtime* private field (JS syntax). Unlike the
 *                            TS `private` keyword it is unreachable even from
 *                            outside code that casts the type away.
 * - static factories       → named constructors instead of overloading
 */
export class Money implements Comparable<Money>, MoneyLike {
  readonly #cents: number;
  readonly currency: Currency;

  /** Private constructor — instances only ever come from the static factories. */
  private constructor(cents: number, currency: Currency) {
    this.#cents = Math.round(cents);
    this.currency = currency;
  }

  // ── static factories ──────────────────────────────────────────────────────
  static of(amount: number, currency: Currency = "GBP"): Money {
    return new Money(amount * 100, currency);
  }

  static zero(currency: Currency = "GBP"): Money {
    return new Money(0, currency);
  }

  static parse(text: string): Money {
    const match = /^(GBP|USD|EUR)\s*(-?\d+(?:\.\d{1,2})?)$/.exec(text.trim());
    if (!match) throw new TypeError(`Cannot parse money from "${text}"`);
    const currency = String(match[1]) as Currency; // the regex already proved the set
    const amount = Number.parseFloat(String(match[2]));
    return Money.of(amount, currency);
  }

  /** Static initialisation block — runs once, when the class is defined. */
  static readonly SUPPORTED: readonly Currency[] = ["GBP", "USD", "EUR"];

  // ── instance API ──────────────────────────────────────────────────────────
  get amount(): number {
    return this.#cents / 100;
  }

  get isZero(): boolean {
    return this.#cents === 0;
  }

  add(other: Money): Money {
    return this.#combine(other, this.#cents + other.cents);
  }

  subtract(other: Money): Money {
    return this.#combine(other, this.#cents - other.cents);
  }

  multiply(factor: number): Money {
    return new Money(this.#cents * factor, this.currency);
  }

  /** Getter with a guard: negative money is never allowed out. */
  get absolute(): Money {
    return this.#cents < 0 ? this.multiply(-1) : this;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.#cents === other.cents;
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  /** §30 — well-known symbol hooks let the object behave like a primitive. */
  toJSON(): MoneyLike {
    return { amount: this.amount, currency: this.currency };
  }

  [Symbol.toPrimitive](hint: string): string | number {
    return hint === "number" ? this.amount : this.toString();
  }

  /** Internal: `#cents` is readable only from inside the class. */
  private get cents(): number {
    return this.#cents;
  }

  #combine(other: Money, cents: number): Money {
    if (this.currency !== other.currency) {
      throw new TypeError(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
    return new Money(cents, this.currency);
  }
}
