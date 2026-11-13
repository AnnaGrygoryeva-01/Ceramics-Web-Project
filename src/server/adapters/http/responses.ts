import type { StartCheckoutResult } from "../../application/checkout";

// Same { ok, message } shape as the contact form, plus a code to tell failures apart
export function errorResponse(status: number, code: string, message: string) {
  return Response.json({ ok: false, code, message }, { status });
}

const STATUS_BY_CODE = { "invalid-order": 422, "out-of-stock": 409 };

// A started checkout comes with Stripe's publishable key, which the payment form
// needs. It's public, and comes from here rather than the build so it can be set
// on the server like the other keys.
export function startCheckoutResponse(result: StartCheckoutResult, publishableKey: string) {
  if (!result.ok) return Response.json(result, { status: STATUS_BY_CODE[result.code] });
  return Response.json({ ...result, publishableKey }, { status: 201 });
}
