import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { clearCart, setQuantity } from "@/lib/cart";
import CartView from "./CartView";

vi.mock("@/lib/products", async (importOriginal) => (await import("@/test/fixtures")).mockProducts(importOriginal));

const stored = () => JSON.parse(localStorage.getItem("cart") ?? "{}");
const row = (name: string) => screen.getByRole("link", { name }).closest("tr")!;

beforeEach(() => {
  clearCart();
});

describe("CartView", () => {
  test("empty cart links to the shop", () => {
    render(<CartView />);
    expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse the shop" })).toHaveAttribute("href", "/shop");
  });

  test("a cart with only removed products counts as empty", () => {
    setQuantity("deleted-product", 2);
    render(<CartView />);
    expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
  });

  test("lists each line with its picks, subtotal and the total", () => {
    setQuantity("vase", 2);
    setQuantity("brush-set|Small,Large", 1);
    setQuantity("deleted-product", 1);
    render(<CartView />);

    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2 lines
    const vase = within(row("Vase"));
    expect(vase.getByRole("link", { name: "Vase" })).toHaveAttribute("href", "/shop/floral/vase");
    expect(vase.getByText("£48.00")).toBeInTheDocument();
    expect(vase.getByText("£96.00")).toBeInTheDocument();

    expect(within(row("Brush Set")).getByText("Small, Large")).toBeInTheDocument();
    expect(screen.getByText("Total: £151.00")).toBeInTheDocument();
  });

  test("changes quantities and removes lines", async () => {
    const user = userEvent.setup();
    setQuantity("vase", 1);
    setQuantity("bowl", 1);
    render(<CartView />);

    await user.click(within(row("Vase")).getByRole("button", { name: "Increase quantity" }));
    expect(stored()).toEqual({ vase: 2, bowl: 1 });

    await user.click(within(row("Vase")).getByRole("button", { name: "Decrease quantity" }));
    expect(stored()).toEqual({ vase: 1, bowl: 1 });

    await user.click(within(row("Bowl")).getByRole("button", { name: "Remove" }));
    expect(stored()).toEqual({ vase: 1 });
    expect(screen.queryByRole("link", { name: "Bowl" })).not.toBeInTheDocument();

    await user.click(within(row("Vase")).getByRole("button", { name: "Decrease quantity" }));
    expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
  });

  test("can't increase past the stock, counting sets", () => {
    setQuantity("bowl", 1);
    setQuantity("large-brush", 1);
    setQuantity("brush-set|Small,Medium", 1);
    render(<CartView />);
    expect(within(row("Bowl")).getByRole("button", { name: "Increase quantity" })).toBeDisabled();
    expect(within(row("Large Brush")).getByRole("button", { name: "Increase quantity" })).toBeDisabled();
    expect(within(row("Brush Set")).getByRole("button", { name: "Increase quantity" })).toBeEnabled();
  });

  test("clear cart", async () => {
    const user = userEvent.setup();
    setQuantity("vase", 3);
    render(<CartView />);
    await user.click(screen.getByRole("button", { name: "Clear cart" }));
    expect(stored()).toEqual({});
    expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
  });

  test("checkout isn't built yet", async () => {
    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    setQuantity("vase", 1);
    render(<CartView />);
    await user.click(screen.getByRole("button", { name: "Checkout" }));
    expect(alert).toHaveBeenCalledWith("Checkout is not implemented yet.");
    alert.mockRestore();
  });
});
