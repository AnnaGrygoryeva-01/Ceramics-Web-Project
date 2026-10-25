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
  stock: number
  image?: string // Path inside /public, e.g. "/products/brushes/brush-set.jpg"
}

export const collections: Collection[] = [
  {
    slug: 'christmas-collection',
    name: 'Christmas Collection',
    description:
      'Handmade ornaments, mugs and festive pieces for the holiday season.',
    snow: true
  },
  {
    slug: 'floral-collection',
    name: 'Floral Collection',
    description:
      'Vases, plates and cups decorated with hand-painted and pressed flowers.'
  },
  {
    slug: 'brushes',
    name: 'Brushes',
    description: 'Brushes with handmade ceramic handles.'
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
