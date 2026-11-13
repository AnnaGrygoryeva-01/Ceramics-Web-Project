import Link from "next/link";
import { formatPrice, productUrl, type Product } from "@/lib/products";

type Line = {
  key: string;
  product: Product;
  choices: string[];
  price: number; // Each, in pence: a piece's own price
  qty: number;
  canIncrease: boolean;
};

type Props = {
  lines: Line[];
  onSetQuantity: (key: string, qty: number) => void;
  onClear: () => void;
};

export default function CartTable({ lines, onSetQuantity, onClear }: Props) {
  const total = lines.reduce((sum, { price, qty }) => sum + price * qty, 0);

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
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
              <td>{formatPrice(price)}</td>
              <td>
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
              <td>{formatPrice(price * qty)}</td>
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
        <button type="button" className="button" onClick={() => alert("Checkout is not implemented yet.")}>
          Checkout
        </button>
      </div>
    </>
  );
}
