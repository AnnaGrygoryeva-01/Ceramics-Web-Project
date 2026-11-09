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
  stock?: number // Not set for products with options, see ProductOptions
  image?: string // Path inside /public, e.g. "/products/brushes/brush-set.jpg"
  options?: ProductOptions
  hidden?: boolean // A piece of another product, not listed on its own
}
