import Link from "next/link";
import { formatPrice, productUrl, type Product } from "@/lib/products";
import AddToCartButton from "./AddToCartButton";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article>
      <h3>
        <Link href={productUrl(product)}>{product.name}</Link>
      </h3>
      <p>{formatPrice(product.price)}</p>
      <AddToCartButton product={product} />
    </article>
  );
}
