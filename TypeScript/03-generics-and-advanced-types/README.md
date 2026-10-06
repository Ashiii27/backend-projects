# 03 · Generics & Advanced Types

The type-level half of TypeScript: generics with constraints, every built-in
utility type, hand-written mapped / conditional / template-literal types,
`infer`, recursion, variance annotations and a type-safe event bus.

**Covers** §16 Generics · §19 Utility Types · §20 Mapped Types · §21 Conditional
Types · §22 Template Literal Types · §23 `keyof` & `typeof` · §24 Indexed Access
· §29 Structural Typing · §36 Discriminated Unions · §38 `infer` · §39 Recursive
Types · §40 Variance Annotations

```bash
npm run start:03      # run the demo
npm test              # 12 tests
```

| File | What it demonstrates |
| --- | --- |
| `src/generics.ts` | generic functions/classes/interfaces, `keyof` constraints, type-parameter defaults, `const` type parameters, `NoInfer`, variadic tuples, a generic repository, `Result<T, E>` |
| `src/utility-types.ts` | `Partial`/`Pick`/`Omit`/`Record`/`NonNullable`/`Parameters`/`ReturnType`, `DeepPartial`, `DeepReadonly`, `Mutable`, key remapping with `as`, distributive vs non-distributive conditionals, template-literal route params |
| `src/infer.ts` | `UnwrapPromise`, `ElementOf`, `Split`, recursive `JSONValue` and `DeepKeys`, structural compatibility, excess property checks, `in` / `out` / `in out` variance |
| `src/event-bus.ts` | a fully type-safe event bus: mapped handler types, `once`, unsubscribe, symbol-keyed state, `[Symbol.iterator]` |
| `src/advanced.test.ts` | 12 tests |

### Two details worth reading

- **Inference stops at a union.** `mapResult(ok(4), n => n * 2)` infers `T`,
  but a value whose static type is the whole `Result<number>` does not — you
  narrow with `isOk()` first or pass the type arguments. `generics.ts`
  documents this at the source.
- **Excess property checks only apply to fresh literals.** `distance({x,y,z})`
  is an error while `distance(vector)` is fine, even though `Vector` is
  structurally assignable to `Point`. `infer.ts` shows both, with a
  `@ts-expect-error` that fails the build if the rule ever changes.
