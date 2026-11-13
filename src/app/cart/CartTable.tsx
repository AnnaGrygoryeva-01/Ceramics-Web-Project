import Link from "next/link";
import { cartTotal, type CartLine } from "@/lib/cart-lines";
import { formatPrice, productUrl } from "@/lib/products";

type Props = {
  lines: CartLine[];
  onSetQuantity: (key: string, qty: number) => void;
  onClear: () => void;
};

export default function CartTable({ lines, onSetQuantity, onClear }: Props) {
  const total = cartTotal(lines);

  return (
    <>
      <table className="cart-table">
        <thead>
          <tr>
            <th>Item</th>
            <th className="cart-table__number cart-table__price">Price</th>
            <th className="cart-table__qty">Quantity</th>
            <th className="cart-table__number cart-table__subtotal">Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lines.map(({ key, product, choices, price, qty, canIncrease }) => (
            <tr key={key}>
              <td>
                <Link href={productUrl(product)} prefetch>{product.name}</Link>
                {choices.length > 0 && <span className="cart-choices">{choices.join(", ")}</span>}
              </td>
              <td className="cart-table__number cart-table__price">{formatPrice(price)}</td>
              <td className="cart-table__qty">
                <div className="cart-stepper cart-stepper--small">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => onSetQuantity(key, qty - 1)}
                  >
                    −
                  </button>
                  <span>{qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={!canIncrease}
                    onClick={() => onSetQuantity(key, qty + 1)}
                  >
                    +
                  </button>
                </div>
              </td>
              <td className="cart-table__number cart-table__subtotal">{formatPrice(price * qty)}</td>
              <td>
                <button type="button" className="button button--small" onClick={() => onSetQuantity(key, 0)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        <strong>Total: {formatPrice(total)}</strong>
      </p>
      <div className="cart-actions">
        <button type="button" className="button" onClick={onClear}>
          Clear cart
        </button>
        <Link href="/checkout" className="button" prefetch>
          Checkout
        </Link>
      </div>
    </>
  );
}
