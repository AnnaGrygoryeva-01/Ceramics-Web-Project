"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties } from "react";

export type GalleryTile = {
  // Place in the 13 × 12 mosaic on wider screens: first column / columns wide,
  // first row / rows tall (see .gallery in globals.sass)
  col: number;
  cols: number;
  row: number;
  rows: number;
  // Columns (1 or 2) and rows wide on phones, where the tiles flow in 2 columns
  phoneCols: number;
  phoneRows: number;
  image?: string; // Path inside /public, e.g. "/gallery/vase.jpg"
  alt?: string;
};

// A mosaic row is about 11/12 of a column wide (the grid is 13 wide by 11 tall,
// split into 12 rows), so a placeholder keeps its tile's shape when enlarged
const ROW_TO_COLUMN = 11 / 12;

// The mosaic, plus the enlarged view: clicking a tile shows it large in the
// middle of the screen while the rest of the mosaic blurs and fades
export default function Gallery({ tiles }: { tiles: GalleryTile[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex === null ? null : tiles[openIndex];

  function show(index: number) {
    setOpenIndex(index);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <ul className={openIndex === null ? "gallery" : "gallery gallery--dimmed"}>
        {tiles.map((tile, index) => (
          <li
            key={index}
            className="gallery__tile"
            style={
              {
                "--col": tile.col,
                "--cols": tile.cols,
                "--row": tile.row,
                "--rows": tile.rows,
                "--phone-cols": tile.phoneCols,
                "--phone-rows": tile.phoneRows,
              } as CSSProperties
            }
          >
            <button
              type="button"
              className="gallery__open"
              aria-label={tile.alt ? `Enlarge: ${tile.alt}` : `Enlarge picture ${index + 1}`}
              onClick={() => show(index)}
            >
              {tile.image && (
                <Image src={tile.image} alt="" fill sizes="(max-width: 560px) 100vw, 400px" />
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* Esc closes it too (built into <dialog>), and focus goes back to the tile */}
      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label={open?.alt ?? "Enlarged picture"}
        onClose={() => setOpenIndex(null)}
        // A click beside the picture lands on the dialog itself
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        {open && (
          <div
            className={open.image ? "lightbox__frame lightbox__frame--photo" : "lightbox__frame"}
            style={{ "--ratio": open.cols / (open.rows * ROW_TO_COLUMN) } as CSSProperties}
          >
            {/* At its own shape (size set in CSS), so the frame hugs the photo */}
            {open.image && (
              <Image src={open.image} alt={open.alt ?? ""} width={0} height={0} sizes="90vw" />
            )}
          </div>
        )}
        <button type="button" className="lightbox__close" aria-label="Close" onClick={close}>
          ×
        </button>
      </dialog>
    </>
  );
}
