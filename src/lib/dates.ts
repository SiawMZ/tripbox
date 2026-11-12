/** Trip dates are plain YYYY-MM-DD strings (no time zone): the traveller's local calendar days. */

export function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

export function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "18 – 20 Dec 2026", or "30 Dec 2026 – 2 Jan 2027" across a year. */
export function dateRange(start: string, days: number) {
  const end = addDays(start, days - 1);
  const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
  if (days === 1) return fmt(start, { day: 'numeric', month: 'short', year: 'numeric' });
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const sameMonth = sameYear && start.slice(5, 7) === end.slice(5, 7);
  const from = fmt(start, sameMonth ? { day: 'numeric' } : sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
  return `${from} – ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function todayPlus(days: number) {
  return addDays(new Date().toISOString().slice(0, 10), days);
}
