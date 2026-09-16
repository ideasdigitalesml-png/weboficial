"use client";

import type {
  FormFieldSchema,
  FormFieldValue,
} from "@/lib/forms/validate-form-data";
import {
  WHATSAPP_COUNTRY_CODES,
  DEFAULT_WHATSAPP_COUNTRY_CODE,
  buildWhatsappValue,
  splitWhatsappValue,
} from "@/lib/whatsapp";
import { useState } from "react";

export interface StockImage {
  id: string;
  category: string;
  image_url: string;
}

// Shared weboficial brand treatment for every input in the onboarding
// wizard (and, since this component is reused there too, the dashboard's
// post-publish edit form) -- navy/sky on white, min-h-12 tap targets, no
// dark-mode branching, matching the rest of the marketing site's fixed
// light theme in src/components/landing/.
const LABEL_CLASS = "text-sm font-medium text-navy";
const INPUT_CLASS =
  "min-h-12 rounded-lg border border-border-subtle bg-white px-3 py-2 text-navy placeholder:text-text-body/50 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30";
const TOGGLE_ACTIVE_CLASS = "font-semibold text-navy underline decoration-sky decoration-2 underline-offset-4";
const TOGGLE_INACTIVE_CLASS = "text-text-body";

export function FieldInput({
  field,
  value,
  error,
  onChange,
  imageMode,
  onImageModeChange,
  stockImages,
}: {
  field: FormFieldSchema;
  value: FormFieldValue;
  error?: string;
  onChange: (value: FormFieldValue) => void;
  imageMode: "stock" | "manual";
  onImageModeChange: (mode: "stock" | "manual") => void;
  stockImages: StockImage[];
}) {
  const stringValue = typeof value === "string" ? value : "";

  if (field.type === "image") {
    return (
      <div className="flex flex-col gap-2">
        <label className={LABEL_CLASS}>{field.label}</label>
        <div className="flex gap-4 text-sm">
          <button
            type="button"
            onClick={() => onImageModeChange("stock")}
            className={
              imageMode === "stock" ? TOGGLE_ACTIVE_CLASS : TOGGLE_INACTIVE_CLASS
            }
          >
            Elegir de la galería
          </button>
          <button
            type="button"
            onClick={() => onImageModeChange("manual")}
            className={
              imageMode === "manual" ? TOGGLE_ACTIVE_CLASS : TOGGLE_INACTIVE_CLASS
            }
          >
            Pegar URL
          </button>
        </div>
        {imageMode === "stock" ? (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {stockImages.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.image_url}
                alt=""
                onClick={() => onChange(img.image_url)}
                className={`aspect-square cursor-pointer rounded-full object-cover ${
                  stringValue === img.image_url
                    ? "ring-2 ring-sky ring-offset-2"
                    : ""
                }`}
              />
            ))}
          </div>
        ) : (
          <input
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className={INPUT_CLASS}
          />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (field.type === "whatsapp") {
    return (
      <WhatsappFieldInput
        field={field}
        value={stringValue}
        error={error}
        onChange={onChange}
      />
    );
  }

  if (field.type === "select") {
    return (
      <div className="flex flex-col gap-2">
        <label className={LABEL_CLASS}>{field.label}</label>
        <select
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">Sin especificar</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (field.type === "checkbox-group") {
    const selected = Array.isArray(value) ? value : [];
    function toggle(optionValue: string) {
      const next = selected.includes(optionValue)
        ? selected.filter((v) => v !== optionValue)
        : [...selected, optionValue];
      onChange(next);
    }
    return (
      <div className="flex flex-col gap-2">
        <label className={LABEL_CLASS}>{field.label}</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {(field.options ?? []).map((opt) => {
            const isChecked = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  isChecked
                    ? "border-sky bg-sky/5 text-navy"
                    : "border-border-subtle text-text-body"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(opt.value)}
                  className="accent-sky"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className={LABEL_CLASS}>{field.label}</label>
      {field.type === "textarea" ? (
        <textarea
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          maxLength={field.max_length}
          className={INPUT_CLASS}
        />
      ) : (
        <input
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          type={field.type === "email" ? "email" : "text"}
          className={INPUT_CLASS}
        />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function WhatsappFieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: FormFieldSchema;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const initial = value ? splitWhatsappValue(value) : null;
  const [countryCode, setCountryCode] = useState(
    initial?.countryCode ?? DEFAULT_WHATSAPP_COUNTRY_CODE
  );
  const [rawNumber, setRawNumber] = useState(initial?.number ?? "");

  function emit(nextCountryCode: string, nextRawNumber: string) {
    const built = buildWhatsappValue(nextCountryCode, nextRawNumber);
    onChange(built ?? "");
  }

  return (
    <div className="flex flex-col gap-2">
      <label className={LABEL_CLASS}>{field.label}</label>
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(e) => {
            setCountryCode(e.target.value);
            emit(e.target.value, rawNumber);
          }}
          className={`${INPUT_CLASS} text-sm`}
        >
          {WHATSAPP_COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          value={rawNumber}
          onChange={(e) => {
            setRawNumber(e.target.value);
            emit(countryCode, e.target.value);
          }}
          inputMode="numeric"
          placeholder="11 2233-4455"
          className={`${INPUT_CLASS} flex-1`}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
