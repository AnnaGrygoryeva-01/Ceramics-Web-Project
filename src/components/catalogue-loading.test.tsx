import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import CartView from "@/app/cart/CartView";
import { clearCart, setQuantity } from "@/lib/cart";
import { fixture } from "@/test/fixtures";
import AddToCartButton from "./AddToCartButton";
import Header from "./Header";

// What people see before /api/products answers, or if it never does
vi.mock("@/lib/catalogue-store", () => ({ useProductLookup: () => null }));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

beforeEach(() => {
  clearCart();
});

test("nothing can be added until stock is known", () => {
  render(<AddToCartButton product={fixture("vase")} />);
  expect(screen.getByRole("button", { name: "Add to cart" })).toBeDisabled();
});

test("a product with no stock of its own already shows as sold out", () => {
  render(<AddToCartButton product={fixture("mug")} />);
  expect(screen.getByRole("button", { name: "Sold out" })).toBeDisabled();
});

test("a set doesn't flash as sold out, and its picker is usable", () => {
  render(<AddToCartButton product={fixture("brush-set")} />);
  expect(screen.getByRole("button", { name: "Add to cart" })).toBeDisabled();
  expect(screen.getAllByRole("combobox")).toHaveLength(2);
});

test("a stepper can still remove, but can't add or claim there's no stock", () => {
  setQuantity("vase", 1);
  render(<AddToCartButton product={fixture("vase")} />);
  expect(screen.getByRole("button", { name: "Remove one" })).toBeEnabled();
  const plus = screen.getByRole("button", { name: "Add one more" });
  expect(plus).toBeDisabled();
  expect(plus).not.toHaveAttribute("title");
});

test("the header counts everything in the cart", () => {
  setQuantity("vase", 2);
  setQuantity("deleted-product", 1);
  render(<Header />);
  expect(screen.getByRole("link", { name: "Cart, 3 items" })).toBeInTheDocument();
});

test("a cart with items shows it's loading, not that it's empty", () => {
  setQuantity("vase", 1);
  render(<CartView />);
  expect(screen.getByText("Loading…")).toBeInTheDocument();
  expect(screen.queryByText(/Your cart is empty/)).not.toBeInTheDocument();
});

test("an empty cart doesn't need the products", () => {
  render(<CartView />);
  expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
});
