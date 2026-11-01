'use client'

import { usePathname } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useCart } from '@/lib/cart'
import { countItems } from '@/lib/cart-stock'
import { useProductLookup } from '@/lib/catalogue-store'
import HeaderView from './HeaderView'

const noop = () => {}

// Shop URLs aren't known at build time, so usePathname has to be inside <Suspense>
// or the build fails. Until it's known, the same header shows with no link active.
export default function Header () {
  const idle = <HeaderView cartCount={0} isActive={() => false} menuOpen={false} onToggleMenu={noop} onCloseMenu={noop} />
  return (
    <Suspense fallback={idle}>
      <HeaderContainer />
    </Suspense>
  )
}

function HeaderContainer () {
  const pathname = usePathname()
  const cart = useCart()
  const getProduct = useProductLookup()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  // Mobile menu. Closes when the page changes (including the browser's back
  // button) and on Escape.
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPathname, setMenuPathname] = useState(pathname)
  if (pathname !== menuPathname) {
    setMenuPathname(pathname)
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <HeaderView
      cartCount={countItems(cart, getProduct)}
      isActive={isActive}
      menuOpen={menuOpen}
      onToggleMenu={() => setMenuOpen((open) => !open)}
      onCloseMenu={() => setMenuOpen(false)}
    />
  )
}
