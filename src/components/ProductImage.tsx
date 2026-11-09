import type { Product } from "@/lib/products";
import PhotoOrPlaceholder from "./PhotoOrPlaceholder";

type Props = {
  product: Product;
  sizes: string;
  className?: string;
  priority?: boolean;
};

// Product photo in a fixed 4:5 frame, cropped to fit, so photos of different
// shapes line up. Products without a photo get the placeholder.
export default function ProductImage({ product, sizes, className, priority }: Props) {
  return (
    <div className={["product-image", className].filter(Boolean).join(" ")}>
      <PhotoOrPlaceholder src={product.image} alt={product.name} sizes={sizes} priority={priority} />
    </div>
  );
}
