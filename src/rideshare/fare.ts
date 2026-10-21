/**
 * Where a fare stays. One cent of each dollar keeps the shared infrastructure running.
 * The rest stays with the person who drove. An outside owner takes nothing.
 * This does not pay anyone.
 */

export type FareSplit = {
  fare: number;
  driver: number;
  infrastructure: number;
  outside: 0;
};

export function splitFare(cents: number): FareSplit {
  if (!Number.isInteger(cents) || cents < 0 || cents > 100_000) {
    throw new Error("A fare is a whole number of cents, from 0 to 100000.");
  }
  const infrastructure = Math.floor(cents / 100);
  const outside = 0;
  return { fare: cents, driver: cents - infrastructure - outside, infrastructure, outside };
}

export function fareCents(input: string): number | null {
  const text = input.trim();
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(text)) return null;
  const [whole, frac = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  if (!Number.isInteger(cents) || cents > 100_000) return null;
  return cents;
}

export function formatFare(cents: number) {
  return `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}
