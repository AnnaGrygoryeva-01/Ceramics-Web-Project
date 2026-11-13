import { parseOrderRequest } from "@/server/adapters/http/parse-order-request";
import { errorResponse, startCheckoutResponse } from "@/server/adapters/http/responses";
import { startCheckout } from "@/server/application/checkout";
import { getServices } from "@/server/composition";

const MAX_BODY_BYTES = 16 * 1024;

// Where Stripe sends the customer once they've paid. SITE_URL in production, as
// the request's own address may be the server's internal one.
function returnUrl(request: Request) {
  const site = process.env.SITE_URL || new URL(request.url).origin;
  return `${site}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`;
}

// Saves the order and opens a Stripe payment form for it. The body names what's
// in the cart, nothing more: prices come from the product files.
export async function POST(request: Request) {
  const body = await request.text();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
    return errorResponse(413, "too-large", "The request is too large.");
  }

  const parsed = parseOrderRequest(body);
  if (!parsed.ok) return errorResponse(400, "invalid-request", parsed.message);

  const { publishableKey, ...services } = getServices();
  return startCheckoutResponse(await startCheckout(services, parsed.request, returnUrl(request)), publishableKey);
}
