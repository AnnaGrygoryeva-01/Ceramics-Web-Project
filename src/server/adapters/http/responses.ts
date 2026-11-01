import type { PlaceOrderResult } from "../../application/place-order";

// Same { ok, message } shape as the contact form, plus a code to tell failures apart
export function errorResponse(status: number, code: string, message: string) {
  return Response.json({ ok: false, code, message }, { status });
}

const STATUS_BY_CODE = { "invalid-order": 422, "out-of-stock": 409 };

export function placeOrderResponse(result: PlaceOrderResult) {
  const status = result.ok ? 201 : STATUS_BY_CODE[result.code];
  return Response.json(result, { status });
}
