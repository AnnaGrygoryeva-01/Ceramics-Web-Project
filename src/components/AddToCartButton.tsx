"use client";

import { useState } from "react";
import { addToCart, setQuantity, useCart } from "@/lib/cart";
import { canAdd, cartKey, countInCart, isSoldOut, stockLeft } from "@/lib/cart-stock";
import { useProductLookup } from "@/lib/catalogue-store";
import type { Product, ProductOptions } from "@/lib/products";
import type { ProductLookup } from "@/lib/cart-stock";
import AddToCartControls from "./AddToCartControls";
import OptionPicker from "./OptionPicker";

// The picks before the customer changes any
function defaultChoices(options: ProductOptions | undefined, getProduct: ProductLookup | null) {
  if (!options) return [];
  const names = Object.keys(options.values);
  // One piece: the first that isn't sold, once stock is known
  if (options.count === 1) {
    return [names.find((name) => getProduct?.(options.values[name])?.stock) ?? names[0]];
  }
  // Start with different values (Small, Medium, ...) so a set is mixed by default
  return Array.from({ length: options.count }, (_, i) => names[i % names.length]);
}

// The add button (a − / + stepper once it's in the cart), plus the option picker
// for products that have options (e.g. brush sizes in a set, or which piece of a
// one-of-a-kind ornament). Returned as siblings so the button can still sit at
// the bottom of a product card.
export default function AddToCartButton({ product }: { product: Product }) {
  const { options } = product;
  const names = options ? Object.keys(options.values) : [];
  const cart = useCart();
  // Null until the products load. Stock depends on them, so nothing can be added yet.
  const getProduct = useProductLookup();
  // Null until the customer picks something
  const [picked, setChoices] = useState<string[] | null>(null);
  const choices = picked ?? defaultChoices(options, getProduct);
  // Same order as the list, so Small + Large and Large + Small share one cart line
  const sorted = choices.toSorted((a, b) => names.indexOf(a) - names.indexOf(b));

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
