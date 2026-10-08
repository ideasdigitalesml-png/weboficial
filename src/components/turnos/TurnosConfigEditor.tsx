"use client";

import { useState } from "react";
import {
  WEEKDAY_KEYS,
  WEEKDAY_LABELS,
  SLOT_DURATIONS,
  DEFAULT_WEEKLY_SCHEDULE,
  validateDayRanges,
  type TurnosConfig,
  type WeekdayKey,
  type TimeRange,
} from "@/lib/turnos/types";

const TOGGLE_ACTIVE =
  "font-semibold text-navy underline decoration-sky decoration-2 underline-offset-4";
const TOGGLE_INACTIVE = "text-text-body";
const SELECT_CLASS =
  "min-h-10 rounded-lg border border-border-subtle bg-white px-2 py-1.5 text-sm text-navy focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30";

// 24h, 15-min steps, "00:00".."23:45" -- a <select> instead of
// <input type="time"> so the format is always 24h regardless of the
// visitor's OS/browser locale (type="time" renders am/pm under some
// locales no matter what `step` is set).
const TIME_OPTIONS: string[] = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 45, min));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Flex-based, not absolute-positioned -- the circle's translate-x is
// relative to its own normal-flow start (the track's content edge, thanks
// to p-0/border-0 killing the browser's default <button> padding), so it
// can never overflow the track the way an unreset absolute child can.
function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-0 p-0 transition-colors ${
        checked ? "bg-sky" : "bg-border-subtle"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
      {TIME_OPTIONS.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

// Shared by the "configurá tus turnos" wizard step and the dashboard's
// "Mis turnos" page -- the professional-facing config form (not to be
// confused with the public booking calendar a client sees, which is a
// separate, per-template-themed component). Fully controlled: the caller
// owns the TurnosConfig state and persists it (draft/sessionStorage during
// onboarding, a server action from the dashboard).
export function TurnosConfigEditor({
  value,
  onChange,
}: {
  value: TurnosConfig;
  onChange: (next: TurnosConfig) => void;
}) {
  const [newBlockedDate, setNewBlockedDate] = useState("");

  function toggleDay(day: WeekdayKey, enabled: boolean) {
    const current = value.weeklySchedule[day];
    onChange({
      ...value,
      weeklySchedule: {
        ...value.weeklySchedule,
        // Switching Cerrado -> Atiendo with no ranges yet gets a sensible
        // default instead of landing on an empty "sin horarios" state.
        [day]: {
          enabled,
          ranges: enabled && current.ranges.length === 0 ? [{ start: "09:00", end: "13:00" }] : current.ranges,
        },
      },
    });
  }

  function updateRange(day: WeekdayKey, index: number, patch: Partial<TimeRange>) {
    const ranges = value.weeklySchedule[day].ranges.map((r, i) =>
      i === index ? { ...r, ...patch } : r
    );
    onChange({
      ...value,
      weeklySchedule: {
        ...value.weeklySchedule,
        [day]: { ...value.weeklySchedule[day], ranges },
      },
    });
  }

  function addRange(day: WeekdayKey) {
    const existing = value.weeklySchedule[day].ranges;
    const last = existing[existing.length - 1];
    // Proposes a range starting right where the last one ends (e.g. 09:00-13:00
    // already there -> proposes 13:00-17:00), never past 23:45.
    const start = last ? last.end : "09:00";
    const end = minutesToTime(timeToMinutes(start) + 4 * 60);
    onChange({
      ...value,
      weeklySchedule: {
        ...value.weeklySchedule,
        [day]: { ...value.weeklySchedule[day], ranges: [...existing, { start, end }] },
      },
    });
  }

  function removeRange(day: WeekdayKey, index: number) {
    const ranges = value.weeklySchedule[day].ranges.filter((_, i) => i !== index);
    onChange({
      ...value,
      weeklySchedule: { ...value.weeklySchedule, [day]: { ...value.weeklySchedule[day], ranges } },
    });
  }

  function copyToAllOpenDays(sourceDay: WeekdayKey) {
    const ranges = value.weeklySchedule[sourceDay].ranges;
    const weeklySchedule = { ...value.weeklySchedule };
    for (const day of WEEKDAY_KEYS) {
      if (day !== sourceDay && weeklySchedule[day].enabled) {
        weeklySchedule[day] = { ...weeklySchedule[day], ranges };
      }
    }
    onChange({ ...value, weeklySchedule });
  }

  function applyPreset() {
    onChange({ ...value, weeklySchedule: DEFAULT_WEEKLY_SCHEDULE });
  }

  function addBlockedDate() {
    if (!newBlockedDate || value.blockedDates.includes(newBlockedDate)) return;
    onChange({
      ...value,
      blockedDates: [...value.blockedDates, newBlockedDate].sort(),
    });
    setNewBlockedDate("");
  }

  function removeBlockedDate(date: string) {
    onChange({ ...value, blockedDates: value.blockedDates.filter((d) => d !== date) });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border-subtle bg-surface-muted px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-navy">Turnos por WhatsApp</p>
          <p className="text-xs text-text-body">
            Tus clientes eligen día y horario, y te escriben por WhatsApp para pedir el turno.
          </p>
        </div>
        <Switch
          checked={value.enabled}
          onChange={() => onChange({ ...value, enabled: !value.enabled })}
          label="Activar turnos por WhatsApp"
        />
      </div>

      {value.enabled && (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-medium text-navy">Días y horarios de atención</label>
              <button
                type="button"
                onClick={applyPreset}
                className="text-xs font-medium text-sky-dark hover:underline"
              >
                Usar lun a vie, 9 a 13 y 15 a 19
              </button>
            </div>
            {WEEKDAY_KEYS.map((day) => {
              const schedule = value.weeklySchedule[day];
              const error = schedule.enabled ? validateDayRanges(schedule.ranges) : null;
              return (
                <div
                  key={day}
                  className={`rounded-lg border p-3 transition-colors ${
                    schedule.enabled ? "border-border-subtle" : "border-border-subtle bg-surface-muted/60 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-navy">{WEEKDAY_LABELS[day]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-body">
                        {schedule.enabled ? "Atiendo" : "Cerrado"}
                      </span>
                      <Switch
                        checked={schedule.enabled}
                        onChange={() => toggleDay(day, !schedule.enabled)}
                        label={`${WEEKDAY_LABELS[day]}: ${schedule.enabled ? "atiendo" : "cerrado"}`}
                      />
                    </div>
                  </div>
                  {schedule.enabled ? (
                    <div className="mt-2 flex flex-col gap-2">
                      {schedule.ranges.map((range, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <TimeSelect
                            value={range.start}
                            onChange={(v) => updateRange(day, i, { start: v })}
                          />
                          <span className="text-sm text-text-body">a</span>
                          <TimeSelect
                            value={range.end}
                            onChange={(v) => updateRange(day, i, { end: v })}
                          />
                          <button
                            type="button"
                            onClick={() => removeRange(day, i)}
                            aria-label="Quitar horario"
                            className="text-text-body hover:text-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <button
                          type="button"
                          onClick={() => addRange(day)}
                          className="text-xs font-medium text-sky-dark hover:underline"
                        >
                          + agregar horario
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToAllOpenDays(day)}
                          className="text-xs font-medium text-sky-dark hover:underline"
                        >
                          Copiar este horario a todos los días que atiendo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-text-body">Cerrado</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy">Tipo de turno</span>
            <div className="flex gap-4 text-sm">
              <button
                type="button"
                onClick={() => onChange({ ...value, bookingMode: "exact" })}
                className={value.bookingMode !== "range" ? TOGGLE_ACTIVE : TOGGLE_INACTIVE}
              >
                Horario exacto
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...value, bookingMode: "range" })}
                className={value.bookingMode === "range" ? TOGGLE_ACTIVE : TOGGLE_INACTIVE}
              >
                Por franja
              </button>
            </div>
            <p className="text-xs text-text-body">
              {value.bookingMode === "range"
                ? "Tu cliente elige el día y si prefiere mañana o tarde, sin horario exacto."
                : "Tu cliente elige el día y un horario puntual dentro de tus rangos."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {value.bookingMode !== "range" && (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-navy">Duración del turno</span>
                <select
                  value={value.slotDurationMinutes}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      slotDurationMinutes: Number(e.target.value) as TurnosConfig["slotDurationMinutes"],
                    })
                  }
                  className={SELECT_CLASS}
                >
                  {SLOT_DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} minutos
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-navy">Días hacia adelante a mostrar</span>
              <input
                type="number"
                min={1}
                max={365}
                value={value.daysAhead}
                onChange={(e) =>
                  onChange({ ...value, daysAhead: Math.max(1, Math.min(365, Number(e.target.value) || 1)) })
                }
                className={SELECT_CLASS}
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle px-3 py-2.5">
            <span className="text-sm font-medium text-navy">¿Trabajás los feriados?</span>
            <div className="flex gap-3 text-sm">
              <button
                type="button"
                onClick={() => onChange({ ...value, worksHolidays: false })}
                className={!value.worksHolidays ? TOGGLE_ACTIVE : TOGGLE_INACTIVE}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...value, worksHolidays: true })}
                className={value.worksHolidays ? TOGGLE_ACTIVE : TOGGLE_INACTIVE}
              >
                Sí
              </button>
            </div>
          </div>
          {!value.worksHolidays && (
            <p className="-mt-2 text-xs text-text-body">
              No se van a ofrecer turnos en los feriados nacionales (incluye trasladables y puentes).
            </p>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-navy">
              Fechas puntuales bloqueadas (vacaciones, etc.)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                className={SELECT_CLASS}
              />
              <button
                type="button"
                onClick={addBlockedDate}
                disabled={!newBlockedDate}
                className="min-h-10 rounded-lg border border-border-subtle px-3 text-sm font-medium text-navy transition-colors hover:border-navy/40 disabled:opacity-40"
              >
                Agregar
              </button>
            </div>
            {value.blockedDates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {value.blockedDates.map((date) => (
                  <span
                    key={date}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-muted px-3 py-1 text-xs text-navy"
                  >
                    {date}
                    <button
                      type="button"
                      onClick={() => removeBlockedDate(date)}
                      aria-label={`Quitar ${date}`}
                      className="text-text-body hover:text-red-600"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
