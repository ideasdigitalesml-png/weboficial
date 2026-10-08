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
// "YYYY-MM-DD" -- only dates with at least one free slot are included, so
// the public calendar can just check `Object.keys(availability)` for which
// days to offer. Computed once per page render (server-side), not
// recomputed client-side, so the client component never needs its own copy
// of this date/timezone logic.
export function buildAvailability(
  config: TurnosConfig,
  holidays: ReadonlySet<string>,
  now: NowInBA = nowInBuenosAires()
): Record<string, string[]> {
  const availability: Record<string, string[]> = {};
  for (let i = 0; i < config.daysAhead; i++) {
    const dateStr = addDays(now.dateStr, i);
    const slots = slotsForDate(config, dateStr, holidays, now);
    if (slots.length > 0) availability[dateStr] = slots;
  }
  return availability;
}

// Which calendar years a `daysAhead`-long window starting today can touch
// -- at most two, since daysAhead is capped at 365 (sanitizeTurnosConfig).
export function yearsInWindow(daysAhead: number, now: NowInBA = nowInBuenosAires()): number[] {
  const startYear = Number(now.dateStr.slice(0, 4));
  const endDateStr = addDays(now.dateStr, Math.max(0, daysAhead - 1));
  const endYear = Number(endDateStr.slice(0, 4));
  return startYear === endYear ? [startYear] : [startYear, endYear];
}
