import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Money } from "./money.js";
import {
  BankTransfer,
  CardPayment,
  FailedPayment,
  PaymentProcessor,
  PaymentStatus,
  type PaymentMethod,
} from "./payments.js";
import { Player, registry } from "./decorators.js";
import { Document, TrackedDocument, describe as describeChain } from "./mixins.js";

describe("money.ts — §13/§14/§30 value object", () => {
  it("builds money through static factories only", () => {
    assert.equal(Money.of(10).toString(), "GBP 10.00");
    assert.equal(Money.of(10, "USD").currency, "USD");
    assert.ok(Money.zero().isZero);
    assert.deepEqual([...Money.SUPPORTED], ["GBP", "USD", "EUR"]);
  });

  it("parses and rejects strings", () => {
    assert.equal(Money.parse("USD 49.99").amount, 49.99);
    assert.equal(Money.parse(" EUR -3.50 ").amount, -3.5);
    assert.throws(() => Money.parse("CHF 1.00"), TypeError);
    assert.throws(() => Money.parse("nonsense"), TypeError);
  });

  it("does arithmetic and refuses mixed currencies", () => {
    const a = Money.of(10);
    const b = Money.of(2.5);
    assert.equal(a.add(b).amount, 12.5);
    assert.equal(a.subtract(b).amount, 7.5);
    assert.equal(a.multiply(3).amount, 30);
    assert.throws(() => a.add(Money.of(1, "EUR")), /Currency mismatch/);
  });

  it("compares, serialises and coerces", () => {
    assert.ok(Money.of(5).equals(Money.of(5)));
    assert.ok(!Money.of(5).equals(Money.of(5, "USD")));
    assert.deepEqual(Money.of(5).toJSON(), { amount: 5, currency: "GBP" });
    assert.equal(+Money.of(5), 5); // [Symbol.toPrimitive]("number")
    assert.equal(`${Money.of(5)}`, "GBP 5.00");
    assert.equal(Money.of(-5).absolute.amount, 5);
  });
});

describe("payments.ts — §15 abstract classes and access modifiers", () => {
  it("runs the template method for each subclass", async () => {
    const card: PaymentMethod = new CardPayment("c1", "Ada", "4242424242424242");
    const receipt = await card.pay(Money.of(100));
    assert.equal(receipt.status, PaymentStatus.Captured);
    assert.equal(receipt.method, "card••••4242");
    assert.equal(receipt.amount.amount, 98.25); // 100 minus the 1.75% fee
  });

  it("charges no fee on a bank transfer", async () => {
    const transfer = new BankTransfer("b1", "Ada", "200000", "55779911");
    const receipt = await transfer.pay(Money.of(100));
    assert.equal(receipt.amount.amount, 100);
    assert.equal(receipt.method, "bank transfer 200000-11");
  });

  it("reports a failed authorisation", async () => {
    const receipt = await new FailedPayment("f1", "Mallory").pay(Money.of(100));
    assert.equal(receipt.status, PaymentStatus.Failed);
  });

  it("fails on zero amounts without authorising", async () => {
    const receipt = await new CardPayment("c2", "Ada", "4242424242424242").pay(Money.zero());
    assert.equal(receipt.status, PaymentStatus.Failed);
  });

  it("validates card numbers in the constructor", () => {
    assert.throws(() => new CardPayment("c3", "Ada", "not-a-pan"), /Invalid card number/);
  });

  it("accumulates a readonly ledger", async () => {
    const processor = new PaymentProcessor();
    await processor.process(new CardPayment("c1", "Ada", "4242424242424242"), Money.of(100));
    await processor.process(new BankTransfer("b1", "Ada", "200000", "55779911"), Money.of(50));
    assert.equal(processor.ledger.length, 2);
    assert.equal(processor.total.amount, 148.25);
    // Compile time: the `readonly` type has no `push`. If the line below ever
    // becomes legal, `tsc` fails the build — that IS the assertion.
    // @ts-expect-error Property 'push' does not exist on type 'readonly LedgerEntry[]'
    void processor.ledger.push;

    // Runtime: the getter hands back a frozen copy, so writing throws too.
    assert.throws(() => (processor.ledger as unknown[]).push("nope"), TypeError);
    assert.equal(processor.ledger.length, 2);
  });

  it("gives every payment a unique reference", async () => {
    const card = new CardPayment("c1", "Ada", "4242424242424242");
    const a = await card.pay(Money.of(1));
    const b = await card.pay(Money.of(1));
    assert.notEqual(a.reference, b.reference);
    assert.match(a.reference, /^pay_\d{4}$/);
  });
});

describe("decorators.ts — §27 standard decorators", () => {
  it("clamps accessor values on init and on set", () => {
    const player = new Player();
    assert.equal(player.health, 100);
    player.health = 999;
    assert.equal(player.health, 100);
    player.health = -50;
    assert.equal(player.health, 0);
    player.level = 42;
    assert.equal(player.level, 10);
  });

  it("traces and counts method calls", () => {
    const player = new Player();
    player.hit(10);
    player.hit(20);
    assert.equal(player.health, 70);
    assert.equal(player.calls, 2);
  });

  it("retries until it succeeds", async () => {
    assert.equal(await new Player().connect(), "connected");
  });

  it("registers and freezes the class", () => {
    assert.equal(registry.get("player"), Player);
    assert.throws(() => {
      // @ts-expect-error the prototype was frozen by @sealed
      Player.prototype.extra = () => {};
    });
  });
});

describe("mixins.ts — §28 mixins", () => {
  it("composes timestamping, serialisation and observers", () => {
    const doc = new TrackedDocument("d1", "Handbook");
    const seen: string[] = [];
    const unsubscribe = doc.onChange((id) => seen.push(id));
    doc.rename("Handbook v2");
    unsubscribe();
    doc.rename("ignored");

    assert.equal(doc.title, "ignored");
    assert.deepEqual(seen, ["d1"]);
    assert.ok(doc.createdAt instanceof Date);
    assert.ok(doc.ageInMs() >= 0);
    // The Timestamped mixin adds `createdAt`, so it shows up in the JSON too.
    const json = JSON.parse(doc.toJSONString()) as Record<string, unknown>;
    assert.equal(json.id, "d1");
    assert.equal(json.title, "ignored");
    assert.ok(!Number.isNaN(Date.parse(String(json.createdAt))));
  });

  it("keeps the plain base class independent", () => {
    const plain = new Document("d2", "Plain");
    assert.equal(plain.title, "Plain");
    assert.equal("createdAt" in plain, false);
  });

  it("walks the generated prototype chain", () => {
    const chain = describeChain(TrackedDocument);
    assert.match(chain, /Document → Observable → Serializable → Timestamped → TrackedDocument/);
  });
});
