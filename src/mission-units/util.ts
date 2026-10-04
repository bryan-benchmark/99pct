export function parsePeriod(period: string): { y: number; m: number } {
  const [ys, ms] = period.split("-");
  return { y: Number(ys), m: Number(ms) };
}

export function periodKey(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function listPeriods(start: string, end: string): string[] {
  const a = parsePeriod(start);
  const b = parsePeriod(end);
  const out: string[] = [];
  let y = a.y;
  let m = a.m;
  while (y < b.y || (y === b.y && m <= b.m)) {
    out.push(periodKey(y, m));
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function dateParts(iso: string): { y: number; m: number; d: number } {
  const [ys, ms, ds] = iso.split("-");
  return { y: Number(ys), m: Number(ms), d: Number(ds) };
}

export function activeFraction(
  contributor: { startDate: string; endDate?: string; heirOf?: string },
  period: string,
): number {
  if (contributor.heirOf) return 0;
  const { y, m } = parsePeriod(period);
  const dim = daysInMonth(y, m);
  const start = dateParts(contributor.startDate);
  const end = contributor.endDate
    ? dateParts(contributor.endDate)
    : { y: 9999, m: 12, d: 31 };

  const startDay =
    start.y === y && start.m === m
      ? start.d
      : start.y > y || (start.y === y && start.m > m)
        ? dim + 1
        : 1;

  const endDay =
    end.y === y && end.m === m
      ? end.d
      : end.y < y || (end.y === y && end.m < m)
        ? 0
        : dim;

  if (startDay > endDay) return 0;
  return Math.min(1, Math.max(0, (endDay - startDay + 1) / dim));
}

export function monthlyFromAnnual(annual: number): number {
  return annual / 12;
}

export function roundUnits(n: number): number {
  return Math.round(n * 100) / 100;
}

export function almostEqual(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
}
