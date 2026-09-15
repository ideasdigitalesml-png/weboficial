import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mercadoPagoClient } from "@/lib/mercadopago/client";
import { verifyMercadoPagoSignature } from "@/lib/mercadopago/verify-signature";
import { processMercadoPagoWebhook } from "@/lib/webhooks/process-mercadopago-webhook";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const dataIdFromQuery = url.searchParams.get("data.id");
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("MP_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  const isValid = verifyMercadoPagoSignature({
    xSignature,
    xRequestId,
    dataId: dataIdFromQuery,
    secret,
  });

  if (!isValid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string | number;
    type?: string;
    data?: { id?: string | number };
  };

  const mpEventId = body.id;
  const eventType = body.type;
  const dataId = body.data?.id ?? dataIdFromQuery;

  if (!mpEventId || !eventType || !dataId) {
    return NextResponse.json({ error: "malformed payload" }, { status: 400 });
  }

  try {
    const result = await processMercadoPagoWebhook(createAdminClient(), mercadoPagoClient, {
      mpEventId: String(mpEventId),
      eventType: String(eventType),
      dataId: String(dataId),
      rawPayload: body,
    });

    return NextResponse.json({ result: result.outcome }, { status: 200 });
  } catch (err) {
    console.error("mercadopago webhook processing failed", err);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
