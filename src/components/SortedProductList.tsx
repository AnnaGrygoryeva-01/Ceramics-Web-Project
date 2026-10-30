"use client";

import { useState } from "react";
import type { Collection, Product } from "@/lib/products";
import ProductCard from "./ProductCard";
import Dropdown from "./Dropdown";

const sortOptions = {
  default: { label: "Featured", compare: null },
  "price-asc": { label: "Price: low to high", compare: (a: Product, b: Product) => a.price - b.price },
  "price-desc": { label: "Price: high to low", compare: (a: Product, b: Product) => b.price - a.price },
} as const;

type SortKey = keyof typeof sortOptions;
const sortKeys = Object.keys(sortOptions) as SortKey[];

const ALL = "all";

// Pass `collections` to also show a "Collection" filter (Shop All page only)
export default function SortedProductList({
  products,
  collections,
}: {
  products: Product[];
  collections?: Collection[];
}) {
  const [sort, setSort] = useState<SortKey>("default");
  const [collection, setCollection] = useState(ALL);
  const { compare } = sortOptions[sort];
  const filtered = collection === ALL ? products : products.filter((p) => p.collection === collection);
  const sorted = compare ? filtered.toSorted(compare) : filtered;

  return (
    <>
      <div className="list-controls">
        {collections && (
          <Dropdown
            className="sort"
            label="Collection"
            options={[
              { value: ALL, label: "All collections" },
              ...collections.map((c) => ({ value: c.slug, label: c.name })),
            ]}
            value={collection}
            onChange={setCollection}
          />
        )}
        <Dropdown
          className="sort"
          label="Sort by"
          options={sortKeys.map((key) => ({ value: key, label: sortOptions[key].label }))}
          value={sort}
          onChange={setSort}
        />
      </div>
      <div className="product-grid">
        {sorted.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </>
  );
}
