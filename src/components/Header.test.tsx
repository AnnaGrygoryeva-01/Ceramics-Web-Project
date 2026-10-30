import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { clearCart, setQuantity } from "@/lib/cart";
import Header from "./Header";

vi.mock("@/lib/products", async (importOriginal) => (await import("@/test/fixtures")).mockProducts(importOriginal));

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

const menuButton = () => screen.getByRole("button", { name: /menu/ });

beforeEach(() => {
  clearCart();
  navigation.pathname = "/";
});

describe("cart link", () => {
  test("empty cart", () => {
    render(<Header />);
    const link = screen.getByRole("link", { name: "Cart, 0 items" });
    expect(link).toHaveAttribute("href", "/cart");
    expect(link.querySelector(".cart-link__count")).toBeNull();
  });

  test("counts every item, skipping products that no longer exist", () => {
    setQuantity("vase", 2);
    setQuantity("brush-set|Small,Large", 1);
    setQuantity("deleted-product", 5);
    render(<Header />);
    expect(screen.getByRole("link", { name: "Cart, 3 items" })).toHaveTextContent("3");
  });

  test("one item", () => {
    setQuantity("vase", 1);
    render(<Header />);
    expect(screen.getByRole("link", { name: "Cart, 1 item" })).toBeInTheDocument();
  });

  test("updates when something is added", () => {
    render(<Header />);
    act(() => setQuantity("vase", 2));
    expect(screen.getByRole("link", { name: "Cart, 2 items" })).toBeInTheDocument();
  });
});

describe("current page", () => {
  test.each([
    ["/", "Gallery"],
    ["/shop", "Shop"],
    ["/shop/floral/vase", "Shop"],
    ["/faq", "FAQ"],
  ])("%s marks %s", (pathname, label) => {
    navigation.pathname = pathname;
    render(<Header />);
    const current = screen.getAllByRole("link").filter((l) => l.getAttribute("aria-current") === "page");
    expect(current.map((l) => l.textContent)).toEqual([label]);
  });

  test("the cart page marks the cart link", () => {
    navigation.pathname = "/cart";
    render(<Header />);
    expect(screen.getByRole("link", { name: /^Cart/ })).toHaveAttribute("aria-current", "page");
  });
});

describe("mobile menu", () => {
  test("opens and closes with the button", async () => {
    const user = userEvent.setup();
    render(<Header />);
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");

    await user.click(menuButton());
    expect(menuButton()).toHaveAccessibleName("Close menu");
    expect(menuButton()).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("site-menu")).toHaveAttribute("data-open", "true");

    await user.click(menuButton());
    expect(menuButton()).toHaveAccessibleName("Open menu");
  });

  test("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Header />);
    await user.click(menuButton());
    await user.keyboard("{Escape}");
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
  });

  test("closes when the page changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Header />);
    await user.click(menuButton());

    navigation.pathname = "/about";
    rerender(<Header />);
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
  });
});
