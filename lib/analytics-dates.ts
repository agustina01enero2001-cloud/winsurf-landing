/** Calendar helpers in America/Argentina/Buenos_Aires for analytics. */

export const ART_TIME_ZONE = "America/Argentina/Buenos_Aires";
export const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type CalendarDate = { y: number; m: number; d: number };

export function parseIsoDate(value: string): CalendarDate | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

export function formatIsoDate(date: CalendarDate): string {
  const m = String(date.m).padStart(2, "0");
  const d = String(date.d).padStart(2, "0");
  return `${date.y}-${m}-${d}`;
}

export function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const shifted = new Date(Date.UTC(date.y, date.m - 1, date.d + days));
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
  };
}

export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";
  let hour = Number(pick("hour"));
  if (hour === 24) hour = 0;
  const wallAsUtc = Date.UTC(
    Number(pick("year")),
    Number(pick("month")) - 1,
    Number(pick("day")),
    hour,
    Number(pick("minute")),
    Number(pick("second")),
  );
  return wallAsUtc - instant.getTime();
}

/** UTC instant of 00:00:00 on that calendar day in Argentina. */
export function artMidnightUtc(date: CalendarDate): Date {
  let utc = Date.UTC(date.y, date.m - 1, date.d, 3, 0, 0);
  for (let i = 0; i < 3; i++) {
    const offset = timeZoneOffsetMs(new Date(utc), ART_TIME_ZONE);
    const next = Date.UTC(date.y, date.m - 1, date.d, 0, 0, 0) - offset;
    if (next === utc) break;
    utc = next;
  }
  return new Date(utc);
}

/** YYYY-MM-DD of an instant in Argentina. */
export function artDateKey(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ART_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function todayArt(): CalendarDate {
  const key = artDateKey(new Date());
  return parseIsoDate(key)!;
}

export function eachCalendarDay(
  from: CalendarDate,
  to: CalendarDate,
): CalendarDate[] {
  const days: CalendarDate[] = [];
  let cursor = from;
  while (compareCalendarDates(cursor, to) <= 0) {
    days.push(cursor);
    cursor = addCalendarDays(cursor, 1);
  }
  return days;
}
