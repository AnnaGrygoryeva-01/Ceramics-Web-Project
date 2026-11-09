import Link from "next/link";
import { formatPrice, productUrl, type Product } from "@/lib/products";
import AddToCartButton from "./AddToCartButton";
import { PieceChoiceProvider } from "./PieceChoice";
import ProductPhotos from "./ProductPhotos";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <PieceChoiceProvider>
        <ProductPhotos
          product={product}
          href={productUrl(product)}
          sizes="(max-width: 560px) 320px, (max-width: 760px) 50vw, (max-width: 1100px) 33vw, 260px"
        />
        <h3>
          <Link href={productUrl(product)} prefetch>{product.name}</Link>
        </h3>
        <p className="product-card__price">{formatPrice(product.price)}</p>
        {/* The photos pick the piece: swipe or use the arrows */}
        <AddToCartButton product={product} piecePicker={false} />
      </PieceChoiceProvider>
    </article>
  );
}
