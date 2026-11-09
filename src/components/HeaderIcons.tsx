// Two lines, which turn into a cross while the menu is open (see .menu-button)
export function MenuIcon () {
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

export function CartIcon () {
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
