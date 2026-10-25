import brushProducts from '@/data/products/brushes.json'
import christmasProducts from '@/data/products/christmas-collection.json'
import floralProducts from '@/data/products/floral-collection.json'

export type Collection = {
  slug: string
  name: string
  description: string
  snow?: boolean // Show the falling snow background on this collection's pages
}

export type Product = {
  slug: string
  collection: string // Collection slug
  name: string
  price: number // in pence (4800 = £48.00)
  description: string
  stock?: number // Leave out for products with options, see ProductOptions
  image?: string // Path inside /public, e.g. "/products/brushes/brush-set.jpg"
  options?: ProductOptions
}

// Lets the customer pick other products several times, e.g. the size of each
// brush in a set. Such a product has no stock of its own: each pick uses up the
// stock of the product it names. In the JSON:
// "options": {
//   "label": "Brush",
//   "count": 2,
//   "values": { "Small": "small-brush", "Medium": "medium-brush", "Large": "large-brush" }
// }
export type ProductOptions = {
  label: string // Each pick is shown as "Brush 1", "Brush 2", ...
  count: number // How many picks
  values: Record<string, string> // Name shown -> slug of the product it uses up
}

export const collections: Collection[] = [
  {
    slug: 'christmas-collection',
    name: 'Christmas Collection',
    description:
      'Hand-painted Christmas tree ornaments, made one at a time. Every piece has its own small differences, so yours will be truly one of a kind.',
    snow: true
  },
  {
    slug: 'floral-collection',
    name: 'Floral Collection',
    description:
      'Ceramic pieces decorated with hand-painted flowers inspired by Petrykivka art. Each piece carries its own small differences, so no two are exactly the same.'
  },
  {
    slug: 'brushes',
    name: 'Brushes',
    description:
      'Experience the authentic soul of Ukrainian folk art with the traditional Koshashka brush. Hand-bound by master artisans and crafted from ethically gathered, ultra-soft cat fur, this indispensable tool is the secret behind the fluid, mesmerizing strokes of UNESCO-recognized Petrykivka painting.'
  }
]

// Placeholder products, replace with the real pieces. Each collection's products
// live in their own file in src/data/products; the file decides the collection.
const productsByCollection: Record<string, Omit<Product, 'collection'>[]> = {
  'christmas-collection': christmasProducts,
  'floral-collection': floralProducts,
  brushes: brushProducts
}

export const products: Product[] = Object.entries(productsByCollection).flatMap(
  ([collection, items]) => items.map(item => ({ ...item, collection }))
)

export function getCollection (slug: string) {
  return collections.find(c => c.slug === slug)
}

export function getCollectionProducts (collection: string) {
  return products.filter(p => p.collection === collection)
}

export function getProduct (slug: string) {
  return products.find(p => p.slug === slug)
}

export function productUrl (product: Product) {
  return `/shop/${product.collection}/${product.slug}`
}

export function formatPrice (pence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(pence / 100)
}
