// WhatsApp-only appointment booking config, stored in landings.turnos_config
// (see 0043_landing_turnos_config.sql). No appointment is ever persisted --
// this is purely "when is the professional available", computed fresh on
// every page load against the current date. See src/lib/turnos/slots.ts for
// the availability calculator that consumes this shape.

export const SLOT_DURATIONS = [30, 45, 60] as const;
export type SlotDuration = (typeof SLOT_DURATIONS)[number];

// Keyed by JS Date.getDay() (0 = Sunday ... 6 = Saturday), as strings
// because that's what JSON object keys are -- see WEEKDAY_KEYS below for
// the canonical iteration order.
export type WeekdayKey = "0" | "1" | "2" | "3" | "4" | "5" | "6";
export const WEEKDAY_KEYS: WeekdayKey[] = ["0", "1", "2", "3", "4", "5", "6"];
export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  "0": "Domingo",
  "1": "Lunes",
  "2": "Martes",
  "3": "Miércoles",
  "4": "Jueves",
  "5": "Viernes",
  "6": "Sábado",
};

export interface TimeRange {
  // 24h "HH:MM", e.g. "09:00". `start` must be strictly before `end`.
  start: string;
  end: string;
}

export interface DaySchedule {
  enabled: boolean;
  ranges: TimeRange[];
}

export type WeeklySchedule = Record<WeekdayKey, DaySchedule>;

export interface TurnosConfig {
  enabled: boolean;
  slotDurationMinutes: SlotDuration;
  // How many days forward the public calendar shows (e.g. 30).
  daysAhead: number;
  // false => national Argentine holidays (see holidays.ts) are blocked.
  worksHolidays: boolean;
  weeklySchedule: WeeklySchedule;
  // Specific one-off blocked dates (vacations, etc.), "YYYY-MM-DD".
  blockedDates: string[];
}

function emptyDay(enabled: boolean, ranges: TimeRange[] = []): DaySchedule {
  return { enabled, ranges };
}

export const DEFAULT_TURNOS_CONFIG: TurnosConfig = {
  enabled: false,
  slotDurationMinutes: 30,
  daysAhead: 30,
  worksHolidays: false,
  weeklySchedule: {
    "0": emptyDay(false),
    "1": emptyDay(true, [{ start: "09:00", end: "13:00" }]),
    "2": emptyDay(true, [{ start: "09:00", end: "13:00" }]),
    "3": emptyDay(true, [{ start: "09:00", end: "13:00" }]),
    "4": emptyDay(true, [{ start: "09:00", end: "13:00" }]),
    "5": emptyDay(true, [{ start: "09:00", end: "13:00" }]),
    "6": emptyDay(false),
  },
  blockedDates: [],
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && TIME_RE.test(value);
}

function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function sanitizeRanges(value: unknown): TimeRange[] {
  if (!Array.isArray(value)) return [];
  const ranges: TimeRange[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const { start, end } = item as Record<string, unknown>;
    if (!isValidTime(start) || !isValidTime(end)) continue;
    if (timeToMinutes(start) >= timeToMinutes(end)) continue;
    ranges.push({ start, end });
  }
  // Earliest first -- purely cosmetic (display order), the availability
  // calculator doesn't depend on it.
  return ranges.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

function sanitizeWeeklySchedule(value: unknown): WeeklySchedule {
  const input = typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
  const result = {} as WeeklySchedule;
  for (const key of WEEKDAY_KEYS) {
    const day = input[key];
    const dayObj = typeof day === "object" && day !== null
      ? (day as Record<string, unknown>)
      : {};
    result[key] = {
      enabled: dayObj.enabled === true,
      ranges: sanitizeRanges(dayObj.ranges),
    };
  }
  return result;
}

function sanitizeBlockedDates(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const unique = new Set<string>();
  for (const item of value) {
    if (typeof item === "string" && DATE_RE.test(item)) unique.add(item);
  }
  return Array.from(unique).sort();
}

// Defensive merge against defaults -- used both when reading a landing's
// stored config (so a hand-edited/legacy row never crashes the page) and
// when accepting an update from the client (so the RLS-protected update
// below never has to trust client-shaped JSON as-is).
export function sanitizeTurnosConfig(value: unknown): TurnosConfig {
  const input = typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

  const slotDurationMinutes = SLOT_DURATIONS.includes(
    input.slotDurationMinutes as SlotDuration
  )
    ? (input.slotDurationMinutes as SlotDuration)
    : DEFAULT_TURNOS_CONFIG.slotDurationMinutes;

  const daysAheadRaw = Number(input.daysAhead);
  const daysAhead =
    Number.isInteger(daysAheadRaw) && daysAheadRaw >= 1 && daysAheadRaw <= 365
      ? daysAheadRaw
      : DEFAULT_TURNOS_CONFIG.daysAhead;

  return {
    enabled: input.enabled === true,
    slotDurationMinutes,
    daysAhead,
    worksHolidays: input.worksHolidays === true,
    weeklySchedule: sanitizeWeeklySchedule(input.weeklySchedule),
    blockedDates: sanitizeBlockedDates(input.blockedDates),
  };
}
