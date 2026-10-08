import fallbackHolidays from "./holidays-fallback.json";

// Maintained source for Argentine national holidays, including trasladables
// (moved-by-law holidays) and puentes (bridge/long-weekend non-working
// days) -- ArgentinaDatos' endpoint already folds all three "tipo"s
// (inamovible/trasladable/puente) into one list per year, so blocking every
// `fecha` it returns is exactly "feriados nacionales incluyendo
// trasladables y puentes".
const HOLIDAYS_API_URL = "https://api.argentinadatos.com/v1/feriados";
const FETCH_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface HolidayApiItem {
  fecha: string;
  tipo: string;
  nombre: string;
}

const cache = new Map<number, { dates: Set<string>; fetchedAt: number }>();

function fallbackDatesFor(year: number): Set<string> {
  const dates = (fallbackHolidays as Record<string, string[]>)[String(year)];
  return new Set(dates ?? []);
}

// Fetches (and caches, 24h TTL, per server instance) every blocked date for
// a given year. Falls back to a bundled snapshot (see holidays-fallback.json)
// if the API is unreachable or returns something unexpected -- a missing
// year in the fallback degrades to "no holidays blocked" rather than
// throwing, since this must never be the reason a booking section fails to
// render.
export async function getArgentinaHolidays(year: number): Promise<Set<string>> {
  const cached = cache.get(year);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.dates;
  }

  try {
    const res = await fetch(`${HOLIDAYS_API_URL}/${year}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`feriados API status ${res.status}`);
    const data = (await res.json()) as HolidayApiItem[];
    if (!Array.isArray(data)) throw new Error("feriados API: unexpected shape");
    const dates = new Set(
      data
        .map((item) => item?.fecha)
        .filter((fecha): fecha is string => typeof fecha === "string")
    );
    cache.set(year, { dates, fetchedAt: Date.now() });
    return dates;
  } catch (err) {
    console.error(`getArgentinaHolidays(${year}) failed, using fallback snapshot`, err);
    const dates = fallbackDatesFor(year);
    cache.set(year, { dates, fetchedAt: Date.now() });
    return dates;
  }
}

// Convenience for a date range spanning at most two calendar years (the
// booking window is `daysAhead` days, capped at 365 -- see sanitizeTurnosConfig
// -- so it can straddle at most one year boundary).
export async function getArgentinaHolidaysForYears(
  years: number[]
): Promise<Set<string>> {
  const unique = Array.from(new Set(years));
  const sets = await Promise.all(unique.map(getArgentinaHolidays));
  const merged = new Set<string>();
  for (const set of sets) {
    for (const date of set) merged.add(date);
  }
  return merged;
}
