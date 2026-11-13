import { recordPaymentEvent } from "@/server/application/checkout";
import { getServices } from "@/server/composition";

// Stripe's messages about payments: an order is paid, or its payment form expired.
// Signed by Stripe, so nobody else can mark an order paid. Stripe retries until
// it gets a 2xx, and a repeated message changes nothing.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const services = getServices();
  const event = services.payments.readEvent(await request.text(), signature);
  if (!event) return new Response("Invalid signature", { status: 400 });

  await recordPaymentEvent(services, event);
  return Response.json({ received: true });
}
