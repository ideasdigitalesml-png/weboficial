import { createHmac } from "node:crypto";
import http from "node:http";
import { processMercadoPagoWebhook } from "../src/lib/webhooks/process-mercadopago-webhook";
import { verifyMercadoPagoSignature, buildManifest } from "../src/lib/mercadopago/verify-signature";
import type { MercadoPagoClient } from "../src/lib/mercadopago/client";
import { createLandingForUser } from "../src/lib/landings/create-landing";
import {
  admin,
  createTestUser,
  deleteTestUser,
  signInAs,
  getSeedIds,
  VALID_FORM_DATA,
  assert,
  createRunner,
} from "./test-helpers";

const DEV_SERVER_PORT = 3000;
const WEBHOOK_SECRET = "test-secret-for-milestone4";

function requestJson(
  pathname: string,
  body: unknown,
  headers: Record<string, string>
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      {
        host: "127.0.0.1",
        port: DEV_SERVER_PORT,
        path: pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          ...headers,
        },
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: responseBody }));
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function signedHeaders(dataId: string, requestId: string, secret: string) {
  const ts = String(Math.floor(Date.now() / 1000));
  const manifest = buildManifest(dataId, requestId, ts);
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
  return {
    "x-signature": `ts=${ts},v1=${v1}`,
    "x-request-id": requestId,
  };
}

async function createDraftLanding(suffix: string | number) {
  const email = `test-mp-${suffix}@example.com`;
  const userId = await createTestUser(email);
  const client = await signInAs(email);
  const { professionId, templateId } = await getSeedIds();
  const slug = `contador-mp-${suffix}`;
  const result = await createLandingForUser(client, userId, {
    professionId,
    templateId,
    formData: VALID_FORM_DATA,
    desiredSlug: slug,
  });
  assert(result.ok, `no se pudo crear la landing de prueba: ${JSON.stringify(result)}`);
  return { userId, landingId: result.landing.id, slug };
}

