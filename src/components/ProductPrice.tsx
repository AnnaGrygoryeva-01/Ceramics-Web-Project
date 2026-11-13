"use client";

import { useProductLookup } from "@/lib/catalogue-store";
import { formatPrice, unitPrice, type Product } from "@/lib/products";
import { usePiece } from "./PieceChoice";

// The price, or the picked piece's own price for a product with pieces. The
// cheapest piece's (the product's price) until the products have loaded.
export default function ProductPrice({ product, className }: { product: Product; className?: string }) {
  const [piece] = usePiece(product.options);
  const getProduct = useProductLookup();
  const price = piece && getProduct ? unitPrice(product, [piece], getProduct) : product.price;
  return <p className={className}>{formatPrice(price)}</p>;
}
