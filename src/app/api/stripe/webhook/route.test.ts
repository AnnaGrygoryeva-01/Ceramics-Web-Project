import { beforeEach, expect, test, vi } from "vitest";
import { getServices } from "@/server/composition";
import { POST } from "./route";

vi.mock("@/server/composition", () => ({ getServices: vi.fn() }));

const orderStore = { markPaid: vi.fn(async () => true), markCancelled: vi.fn(async () => true) };
const payments = { readEvent: vi.fn() };

const post = (headers: Record<string, string> = { "stripe-signature": "t=1,v1=abc" }) =>
  POST(new Request("http://shop.test/api/stripe/webhook", { method: "POST", body: "{}", headers }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServices).mockReturnValue({ orderStore, payments } as never);
});

test("records a verified message", async () => {
  payments.readEvent.mockReturnValue({ type: "failed", orderId: "order-1" });
  const response = await post();
  expect(response.status).toBe(200);
  expect(payments.readEvent).toHaveBeenCalledWith("{}", "t=1,v1=abc");
  expect(orderStore.markCancelled).toHaveBeenCalledWith("order-1");
});

test("400 without a signature", async () => {
  expect((await post({})).status).toBe(400);
  expect(payments.readEvent).not.toHaveBeenCalled();
});

test("400 for a message that isn't from Stripe, changing nothing", async () => {
  payments.readEvent.mockReturnValue(null);
  expect((await post()).status).toBe(400);
  expect(orderStore.markPaid).not.toHaveBeenCalled();
  expect(orderStore.markCancelled).not.toHaveBeenCalled();
});
