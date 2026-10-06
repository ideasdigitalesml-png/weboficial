import { createHash } from "crypto";
import { META_PIXEL_ID } from "@/lib/meta/pixel";

function sha256(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function sendCompleteRegistrationEvent(params: {
  eventId: string;
  email: string;
  eventSourceUrl: string;
  clientIp: string | null;
  userAgent: string | null;
  fbp: string | null;
  fbc: string | null;
}) {
  const accessToken = process.env.FB_CONVERSIONS_API_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn(
      "[meta-capi] FB_CONVERSIONS_API_ACCESS_TOKEN not set -- skipping server-side CompleteRegistration event"
    );
    return;
  }

  const userData: Record<string, unknown> = { em: [sha256(params.email)] };
  if (params.clientIp) userData.client_ip_address = params.clientIp;
  if (params.userAgent) userData.client_user_agent = params.userAgent;
  if (params.fbp) userData.fbp = params.fbp;
  if (params.fbc) userData.fbc = params.fbc;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: "CompleteRegistration",
        event_time: Math.floor(Date.now() / 1000),
        // Same ID the client pixel reports with (see
        // CompleteRegistrationPixel.tsx) so Meta dedupes the browser and
        // server copies of this event instead of double-counting it.
        event_id: params.eventId,
        action_source: "website",
        event_source_url: params.eventSourceUrl,
        user_data: userData,
      },
    ],
  };

  // Events Manager > Test Events tab. Must be unset in production.
  if (process.env.META_TEST_EVENT_CODE) {
    body.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  // TEMPORARY: verbose logging to confirm this call actually reaches Meta
  // and what it says back. Remove once CompleteRegistration is confirmed
  // showing up in Events Manager.
  console.log("[meta-capi] sending CompleteRegistration", {
    eventId: params.eventId,
    pixelId: META_PIXEL_ID,
    testEventCode: process.env.META_TEST_EVENT_CODE ?? null,
  });

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3000),
      }
    );
    const responseBody = await res.text();
    if (!res.ok) {
      console.error("[meta-capi] CompleteRegistration event failed", res.status, responseBody);
    } else {
      console.log("[meta-capi] CompleteRegistration event accepted", res.status, responseBody);
    }
  } catch (err) {
    console.error("[meta-capi] CompleteRegistration event errored", err);
  }
}
