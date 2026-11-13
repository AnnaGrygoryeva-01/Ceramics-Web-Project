import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { clearCart } from "@/lib/cart";
import { fixture } from "@/test/fixtures";
import AddToCartButton from "./AddToCartButton";
import { PieceChoiceProvider } from "./PieceChoice";
import ProductPhotos from "./ProductPhotos";

vi.mock("@/lib/catalogue-store", async () => (await import("@/test/fixtures")).mockCatalogueStore());

// jsdom doesn't lay anything out or scroll, so give the track a width and record scrolls
const scrollTo = vi.fn();
beforeEach(() => {
  clearCart();
  scrollTo.mockClear();
  Element.prototype.scrollTo = scrollTo;
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(300);
});

// The photos and the button together, as on a card or the product page
function Bauble() {
  return (
    <PieceChoiceProvider>
      <ProductPhotos product={fixture("bauble")} sizes="300px" />
      <AddToCartButton product={fixture("bauble")} />
    </PieceChoiceProvider>
  );
}

const current = () => screen.getByRole("button", { current: true });
const picker = () => screen.getByRole("combobox");

describe("ProductPhotos", () => {
  test("a product without pieces has its single photo, no carousel", () => {
    render(<ProductPhotos product={fixture("vase")} sizes="300px" href="/shop/floral/vase" />);
    expect(screen.queryByRole("group", { name: /Photos of/ })).not.toBeInTheDocument();
    expect(document.querySelector("a")).toHaveAttribute("href", "/shop/floral/vase");
  });

  test("on the product page, clicking the photo shows it large, until closed", async () => {
    const user = userEvent.setup();
    render(<ProductPhotos product={{ ...fixture("vase"), image: "/vase.jpg" }} sizes="300px" enlarge />);
    const dialog = document.querySelector("dialog")!;

    await user.click(screen.getByRole("button", { name: "Enlarge: Vase" }));
    expect(dialog.open).toBe(true);
    expect(dialog.querySelector("img")).toHaveAttribute("src", expect.stringContaining("vase.jpg"));

    await user.click(screen.getByRole("button", { name: "Close", hidden: true }));
    expect(dialog.open).toBe(false);
  });

  test("without a photo there is nothing to enlarge", () => {
    render(<ProductPhotos product={fixture("vase")} sizes="300px" enlarge />);
    expect(screen.queryByRole("button", { name: /Enlarge/ })).not.toBeInTheDocument();
  });

  test("a set keeps a single photo too", () => {
    render(<ProductPhotos product={fixture("brush-set")} sizes="300px" />);
    expect(screen.queryByRole("group", { name: /Photos of/ })).not.toBeInTheDocument();
  });

  test("pieces get a slide each, with the sold ones marked", () => {
    render(<Bauble />);
    const carousel = screen.getByRole("group", { name: "Photos of Bauble" });
    const slides = within(carousel).getAllByRole("group");
    expect(slides.map((s) => s.getAttribute("aria-label"))).toEqual(["No. 1, 1 of 3", "No. 2, 2 of 3", "No. 3, 3 of 3"]);
    expect(within(slides[1]).getByText("Sold")).toBeInTheDocument();
    expect(within(slides[0]).queryByText("Sold")).not.toBeInTheDocument();
  });

  test("the arrows move between pieces and pick them", async () => {
    const user = userEvent.setup();
    render(<Bauble />);
    expect(current()).toHaveAccessibleName("Show No. 1");
    expect(screen.getByRole("button", { name: "Previous piece" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next piece" }));
    await user.click(screen.getByRole("button", { name: "Next piece" }));
    expect(current()).toHaveAccessibleName("Show No. 3");
    expect(picker()).toHaveAccessibleName("Piece No. 3");
    expect(screen.getByRole("button", { name: "Next piece" })).toBeDisabled();
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 600, behavior: "smooth" });
  });

  test("a sold piece's photo says so on the button", async () => {
    const user = userEvent.setup();
    render(<Bauble />);
    await user.click(screen.getByRole("button", { name: "Show No. 2" }));
    expect(screen.getByRole("button", { name: "Sold" })).toBeDisabled();
  });

  test("picking a piece in the dropdown shows its photo", async () => {
    const user = userEvent.setup();
    render(<Bauble />);
    await user.click(picker());
    await user.click(screen.getByRole("option", { name: "No. 3" }));
    expect(current()).toHaveAccessibleName("Show No. 3");
  });

  test("swiping picks the piece it stops on", () => {
    vi.useFakeTimers();
    try {
      render(<Bauble />);
      const track = document.querySelector(".carousel__track")!;
      track.scrollLeft = 300;
      fireEvent.scroll(track);
      act(() => vi.advanceTimersByTime(200));
    } finally {
      vi.useRealTimers();
    }
    expect(picker()).toHaveAccessibleName("Piece No. 2");
  });

  test("without a shared choice it still works on its own", async () => {
    const user = userEvent.setup();
    render(<ProductPhotos product={fixture("bauble")} sizes="300px" />);
    await user.click(screen.getByRole("button", { name: "Next piece" }));
    expect(current()).toHaveAccessibleName("Show No. 2");
  });
});
