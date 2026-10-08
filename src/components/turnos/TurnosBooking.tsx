"use client";

import { useMemo, useState } from "react";
import { buildWaLink } from "@/lib/whatsapp";
import {
  formatDayMonth,
  weekdayOf,
  monthKeyOf,
  daysInMonth,
  addMonths,
  addDays,
  classifyRange,
  type Franja,
} from "@/lib/turnos/slots";
import type { TimeRange, WeekdayKey } from "@/lib/turnos/types";
import type { TurnosBookingData, TurnosVisualStyle } from "@/lib/turnos/booking-data";

const WEEKDAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];
const WEEKDAY_FULL = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const MOTIVO_MAX_LENGTH = 120;

// Day/month without zero-padding, e.g. "8/10" -- the on-screen summary
// line's format (per spec: "Jueves 8/10 a las 09:00"). Deliberately
// different from formatDayMonth (slots.ts), which zero-pads for the
// WhatsApp message text ("08/10") instead.
function formatSummaryDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${d}/${m}`;
}

// "9" for "09:00", "13:30" for "13:30" -- whole hours drop the ":00" to
// match the spec's own "Mañana (9 a 13)" example.
function formatHourShort(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return m === 0 ? `${h}` : `${h}:${String(m).padStart(2, "0")}`;
}

// "Mañana (9 a 13)" / "Tarde (15 a 19)" -- built from whichever of the
// day's own configured ranges classify into this franja (see classifyRange),
// spanning from the earliest start to the latest end among them. A day
// with only one range only ever produces a label for its own franja, which
// is exactly "si el día tiene un solo rango, mostrá solo esa franja" --
// TurnosBooking only renders a franja button when `franja` is present in
// that date's availability array to begin with.
function franjaLabel(ranges: TimeRange[], franja: Franja): string {
  const name = franja === "morning" ? "Mañana" : "Tarde";
  const matching = ranges.filter((r) => classifyRange(r) === franja);
  if (matching.length === 0) return name;
  const start = matching.reduce((min, r) => (r.start < min ? r.start : min), matching[0].start);
  const end = matching.reduce((max, r) => (r.end > max ? r.end : max), matching[0].end);
  return `${name} (${formatHourShort(start)} a ${formatHourShort(end)})`;
}

function buildMonthGrid(monthKey: string): (string | null)[] {
  const [y, m] = monthKey.split("-").map(Number);
  const firstWeekday = weekdayOf(`${monthKey}-01`); // 0=Sun..6=Sat
  const leading = (firstWeekday + 6) % 7; // Monday-start offset
  const total = daysInMonth(monthKey);
  const cells: (string | null)[] = Array(leading).fill(null);
  for (let d = 1; d <= total; d++) {
    cells.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.44 1.27 4.89L2 22l5.24-1.27A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.13c-1.58 0-3.06-.44-4.32-1.22l-.31-.18-3.11.76.77-3.03-.2-.32A8.07 8.07 0 0 1 3.9 12c0-4.49 3.65-8.14 8.14-8.14S20.18 7.51 20.18 12s-3.65 8.13-8.14 8.13Zm4.46-6.09c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

// Three families, matching every template's own layout vocabulary
// (moderno/clasico/minimal) -- picked by visualStyle (see
// normalizeVisualStyle in booking-data.ts) so this section's typography,
// corners, and button shape read as part of whichever template it's
// embedded in, not one generic widget reused unchanged nine times.
const STYLE_MAP: Record<
  TurnosVisualStyle,
  { heading: string; chipRadius: string; buttonRadius: string; cardRadius: string }
> = {
  moderno: {
    heading: "font-bold",
    chipRadius: "rounded-lg",
    buttonRadius: "rounded-full",
    cardRadius: "rounded-2xl",
  },
  clasico: {
    heading: "font-serif font-semibold",
    chipRadius: "rounded-md",
    buttonRadius: "rounded-md",
    cardRadius: "rounded-lg",
  },
  minimal: {
    heading: "font-medium tracking-wide",
    chipRadius: "rounded-sm",
    buttonRadius: "rounded-sm",
    cardRadius: "rounded-sm",
  },
};

// The one calendar+slot-picker+form component every template (all 9) and
// every /ejemplo/* demo page embeds for "Reservá tu turno" -- styled via
// primaryColor/accentColor props instead of a per-template copy, so one fix
// here fixes it everywhere. No appointment is ever sent anywhere by this
// component: picking a slot and submitting just opens a wa.me link with the
// message prefilled: the professional's own WhatsApp is the only system of
// record, by design (see the feature's conversation).
export function TurnosBooking({ data }: { data: TurnosBookingData }) {
  const {
    config,
    availability,
    phone,
    professionalName,
    requireMotivo,
    accentColor,
    visualStyle,
    todayDateStr,
  } = data;
  const style = STYLE_MAP[visualStyle];
  const isRangeMode = config.bookingMode === "range";

  const dates = useMemo(() => Object.keys(availability).sort(), [availability]);
  const minMonth = monthKeyOf(todayDateStr);
  const maxMonth = monthKeyOf(addDays(todayDateStr, Math.max(0, config.daysAhead - 1)));
  const [viewMonth, setViewMonth] = useState(() => monthKeyOf(dates[0] ?? todayDateStr));
  const [selectedDate, setSelectedDate] = useState<string | null>(dates[0] ?? null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [motivo, setMotivo] = useState("");
  const grid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  if (!config.enabled || !phone) return null;

  function selectDate(date: string) {
    setSelectedDate(date);
    setSelectedTime(null);
  }

  const canSubmit =
    Boolean(selectedDate) && Boolean(selectedTime) && name.trim().length > 0 &&
    (!requireMotivo || motivo.trim().length > 0);

  const waHref = (() => {
    if (!canSubmit || !selectedDate || !selectedTime) return undefined;
    if (data.ctaHref) return data.ctaHref;
    // Range mode: "el jueves 8/10 por la mañana" (weekday name + unpadded
    // day/month, same as the on-screen summary). Exact mode: unchanged --
    // "el 08/10 a las 09:00".
    const whenText = isRangeMode
      ? `el ${WEEKDAY_FULL[weekdayOf(selectedDate)].toLowerCase()} ${formatSummaryDate(selectedDate)} por la ${
          selectedTime === "morning" ? "mañana" : "tarde"
        }`
      : `el ${formatDayMonth(selectedDate)} a las ${selectedTime}`;
    const base = `Hola ${professionalName || "profesional"}, soy ${name.trim()}. Quiero pedir un turno ${whenText}.`;
    const motivoPart = requireMotivo ? ` Motivo: ${motivo.trim()}.` : "";
    const message = `${base}${motivoPart} Lo pedí desde tu página web.`;
    return `${buildWaLink(phone)}?text=${encodeURIComponent(message)}`;
  })();

  const [y, m] = viewMonth.split("-").map(Number);
  const monthLabel = `${MONTH_NAMES[m - 1]} ${y}`;

  return (
    <section
      id="reserva-turno"
      className="px-6 py-14"
      style={{ backgroundColor: `color-mix(in srgb, ${data.primaryColor} 4%, white)` }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="text-center">
          <h2 className={`text-2xl sm:text-3xl ${style.heading}`} style={{ color: data.primaryColor }}>
            Reservá tu turno
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Elegí un día y un horario, completá tus datos y pedí tu turno por WhatsApp.
          </p>
        </div>

        {dates.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
            No hay turnos disponibles por el momento.
          </p>
        ) : (
          <>
            <div className={`border border-slate-200 bg-white p-3 sm:p-4 ${style.cardRadius}`}>
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewMonth((v) => addMonths(v, -1))}
                  disabled={viewMonth <= minMonth}
                  aria-label="Mes anterior"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-30"
                >
                  ‹
                </button>
                <span className="text-sm font-semibold capitalize text-slate-700">{monthLabel}</span>
                <button
                  type="button"
                  onClick={() => setViewMonth((v) => addMonths(v, 1))}
                  disabled={viewMonth >= maxMonth}
                  aria-label="Mes siguiente"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-30"
                >
                  ›
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-slate-400">
                {WEEKDAY_LETTERS.map((l, i) => (
                  <span key={i}>{l}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {grid.map((dateStr, i) => {
                  if (!dateStr) return <span key={i} />;
                  const isAvailable = Boolean(availability[dateStr]);
                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === todayDateStr;
                  const dayNum = Number(dateStr.slice(-2));
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => selectDate(dateStr)}
                      aria-current={isToday ? "date" : undefined}
                      className={`relative aspect-square text-sm font-medium transition-colors ${style.chipRadius} ${
                        isAvailable ? "cursor-pointer" : "cursor-not-allowed text-slate-300"
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: accentColor, color: "#fff" }
                          : isAvailable
                            ? { backgroundColor: "#fff", color: "#334155", border: "1px solid #e2e8f0" }
                            : undefined
                      }
                    >
                      {dayNum}
                      {isToday && !isSelected && (
                        <span
                          className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                          style={{ backgroundColor: accentColor }}
                          aria-hidden
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (() => {
              const dayRanges =
                config.weeklySchedule[String(weekdayOf(selectedDate)) as WeekdayKey]?.ranges ?? [];
              return (
                <div className="flex flex-wrap justify-center gap-2">
                  {availability[selectedDate].map((option) => {
                    const isSelected = option === selectedTime;
                    const label = isRangeMode ? franjaLabel(dayRanges, option as Franja) : option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedTime(option)}
                        className={`min-w-[72px] border px-3 py-2 text-sm font-medium transition-colors ${style.chipRadius}`}
                        style={
                          isSelected
                            ? { backgroundColor: accentColor, borderColor: accentColor, color: "#fff" }
                            : { backgroundColor: "#fff", borderColor: "#e2e8f0", color: "#334155" }
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {selectedDate && selectedTime && (
              <div className={`flex flex-col gap-3 border border-slate-200 bg-white p-4 ${style.cardRadius}`}>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-slate-700">Tu nombre</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre y apellido"
                    className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-slate-400 focus:outline-none"
                  />
                </label>
                {requireMotivo && (
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-slate-700">Motivo (breve)</span>
                    <input
                      type="text"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value.slice(0, MOTIVO_MAX_LENGTH))}
                      placeholder="Ej: consulta por monotributo"
                      maxLength={MOTIVO_MAX_LENGTH}
                      className="min-h-11 rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:border-slate-400 focus:outline-none"
                    />
                    <span className="text-right text-xs text-slate-400">
                      {motivo.length}/{MOTIVO_MAX_LENGTH}
                    </span>
                  </label>
                )}

                <p className="text-center text-sm font-medium text-slate-600">
                  {WEEKDAY_FULL[weekdayOf(selectedDate)]} {formatSummaryDate(selectedDate)}{" "}
                  {isRangeMode
                    ? `por la ${selectedTime === "morning" ? "mañana" : "tarde"}`
                    : `a las ${selectedTime}`}
                </p>

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener"
                  aria-disabled={!canSubmit}
                  onClick={(e) => {
                    if (!canSubmit) e.preventDefault();
                  }}
                  className={`mt-1 inline-flex min-h-12 items-center justify-center gap-2 px-6 text-sm font-semibold text-white transition-opacity ${
                    style.buttonRadius
                  } ${canSubmit ? "" : "pointer-events-none opacity-40"}`}
                  style={{ backgroundColor: accentColor }}
                >
                  <WhatsAppIcon />
                  Agendar turno por WhatsApp
                </a>
                <p className="text-center text-xs text-slate-400">
                  {data.ctaHref
                    ? "Así lo pediría tu cliente — en tu página real, esto abre WhatsApp."
                    : "El profesional te va a confirmar el turno por WhatsApp."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
