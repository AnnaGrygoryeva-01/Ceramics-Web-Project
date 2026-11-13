"use client";

import { useProductLookup } from "@/lib/catalogue-store";
import type { Product } from "@/lib/products";
import { usePiece } from "./PieceChoice";

// The size, or the picked piece's own size for a product with pieces. Nothing
// for a product without one.
export default function ProductSize({ product }: { product: Product }) {
  const [piece] = usePiece(product.options);
  const getProduct = useProductLookup();
  const slug = piece && product.options?.count === 1 ? product.options.values[piece] : undefined;
  const size = (slug && getProduct?.(slug)?.size) || product.size;
  return size ? <p className="product__size">Size: {size}</p> : null;
}
