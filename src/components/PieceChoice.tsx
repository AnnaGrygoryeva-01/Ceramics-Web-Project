"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ProductLookup } from "@/lib/cart-stock";
import { useProductLookup } from "@/lib/catalogue-store";
import type { Product, ProductOptions } from "@/lib/products";

type Choice = { piece?: string; setPiece: (name: string) => void };

const PieceContext = createContext<Choice | null>(null);

// Shares which piece of a one-of-a-kind product is picked between its photos and
// its add to cart button, so picking "No. 3" shows No. 3, and swiping to a photo
// picks that piece. Renders no element of its own.
export function PieceChoiceProvider({ children }: { children: ReactNode }) {
  const [piece, setPiece] = useState<string>();
  return <PieceContext value={{ piece, setPiece }}>{children}</PieceContext>;
}

// A product the customer picks one piece of, rather than a set of several picks
export const hasPieces = (options?: ProductOptions): options is ProductOptions => options?.count === 1;

// The pieces of a product, each with the hidden product holding its photo and
// stock. Empty for other products, and until the products have loaded.
export function getPieces(product: Product, getProduct: ProductLookup | null) {
  const { options } = product;
  if (!hasPieces(options) || !getProduct) return [];
  return Object.entries(options.values).flatMap(([name, slug]) => {
    const piece = getProduct(slug);
    return piece ? [{ name, piece }] : [];
  });
}

// The picked piece's name ("No. 2"), or the first that isn't sold until the
// customer picks one. Shared within a PieceChoiceProvider, otherwise kept here.
export function usePiece(options?: ProductOptions): [string | undefined, (name: string) => void] {
  const shared = useContext(PieceContext);
  const [own, setOwn] = useState<string>();
  const getProduct = useProductLookup();
  const [picked, setPicked] = shared ? [shared.piece, shared.setPiece] : [own, setOwn];

  if (!hasPieces(options)) return [undefined, setPicked];
  const names = Object.keys(options.values);
  const firstInStock = names.find((name) => getProduct?.(options.values[name])?.stock);
  return [picked ?? firstInStock ?? names[0], setPicked];
}
