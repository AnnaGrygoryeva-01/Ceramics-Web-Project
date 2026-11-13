export type Collection = {
  slug: string
  name: string
  description: string
  image?: string // Card photo on the Shop page, a path inside /public
}

// Lets the customer pick other products several times, e.g. the size of each
// brush in a set. Such a product has no stock of its own: each pick uses up the
// stock of the product it names. One-of-a-kind pieces work the same way with a
// single pick: "Piece" -> { "No. 1": "bow-ornament-01", ... }, where each piece
// is a hidden product with its own photo and stock.
export type ProductOptions = {
  label: string // Each pick is shown as "Brush 1", "Brush 2", ...
  count: number // How many picks
  values: Record<string, string> // Name shown -> slug of the product it uses up
}

export type Product = {
  slug: string
  collection: string // Collection slug
  name: string
  price: number // in pence (4800 = £48.00)
  description: string
  size?: string // e.g. "6 × 7 cm"
  stock?: number // Not set for products with options, see ProductOptions
  image?: string // Path inside /public, e.g. "/products/brushes/brush-set.jpg"
  options?: ProductOptions
  hidden?: boolean // A piece of another product, not listed on its own
}

// What one costs with these picks: the picked piece's own price for a product
// with pieces, else the product's (a set has one price, whatever is picked)
export function unitPrice(product: Product, choices: string[], getProduct: (slug: string) => Product | undefined) {
  if (product.options?.count !== 1) return product.price
  return getProduct(product.options.values[choices[0]])?.price ?? product.price
}
