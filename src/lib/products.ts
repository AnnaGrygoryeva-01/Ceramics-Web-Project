export type Collection = {
  slug: string;
  name: string;
  description: string;
};

export type Product = {
  slug: string;
  collection: string; // Collection slug
  name: string;
  price: number; // in cents
  description: string;
  stock: number;
};

export const collections: Collection[] = [
  {
    slug: "christmas-collection",
    name: "Christmas Collection",
    description: "Handmade ornaments, mugs and festive pieces for the holiday season.",
  },
  {
    slug: "brushes",
    name: "Brushes",
    description: "Brushes with handmade ceramic handles.",
  },
];

// Placeholder products, replace with the real pieces
export const products: Product[] = [
  {
    slug: "snowflake-ornament",
    collection: "christmas-collection",
    name: "Snowflake Ornament",
    price: 1800,
    description: "Hand-cut porcelain snowflake with a gold ribbon for hanging.",
    stock: 12,
  },
  {
    slug: "festive-red-mug",
    collection: "christmas-collection",
    name: "Festive Red Mug",
    price: 3600,
    description: "Wheel-thrown stoneware mug in a deep holiday red glaze.",
    stock: 5,
  },
  {
    slug: "star-candle-holder",
    collection: "christmas-collection",
    name: "Star Candle Holder",
    price: 2900,
    description: "Star-shaped tealight holder with cut-outs that cast a warm glow.",
    stock: 3,
  },
  {
    slug: "large-brush",
    collection: "brushes",
    name: "Large Brush",
    price: 2400,
    description: "Large brush with a speckled glazed ceramic handle.",
    stock: 8,
  },
  {
    slug: "small-brush",
    collection: "brushes",
    name: "Small Brush",
    price: 1900,
    description: "Small brush with a matte white ceramic handle.",
    stock: 6,
  },
  {
    slug: "brush-set",
    collection: "brushes",
    name: "Brush Set",
    price: 5500,
    description: "Set of three brushes in different sizes with matching handles.",
    stock: 2,
  },
];

export function getCollection(slug: string) {
  return collections.find((c) => c.slug === slug);
}

export function getCollectionProducts(collection: string) {
  return products.filter((p) => p.collection === collection);
}

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function productUrl(product: Product) {
  return `/shop/${product.collection}/${product.slug}`;
}

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
