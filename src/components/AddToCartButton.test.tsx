import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { clearCart, setQuantity } from "@/lib/cart";
import { fixture } from "@/test/fixtures";
import AddToCartButton from "./AddToCartButton";

vi.mock("@/lib/products", async (importOriginal) => (await import("@/test/fixtures")).mockProducts(importOriginal));

const stored = () => JSON.parse(localStorage.getItem("cart") ?? "{}");

// Picks `value` in the dropdown labelled `label`
async function pick(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  const picker = screen.getByText(label).parentElement!;
  await user.click(within(picker).getByRole("combobox"));
  await user.click(within(picker).getByRole("option", { name: value }));
}

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

describe("a product with options", () => {
  test("starts with different picks and adds them as one cart line", async () => {
    const user = userEvent.setup();
    render(<AddToCartButton product={fixture("brush-set")} />);

    expect(screen.getAllByRole("combobox").map((c) => c.textContent)).toEqual(["Small", "Medium"]);
    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(stored()).toEqual({ "brush-set|Small,Medium": 1 });
  });

  test("picks in a different order share a cart line", async () => {
    const user = userEvent.setup();
    render(<AddToCartButton product={fixture("brush-set")} />);

    await pick(user, "Brush 1", "Medium");
    await pick(user, "Brush 2", "Small");
    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(stored()).toEqual({ "brush-set|Small,Medium": 1 });
  });

  test("other picks already in the cart are counted on the button", async () => {
    const user = userEvent.setup();
    setQuantity("brush-set|Small,Medium", 1);
    render(<AddToCartButton product={fixture("brush-set")} />);

    // The default picks are in the cart, so it shows the stepper
    expect(screen.getByText("1 in your cart")).toBeInTheDocument();

    await pick(user, "Brush 2", "Large");
    expect(screen.getByRole("button", { name: "Add to cart (1 in your cart)" })).toBeEnabled();
  });

  test("options without enough stock for these picks are disabled", async () => {
    const user = userEvent.setup();
    render(<AddToCartButton product={fixture("brush-set")} />);

    // Only one large brush: once Brush 1 is Large, Brush 2 can't be Large too
    await pick(user, "Brush 1", "Large");
    const second = screen.getByText("Brush 2").parentElement!;
    await user.click(within(second).getByRole("combobox"));
    expect(within(second).getByRole("option", { name: "Large" })).toHaveAttribute("aria-disabled", "true");
    expect(within(second).getByRole("option", { name: "Small" })).not.toHaveAttribute("aria-disabled");
  });

  test("not enough in stock for the picks", () => {
    setQuantity("large-brush", 1);
    setQuantity("small-brush", 2);
    render(<AddToCartButton product={fixture("brush-set")} />);
    // Default picks are Small + Medium, and the small brushes are all in the cart
    expect(screen.getByRole("button", { name: /Not enough in stock/ })).toBeDisabled();
  });
});
