# 01 · Type Foundations

The language basics, exercised through a small geometry domain: shapes, areas
and perimeters, plus a parser that turns untrusted JSON into typed values.

**Covers** §3 Basic Types · §4 Annotations & Inference · §5 Interfaces ·
§6 Type Aliases · §7 Union & Intersection · §8 Literal Types · §9 Enums ·
§10 Arrays & Tuples · §11 Functions · §12 Objects · §17 Type Assertions ·
§18 Type Guards & Narrowing · §36 Discriminated Unions · §37 Overloading ·
§41 `satisfies`

```bash
npm run start:01      # run the demo
npm test              # 18 tests
```

| File | What it demonstrates |
| --- | --- |
| `src/types.ts` | primitives, `bigint`, `symbol`, `any` vs `unknown` vs `never`, `as const`, branded types, enums, labelled tuples, rest tuples |
| `src/shapes.ts` | interfaces (optional, `readonly`, `extends`, call signatures, index signatures, declaration merging), discriminated unions with an `assertNever` exhaustiveness check, function overloads |
| `src/narrowing.ts` | `typeof` / `instanceof` / `in` / truthiness / equality guards, type predicates, assertion functions, an `unknown` → DTO parser, `satisfies` |
| `src/index.ts` | runnable tour of all of the above |
| `src/types.test.ts` | 18 tests over every module |

### Two details worth reading

- **`exactOptionalPropertyTypes: true`** — `color?: string` means "may be
  absent", *not* "may be `undefined`". `src/shapes.ts` shows both spellings.
- **`noUncheckedIndexedAccess: true`** — `list[i]` is `T | undefined`, so
  `firstOr()` has to prove the element exists before returning it.
