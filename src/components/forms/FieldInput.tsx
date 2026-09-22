"use client";

import type {
  FormFieldSchema,
  FormFieldValue,
  RepeaterItem,
} from "@/lib/forms/validate-form-data";
import {
  WHATSAPP_COUNTRY_CODES,
  DEFAULT_WHATSAPP_COUNTRY_CODE,
  buildWhatsappValue,
  splitWhatsappValue,
} from "@/lib/whatsapp";
import { useRef, useState } from "react";

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

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
  imageMode?: "stock" | "manual";
  onImageModeChange?: (mode: "stock" | "manual") => void;
  stockImages?: StockImage[];
}) {
  const stringValue = typeof value === "string" ? value : "";

  if (field.type === "image") {
    return (
      <ImageFieldInput field={field} value={stringValue} error={error} onChange={onChange} />
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

  if (field.type === "repeater") {
    const items = Array.isArray(value) && typeof value[0] !== "string"
      ? (value as RepeaterItem[])
      : [];
    return (
      <RepeaterFieldInput
        field={field}
        items={items}
        error={error}
        onChange={(next) => onChange(next as unknown as FormFieldValue)}
      />
    );
  }

  if (field.type === "checkbox-group") {
    const selected = Array.isArray(value)
      ? value.filter((v): v is string => typeof v === "string")
      : [];
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

// Photos are captured as base64 data URLs here, not uploaded yet -- the
// onboarding wizard is reachable by anonymous visitors (they sign in only
// at publish time), and the storage.objects insert policy requires an
// authenticated role, so an upload attempted from this component would
// fail with a permissions error for anyone not already logged in. The
// actual Supabase Storage upload happens once at publish time, when a
// session is guaranteed to exist -- see uploadPendingPhotos in
// src/app/onboarding/photo-upload.ts.
function ImageFieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: FormFieldSchema;
  value: string;
  error?: string;
  onChange: (value: FormFieldValue) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [readError, setReadError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input so selecting the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setReadError("La imagen no puede pesar más de 5MB.");
      return;
    }

    setReadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      } else {
        setReadError("Error al leer la foto, intentá de nuevo");
      }
    };
    reader.onerror = () => {
      setReadError("Error al leer la foto, intentá de nuevo");
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className={LABEL_CLASS}>{field.label}</label>
      <div className="flex items-center gap-4">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border-subtle bg-white px-4 text-sm font-medium text-navy transition-colors hover:border-sky"
        >
          <CameraIcon />
          {value ? "Cambiar foto" : "Subir foto"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {readError && <p className="text-sm text-red-600">{readError}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M6.5 4.5L7.5 3h5l1 1.5H16a1 1 0 011 1V15a1 1 0 01-1 1H4a1 1 0 01-1-1V5.5a1 1 0 011-1h2.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10.5" r="3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

// Renders an add/remove list of cards (servicios, testimonios, "por qué
// elegirnos") -- each card's columns come from field.item_fields, not
// hardcoded here, so the same component serves every repeater field across
// every profession. min_items/max_items are UI hints only (see
// validate-form-data.ts): saving with fewer than min_items still works, the
// professional can build the list up over multiple edits.
function RepeaterFieldInput({
  field,
  items,
  error,
  onChange,
}: {
  field: FormFieldSchema;
  items: RepeaterItem[];
  error?: string;
  onChange: (items: RepeaterItem[]) => void;
}) {
  const itemFields = field.item_fields ?? [];
  const maxReached = field.max_items ? items.length >= field.max_items : false;

  function updateItem(index: number, key: string, itemValue: string) {
    const next = items.map((item, i) =>
      i === index ? { ...item, [key]: itemValue } : item
    );
    onChange(next);
  }

  function addItem() {
    const blank: RepeaterItem = Object.fromEntries(
      itemFields.map((f) => [f.key, ""])
    );
    onChange([...items, blank]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <label className={LABEL_CLASS}>{field.label}</label>
      {field.min_items && (
        <p className="text-xs text-text-body/70">
          {items.length >= field.min_items
            ? `${items.length} elemento(s) — recomendado: al menos ${field.min_items}`
            : `Tenés ${items.length} de ${field.min_items} recomendados`}
        </p>
      )}
      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-white p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-text-body/60">
                #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </div>
            {itemFields.map((itemField) => (
              <div key={itemField.key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-navy">
                  {itemField.label}
                </label>
                {itemField.type === "textarea" ? (
                  <textarea
                    value={item[itemField.key] ?? ""}
                    onChange={(e) => updateItem(index, itemField.key, e.target.value)}
                    rows={3}
                    maxLength={itemField.max_length}
                    className={INPUT_CLASS}
                  />
                ) : (
                  <input
                    value={item[itemField.key] ?? ""}
                    onChange={(e) => updateItem(index, itemField.key, e.target.value)}
                    maxLength={itemField.type === "icon" ? 4 : itemField.max_length}
                    placeholder={itemField.type === "icon" ? "🙂" : undefined}
                    className={
                      itemField.type === "icon" ? `${INPUT_CLASS} w-20 text-center text-lg` : INPUT_CLASS
                    }
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        disabled={maxReached}
        className="inline-flex min-h-10 items-center justify-center self-start rounded-lg border border-border-subtle bg-white px-4 text-sm font-medium text-navy transition-colors hover:border-sky disabled:cursor-not-allowed disabled:opacity-40"
      >
        + Agregar
      </button>
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
