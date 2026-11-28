import "server-only";

// Owner: Aminah.
const MS_PER_DAY = 86_400_000;

/** Return today's UTC date as YYYY-MM-DD. */
export function todayUtcIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Check that a string is a real calendar date in YYYY-MM-DD format. */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Shift a valid YYYY-MM-DD date by `days` (negative or positive) in UTC. */
export function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Inclusive number of calendar days between two YYYY-MM-DD dates. */
export function inclusiveDaysBetween(startIso: string, endIso: string): number {
  const startMs = Date.parse(`${startIso}T00:00:00Z`);
  const endMs = Date.parse(`${endIso}T00:00:00Z`);
  return Math.round((endMs - startMs) / MS_PER_DAY) + 1;
}
