import { NextRequest, connection } from "next/server";
import { beforeEach, expect, test, vi } from "vitest";
import { getServices } from "@/server/composition";
import { fixtureProducts } from "@/test/fixtures";
import { GET as getCollections } from "./collections/route";
import { GET as getProduct } from "./products/[slug]/route";
import { GET as getProducts } from "./products/route";

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: vi.fn(),
}));
vi.mock("@/server/composition", () => ({ getServices: vi.fn() }));

const catalogueReader = {
  listCollections: vi.fn(async () => [{ id: "1", slug: "floral", name: "Floral", description: "" }]),
  listProducts: vi.fn(async () => fixtureProducts),
  getProduct: vi.fn(async (slug: string) => fixtureProducts.find((p) => p.slug === slug) ?? null),
};

const productRoute = (slug: string) =>
  getProduct(new NextRequest(`http://shop.test/api/products/${slug}`), { params: Promise.resolve({ slug }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServices).mockReturnValue({ catalogueReader } as never);
});

test("GET /api/collections", async () => {
  const response = await getCollections();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([{ id: "1", slug: "floral", name: "Floral", description: "" }]);
});

test("GET /api/products", async () => {
  const response = await getProducts(new NextRequest("http://shop.test/api/products"));
  expect(response.status).toBe(200);
  expect(await response.json()).toHaveLength(fixtureProducts.length);
  expect(catalogueReader.listProducts).toHaveBeenCalledWith({ collection: undefined, includeHidden: true });
});

test("GET /api/products?collection=floral passes the filter on", async () => {
  await getProducts(new NextRequest("http://shop.test/api/products?collection=floral"));
  expect(catalogueReader.listProducts).toHaveBeenCalledWith({ collection: "floral", includeHidden: true });
});

test("GET /api/products/[slug]", async () => {
  const response = await productRoute("vase");
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ id: "id-vase", slug: "vase", price: 4800 });
});

test("GET /api/products/[slug] is a 404 for an unknown product", async () => {
  const response = await productRoute("no-such-product");
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({ ok: false, code: "not-found" });
});

// `next build` runs GET handlers and stops them at connection(). Reaching the
// database first would freeze stock into the build output.
test.each([
  ["collections", () => getCollections()],
  ["products", () => getProducts(new NextRequest("http://shop.test/api/products"))],
  ["one product", () => productRoute("vase")],
])("GET %s touches nothing until connection() lets it through", async (_name, run) => {
  vi.mocked(connection).mockRejectedValueOnce(new Error("stopped by prerender"));
  await expect(run()).rejects.toThrow("stopped by prerender");
  expect(getServices).not.toHaveBeenCalled();
});
