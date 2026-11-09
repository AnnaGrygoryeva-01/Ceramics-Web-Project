import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { clearCart, setQuantity } from "@/lib/cart";
import { fixture } from "@/test/fixtures";
import AddToCartButton from "./AddToCartButton";

vi.mock("@/lib/catalogue-store", async () => (await import("@/test/fixtures")).mockCatalogueStore());

const stored = () => JSON.parse(localStorage.getItem("cart") ?? "{}");

beforeEach(() => {
  clearCart();
});

describe("a product without options", () => {
  test("adds to the cart and turns into a stepper", async () => {
    const user = userEvent.setup();
    render(<AddToCartButton product={fixture("vase")} />);

    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(stored()).toEqual({ vase: 1 });
    expect(screen.getByText("1 in your cart")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add one more" }));
    expect(screen.getByText("2 in your cart")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove one" }));
    await user.click(screen.getByRole("button", { name: "Remove one" }));
    expect(stored()).toEqual({});
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeInTheDocument();
  });

  test("can't go over the stock", async () => {
    const user = userEvent.setup();
    render(<AddToCartButton product={fixture("bowl")} />);
    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    const plus = screen.getByRole("button", { name: "Add one more" });
    expect(plus).toBeDisabled();
    expect(plus).toHaveAttribute("title", "No more in stock");
  });

  test("sold out", () => {
    render(<AddToCartButton product={fixture("mug")} />);
    expect(screen.getByRole("button", { name: "Sold out" })).toBeDisabled();
  });

  test("all of it already in the cart as part of a set", () => {
    setQuantity("brush-set|Medium,Large", 1);
    render(<AddToCartButton product={fixture("large-brush")} />);
    expect(screen.getByRole("button", { name: "All in your cart" })).toBeDisabled();
  });
});
