/**
 * 02 · OOP Patterns — inheritance hierarchies: abstract classes, access
 * modifiers, `override`, statics, parameter properties and the template-method
 * pattern.
 *
 * Guide sections covered: §9 Enums, §13 Classes, §14 Access Modifiers,
 * §15 Abstract Classes, §19 Utility Types (used in the processor).
 */
import { Money, type Currency } from "./money.js";

export enum PaymentStatus {
  Pending = "PENDING",
  Authorised = "AUTHORISED",
  Captured = "CAPTURED",
  Failed = "FAILED",
  Refunded = "REFUNDED",
}

export interface Receipt {
  readonly reference: string;
  readonly method: string;
  readonly amount: Money;
  readonly status: PaymentStatus;
  readonly at: Date;
}

/** A class can only `implements` members it actually declares. */
export interface Payable {
  readonly label: string;
  pay(amount: Money): Promise<Receipt>;
}

let counter = 0;
const nextReference = (): string => `pay_${(++counter).toString().padStart(4, "0")}`;

/**
 * §15 Abstract class. It cannot be instantiated directly (`new PaymentMethod()`
 * is a compile error) and it declares members subclasses *must* implement.
 */
export abstract class PaymentMethod implements Payable {
  /** §14 — three modifiers on one constructor via parameter properties. */
  constructor(
    public readonly id: string,
    protected readonly owner: string,
    private readonly feeRate = 0,
  ) {}

  /** Abstract *getter*: every subclass must define it. */
  abstract get label(): string;

  /** Abstract method: the part that differs per payment type. */
  protected abstract authorise(amount: Money): Promise<boolean>;

  /** `protected` → visible to subclasses, invisible to everyone else. */
  protected fee(amount: Money): Money {
    return amount.multiply(this.feeRate);
  }

  /**
   * Template method: fixed skeleton, subclass supplies the steps. `final` is not
   * a TypeScript keyword — the convention is a doc comment plus `readonly`.
   */
  async pay(amount: Money): Promise<Receipt> {
    const reference = nextReference();
    const base = {
      reference,
      method: this.label,
      amount,
      at: new Date(),
    };

    if (amount.isZero) {
      return { ...base, status: PaymentStatus.Failed };
    }

    const ok = await this.authorise(amount);
    if (!ok) return { ...base, status: PaymentStatus.Failed };

    const captured = amount.subtract(this.fee(amount));
    return { ...base, amount: captured, status: PaymentStatus.Captured };
  }

  /**
   * Replaces `Object.prototype.toString`. Note there is no `override` keyword
   * here: `PaymentMethod` has no explicit base class, and `noImplicitOverride`
   * only applies to members of a declared base. The subclasses below *do* use
   * `override`, because they extend this class.
   */
  toString(): string {
    return `${this.label} (${this.id}) for ${this.owner}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Concrete subclasses
// ─────────────────────────────────────────────────────────────────────────────

export class CardPayment extends PaymentMethod {
  /** Last four digits only — never store the whole PAN. */
  readonly last4: string;

  constructor(id: string, owner: string, pan: string, feeRate = 0.0175) {
    super(id, owner, feeRate);
    if (!/^\d{12,19}$/.test(pan)) throw new TypeError("Invalid card number");
    this.last4 = pan.slice(-4);
  }

  override get label(): string {
    return `card••••${this.last4}`;
  }

  /** Subclasses can reach `owner` and `fee()`; outside code cannot. */
  protected override async authorise(amount: Money): Promise<boolean> {
    return amount.amount > 0 && this.owner.length > 0;
  }
}

export class BankTransfer extends PaymentMethod {
  /** A field only this subclass has — the base class knows nothing about it. */
  readonly sortCode: string;

  constructor(id: string, owner: string, sortCode: string, accountNumber: string) {
    super(id, owner, 0);
    this.sortCode = `${sortCode}-${accountNumber.slice(-2)}`;
  }

  override get label(): string {
    return `bank transfer ${this.sortCode}`;
  }

  protected override async authorise(): Promise<boolean> {
    // Bank transfers always clear, they are just slow.
    return true;
  }
}

export class FailedPayment extends PaymentMethod {
  override get label(): string {
    return "declined card";
  }

  protected override async authorise(): Promise<boolean> {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Composition on top of inheritance — a processor, not another subclass
// ─────────────────────────────────────────────────────────────────────────────

export type LedgerEntry = Pick<Receipt, "reference" | "method" | "status"> & {
  net: number;
  currency: Currency;
};

export class PaymentProcessor {
  readonly #ledger: LedgerEntry[] = [];

  /**
   * §14 — a getter that hides the mutable array behind a readonly view.
   *
   * Important: `readonly LedgerEntry[]` is a *compile-time* type. It is erased
   * at runtime, so returning `this.#ledger` directly would still let a caller
   * write `(processor.ledger as LedgerEntry[]).push(...)`. Freezing a copy makes
   * the guarantee real in both worlds.
   */
  get ledger(): readonly LedgerEntry[] {
    return Object.freeze([...this.#ledger]);
  }

  get total(): Money {
    return this.#ledger.reduce<Money>(
      (sum, entry) => sum.add(Money.of(entry.net, entry.currency)),
      Money.zero(),
    );
  }

  async process(method: PaymentMethod, amount: Money): Promise<Receipt> {
    const receipt = await method.pay(amount);
    this.#ledger.push({
      reference: receipt.reference,
      method: receipt.method,
      status: receipt.status,
      net: receipt.amount.amount,
      currency: receipt.amount.currency,
    });
    return receipt;
  }
}
