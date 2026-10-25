"use client";

import Link from "next/link";
import { canAdd, clearCart, parseCartKey, setQuantity, useCart } from "@/lib/cart";
import { formatPrice, getProduct, productUrl } from "@/lib/products";

export default function CartView() {
  const cart = useCart();
  const items = Object.entries(cart).flatMap(([key, qty]) => {
    const { slug, choices } = parseCartKey(key);
    const product = getProduct(slug);
    return product ? [{ key, product, choices, qty }] : [];
  });

  if (items.length === 0) {
    return (
      <p>
        Your cart is empty. <Link href="/shop">Browse the shop</Link>
      </p>
    );
  }

  const total = items.reduce((sum, { product, qty }) => sum + product.price * qty, 0);

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
          {items.map(({ key, product, choices, qty }) => (
            <tr key={key}>
              <td>
                <Link href={productUrl(product)} prefetch>{product.name}</Link>
                {choices.length > 0 && <span className="cart-choices">{choices.join(", ")}</span>}
              </td>
              <td>{formatPrice(product.price)}</td>
              <td>
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(key, qty - 1)}
                >
                  −
                </button>{" "}
                {qty}{" "}
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={!canAdd(cart, product.slug, choices)}
                  onClick={() => setQuantity(key, qty + 1)}
                >
                  +
                </button>
              </td>
              <td>{formatPrice(product.price * qty)}</td>
              <td>
                <button type="button" onClick={() => setQuantity(key, 0)}>
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
      <button type="button" onClick={clearCart}>
        Clear cart
      </button>{" "}
      <button type="button" onClick={() => alert("Checkout is not implemented yet.")}>
        Checkout
      </button>
    </>
  );
}
