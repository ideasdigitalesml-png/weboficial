"use client";

import { useState } from "react";
import {
  WEEKDAY_KEYS,
  WEEKDAY_LABELS,
  SLOT_DURATIONS,
  type TurnosConfig,
  type WeekdayKey,
  type TimeRange,
} from "@/lib/turnos/types";

const TOGGLE_ACTIVE =
  "font-semibold text-navy underline decoration-sky decoration-2 underline-offset-4";
const TOGGLE_INACTIVE = "text-text-body";
const INPUT_CLASS =
  "min-h-10 rounded-lg border border-border-subtle bg-white px-2 py-1.5 text-sm text-navy focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30";

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
    onChange({
      ...value,
      weeklySchedule: {
        ...value.weeklySchedule,
        [day]: { ...value.weeklySchedule[day], enabled },
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
    const ranges = [...value.weeklySchedule[day].ranges, { start: "09:00", end: "13:00" }];
    onChange({
      ...value,
      weeklySchedule: { ...value.weeklySchedule, [day]: { ...value.weeklySchedule[day], ranges } },
    });
  }

  function removeRange(day: WeekdayKey, index: number) {
    const ranges = value.weeklySchedule[day].ranges.filter((_, i) => i !== index);
    onChange({
      ...value,
      weeklySchedule: { ...value.weeklySchedule, [day]: { ...value.weeklySchedule[day], ranges } },
    });
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
        <button
          type="button"
          role="switch"
          aria-checked={value.enabled}
          onClick={() => onChange({ ...value, enabled: !value.enabled })}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            value.enabled ? "bg-sky" : "bg-border-subtle"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              value.enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {value.enabled && (
        <>
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-navy">Días y horarios de atención</label>
            {WEEKDAY_KEYS.map((day) => {
              const schedule = value.weeklySchedule[day];
              return (
                <div key={day} className="rounded-lg border border-border-subtle p-3">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleDay(day, !schedule.enabled)}
                      className={`text-sm ${schedule.enabled ? TOGGLE_ACTIVE : TOGGLE_INACTIVE}`}
                    >
                      {WEEKDAY_LABELS[day]}
                    </button>
                    {schedule.enabled && (
                      <button
                        type="button"
                        onClick={() => addRange(day)}
                        className="text-xs font-medium text-sky-dark hover:underline"
                      >
                        + agregar horario
                      </button>
                    )}
                  </div>
                  {schedule.enabled && (
                    <div className="mt-2 flex flex-col gap-2">
                      {schedule.ranges.length === 0 && (
                        <p className="text-xs text-text-body">Sin horarios -- agregá uno.</p>
                      )}
                      {schedule.ranges.map((range, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={range.start}
                            onChange={(e) => updateRange(day, i, { start: e.target.value })}
                            className={INPUT_CLASS}
                          />
                          <span className="text-sm text-text-body">a</span>
                          <input
                            type="time"
                            value={range.end}
                            onChange={(e) => updateRange(day, i, { end: e.target.value })}
                            className={INPUT_CLASS}
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                className={INPUT_CLASS}
              >
                {SLOT_DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} minutos
                  </option>
                ))}
              </select>
            </label>

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
                className={INPUT_CLASS}
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
                className={INPUT_CLASS}
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
