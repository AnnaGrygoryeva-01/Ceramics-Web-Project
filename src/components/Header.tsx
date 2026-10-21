"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { getProduct } from "@/lib/products";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const cart = useCart();
  // Skip slugs of products that no longer exist, same as the cart page does
  const count = Object.entries(cart).reduce(
    (sum, [slug, qty]) => (getProduct(slug) ? sum + qty : sum),
    0,
  );

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header>
      <nav className="top-bar">
        {links.map(({ href, label }) => (
          <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      <Link
        href="/cart"
        className="cart-link"
        aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
        aria-current={isActive("/cart") ? "page" : undefined}
      >
        <CartIcon />
        {count > 0 && <span className="cart-link__count">{count}</span>}
      </Link>
    </header>
  );
}

function CartIcon() {
  return (
    <svg
      className="cart-link__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 3h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 7H6" />
      <circle cx="9.5" cy="19.5" r="1.5" />
      <circle cx="17" cy="19.5" r="1.5" />
    </svg>
  );
}
