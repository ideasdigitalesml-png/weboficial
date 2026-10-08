"use client";

import { useMemo, useState } from "react";
import { buildWaLink } from "@/lib/whatsapp";
import { formatDayMonth, weekdayOf } from "@/lib/turnos/slots";
import type { TurnosBookingData, TurnosVisualStyle } from "@/lib/turnos/booking-data";

const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MOTIVO_MAX_LENGTH = 120;

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
    chipRadius: "rounded-xl",
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
    primaryColor,
    accentColor,
    visualStyle,
  } = data;
  const style = STYLE_MAP[visualStyle];

  const dates = useMemo(() => Object.keys(availability).sort(), [availability]);
  const [selectedDate, setSelectedDate] = useState<string | null>(dates[0] ?? null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [motivo, setMotivo] = useState("");

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
    const base = `Hola ${professionalName || "profesional"}, soy ${name.trim()}. Quiero pedir un turno el ${formatDayMonth(
      selectedDate
    )} a las ${selectedTime}.`;
    const motivoPart = requireMotivo ? ` Motivo: ${motivo.trim()}.` : "";
    const message = `${base}${motivoPart} Lo pedí desde tu página web.`;
    return `${buildWaLink(phone)}?text=${encodeURIComponent(message)}`;
  })();

  return (
    <section
      id="reserva-turno"
      className="px-6 py-14"
      style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 4%, white)` }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="text-center">
          <h2 className={`text-2xl sm:text-3xl ${style.heading}`} style={{ color: primaryColor }}>
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
            <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
              {dates.map((date) => {
                const isSelected = date === selectedDate;
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => selectDate(date)}
                    className={`flex shrink-0 flex-col items-center gap-0.5 border px-3.5 py-2.5 text-sm font-medium transition-colors ${style.chipRadius}`}
                    style={
                      isSelected
                        ? { backgroundColor: accentColor, borderColor: accentColor, color: "#fff" }
                        : { backgroundColor: "#fff", borderColor: "#e2e8f0", color: "#334155" }
                    }
                  >
                    <span className="text-[11px] uppercase opacity-80">
                      {WEEKDAY_SHORT[weekdayOf(date)]}
                    </span>
                    <span>{formatDayMonth(date)}</span>
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="flex flex-wrap justify-center gap-2">
                {availability[selectedDate].map((time) => {
                  const isSelected = time === selectedTime;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`min-w-[72px] border px-3 py-2 text-sm font-medium transition-colors ${style.chipRadius}`}
                      style={
                        isSelected
                          ? { backgroundColor: primaryColor, borderColor: primaryColor, color: "#fff" }
                          : { backgroundColor: "#fff", borderColor: "#e2e8f0", color: "#334155" }
                      }
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}

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
                  Agendar turno por WhatsApp
                </a>
                <p className="text-center text-xs text-slate-400">
                  El profesional te va a confirmar el turno por WhatsApp.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
