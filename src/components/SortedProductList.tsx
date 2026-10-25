"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import ProductCard from "./ProductCard";
import SortSelect from "./SortSelect";

const sortOptions = {
  default: { label: "Featured", compare: null },
  "price-asc": { label: "Price: low to high", compare: (a: Product, b: Product) => a.price - b.price },
  "price-desc": { label: "Price: high to low", compare: (a: Product, b: Product) => b.price - a.price },
} as const;

type SortKey = keyof typeof sortOptions;
const sortKeys = Object.keys(sortOptions) as SortKey[];

export default function SortedProductList({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<SortKey>("default");
  const { compare } = sortOptions[sort];
  const sorted = compare ? products.toSorted(compare) : products;

  return (
    <>
      <SortSelect
        label="Sort by"
        options={sortKeys.map((key) => ({ value: key, label: sortOptions[key].label }))}
        value={sort}
        onChange={setSort}
      />
      <div className="product-grid">
        {sorted.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </>
  );
}
