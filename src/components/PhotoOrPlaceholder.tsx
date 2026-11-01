"use client";

import Image from "next/image";
import { useState } from "react";
import PhotoPlaceholder from "./PhotoPlaceholder";

type Props = {
  src?: string; // Path inside /public
  alt: string;
  sizes: string;
  priority?: boolean;
};

// Fills its frame with the photo. With no photo set, or a path whose file isn't in
// /public yet, it shows the placeholder rather than an empty frame or a broken image.
// Remembers which photo failed, not just that one did, because client-side navigation
// can reuse this component for the next product.
export default function PhotoOrPlaceholder({ src, alt, sizes, priority }: Props) {
  const [failedSrc, setFailedSrc] = useState<string>();

  if (!src || src === failedSrc) return <PhotoPlaceholder />;

  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} onError={() => setFailedSrc(src)} />;
}
