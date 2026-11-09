import { beforeEach, expect, test, vi } from "vitest";
import { getServices } from "@/server/composition";
import { fixtureCustomer as customer, fixtureProducts } from "@/test/fixtures";
import { POST } from "./route";

vi.mock("@/server/composition", () => ({ getServices: vi.fn() }));

const orderStore = { place: vi.fn(async () => "placed") };

const post = (body: string) => POST(new Request("http://shop.test/api/orders", { method: "POST", body }));
const postOrder = (items: object[]) => post(JSON.stringify({ customer, items }));

beforeEach(() => {
  vi.clearAllMocks();
  const catalogueReader = { listProducts: async () => fixtureProducts };
  vi.mocked(getServices).mockReturnValue({ catalogueReader, orderStore } as never);
});

test("201 with the order, priced from the database", async () => {
  const response = await postOrder([{ slug: "vase", quantity: 2, price: 1 }]);
  expect(response.status).toBe(201);
  expect(await response.json()).toMatchObject({
    ok: true,
    order: { status: "pending", total: 9600, lines: [{ unitPrice: 4800, quantity: 2 }] },
  });
});

test("400 for a body that isn't JSON", async () => {
  const response = await post("not json");
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ ok: false, code: "invalid-request" });
});

test("400 for a badly shaped order", async () => {
  expect((await postOrder([])).status).toBe(400);
});

test("413 for a body that's too large, before reading it as an order", async () => {
  const response = await post("x".repeat(16 * 1024 + 1));
  expect(response.status).toBe(413);
  expect(await response.json()).toMatchObject({ ok: false, code: "too-large" });
});

test("422 for a product that doesn't exist", async () => {
  const response = await postOrder([{ slug: "no-such-product", quantity: 1 }]);
  expect(response.status).toBe(422);
  expect(await response.json()).toMatchObject({ ok: false, code: "invalid-order" });
});

test("409 naming what's out of stock", async () => {
  const response = await postOrder([{ slug: "mug", quantity: 1 }]);
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ code: "out-of-stock", outOfStock: ["mug"] });
  expect(orderStore.place).not.toHaveBeenCalled();
});

test("409 when the store finds the stock has gone", async () => {
  orderStore.place.mockResolvedValueOnce("out-of-stock");
  const response = await postOrder([{ slug: "vase", quantity: 1 }]);
  expect(response.status).toBe(409);
});
