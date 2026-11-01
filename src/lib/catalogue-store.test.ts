import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fixture, fixtureProducts } from "@/test/fixtures";

const fetchMock = vi.fn();

// The store keeps its products for the life of the page, so each test starts fresh
async function freshStore() {
  vi.resetModules();
  return (await import("./catalogue-store")).useProductLookup;
}

const respondWithProducts = () => fetchMock.mockImplementation(async () => Response.json(fixtureProducts));

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

test("is null while loading, then finds products by slug", async () => {
  respondWithProducts();
  const useProductLookup = await freshStore();
  const { result } = renderHook(() => useProductLookup());

  expect(result.current).toBeNull();
  await waitFor(() => expect(result.current).not.toBeNull());
  expect(result.current!("vase")).toEqual(fixture("vase"));
  expect(result.current!("no-such-product")).toBeUndefined();
  expect(fetchMock).toHaveBeenCalledWith("/api/products");
});

test("every component shares one request", async () => {
  respondWithProducts();
  const useProductLookup = await freshStore();
  const first = renderHook(() => useProductLookup());
  const second = renderHook(() => useProductLookup());

  await waitFor(() => expect(first.result.current).not.toBeNull());
  await waitFor(() => expect(second.result.current).not.toBeNull());
  const third = renderHook(() => useProductLookup());

  expect(third.result.current).not.toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test.each([
  // Valid JSON on purpose: read as products, it would make every cart item look deleted
  ["the server answers with an error", async () => Response.json([], { status: 500 })],
  [
    "the network fails",
    async () => {
      throw new Error("offline");
    },
  ],
])("when %s it stays null, and the next component tries again", async (_name, failure) => {
  fetchMock.mockImplementationOnce(failure);
  const useProductLookup = await freshStore();
  const { result } = renderHook(() => useProductLookup());
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  await new Promise((resolve) => setTimeout(resolve)); // Let the failed request finish
  expect(result.current).toBeNull();

  respondWithProducts();
  const next = renderHook(() => useProductLookup());
  await waitFor(() => expect(next.result.current).not.toBeNull());
});
