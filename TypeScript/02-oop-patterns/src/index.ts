/**
 * Project 02 — OOP Patterns.
 * Run with:  npm run start:02
 */
import { Money } from "./money.js";
import {
  BankTransfer,
  CardPayment,
  FailedPayment,
  PaymentProcessor,
  PaymentStatus,
  type PaymentMethod,
} from "./payments.js";
import { Player, decoratorLog, registry } from "./decorators.js";
import { Document, TrackedDocument, describe as describeChain } from "./mixins.js";

async function main(): Promise<void> {
  console.log("── 02 · OOP Patterns ────────────────────────────────");

  // §13/§14 — value object
  const price = Money.of(120, "GBP");
  const vat = price.multiply(0.2);
  console.log("money          ", price.toString(), "+ vat", vat.toString(), "=", price.add(vat).toString());
  console.log("parsed         ", Money.parse("USD 49.99").toString(), "| zero?", Money.zero().isZero);
  console.log("toPrimitive    ", `number hint: ${+price}`, "| json:", JSON.stringify(price));

  // §15 — abstract class + template method
  const methods: PaymentMethod[] = [
    new CardPayment("c1", "Ada", "4242424242424242"),
    new BankTransfer("b1", "Ada", "200000", "55779911"),
    new FailedPayment("f1", "Mallory"),
  ];

  const processor = new PaymentProcessor();
  for (const method of methods) {
    const receipt = await processor.process(method, Money.of(200));
    console.log(
      `payment        ${receipt.method.padEnd(24)} ${receipt.status.padEnd(10)} net ${receipt.amount.toString()}`,
    );
  }
  console.log("ledger         ", processor.ledger.length, "entries, total", processor.total.toString());
  console.log("enum values    ", Object.values(PaymentStatus).join(", "));

  // §27 — decorators
  const player = new Player();
  player.heal(50);
  player.hit(30);
  player.health = 999; // clamped by @clamp(0, 100)
  console.log("player         ", `health=${player.health} level=${player.level} hits=${player.calls}`);
  console.log("retry          ", await player.connect());
  console.log("registry       ", [...registry.keys()].join(", "));
  console.log("decorator log  ", decoratorLog.slice(0, 4).join(" | "));

  // §28 — mixins
  const doc = new TrackedDocument("d1", "Handbook");
  const unsubscribe = doc.onChange((id) => console.log("mixin event    ", `${id} changed`));
  doc.rename("Handbook v2");
  unsubscribe();
  console.log("mixin json     ", doc.toJSONString());
  console.log("mixin chain    ", describeChain(TrackedDocument));
  console.log("plain doc      ", new Document("d2", "Plain").title);
}

void main();
