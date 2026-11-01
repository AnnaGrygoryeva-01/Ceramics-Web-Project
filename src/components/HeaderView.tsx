import Image from 'next/image'
import Link from 'next/link'
import { CartIcon, MenuIcon } from './HeaderIcons'
import ThemeToggle from './ThemeToggle'
import brace from './UI/nav-bar-line.png'

const links = [
  { href: '/shop', label: 'Shop' },
  { href: '/', label: 'Gallery' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' }
]

type Props = {
  cartCount: number
  isActive: (href: string) => boolean
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
}

export default function HeaderView ({ cartCount, isActive, menuOpen, onToggleMenu, onCloseMenu }: Props) {
  return (
    <header className='site-header'>
      <button
        type='button'
        className='menu-button'
        aria-expanded={menuOpen}
        aria-controls='site-menu'
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={onToggleMenu}
      >
        <MenuIcon />
      </button>
      <Link href='/' className='logo' aria-label='Handmade Ceramics by Anna Grygoryeva, home'>
        {/* Drawn in the text colour from a cut-out of the logo, so it follows the theme */}
        <span className='logo__mark' />
      </Link>
      <nav id='site-menu' className='top-bar' data-open={menuOpen || undefined}>
        <div className='top-bar__links'>
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              onClick={onCloseMenu}
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
        aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
        aria-current={isActive('/cart') ? 'page' : undefined}
      >
        <CartIcon />
        {cartCount > 0 && <span className='cart-link__count'>{cartCount}</span>}
      </Link>
    </header>
  )
}
