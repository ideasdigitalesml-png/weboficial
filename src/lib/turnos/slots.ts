import type { TurnosConfig, WeekdayKey } from "./types";

// Argentina has had no DST since 2009 -- fixed UTC-3 year-round -- so "now
// in Buenos Aires" only ever needs Intl's timeZone conversion, never a
// floating UTC-offset calculation that could drift across a DST boundary
// (there isn't one).
const TIMEZONE = "America/Argentina/Buenos_Aires";

export interface NowInBA {
  // "YYYY-MM-DD" for today in Buenos Aires.
  dateStr: string;
  // Minutes since midnight, Buenos Aires local time.
  minutes: number;
}

export function nowInBuenosAires(reference: Date = new Date()): NowInBA {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(reference);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  // formatToParts can return hour "24" for midnight under hour12:false in
  // some engines -- normalize to 0.
  const hour = map.hour === "24" ? 0 : Number(map.hour);
  return {
    dateStr: `${map.year}-${map.month}-${map.day}`,
    minutes: hour * 60 + Number(map.minute),
  };
}

// All date arithmetic below uses Date.UTC on the Y/M/D parsed out of a
// "YYYY-MM-DD" string -- deliberately never `new Date(dateStr)` (parsed as
// local time, which would shift the calendar date depending on the
// server's own timezone) and never local Date methods (same problem). This
// only ever manipulates calendar dates, never instants, so UTC is just a
// neutral arithmetic base, not a timezone claim.
function parseDateStr(dateStr: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, m, d };
}

export function addDays(dateStr: string, days: number): string {
  const { y, m, d } = parseDateStr(dateStr);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function weekdayOf(dateStr: string): number {
  const { y, m, d } = parseDateStr(dateStr);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// "dd/mm" for the WhatsApp message and the calendar's day labels.
export function formatDayMonth(dateStr: string): string {
  const { m, d } = parseDateStr(dateStr);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

// "range" booking mode: the client only picks "Mañana"/"Tarde" for a day,
// not an exact time. A range counts as morning if it ends by 13:00, and
// afternoon if it starts at/after 13:00 (the spec's own two literal rules,
// e.g. 09:00-13:00 -> morning, 15:00-19:00 -> afternoon). A range spanning
// across 13:00 -- not explicitly covered by either rule -- is bucketed by
// its midpoint instead of throwing, since a professional could configure
// one plausibly enough.
export type Franja = "morning" | "afternoon";

const FRANJA_BOUNDARY_MIN = 13 * 60;

function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function classifyRange(range: { start: string; end: string }): Franja {
  const startMin = timeToMinutes(range.start);
  const endMin = timeToMinutes(range.end);
  if (endMin <= FRANJA_BOUNDARY_MIN) return "morning";
  if (startMin >= FRANJA_BOUNDARY_MIN) return "afternoon";
  const midpoint = (startMin + endMin) / 2;
  return midpoint < FRANJA_BOUNDARY_MIN ? "morning" : "afternoon";
}

// Which franjas have at least one still-bookable range on this date (same
// past/blocked/holiday/weekday-off exclusions as slotsForDate below, just
// coarser-grained: today only offers a franja if its range hasn't fully
// elapsed yet). "If the day has a single range, show only that franja" is
// automatic here -- a day with one 09:00-13:00 range only ever classifies
// into "morning", so "afternoon" is never added.
export function franjasForDate(
  config: TurnosConfig,
  dateStr: string,
  holidays: ReadonlySet<string>,
  now: NowInBA
): Franja[] {
  if (dateStr < now.dateStr) return [];
  if (config.blockedDates.includes(dateStr)) return [];
  if (!config.worksHolidays && holidays.has(dateStr)) return [];

  const schedule = config.weeklySchedule[String(weekdayOf(dateStr)) as WeekdayKey];
  if (!schedule?.enabled) return [];

  const franjas = new Set<Franja>();
  for (const range of schedule.ranges) {
    if (dateStr === now.dateStr && timeToMinutes(range.end) <= now.minutes) continue;
    franjas.add(classifyRange(range));
  }
  return (["morning", "afternoon"] as const).filter((f) => franjas.has(f));
}

function slotsForRange(range: { start: string; end: string }, durationMin: number): string[] {
  const [sh, sm] = range.start.split(":").map(Number);
  const [eh, em] = range.end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const slots: string[] = [];
  for (let t = startMin; t + durationMin <= endMin; t += durationMin) {
    slots.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return slots;
}

// Every slot time for a single calendar date, already excluding: the
// weekday being off, a blocked date, an unworked holiday, and (for today
// only) any time that's already past. Empty array means "no turno
// disponible ese día", not an error.
export function slotsForDate(
  config: TurnosConfig,
  dateStr: string,
  holidays: ReadonlySet<string>,
  now: NowInBA
): string[] {
  if (dateStr < now.dateStr) return [];
  if (config.blockedDates.includes(dateStr)) return [];
  if (!config.worksHolidays && holidays.has(dateStr)) return [];

  const schedule = config.weeklySchedule[String(weekdayOf(dateStr)) as WeekdayKey];
  if (!schedule?.enabled) return [];

  let slots = schedule.ranges.flatMap((r) => slotsForRange(r, config.slotDurationMinutes));

  if (dateStr === now.dateStr) {
    slots = slots.filter((s) => {
      const [h, m] = s.split(":").map(Number);
      return h * 60 + m > now.minutes;
    });
  }

  return slots;
}

// Full availability map for the whole `daysAhead` window, keyed by
// "YYYY-MM-DD" -- only dates with at least one free option are included, so
// the public calendar can just check `Object.keys(availability)` for which
// days to offer. Computed once per page render (server-side), not
// recomputed client-side, so the client component never needs its own copy
// of this date/timezone logic. In "exact" mode each date's array holds
// "HH:MM" slot times; in "range" mode it holds Franja keys ("morning"/
// "afternoon") instead -- TurnosBooking branches on config.bookingMode to
// know which it's looking at.
export function buildAvailability(
  config: TurnosConfig,
  holidays: ReadonlySet<string>,
  now: NowInBA = nowInBuenosAires()
): Record<string, string[]> {
  const availability: Record<string, string[]> = {};
  for (let i = 0; i < config.daysAhead; i++) {
    const dateStr = addDays(now.dateStr, i);
    const options =
      config.bookingMode === "range"
        ? franjasForDate(config, dateStr, holidays, now)
        : slotsForDate(config, dateStr, holidays, now);
    if (options.length > 0) availability[dateStr] = options;
  }
  return availability;
}

// "YYYY-MM" for the month a "YYYY-MM-DD" date falls in -- used by
// TurnosBooking's monthly calendar grid (view state, navigation bounds).
export function monthKeyOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  // Day 0 of the next month == the last day of this one.
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function addMonths(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Which calendar years a `daysAhead`-long window starting today can touch
// -- at most two, since daysAhead is capped at 365 (sanitizeTurnosConfig).
export function yearsInWindow(daysAhead: number, now: NowInBA = nowInBuenosAires()): number[] {
  const startYear = Number(now.dateStr.slice(0, 4));
  const endDateStr = addDays(now.dateStr, Math.max(0, daysAhead - 1));
  const endYear = Number(endDateStr.slice(0, 4));
  return startYear === endYear ? [startYear] : [startYear, endYear];
}
