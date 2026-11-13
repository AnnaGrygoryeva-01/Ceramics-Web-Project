"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useProductLookup } from "@/lib/catalogue-store";
import type { Product } from "@/lib/products";
import { getPieces, usePiece } from "./PieceChoice";
import PhotoOrPlaceholder from "./PhotoOrPlaceholder";
import ProductImage from "./ProductImage";

type Props = {
  product: Product;
  sizes: string;
  priority?: boolean;
  href?: string; // Makes the photos a link, e.g. to the product page from a card
  enlarge?: boolean; // Clicking a photo shows it large, over the blurred page
};

// The product's photo, or for a product with pieces a carousel of every piece,
// in step with the piece picker. Arrows, dots, or swiping move between them.
export default function ProductPhotos({ product, sizes, priority, href, enlarge }: Props) {
  const getProduct = useProductLookup();
  const [picked, setPicked] = usePiece(product.options);
  const pieces = getPieces(product, getProduct);
  const trackRef = useRef<HTMLDivElement>(null);
  const index = Math.max(0, pieces.findIndex((p) => p.name === picked));
  const scrolled = useRef(false);

  // Show the picked piece: straight away the first time, smoothly after that
  // (unless the visitor prefers less motion)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const left = index * track.clientWidth;
    if (Math.abs(track.scrollLeft - left) > 1) {
      const smooth = scrolled.current && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollTo({ left, behavior: smooth ? "smooth" : "instant" });
    }
    scrolled.current = true;
  }, [index, pieces.length]);

  // Swiping picks the piece it stops on. Waits for the scroll to settle, so a
  // smooth scroll passing other photos doesn't pick them on the way.
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(settle.current), []);
  function onScroll() {
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const track = trackRef.current;
      if (!track || track.clientWidth === 0) return;
      const piece = pieces[Math.round(track.scrollLeft / track.clientWidth)];
      if (piece && piece.name !== picked) setPicked(piece.name);
    }, 120);
  }

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [enlarged, setEnlarged] = useState<{ src: string; alt: string }>();
  function show(src: string | undefined, alt: string) {
    if (!src) return;
    setEnlarged({ src, alt });
    dialogRef.current?.showModal();
  }

  const linked = (photo: ReactNode, src: string | undefined, alt: string) =>
    href ? (
      // The product name next to the photos is the link for keyboards and screen readers
      <Link href={href} prefetch tabIndex={-1} aria-hidden="true">
        {photo}
      </Link>
    ) : enlarge && src ? (
      <button type="button" className="photo-enlarge" aria-label={`Enlarge: ${alt}`} onClick={() => show(src, alt)}>
        {photo}
      </button>
    ) : (
      photo
    );

  // Esc or a click beside the photo closes it (built into <dialog>), and focus
  // goes back to the photo
  const lightbox = enlarge && (
    <dialog
      ref={dialogRef}
      className="lightbox lightbox--blur"
      aria-label={enlarged?.alt ?? "Enlarged photo"}
      onClose={() => setEnlarged(undefined)}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      {enlarged && (
        <div className="lightbox__frame lightbox__frame--photo">
          <Image src={enlarged.src} alt={enlarged.alt} width={0} height={0} sizes="90vw" />
        </div>
      )}
      <button type="button" className="lightbox__close" aria-label="Close" onClick={() => dialogRef.current?.close()}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </dialog>
  );

  if (pieces.length < 2) {
    return (
      <>
        {linked(<ProductImage product={product} sizes={sizes} priority={priority} />, product.image, product.name)}
        {lightbox}
      </>
    );
  }

  const go = (i: number) => setPicked(pieces[i].name);

  return (
    <div className="carousel" role="group" aria-roledescription="carousel" aria-label={`Photos of ${product.name}`}>
      <div className="carousel__track" ref={trackRef} onScroll={onScroll}>
        {pieces.map(({ name, piece }, i) => (
          <div
            key={name}
            className="carousel__slide product-image"
            role="group"
            aria-roledescription="slide"
            aria-label={`${name}, ${i + 1} of ${pieces.length}`}
          >
            {linked(
              <PhotoOrPlaceholder src={piece.image} alt={piece.name} sizes={sizes} priority={priority && i === 0} />,
              piece.image,
              piece.name,
            )}
            {!piece.stock && <span className="carousel__sold">Sold</span>}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="carousel__arrow carousel__arrow--prev"
        aria-label="Previous piece"
        disabled={index === 0}
        onClick={() => go(index - 1)}
      >
        <Chevron />
      </button>
      <button
        type="button"
        className="carousel__arrow carousel__arrow--next"
        aria-label="Next piece"
        disabled={index === pieces.length - 1}
        onClick={() => go(index + 1)}
      >
        <Chevron />
      </button>
      <div className="carousel__dots">
        {pieces.map(({ name }, i) => (
          <button
            key={name}
            type="button"
            aria-label={`Show ${name}`}
            aria-current={i === index || undefined}
            onClick={() => go(i)}
          />
        ))}
      </div>
      {lightbox}
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
