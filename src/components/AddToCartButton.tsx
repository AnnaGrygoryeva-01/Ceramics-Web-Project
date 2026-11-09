"use client";

import { useState } from "react";
import { addToCart, setQuantity, useCart } from "@/lib/cart";
import { canAdd, cartKey, countInCart, isSoldOut, stockLeft } from "@/lib/cart-stock";
import { useProductLookup } from "@/lib/catalogue-store";
import type { Product, ProductOptions } from "@/lib/products";
import AddToCartControls from "./AddToCartControls";
import OptionPicker from "./OptionPicker";
import { hasPieces, usePiece } from "./PieceChoice";

// A set's picks before the customer changes any: different values (Small,
// Medium, ...) so it's mixed by default
function defaultSet(options: ProductOptions) {
  const names = Object.keys(options.values);
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
  // A piece is shared with the photos (see PieceChoice); a set's picks are kept here
  const [piece, setPiece] = usePiece(options);
  const [setPicks, setSetPicks] = useState<string[] | null>(null);
  const pieces = hasPieces(options);
  const choices = pieces ? [piece!] : (setPicks ?? (options ? defaultSet(options) : []));
  const setChoices = pieces ? ([name]: string[]) => setPiece(name) : setSetPicks;
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
        unavailable={!options ? "All in your cart" : pieces ? "Sold" : "Not enough in stock"}
        onAdd={() => {
          if (getProduct) addToCart(getProduct, product.slug, sorted);
        }}
        onRemoveOne={() => setQuantity(key, qty - 1)}
      />
    </>
  );
}
