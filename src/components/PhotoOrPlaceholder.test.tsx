import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { fixtureCollections, fixtureProducts } from "@/test/fixtures";
import CollectionCards from "./CollectionCards";
import PhotoOrPlaceholder from "./PhotoOrPlaceholder";
import ProductImage from "./ProductImage";

const placeholder = () => document.querySelector("svg");
const photoProps = { alt: "Blue vase", sizes: "100vw" };
const [product] = fixtureProducts;
const [collection] = fixtureCollections;

describe("PhotoOrPlaceholder", () => {
  test("shows the photo when there is one", () => {
    render(<PhotoOrPlaceholder src="/products/vase.jpg" {...photoProps} />);

    expect(screen.getByRole("img", { name: "Blue vase" })).toHaveAttribute("src", "/products/vase.jpg");
    expect(placeholder()).not.toBeInTheDocument();
  });

  test("shows the placeholder when no photo is set", () => {
    render(<PhotoOrPlaceholder {...photoProps} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(placeholder()).toBeInTheDocument();
  });

  test("swaps to the placeholder when the file isn't in /public", () => {
    render(<PhotoOrPlaceholder src="/products/missing.jpg" {...photoProps} />);

    fireEvent.error(screen.getByRole("img"));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(placeholder()).toBeInTheDocument();
  });

  // Client-side navigation can reuse this component for the next product
  test("tries again when it's given a different photo", () => {
    const { rerender } = render(<PhotoOrPlaceholder src="/products/missing.jpg" {...photoProps} />);
    fireEvent.error(screen.getByRole("img"));

    rerender(<PhotoOrPlaceholder src="/products/vase.jpg" {...photoProps} />);

    expect(screen.getByRole("img", { name: "Blue vase" })).toHaveAttribute("src", "/products/vase.jpg");
    expect(placeholder()).not.toBeInTheDocument();
  });
});

describe("pictures without a photo", () => {
  test("a product shows the placeholder", () => {
    render(<ProductImage product={{ ...product, image: undefined }} sizes="100vw" />);

    expect(placeholder()).toBeInTheDocument();
  });

  test("a collection card shows the placeholder", () => {
    render(<CollectionCards collections={[{ ...collection, image: undefined }]} />);

    expect(placeholder()).toBeInTheDocument();
  });
});
