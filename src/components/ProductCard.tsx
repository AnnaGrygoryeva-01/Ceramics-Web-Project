import Link from "next/link";
import { formatPrice, productUrl, type Product } from "@/lib/products";
import AddToCartButton from "./AddToCartButton";
import ProductImage from "./ProductImage";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link href={productUrl(product)} prefetch tabIndex={-1} aria-hidden="true">
        <ProductImage product={product} sizes="240px" />
      </Link>
      <h3>
        <Link href={productUrl(product)} prefetch>{product.name}</Link>
      </h3>
      <p>{formatPrice(product.price)}</p>
      <AddToCartButton product={product} />
    </article>
  );
}
