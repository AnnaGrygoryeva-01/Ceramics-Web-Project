"use client";

import { useState } from "react";
import { addToCart, canAdd, countInCart, isSoldOut, stockLeft, useCart, type Cart } from "@/lib/cart";
import type { Product, ProductOptions } from "@/lib/products";
import Dropdown from "./Dropdown";

// The add button, plus the option picker (e.g. brush sizes in a set) for products
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
  const inCart = countInCart(cart, product.slug);
  const soldOut = isSoldOut(product);
  const available = canAdd(cart, product.slug, sorted);

  return (
    <>
      {options && !soldOut && (
        <OptionPicker options={options} cart={cart} choices={choices} onChange={setChoices} />
      )}
      <button type="button" disabled={soldOut || !available} onClick={() => addToCart(product.slug, sorted)}>
        {soldOut ? "Sold out" : available ? "Add to cart" : options ? "Not enough in stock" : "All in your cart"}
        {inCart > 0 && !soldOut && ` (${inCart} in cart)`}
      </button>
    </>
  );
}

function OptionPicker({
  options,
  cart,
  choices,
  onChange,
}: {
  options: ProductOptions;
  cart: Cart;
  choices: string[];
  onChange: (choices: string[]) => void;
}) {
  return (
    <div className="option-picker">
      {choices.map((choice, index) => (
        <Dropdown
          key={index}
          className="option-picker__pick"
          label={`${options.label} ${index + 1}`}
          value={choice}
          onChange={(value) => onChange(choices.with(index, value))}
          options={Object.keys(options.values).map((value) => {
            // Not enough of that brush left for these picks (after what's in the cart)
            const picks = choices.with(index, value);
            const tooMany = picks.filter((p) => p === value).length > stockLeft(cart, options.values[value]);
            return { value, label: value, disabled: value !== choice && tooMany };
          })}
        />
      ))}
    </div>
  );
}
