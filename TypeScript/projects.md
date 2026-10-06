# TypeScript — Runnable Projects

[`readme.md`](./readme.md) is the reference guide. This folder is the code that
goes with it: six small, self-contained projects that between them exercise
every section of the guide. Each one builds, runs and has tests.

```bash
npm install          # typescript + tsx + @types/node, nothing else
npm run build        # tsc -b across all six projects (project references)
npm run typecheck    # same, but forces a full re-check
npm test             # 106 tests, Node's built-in test runner
npm run start:01     # …through start:06
```

No runtime dependencies at all — every project uses only Node's standard
library, so `npm test` works straight after `npm install`.

---

## The projects

| # | Project | Domain | Guide sections |
| --- | --- | --- | --- |
| 01 | [`01-type-foundations`](./01-type-foundations) | geometry + a JSON parser | §3–§12, §17, §18, §36, §37, §41 |
| 02 | [`02-oop-patterns`](./02-oop-patterns) | payments | §9, §13–§15, §19, §27, §28, §30 |
| 03 | [`03-generics-and-advanced-types`](./03-generics-and-advanced-types) | type-level lab | §16, §19–§24, §29, §36, §38–§40 |
| 04 | [`04-async-and-runtime`](./04-async-and-runtime) | job runner + files | §16, §30–§32, §42 |
| 05 | [`05-modules-and-cli`](./05-modules-and-cli) | task CLI | §8, §11, §16, §18, §25, §26, §33, §36, §37, §41 |
| 06 | [`06-http-api-server`](./06-http-api-server) | notes REST API | §8, §11, §16, §18, §22, §32, §36–§38 |

---

## Where each guide section lives

| § | Topic | File(s) |
| --- | --- | --- |
| 1 | Introduction | `readme.md` |
| 2 | Setup & Installation | `package.json`, this file |
| 3 | Basic Types | `01/src/types.ts` |
| 4 | Type Annotations & Inference | `01/src/types.ts` |
| 5 | Interfaces | `01/src/shapes.ts` |
| 6 | Type Aliases | `01/src/types.ts` |
| 7 | Union & Intersection Types | `01/src/types.ts` |
| 8 | Literal Types | `01/src/types.ts`, `05/src/config/env.ts`, `06/src/types.ts` |
| 9 | Enums | `01/src/types.ts`, `02/src/payments.ts` |
| 10 | Arrays & Tuples | `01/src/types.ts` |
| 11 | Functions | `01/src/shapes.ts`, `05/src/cli.ts`, `06/src/server.ts` |
| 12 | Objects | `01/src/shapes.ts` |
| 13 | Classes | `02/src/money.ts`, `02/src/payments.ts` |
| 14 | Access Modifiers | `02/src/money.ts`, `02/src/payments.ts` |
| 15 | Abstract Classes | `02/src/payments.ts` |
| 16 | Generics | `03/src/generics.ts`, `04/src/files.ts`, `05/src/store/json-store.ts`, `06/src/repository.ts` |
| 17 | Type Assertions | `01/src/narrowing.ts` |
| 18 | Type Guards & Narrowing | `01/src/narrowing.ts`, `06/src/validation.ts` |
| 19 | Utility Types | `03/src/utility-types.ts`, `02/src/payments.ts` |
| 20 | Mapped Types | `03/src/utility-types.ts`, `03/src/event-bus.ts` |
| 21 | Conditional Types | `03/src/utility-types.ts`, `03/src/infer.ts` |
| 22 | Template Literal Types | `03/src/utility-types.ts`, `06/src/types.ts` |
| 23 | `keyof` & `typeof` | `03/src/utility-types.ts` |
| 24 | Indexed Access Types | `03/src/utility-types.ts` |
| 25 | Modules & Namespaces | `05/src/index.ts`, `05/src/namespaces.ts` |
| 26 | Declaration Files | `05/src/legacy/roman.d.ts`, `05/src/types/globals.d.ts` |
| 27 | Decorators | `02/src/decorators.ts` |
| 28 | Mixins | `02/src/mixins.ts` |
| 29 | Type Compatibility & Structural Typing | `03/src/infer.ts`, `01/src/types.ts` (branded types) |
| 30 | Symbols | `04/src/generators.ts`, `02/src/money.ts`, `03/src/event-bus.ts` |
| 31 | Iterators & Generators | `04/src/generators.ts`, `03/src/event-bus.ts` |
| 32 | Async/Await & Promises | `04/src/concurrency.ts`, `06/src/server.ts` |
| 33 | Triple-Slash Directives | `05/src/types/env.d.ts` |
| 34 | `tsconfig.json` Configuration | `tsconfig.base.json`, `tsconfig.json`, each project's `tsconfig.json` |
| 35 | Strict Mode Options | `tsconfig.base.json` (every flag annotated) |
| 36 | Discriminated Unions | `01/src/shapes.ts`, `03/src/generics.ts`, `05/src/cli.ts`, `06/src/types.ts` |
| 37 | Overloading | `01/src/shapes.ts`, `05/src/cli.ts`, `06/src/server.ts` |
| 38 | `infer` | `03/src/infer.ts`, `06/src/types.ts` |
| 39 | Recursive Types | `03/src/infer.ts`, `03/src/utility-types.ts` |
| 40 | Variance Annotations | `03/src/infer.ts` |
| 41 | `satisfies` | `01/src/narrowing.ts`, `05/src/config/env.ts`, `06/src/server.ts` |
| 42 | `using` (Disposable Resources) | `04/src/disposables.ts`, `04/src/files.ts` |
| 43 | Performance Tips | `tsconfig.json` (project references + incremental builds) |
| 44 | References & Resources | `readme.md` |

---

## How the build is wired

```
tsconfig.base.json     shared strict compiler options (§34, §35)
tsconfig.json          solution file: 6 project references, `tsc -b`
0N-*/tsconfig.json     extends the base, adds rootDir/outDir
0N-*/src/**            sources + *.test.ts
0N-*/dist/**           build output (git-ignored)
```

`tsc -b` builds in dependency order and skips projects that are already up to
date; `--force` re-checks everything. Tests run from source through `tsx`, so
there is no build step before `npm test`.

### The strictness level

`tsconfig.base.json` turns on `strict` plus the opt-in flags that are *not* part
of the `strict` family:

| Flag | What it catches |
| --- | --- |
| `noUncheckedIndexedAccess` | `arr[i]` and `record[key]` are `T \| undefined` |
| `exactOptionalPropertyTypes` | `{ x?: T }` cannot be assigned `undefined` |
| `noImplicitOverride` | a subclass member that shadows a base member without `override` |
| `noImplicitReturns` | a code path that falls off the end of a non-void function |
| `noFallthroughCasesInSwitch` | a `case` that runs into the next one |
| `noUnusedLocals` / `noUnusedParameters` | dead code |
| `verbatimModuleSyntax` | a type-only import written as a runtime import |

Each one is demonstrated by real code in the projects — search for the flag
name in the source comments.

## Suggested reading order

1. **01** — the type system's vocabulary.
2. **02** — classes, then decorators and mixins once classes feel normal.
3. **03** — the advanced type system; the hardest folder, and the most useful.
4. **04** — asynchronous code and runtime resource management.
5. **05** — modules, declaration files, and a whole CLI to put it together.
6. **06** — a real HTTP service that reuses everything above.
