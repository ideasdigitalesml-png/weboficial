"use client";

import type { FormFieldValue } from "@/lib/forms/validate-form-data";

// The one key a draft page lives under while a visitor fills the wizard
// without an account yet. sessionStorage (not localStorage) is deliberate:
// it must survive the same-tab round trip through Google OAuth, but must
// NOT persist if the tab is closed and reopened later -- that's the
// correct, expected behavior, not a bug to work around.
export const DRAFT_PAGE_KEY = "draft_page";

export interface DraftPage {
  professionId: string;
  templateId: string;
  formData: Record<string, FormFieldValue>;
  desiredSlug: string;
  paletaId?: string;
}

export function saveDraftPage(draft: DraftPage): void {
  try {
    sessionStorage.setItem(DRAFT_PAGE_KEY, JSON.stringify(draft));
  } catch {
    // sessionStorage can throw in private-browsing edge cases -- losing the
    // draft just means the publish step below re-derives it isn't
    // possible, which the publish flow already handles as a normal error.
  }
}

export function loadDraftPage(): DraftPage | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_PAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftPage;
  } catch {
    return null;
  }
}

export function clearDraftPage(): void {
  try {
    sessionStorage.removeItem(DRAFT_PAGE_KEY);
  } catch {
    // Nothing to do -- see saveDraftPage.
  }
}
