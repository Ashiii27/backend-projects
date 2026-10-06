# 02 · OOP Patterns

Classes and object-oriented design: an immutable `Money` value object, a
payment-processing inheritance hierarchy, standard ECMAScript decorators, and
the mixin pattern.

**Covers** §9 Enums · §13 Classes · §14 Access Modifiers · §15 Abstract Classes
· §19 Utility Types · §27 Decorators · §28 Mixins · §30 Symbols

```bash
npm run start:02      # run the demo
npm test              # 18 tests
```

| File | What it demonstrates |
| --- | --- |
| `src/money.ts` | `readonly` fields, `#private` vs `private`, static factories, static fields, getters, `implements`, `[Symbol.toPrimitive]`, `toJSON` |
| `src/payments.ts` | abstract class, abstract getters/methods, parameter properties, `public`/`protected`/`private`, `override`, template-method pattern, statics, `Pick<>` |
| `src/decorators.ts` | standard TS 5 decorators: method decorators, decorator factories, `accessor` decorators, class decorators, `context.addInitializer` |
| `src/mixins.ts` | the `Constructor<T>` constraint, stacking three mixins, extracting the instance type |
| `src/index.ts` | runnable tour |
| `src/payments.test.ts` | 18 tests |

### Three details worth reading

- **Decorators here need no compiler flag.** They are the standard ECMAScript
  form (TS 5.0+), not the legacy `experimentalDecorators` form used by Angular
  and NestJS. Standard decorators cannot decorate constructor parameters.
- **`readonly` is compile-time only.** `PaymentProcessor.ledger` returns
  `Object.freeze([...this.#ledger])` — the type alone would not stop a runtime
  write. The test asserts both halves.
- **Exported anonymous classes cannot have `protected` members** when
  declarations are emitted (TS4094), which is why `Observable.notifyChange` is
  public.
