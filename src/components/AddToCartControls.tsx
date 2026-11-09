type Props = {
  name: string;
  qty: number; // In the cart with the current picks
  inCart: number; // In the cart with any picks
  loading: boolean; // Stock isn't known yet
  soldOut: boolean;
  available: boolean; // One more can be added
  hasOptions: boolean;
  onAdd: () => void;
  onRemoveOne: () => void;
};

export default function AddToCartControls(props: Props) {
  const { name, qty, inCart, loading, soldOut, available, hasOptions, onAdd, onRemoveOne } = props;

  if (qty > 0) {
    return (
      <div className="cart-stepper" role="group" aria-label={`${name} in your cart`}>
        <button type="button" aria-label="Remove one" onClick={onRemoveOne}>
          −
        </button>
        <span aria-live="polite">{qty} in your cart</span>
        <button
          type="button"
          aria-label="Add one more"
          title={available || loading ? undefined : "No more in stock"}
          disabled={!available}
          onClick={onAdd}
        >
          +
        </button>
      </div>
    );
  }

  const unavailable = hasOptions ? "Not enough in stock" : "All in your cart";
  return (
    <button type="button" className="add-to-cart" disabled={soldOut || !available} onClick={onAdd}>
      {soldOut ? "Sold out" : available || loading ? "Add to cart" : unavailable}
      {/* Other picks of a set already in the cart */}
      {inCart > 0 && !soldOut && ` (${inCart} in your cart)`}
    </button>
  );
}
