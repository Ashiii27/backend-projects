# 05 · Modules & CLI

A complete command-line tool, and the module system around it: barrels, ambient
globals, module augmentation, triple-slash directives, a hand-written `.d.ts`
for untyped JavaScript, and namespaces.

**Covers** §8 Literal Types · §11 Functions · §16 Generics · §18 Narrowing ·
§25 Modules & Namespaces · §26 Declaration Files · §33 Triple-Slash Directives ·
§36 Discriminated Unions · §37 Overloading · §41 `satisfies`

```bash
npm run start:05 -- add "Write the guide" --priority high --tag docs
npm run start:05 -- list
npm run start:05 -- done t001
npm run start:05 -- stats
npm test              # 21 tests
```

| File | What it demonstrates |
| --- | --- |
| `src/index.ts` | a barrel file, and the three import forms side by side: side-effect-only, runtime, and `import type` |
| `src/cli.ts` | commands modelled as a discriminated union, overloaded flag reader, exhaustive `switch` with `assertNever`, handlers that return text instead of printing |
| `src/config/env.ts` | `as const satisfies AppConfig`, environment validation with a typed error |
| `src/domain/task.ts` | immutable model, `ParseResult` union for untrusted rows, id generation derived from the data |
| `src/store/json-store.ts` | a generic JSON persistence layer |
| `src/namespaces.ts` | instantiable namespaces, nested namespaces, declaration merging on both namespaces and interfaces |
| `src/legacy/roman.js` + `roman.d.ts` | untyped JavaScript given a full type surface by a sibling declaration file |
| `src/types/globals.d.ts` | ambient globals — no import needed to use `__BUILD__` |
| `src/types/env.d.ts` | `/// <reference path="..." />` and `declare global` module augmentation of `ProcessEnv` |
| `src/cli.test.ts` | 21 tests, each with its own temp directory |

### Three details worth reading

- **`import { toRoman } from "./legacy/roman.js"`** resolves to `roman.d.ts` at
  compile time and to `roman.js` at runtime. That split is exactly how
  `@types/*` packages work.
- **A module-level counter is not an id generator for a CLI.** The first version
  of this project handed out `t001` on every run; `nextTaskId()` now derives the
  id from the stored rows, and a test covers it.
- **Overload signatures must sit immediately above their implementation**
  (TS2391) — `cli.ts` shows the correct shape.
