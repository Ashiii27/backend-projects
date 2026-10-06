/**
 * §26 Declaration files.
 *
 * TypeScript resolves `import { toRoman } from "./legacy/roman.js"` by looking
 * for a sibling `roman.ts`, then `roman.d.ts`. This file is that sibling, so the
 * untyped JavaScript above becomes fully typed at every call site — while Node
 * still executes the plain `.js` at runtime.
 */

/** Converts 1–3999 to a roman numeral. Throws RangeError outside that range. */
export declare function toRoman(value: number): string;

/** Parses a roman numeral back into a number. Throws TypeError on bad input. */
export declare function fromRoman(text: string): number;