async function main() {
  const { test, report } = createRunner();
  const suffix = Date.now();

  await test("webhook con firma inválida se rechaza (401, sin llegar a MP)", async () => {
    const dataId = `payment-${suffix}-a`;
    const res = await requestJson(
      "/api/webhooks/mercadopago",
      { id: `evt-${suffix}-a`, type: "subscription_authorized_payment", data: { id: dataId } },
      {
        "x-signature": "ts=1234567890,v1=0000000000000000000000000000000000000000000000000000000000000000",
        "x-request-id": "fake-request-id",
      }
    );
    assert(res.status === 401, `se esperaba 401, se obtuvo ${res.status}: ${res.body}`);

    const { data: events } = await admin
      .from("webhook_events")
      .select("id")
      .eq("mp_event_id", `evt-${suffix}-a`);
    assert(
      (events?.length ?? 0) === 0,
      "una firma inválida no debe registrar ni procesar ningún evento"
    );
  });

  await test("webhook duplicado (mismo mp_event_id) no duplica el payment", async () => {
    const { userId, landingId } = await createDraftLanding(`${suffix}-dup`);
    try {
      const { data: plan } = await admin.from("plans").select("id").eq("active", true).single();
      const preapprovalId = `preapproval-${suffix}-dup`;
      const paymentId = `payment-${suffix}-dup`;
      const mpEventId = `evt-${suffix}-dup`;

      // La suscripción ya existe en 'authorized' (como si el evento
      // subscription_preapproval ya se hubiese procesado antes).
      await admin.from("subscriptions").insert({
        landing_id: landingId,
        plan_id: plan!.id,
        mp_preapproval_id: preapprovalId,
        status: "authorized",
      });

      const fakeMpClient: MercadoPagoClient = {
        createPreapprovalPlan: async () => {
          throw new Error("no debería llamarse en este test");
        },
        createAuthorizedPreapproval: async () => {
          throw new Error("no debería llamarse en este test");
        },
        getPreapproval: async () => {
          throw new Error("no debería llamarse: la suscripción ya existe");
        },
        getAuthorizedPayment: async () => ({
          id: paymentId,
          status: "processed",
          paymentStatus: "approved",
          paymentStatusDetail: "accredited",
          preapprovalId,
          transactionAmount: 25000,
          currencyId: "ARS",
        }),
      };

      const input = {
        mpEventId,
        eventType: "subscription_authorized_payment",
        dataId: paymentId,
        rawPayload: { id: mpEventId, type: "subscription_authorized_payment", data: { id: paymentId } },
      };

      const first = await processMercadoPagoWebhook(admin, fakeMpClient, input);
      const second = await processMercadoPagoWebhook(admin, fakeMpClient, input);

      assert(first.outcome === "processed", `se esperaba processed, se obtuvo ${first.outcome}`);
      assert(second.outcome === "duplicate", `se esperaba duplicate, se obtuvo ${second.outcome}`);

      const { data: payments } = await admin
        .from("payments")
        .select("id")
        .eq("mp_payment_id", paymentId);
      assert(
        (payments?.length ?? 0) === 1,
        `se esperaba exactamente 1 payment, se encontraron ${payments?.length ?? 0}`
      );
    } finally {
      const { data: subs } = await admin
        .from("subscriptions")
        .select("id")
        .eq("landing_id", landingId);
      for (const sub of subs ?? []) {
        await admin.from("payments").delete().eq("subscription_id", sub.id);
      }
      await admin.from("subscriptions").delete().eq("landing_id", landingId);
      await deleteTestUser(userId);
    }
  });

  await test("un pago aprobado activa la landing (draft -> active)", async () => {
    const { userId, landingId } = await createDraftLanding(`${suffix}-ok`);
    try {
      const preapprovalId = `preapproval-${suffix}-ok`;
      const paymentId = `payment-${suffix}-ok`;

      const fakeMpClient: MercadoPagoClient = {
        createPreapprovalPlan: async () => {
          throw new Error("no debería llamarse en este test");
        },
        createAuthorizedPreapproval: async () => {
          throw new Error("no debería llamarse en este test");
        },
        getPreapproval: async (id) => ({
          id,
          status: "authorized",
          externalReference: landingId,
          preapprovalPlanId: null,
        }),
        getAuthorizedPayment: async () => ({
          id: paymentId,
          status: "processed",
          paymentStatus: "approved",
          paymentStatusDetail: "accredited",
          preapprovalId,
          transactionAmount: 25000,
          currencyId: "ARS",
        }),
      };

      const { data: before } = await admin
        .from("landings")
        .select("status")
        .eq("id", landingId)
        .single();
      assert(before?.status === "draft", "la landing debería arrancar en draft");

      const result = await processMercadoPagoWebhook(admin, fakeMpClient, {
        mpEventId: `evt-${suffix}-ok`,
        eventType: "subscription_authorized_payment",
        dataId: paymentId,
        rawPayload: {
          id: `evt-${suffix}-ok`,
          type: "subscription_authorized_payment",
          data: { id: paymentId },
        },
      });
      assert(result.outcome === "processed", `se esperaba processed, se obtuvo ${result.outcome}`);

      const { data: after } = await admin
        .from("landings")
        .select("status, published_at")
        .eq("id", landingId)
        .single();
      assert(after?.status === "active", `se esperaba status='active', se obtuvo '${after?.status}'`);
      assert(Boolean(after?.published_at), "published_at debería quedar seteado");

      const { data: subscription } = await admin
        .from("subscriptions")
        .select("status")
        .eq("mp_preapproval_id", preapprovalId)
        .single();
      assert(
        subscription?.status === "authorized",
        `se esperaba subscription 'authorized', se obtuvo '${subscription?.status}'`
      );
    } finally {
      const { data: subs } = await admin
        .from("subscriptions")
        .select("id")
        .eq("landing_id", landingId);
      for (const sub of subs ?? []) {
        await admin.from("payments").delete().eq("subscription_id", sub.id);
      }
      await admin.from("subscriptions").delete().eq("landing_id", landingId);
      await deleteTestUser(userId);
    }
  });

  await test("un pago rechazado por antifraude se guarda sin tirar excepción", async () => {
    // Regression test for a real production incident: MP's own antifraude
    // rejected a real Card Payment Brick charge (status_detail
    // "cc_rejected_high_risk"), auto-cancelled the preapproval, and our
    // webhook threw processing it -- caused by reading the wrong status
    // field (authorized_payment.status, a scheduling state, instead of the
    // nested payment.status, the actual approve/reject outcome).
    const { userId, landingId } = await createDraftLanding(`${suffix}-rejected`);
    try {
      const preapprovalId = `preapproval-${suffix}-rejected`;
      const paymentId = `payment-${suffix}-rejected`;

      const fakeMpClient: MercadoPagoClient = {
        createPreapprovalPlan: async () => {
          throw new Error("no debería llamarse en este test");
        },
        createAuthorizedPreapproval: async () => {
          throw new Error("no debería llamarse en este test");
        },
        getPreapproval: async (id) => ({
          id,
          // MP auto-cancels the preapproval after a high-risk rejection.
          status: "cancelled",
          externalReference: landingId,
          preapprovalPlanId: null,
        }),
        getAuthorizedPayment: async () => ({
          id: paymentId,
          status: "processed",
          paymentStatus: "rejected",
          paymentStatusDetail: "cc_rejected_high_risk",
          preapprovalId,
          transactionAmount: 13400,
          currencyId: "ARS",
        }),
      };

      const result = await processMercadoPagoWebhook(admin, fakeMpClient, {
        mpEventId: `evt-${suffix}-rejected`,
        eventType: "subscription_authorized_payment",
        dataId: paymentId,
        rawPayload: {
          id: `evt-${suffix}-rejected`,
          type: "subscription_authorized_payment",
          data: { id: paymentId },
        },
      });
      assert(result.outcome === "processed", `se esperaba processed, se obtuvo ${result.outcome}`);

      const { data: payment } = await admin
        .from("payments")
        .select("status")
        .eq("mp_payment_id", paymentId)
        .single();
      assert(
        payment?.status === "rejected",
        `se esperaba payment 'rejected', se obtuvo '${payment?.status}'`
      );

      const { data: landing } = await admin
        .from("landings")
        .select("status")
        .eq("id", landingId)
        .single();
      assert(
        landing?.status === "draft",
        `un pago rechazado no debe activar la landing, se obtuvo '${landing?.status}'`
      );

      const { data: webhookEvent } = await admin
        .from("webhook_events")
        .select("status")
        .eq("mp_event_id", `evt-${suffix}-rejected`)
        .single();
      assert(
        webhookEvent?.status === "processed",
        `se esperaba webhook_events 'processed', se obtuvo '${webhookEvent?.status}'`
      );
    } finally {
      const { data: subs } = await admin
        .from("subscriptions")
        .select("id")
        .eq("landing_id", landingId);
      for (const sub of subs ?? []) {
        await admin.from("payments").delete().eq("subscription_id", sub.id);
      }
      await admin.from("subscriptions").delete().eq("landing_id", landingId);
      await deleteTestUser(userId);
    }
  });

  await test("un evento sin landing asociado no rompe el webhook (200, no 500)", async () => {
    const fakeMpClient: MercadoPagoClient = {
      createPreapprovalPlan: async () => {
        throw new Error("no debería llamarse en este test");
      },
      createAuthorizedPreapproval: async () => {
        throw new Error("no debería llamarse en este test");
      },
      getPreapproval: async (id) => ({
        id,
        status: "authorized",
        externalReference: null,
        preapprovalPlanId: null,
      }),
      getAuthorizedPayment: async () => {
        throw new Error("no debería llamarse en este test");
      },
    };

    const preapprovalId = `preapproval-${suffix}-orphan`;
    const result = await processMercadoPagoWebhook(admin, fakeMpClient, {
      mpEventId: `evt-${suffix}-orphan`,
      eventType: "subscription_preapproval",
      dataId: preapprovalId,
      rawPayload: {
        id: `evt-${suffix}-orphan`,
        type: "subscription_preapproval",
        data: { id: preapprovalId },
      },
    });
    assert(result.outcome === "processed", `se esperaba processed, se obtuvo ${result.outcome}`);
    assert(
      result.action === "landing_not_found",
      `se esperaba action 'landing_not_found', se obtuvo '${result.action}'`
    );

    const { data: webhookEvent } = await admin
      .from("webhook_events")
      .select("status")
      .eq("mp_event_id", `evt-${suffix}-orphan`)
      .single();
    assert(
      webhookEvent?.status === "processed",
      `se esperaba webhook_events 'processed' (no 'failed'), se obtuvo '${webhookEvent?.status}'`
    );
  });

  await test("verifyMercadoPagoSignature rechaza una firma alterada", async () => {
    const dataId = "12345";
    const requestId = "req-abc";
    const headers = signedHeaders(dataId, requestId, WEBHOOK_SECRET);

    const validResult = verifyMercadoPagoSignature({
      xSignature: headers["x-signature"],
      xRequestId: requestId,
      dataId,
      secret: WEBHOOK_SECRET,
    });
    assert(validResult, "una firma calculada correctamente debe validar");

    const tamperedResult = verifyMercadoPagoSignature({
      xSignature: headers["x-signature"],
      xRequestId: requestId,
      dataId: "99999", // dataId distinto al usado para firmar
      secret: WEBHOOK_SECRET,
    });
    assert(!tamperedResult, "cambiar el dataId debe invalidar la firma");

    const wrongSecretResult = verifyMercadoPagoSignature({
      xSignature: headers["x-signature"],
      xRequestId: requestId,
      dataId,
      secret: "otro-secreto",
    });
    assert(!wrongSecretResult, "un secreto incorrecto debe invalidar la firma");
  });

  report();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
