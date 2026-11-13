import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { clearCart, setQuantity } from "@/lib/cart";
import CheckoutView from "./CheckoutView";

vi.mock("@/lib/catalogue-store", async () => (await import("@/test/fixtures")).mockCatalogueStore());
// Stripe's form loads from Stripe, so it stands in here
vi.mock("./StripePayment", () => ({
  default: ({ checkoutId }: { checkoutId: string }) => <div role="form" aria-label={`Stripe payment ${checkoutId}`} />,
}));

const fetchMock = vi.fn();

function respond(status: number, body: object) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

const pay = () => userEvent.setup().click(screen.getByRole("button", { name: "Continue to payment" }));

beforeEach(() => {
  clearCart();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("CheckoutView", () => {
  test("an empty cart has nothing to check out", () => {
    render(<CheckoutView />);
    expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue to payment" })).not.toBeInTheDocument();
  });

  test("sums up the order, with no form to fill in", () => {
    setQuantity("bowl", 1);
    setQuantity("bauble|No. 3", 1);
    render(<CheckoutView />);
    expect(screen.getByText("Bauble")).toBeInTheDocument();
    expect(screen.getByText("No. 3")).toBeInTheDocument();
    expect(screen.getByText("£37.00")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to cart" })).toHaveAttribute("href", "/cart");
  });

  test("says how far an order is from free delivery", () => {
    setQuantity("bowl", 1);
    render(<CheckoutView />);
    expect(screen.getByText("From your postcode")).toBeInTheDocument();
    expect(screen.getByText(/add £15\.00 more/)).toBeInTheDocument();
  });

  test("delivery is free from £30", () => {
    setQuantity("bowl", 2);
    render(<CheckoutView />);
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  test("sends what's in the cart, without prices, then shows Stripe's form", async () => {
    respond(201, { ok: true, checkoutId: "cs_test_1", clientSecret: "cs_test_1_secret" });
    setQuantity("vase", 2);
    setQuantity("brush-set|Small,Large", 1);
    render(<CheckoutView />);
    await pay();

    expect(await screen.findByRole("form", { name: "Stripe payment cs_test_1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue to payment" })).not.toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/checkout");
    expect(JSON.parse(init.body)).toEqual({
      items: [
        { slug: "vase", choices: [], quantity: 2 },
        { slug: "brush-set", choices: ["Small", "Large"], quantity: 1 },
      ],
    });
  });

  test("shows the server's error and lets them try again", async () => {
    respond(409, { ok: false, code: "out-of-stock", message: "Sorry, some items have just sold out.", outOfStock: ["vase"] });
    setQuantity("vase", 1);
    render(<CheckoutView />);
    await pay();

    expect(await screen.findByRole("alert")).toHaveTextContent("Sorry, Vase has just sold out. Please remove it");
    expect(screen.getByRole("button", { name: "Continue to payment" })).toBeEnabled();
  });

  test("names every sold-out line, including a sold-out pick", async () => {
    respond(409, { ok: false, code: "out-of-stock", message: "", outOfStock: ["vase", "bauble-03"] });
    setQuantity("vase", 1);
    setQuantity("bauble|No. 3", 1);
    setQuantity("bowl", 1);
    render(<CheckoutView />);
    await pay();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sorry, Vase and Bauble (No. 3) have just sold out. Please remove them",
    );
  });

  test("says so when the shop can't be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    setQuantity("vase", 1);
    render(<CheckoutView />);
    await pay();

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't reach the shop");
  });
});
