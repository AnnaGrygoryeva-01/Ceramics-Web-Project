'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCart } from '@/lib/cart'
import { getProduct } from '@/lib/products'
import ThemeToggle from './ThemeToggle'
import brace from './UI/nav-bar-line.png'

const links = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' }
]

export default function Header () {
  const pathname = usePathname()
  const cart = useCart()
  // Skip slugs of products that no longer exist, same as the cart page does
  const count = Object.entries(cart).reduce(
    (sum, [slug, qty]) => (getProduct(slug) ? sum + qty : sum),
    0
  )

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
    <header className='site-header'>
      <button
        type='button'
        className='menu-button'
        aria-expanded={menuOpen}
        aria-controls='site-menu'
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <MenuIcon />
      </button>
      <Link href='/' className='logo'>
        <span className='logo__name'>Handmade Ceramics</span>
        <span className='logo__tagline'>by Anna Grygoryeva</span>
      </Link>
      <nav id='site-menu' className='top-bar' data-open={menuOpen || undefined}>
        <div className='top-bar__links'>
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
        <Image
          className='top-bar__brace'
          src={brace}
          alt=''
          aria-hidden='true'
          sizes='700px'
        />
        {/* The header's own switch is hidden on phones, so it lives in the menu there */}
        <ThemeToggle className='theme-toggle--menu' />
      </nav>
      <ThemeToggle />
      <Link
        href='/cart'
        className='cart-link'
        aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
        aria-current={isActive('/cart') ? 'page' : undefined}
      >
        <CartIcon />
        {count > 0 && <span className='cart-link__count'>{count}</span>}
      </Link>
    </header>
  )
}

// Two lines, which turn into a cross while the menu is open (see .menu-button)
function MenuIcon () {
  return (
    <svg
      className='menu-button__icon'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      aria-hidden='true'
    >
      <path className='menu-button__line menu-button__line--top' d='M3 8h18' />
      <path className='menu-button__line menu-button__line--bottom' d='M3 16h18' />
    </svg>
  )
}

function CartIcon () {
  return (
    <svg
      className='cart-link__icon'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <path d='M2 3h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 7H6' />
      <circle cx='9.5' cy='19.5' r='1.5' />
      <circle cx='17' cy='19.5' r='1.5' />
    </svg>
  )
}
