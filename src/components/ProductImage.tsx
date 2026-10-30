import Image from "next/image";
import type { Product } from "@/lib/products";

type Props = {
  product: Product;
  sizes: string;
  className?: string;
  priority?: boolean;
};

// Product photo in a fixed 4:5 frame, cropped to fit, so photos of different
// shapes line up. Products without a photo get an empty frame.
export default function ProductImage({ product, sizes, className, priority }: Props) {
  return (
    <div className={["product-image", className].filter(Boolean).join(" ")}>
      {product.image && <Image src={product.image} alt={product.name} fill sizes={sizes} priority={priority} />}
    </div>
  );
}
