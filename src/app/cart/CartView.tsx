"use client";

import Link from "next/link";
import { clearCart, setQuantity, useCart } from "@/lib/cart";
import { formatPrice, getProduct, productUrl } from "@/lib/products";

export default function CartView() {
  const cart = useCart();
  const items = Object.entries(cart).flatMap(([slug, qty]) => {
    const product = getProduct(slug);
    return product ? [{ product, qty }] : [];
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
          {items.map(({ product, qty }) => (
            <tr key={product.slug}>
              <td>
                <Link href={productUrl(product)}>{product.name}</Link>
              </td>
              <td>{formatPrice(product.price)}</td>
              <td>
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(product.slug, qty - 1)}
                >
                  −
                </button>{" "}
                {qty}{" "}
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={qty >= product.stock}
                  onClick={() => setQuantity(product.slug, qty + 1)}
                >
                  +
                </button>
              </td>
              <td>{formatPrice(product.price * qty)}</td>
              <td>
                <button type="button" onClick={() => setQuantity(product.slug, 0)}>
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
