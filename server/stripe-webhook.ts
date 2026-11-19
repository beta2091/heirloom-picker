import { createHmac, timingSafeEqual } from "crypto";

/** Stripe's default signature tolerance. Rejects captured webhooks replayed later. */
export const STRIPE_SIGNATURE_TOLERANCE_SEC = 300;

const PAID_CHECKOUT_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

export type StripeWebhookVerdict =
  | { ok: true }
  | { ok: false; status: number; error: string };

export type PaidCheckout = {
  estateId: string;
  sessionId: string | null;
};

/**
 * Verify a Stripe webhook signature against the raw body.
 *
 * When a webhook secret is configured, a missing or invalid signature is
 * rejected. When the secret is missing in production, this fails closed so an
 * unsigned request cannot activate an estate. Outside production the same
 * refusal applies (503) so local traffic cannot skip verification either.
 */
export function verifyStripeWebhook(opts: {
  secret: string | undefined;
  signatureHeader: string | undefined;
  rawBody: Buffer | string | undefined | null;
  isProduction: boolean;
  nowMs?: number;
}): StripeWebhookVerdict {
  const secret = opts.secret?.trim();
  if (!secret) {
    if (opts.isProduction) {
      return { ok: false, status: 500, error: "Webhook is not configured" };
    }
    return { ok: false, status: 503, error: "Webhook is not configured" };
  }

  const signatureHeader = opts.signatureHeader?.trim();
  if (!signatureHeader) {
    return { ok: false, status: 400, error: "Missing Stripe signature" };
  }
  if (opts.rawBody == null) {
    return { ok: false, status: 400, error: "Missing request body" };
  }

  const payload = Buffer.isBuffer(opts.rawBody) ? opts.rawBody.toString("utf8") : opts.rawBody;
  const parts = signatureHeader.split(",").map((part) => part.trim()).filter(Boolean);
  let timestamp: string | undefined;
  const v1Signatures: string[] = [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const key = part.slice(0, eq);
    const value = part.slice(eq + 1);
    if (key === "t") timestamp = value;
    else if (key === "v1" && value) v1Signatures.push(value);
  }

  if (!timestamp || !/^\d+$/.test(timestamp) || v1Signatures.length === 0) {
    return { ok: false, status: 400, error: "Invalid signature" };
  }

  const nowSec = Math.floor((opts.nowMs ?? Date.now()) / 1000);
  const ts = Number(timestamp);
  if (Math.abs(nowSec - ts) > STRIPE_SIGNATURE_TOLERANCE_SEC) {
    return { ok: false, status: 400, error: "Invalid signature" };
  }

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBuf = Buffer.from(expected);
  let match = false;
  for (const signature of v1Signatures) {
    const got = Buffer.from(signature);
    if (got.length === expectedBuf.length && timingSafeEqual(expectedBuf, got)) {
      match = true;
    }
  }
  if (!match) {
    return { ok: false, status: 400, error: "Invalid signature" };
  }
  return { ok: true };
}

/**
 * Estate to activate for this event, or null when the event must not mark
 * anything paid.
 *
 * Only a Checkout Session that is actually paid (`payment_status === "paid"`)
 * and was created in payment mode counts. `checkout.session.completed` also
 * fires for unpaid async methods (bank debits) and for `no_payment_required`;
 * those must not activate an estate. The estate id is the session's
 * `client_reference_id`, which checkout sets to the estate that started it.
 */
export function paidCheckoutFromEvent(event: unknown): PaidCheckout | null {
  if (!event || typeof event !== "object") return null;
  const record = event as {
    type?: unknown;
    data?: { object?: Record<string, unknown> | null };
  };
  if (typeof record.type !== "string" || !PAID_CHECKOUT_EVENTS.has(record.type)) return null;
  const session = record.data?.object;
  if (!session || session.object !== "checkout.session") return null;
  if (session.mode !== "payment") return null;
  if (session.payment_status !== "paid") return null;
  const estateId = session.client_reference_id;
  if (typeof estateId !== "string" || estateId.trim() === "") return null;
  const sessionId = typeof session.id === "string" && session.id.trim() ? session.id : null;
  return { estateId: estateId.trim(), sessionId };
}
