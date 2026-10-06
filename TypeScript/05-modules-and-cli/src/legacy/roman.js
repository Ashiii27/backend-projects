/**
 * Hand-written JavaScript with no type information — stand-in for a dependency
 * you cannot change. `roman.d.ts` next to it supplies the types.
 */
const TABLE = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function toRoman(value) {
  if (!Number.isInteger(value) || value < 1 || value > 3999) {
    throw new RangeError(`Cannot convert ${value} to a roman numeral`);
  }
  let remaining = value;
  let out = "";
  for (const [number, numeral] of TABLE) {
    while (remaining >= number) {
      out += numeral;
      remaining -= number;
    }
  }
  return out;
}

export function fromRoman(text) {
  const clean = String(text).toUpperCase();
  const VALUES = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < clean.length; i++) {
    const current = VALUES[clean[i]];
    const next = VALUES[clean[i + 1]];
    if (current === undefined) throw new TypeError(`Invalid roman numeral: ${text}`);
    total += next !== undefined && next > current ? -current : current;
  }
  return total;
}
