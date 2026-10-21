import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { products } from '@/lib/products'

export default function Home () {
  const featured = products.slice(0, 3)

  return (
    <>
      <section>
        <h1>Handmade Ceramics</h1>
        <p>Small-batch ceramics, made by hand one piece at a time.</p>
        <Link href='/shop'>Shop all pieces</Link>
      </section>
    </>
  )
}
