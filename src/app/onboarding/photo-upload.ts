import type { SupabaseClient } from "@supabase/supabase-js";

const DATA_URL_PREFIX = "data:image/";

function extensionForMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

// The onboarding wizard is reachable by anonymous visitors, so FieldInput's
// image field never uploads directly -- it only ever captures a base64
// data URL (see ImageFieldInput in FieldInput.tsx), because the
// storage.objects insert policy requires an authenticated role and no
// session is guaranteed to exist yet at that point.
//
// This is the one place that actually uploads to Supabase Storage, called
// right before a landing is created -- by then the caller (either
// publishDraftPage, or a wizard's handleSubmit when the visitor was
// already logged in) is guaranteed to hold an authenticated session.
// Every string field that looks like a data URL gets uploaded and
// replaced with its public URL; anything else passes through untouched.
export async function uploadPendingPhotos(
  supabase: SupabaseClient,
  formData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const entries = await Promise.all(
    Object.entries(formData).map(async ([key, value]) => {
      if (typeof value !== "string" || !value.startsWith(DATA_URL_PREFIX)) {
        return [key, value] as const;
      }

      const blob = await (await fetch(value)).blob();
      const extension = extensionForMime(blob.type);
      const path = `photos/${Date.now()}-${key}.${extension}`;

      const { data, error } = await supabase.storage
        .from("profile-photos")
        .upload(path, blob, { contentType: blob.type, upsert: true });

      if (error || !data) {
        throw error ?? new Error("profile photo upload failed");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-photos").getPublicUrl(data.path);

      return [key, publicUrl] as const;
    })
  );

  return Object.fromEntries(entries);
}
