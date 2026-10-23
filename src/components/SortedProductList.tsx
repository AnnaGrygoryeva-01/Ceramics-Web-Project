"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import ProductCard from "./ProductCard";

const sortOptions = {
  default: { label: "Featured", compare: null },
  "price-asc": { label: "Price: low to high", compare: (a: Product, b: Product) => a.price - b.price },
  "price-desc": { label: "Price: high to low", compare: (a: Product, b: Product) => b.price - a.price },
} as const;

type SortKey = keyof typeof sortOptions;

export default function SortedProductList({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<SortKey>("default");
  const { compare } = sortOptions[sort];
  const sorted = compare ? products.toSorted(compare) : products;

  return (
    <>
      <label className="sort">
        Sort by
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          {Object.entries(sortOptions).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="product-grid">
        {sorted.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </>
  );
}
