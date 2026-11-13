import type { Collection, Product } from '@/server/domain/catalogue'

export type { Collection, Product, ProductOptions } from '@/server/domain/catalogue'
export { unitPrice } from '@/server/domain/catalogue'

// Visual effects are the frontend's business, so this isn't in the product files
const SNOW_COLLECTIONS = ['christmas-collection']

export function hasSnow (collection: Collection) {
  return SNOW_COLLECTIONS.includes(collection.slug)
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
