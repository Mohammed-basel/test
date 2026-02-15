import { Language } from './productMeta';

function parseISODate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

// Force left-to-right rendering inside Arabic UI (prevents RTL re-ordering like "09/02/2026-02").
function ltr(text: string, language: Language): string {
  if (language !== 'ar') return text;
  const LRM = '\u200E';
  return `${LRM}${text}${LRM}`;
}

function formatCompactRange(start: Date, end: Date): string {
  // Prefer compact: 2-9/02/2026
  const d1 = start.getDate(); // no leading zero
  const d2 = end.getDate();
  const m1 = pad2(start.getMonth() + 1);
  const y1 = start.getFullYear();

  const m2 = pad2(end.getMonth() + 1);
  const y2 = end.getFullYear();

  // Same month/year => 2-9/02/2026
  if (m1 === m2 && y1 === y2) return `${d1}-${d2}/${m1}/${y1}`;

  // Different month/year => 28/02/2026-05/03/2026 (still compact-ish)
  return `${d1}/${m1}/${y1}-${d2}/${m2}/${y2}`;
}

function tryNormalizeWeirdRange(raw: string): { start: Date; end: Date } | null {
  // Patterns coming from some Excel exports:
  // 1) "09/02/2026-02"  => endDate - startDay
  // 2) "02-09/02/2026"  => startDay - endDate
  // Both mean: startDate .. endDate within the same month/year.

  const m1 = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})-(\d{1,2})$/);
  if (m1) {
    const endDay = Number(m1[1]);
    const month = Number(m1[2]);
    const year = Number(m1[3]);
    const startDay = Number(m1[4]);

    const end = new Date(year, month - 1, endDay);
    const start = new Date(year, month - 1, startDay);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    return start <= end ? { start, end } : { start: end, end: start };
  }

  const m2 = raw.match(/^(\d{1,2})-(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m2) {
    const startDay = Number(m2[1]);
    const endDay = Number(m2[2]);
    const month = Number(m2[3]);
    const year = Number(m2[4]);

    const start = new Date(year, month - 1, startDay);
    const end = new Date(year, month - 1, endDay);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    return start <= end ? { start, end } : { start: end, end: start };
  }

  return null;
}


function tryNormalizeSingleDate(raw: string): { start: Date; end: Date } | null {
  // ISO start date: "2026-02-02"
  const iso = parseISODate(raw);
  if (iso) {
    return { start: iso, end: addDays(iso, 6) };
  }

  // DD/MM/YYYY as start date
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = Number(m[1]);
    const mon = Number(m[2]);
    const y = Number(m[3]);
    const start = new Date(y, mon - 1, d);
    if (!Number.isNaN(start.getTime())) return { start, end: addDays(start, 6) };
  }

  return null;
}

function normalizeWeekDateText(weekDate: string, language: Language): string | null {
  const raw = (weekDate || '').trim();
  if (!raw) return null;

  const weird = tryNormalizeWeirdRange(raw);
  if (weird) {
    return ltr(`${formatCompactRange(weird.start, weird.end)}`, language);
  }

  const single = tryNormalizeSingleDate(raw);
  if (single) {
    return ltr(`${formatCompactRange(single.start, single.end)}`, language);
  }

  // Already a range? just protect directionality in Arabic.
  if (raw.includes('-')) return ltr(raw, language);

  return ltr(raw, language);
}

/**
 * Optional week start dates via env:
 * VITE_WEEK_STARTS="2026-02-02,2026-02-09,2026-02-16,2026-02-23"
 */
export function getWeekDateRangeLabel(weekNumber: number, language: Language): string | null {
  const raw = (import.meta as any)?.env?.VITE_WEEK_STARTS as string | undefined;
  if (!raw) return null;

  const parts = raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  const start = parseISODate(parts[weekNumber - 1]);
  if (!start) return null;

  const end = addDays(start, 6);
  return ltr(`${formatCompactRange(start, end)}`, language);
}

export function formatWeekLabel(weekNumber: number, language: Language, weekDate?: string): string {
  const base = language === 'ar' ? `الأسبوع ${weekNumber}` : `Week ${weekNumber}`;

  const explicit = normalizeWeekDateText(weekDate || '', language);
  if (explicit) return `${base} (${explicit})`;

  const range = getWeekDateRangeLabel(weekNumber, language);
  return range ? `${base} (${range})` : base;
}
