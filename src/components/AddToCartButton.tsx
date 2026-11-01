"use client";

import { useState } from "react";
import { addToCart, setQuantity, useCart } from "@/lib/cart";
import { canAdd, cartKey, countInCart, isSoldOut, stockLeft } from "@/lib/cart-stock";
import { useProductLookup } from "@/lib/catalogue-store";
import type { Product } from "@/lib/products";
import AddToCartControls from "./AddToCartControls";
import OptionPicker from "./OptionPicker";

// The add button (a − / + stepper once it's in the cart), plus the option picker (e.g. brush sizes in a set) for products
// that have options. Returned as siblings so the button can still sit at the
// bottom of a product card.
export default function AddToCartButton({ product }: { product: Product }) {
  const { options } = product;
  const names = options ? Object.keys(options.values) : [];
  // Start with different values (Small, Medium, ...) so a set is mixed by default
  const [choices, setChoices] = useState(() =>
    options ? Array.from({ length: options.count }, (_, i) => names[i % names.length]) : [],
  );
  // Same order as the list, so Small + Large and Large + Small share one cart line
  const sorted = choices.toSorted((a, b) => names.indexOf(a) - names.indexOf(b));

  const cart = useCart();
  // Null until the products load. Stock depends on them, so nothing can be added yet.
  const getProduct = useProductLookup();
  const soldOut = getProduct ? isSoldOut(getProduct, product) : !options && !product.stock;
  const available = getProduct !== null && canAdd(getProduct, cart, product.slug, sorted);
  // The cart line for these picks: a set with different picks is a separate line
  const key = cartKey(product.slug, sorted);
  const qty = cart[key] ?? 0;

  return (
    <>
      {options && !soldOut && (
        <OptionPicker
          options={options}
          choices={choices}
          stockLeft={(slug) => (getProduct ? stockLeft(getProduct, cart, slug) : Infinity)}
          onChange={setChoices}
        />
      )}
      <AddToCartControls
        name={product.name}
        qty={qty}
        inCart={countInCart(cart, product.slug)}
        loading={getProduct === null}
        soldOut={soldOut}
        available={available}
        hasOptions={options !== undefined}
        onAdd={() => {
          if (getProduct) addToCart(getProduct, product.slug, sorted);
        }}
        onRemoveOne={() => setQuantity(key, qty - 1)}
      />
    </>
  );
}
