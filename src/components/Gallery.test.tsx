import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import Gallery, { type GalleryTile } from "./Gallery";

const place = { col: 1, cols: 2, row: 1, rows: 2, phoneCols: 1, phoneRows: 1 };
const tiles: GalleryTile[] = [
  { ...place, image: "/gallery/vase.jpg", alt: "Blue vase" },
  { ...place },
];

const dialog = () => document.querySelector("dialog")!;
const mosaic = () => document.querySelector("ul.gallery")!;

describe("Gallery", () => {
  test("has a button for each tile", () => {
    render(<Gallery tiles={tiles} />);
    expect(screen.getByRole("button", { name: "Enlarge: Blue vase" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enlarge picture 2" })).toBeInTheDocument();
  });

  test("enlarges a tile and closes again", async () => {
    const user = userEvent.setup();
    render(<Gallery tiles={tiles} />);

    await user.click(screen.getByRole("button", { name: "Enlarge: Blue vase" }));
    expect(dialog().open).toBe(true);
    expect(dialog()).toHaveAttribute("aria-label", "Blue vase");
    expect(dialog().querySelector("img")).toHaveAttribute("src", "/gallery/vase.jpg");
    expect(mosaic()).toHaveClass("gallery--dimmed");

    await user.click(screen.getByRole("button", { name: "Close", hidden: true }));
    expect(dialog().open).toBe(false);
    expect(mosaic()).not.toHaveClass("gallery--dimmed");
  });

  test("a tile without a photo shows an empty frame", async () => {
    const user = userEvent.setup();
    render(<Gallery tiles={tiles} />);
    await user.click(screen.getByRole("button", { name: "Enlarge picture 2" }));
    expect(dialog()).toHaveAttribute("aria-label", "Enlarged picture");
    expect(dialog().querySelector(".lightbox__frame")).not.toHaveClass("lightbox__frame--photo");
  });

  test("clicking beside the picture closes it", async () => {
    const user = userEvent.setup();
    render(<Gallery tiles={tiles} />);
    await user.click(screen.getByRole("button", { name: "Enlarge: Blue vase" }));

    // On the photo: stays open
    await user.click(dialog().querySelector(".lightbox__frame")!);
    expect(dialog().open).toBe(true);

    await user.click(dialog());
    expect(dialog().open).toBe(false);
  });
});
