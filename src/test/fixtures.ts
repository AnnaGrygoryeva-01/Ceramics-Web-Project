import type { ProductLookup } from "@/lib/cart-stock";
import type { Collection, Product } from "@/lib/products";
import type { Customer } from "@/server/domain/order";

// Fixed data for tests, so they don't depend on the real stock or prices in the
// database.
export const fixtureCollections: Collection[] = [
  { id: "id-floral", slug: "floral", name: "Floral", description: "" },
  { id: "id-brushes", slug: "brushes", name: "Brushes", description: "" },
];

const brush = { collection: "brushes", description: "" };
const floral = { collection: "floral", description: "" };

export const fixtureProducts: Product[] = [
  { id: "id-vase", slug: "vase", name: "Vase", price: 4800, stock: 3, ...floral },
  { id: "id-bowl", slug: "bowl", name: "Bowl", price: 1500, stock: 1, ...floral },
  { id: "id-mug", slug: "mug", name: "Mug", price: 2500, stock: 0, ...floral },
  { id: "id-small-brush", slug: "small-brush", name: "Small Brush", price: 1900, stock: 2, ...brush },
  { id: "id-medium-brush", slug: "medium-brush", name: "Medium Brush", price: 1900, stock: 5, ...brush },
  { id: "id-large-brush", slug: "large-brush", name: "Large Brush", price: 2400, stock: 1, ...brush },
  {
    id: "id-brush-set",
    slug: "brush-set",
    name: "Brush Set",
    price: 5500,
    options: {
      label: "Brush",
      count: 2,
      values: { Small: "small-brush", Medium: "medium-brush", Large: "large-brush" },
    },
    ...brush,
  },
];

export const lookup: ProductLookup = (slug) => fixtureProducts.find((p) => p.slug === slug);

export const fixture = (slug: string) => lookup(slug)!;

export const fixtureCustomer: Customer = {
  name: "Ada Potter",
  email: "ada@example.com",
  address: { line1: "1 Kiln Lane", city: "Stoke", postcode: "ST1 1AA", country: "United Kingdom" },
};

// For vi.mock("@/lib/catalogue-store", ...) (see cart page tests for how to call
// it): the products are there straight away, no fetching
export const mockCatalogueStore = () => ({ useProductLookup: () => lookup });
