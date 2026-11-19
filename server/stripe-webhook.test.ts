import { createHmac } from "crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { paidCheckoutFromEvent, verifyStripeWebhook } from "./stripe-webhook.ts";

const SECRET = "whsec_test_secret";
const NOW_MS = 1_700_000_000_000;
const NOW_SEC = Math.floor(NOW_MS / 1000);

function sign(payload: string, secret = SECRET, timestamp = NOW_SEC): string {
  const v1 = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return `t=${timestamp},v1=${v1}`;
}

function paidEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        object: "checkout.session",
        id: "cs_test_123",
        mode: "payment",
        payment_status: "paid",
        client_reference_id: "estate_abc",
        ...overrides,
      },
    },
  };
}

test("rejects a missing signature when a webhook secret is configured", () => {
  const verdict = verifyStripeWebhook({
    secret: SECRET,
    signatureHeader: undefined,
    rawBody: Buffer.from("{}"),
    isProduction: true,
    nowMs: NOW_MS,
  });
  assert.equal(verdict.ok, false);
  if (!verdict.ok) assert.equal(verdict.status, 400);
});

test("rejects an invalid signature", () => {
  const payload = JSON.stringify(paidEvent());
  const verdict = verifyStripeWebhook({
    secret: SECRET,
    signatureHeader: `t=${NOW_SEC},v1=${"ab".repeat(32)}`,
    rawBody: payload,
    isProduction: false,
    nowMs: NOW_MS,
  });
  assert.equal(verdict.ok, false);
  if (!verdict.ok) assert.equal(verdict.status, 400);
});

test("rejects a signature over a tampered body", () => {
  const payload = JSON.stringify(paidEvent());
  const header = sign(payload);
  const verdict = verifyStripeWebhook({
    secret: SECRET,
    signatureHeader: header,
    rawBody: payload + " ",
    isProduction: true,
    nowMs: NOW_MS,
  });
  assert.equal(verdict.ok, false);
});

test("accepts a valid signature, including a rotated extra v1", () => {
  const payload = JSON.stringify(paidEvent());
  const header = `${sign(payload)},v1=${"cd".repeat(32)}`;
  const verdict = verifyStripeWebhook({
    secret: SECRET,
    signatureHeader: header,
    rawBody: Buffer.from(payload),
    isProduction: true,
    nowMs: NOW_MS,
  });
  assert.deepEqual(verdict, { ok: true });
});

test("rejects a signature outside the tolerance window", () => {
  const payload = "{}";
  const old = NOW_SEC - 301;
  const verdict = verifyStripeWebhook({
    secret: SECRET,
    signatureHeader: sign(payload, SECRET, old),
    rawBody: payload,
    isProduction: true,
    nowMs: NOW_MS,
  });
  assert.equal(verdict.ok, false);
});

test("fails closed in production when the webhook secret is missing", () => {
  const verdict = verifyStripeWebhook({
    secret: undefined,
    signatureHeader: undefined,
    rawBody: Buffer.from("{}"),
    isProduction: true,
  });
  assert.equal(verdict.ok, false);
  if (!verdict.ok) assert.equal(verdict.status, 500);
});

test("refuses unsigned events outside production when the secret is missing", () => {
  const verdict = verifyStripeWebhook({
    secret: "  ",
    signatureHeader: undefined,
    rawBody: "{}",
    isProduction: false,
  });
  assert.equal(verdict.ok, false);
  if (!verdict.ok) assert.equal(verdict.status, 503);
});

test("a paid checkout session identifies the estate", () => {
  assert.deepEqual(paidCheckoutFromEvent(paidEvent()), {
    estateId: "estate_abc",
    sessionId: "cs_test_123",
  });
});

test("unpaid, no-payment, and non-payment sessions do not activate an estate", () => {
  assert.equal(paidCheckoutFromEvent(paidEvent({ payment_status: "unpaid" })), null);
  assert.equal(paidCheckoutFromEvent(paidEvent({ payment_status: "no_payment_required" })), null);
  assert.equal(paidCheckoutFromEvent(paidEvent({ mode: "subscription" })), null);
  assert.equal(paidCheckoutFromEvent(paidEvent({ client_reference_id: "  " })), null);
  assert.equal(paidCheckoutFromEvent({ type: "payment_intent.succeeded", data: { object: { payment_status: "paid" } } }), null);
});

test("async payment success counts only once the session is paid", () => {
  const paid = paidEvent();
  paid.type = "checkout.session.async_payment_succeeded";
  assert.equal(paidCheckoutFromEvent(paid)?.estateId, "estate_abc");

  const completedUnpaid = paidEvent({ payment_status: "unpaid" });
  assert.equal(paidCheckoutFromEvent(completedUnpaid), null);
});
