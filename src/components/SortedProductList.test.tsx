import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { fixture, fixtureCollections } from "@/test/fixtures";
import SortedProductList from "./SortedProductList";

vi.mock("@/lib/products", async (importOriginal) => (await import("@/test/fixtures")).mockProducts(importOriginal));

const list = ["vase", "small-brush", "bowl", "large-brush"].map(fixture);
const names = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

async function pick(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  const dropdown = screen.getByText(label).parentElement!;
  await user.click(within(dropdown).getByRole("combobox"));
  await user.click(within(dropdown).getByRole("option", { name: value }));
}

describe("SortedProductList", () => {
  test("shows products in the given order by default", () => {
    render(<SortedProductList products={list} />);
    expect(names()).toEqual(["Vase", "Small Brush", "Bowl", "Large Brush"]);
    expect(screen.queryByText("Collection")).not.toBeInTheDocument();
  });

  test("sorts by price", async () => {
    const user = userEvent.setup();
    render(<SortedProductList products={list} />);

    await pick(user, "Sort by", "Price: low to high");
    expect(names()).toEqual(["Bowl", "Small Brush", "Large Brush", "Vase"]);

    await pick(user, "Sort by", "Price: high to low");
    expect(names()).toEqual(["Vase", "Large Brush", "Small Brush", "Bowl"]);

    await pick(user, "Sort by", "Featured");
    expect(names()).toEqual(["Vase", "Small Brush", "Bowl", "Large Brush"]);
  });

  test("filters by collection when collections are given", async () => {
    const user = userEvent.setup();
    render(<SortedProductList products={list} collections={fixtureCollections} />);

    await pick(user, "Collection", "Brushes");
    expect(names()).toEqual(["Small Brush", "Large Brush"]);

    // Filter and sort together
    await pick(user, "Sort by", "Price: high to low");
    expect(names()).toEqual(["Large Brush", "Small Brush"]);

    await pick(user, "Collection", "All collections");
    expect(names()).toHaveLength(4);
  });

  test("each card links to its product and shows the price", () => {
    render(<SortedProductList products={[fixture("vase")]} />);
    expect(screen.getByRole("link", { name: "Vase" })).toHaveAttribute("href", "/shop/floral/vase");
    expect(screen.getByText("£48.00")).toBeInTheDocument();
  });
});
