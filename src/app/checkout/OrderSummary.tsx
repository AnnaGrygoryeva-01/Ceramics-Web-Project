import { cartTotal, type CartLine } from "@/lib/cart-lines";
import { formatPrice } from "@/lib/products";
import { FREE_SHIPPING_FROM, SHIPPING_HAS_ZONES, STANDARD_SHIPPING } from "@/lib/shipping";

export default function OrderSummary({ lines }: { lines: CartLine[] }) {
  const subtotal = cartTotal(lines);
  const free = subtotal >= FREE_SHIPPING_FROM;
  const shipping = free ? 0 : STANDARD_SHIPPING;
  // With zones, delivery is only known once the postcode is in Stripe's form
  const shippingText = free ? "Free" : `${SHIPPING_HAS_ZONES ? "From " : ""}${formatPrice(shipping)}`;

  return (
    <section className="order-summary" aria-labelledby="order-summary-heading">
      <h2 id="order-summary-heading">Your order</h2>
      <ul>
        {lines.map(({ key, product, choices, price, qty }) => (
          <li key={key}>
            <span>
              {product.name}
              {qty > 1 && ` × ${qty}`}
              {choices.length > 0 && <span className="cart-choices">{choices.join(", ")}</span>}
            </span>
            <span className="order-summary__price">{formatPrice(price * qty)}</span>
          </li>
        ))}
      </ul>
      <p className="order-summary__row order-summary__subtotal">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </p>
      <p className="order-summary__row">
        <span>Delivery</span>
        <span>{shippingText}</span>
      </p>
      {!SHIPPING_HAS_ZONES && (
        <p className="order-summary__row order-summary__total">
          <span>Total</span>
          <span>{formatPrice(subtotal + shipping)}</span>
        </p>
      )}
      <p className="order-summary__note">
        {free
          ? "Your order gets free UK delivery."
          : `Free UK delivery on orders of ${formatPrice(FREE_SHIPPING_FROM)} or more: add ${formatPrice(FREE_SHIPPING_FROM - subtotal)} more to get it.`}{" "}
        We deliver within the UK, but not to Jersey, Guernsey or the Isle of Man.
      </p>
    </section>
  );
}
