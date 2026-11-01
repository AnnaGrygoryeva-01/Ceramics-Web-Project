import { parseOrderRequest } from "@/server/adapters/http/parse-order-request";
import { errorResponse, placeOrderResponse } from "@/server/adapters/http/responses";
import { placeOrder } from "@/server/application/place-order";
import { getServices } from "@/server/composition";

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const body = await request.text();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
    return errorResponse(413, "too-large", "The request is too large.");
  }

  const parsed = parseOrderRequest(body);
  if (!parsed.ok) return errorResponse(400, "invalid-request", parsed.message);

  return placeOrderResponse(await placeOrder(getServices(), parsed.request));
}
