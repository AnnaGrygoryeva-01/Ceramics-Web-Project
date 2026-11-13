import { errorResponse } from "@/server/adapters/http/responses";
import { quoteShipping } from "@/server/application/checkout";
import { getServices } from "@/server/composition";

const isText = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= max;

// Sets the delivery price on a payment form, for the postcode typed into it
export async function POST(request: Request) {
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    data = null;
  }
  const { checkoutId, postcode } = (data ?? {}) as Record<string, unknown>;
  if (!isText(checkoutId, 255) || !checkoutId.startsWith("cs_") || !isText(postcode, 16)) {
    return errorResponse(400, "invalid-request", "A checkout and a postcode are needed.");
  }

  const result = await quoteShipping(getServices(), checkoutId, postcode);
  return Response.json(result, { status: result.ok ? 200 : 422 });
}
