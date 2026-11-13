import type { NewOrder, Payment, StockLimits } from "../domain/order";

// What orders hold, by product slug: sold (paid or shipped), and in checkout
// (unpaid, within PENDING_HOLD_MS)
export type HeldStock = { sold: StockLimits; inCheckout: StockLimits };

export type PlaceResult = { ok: true } | { ok: false; outOfStock: string[] };

export interface OrderStore {
  // Saves the order if there's still enough stock: the stock in the files, less
  // what paid orders and recent unpaid ones hold (see PENDING_HOLD_MS). Checked
  // and saved together, so two customers can't both buy the last piece.
  place(order: NewOrder, stock: StockLimits): Promise<PlaceResult>;
  // How much of each product paid orders and recent unpaid ones hold, by slug.
  // Products nothing holds are left out.
  heldStock(now?: Date): Promise<StockLimits>;
  heldStockByStatus(now?: Date): Promise<HeldStock>;
  // The Stripe Checkout Session paying for the order
  setCheckout(orderId: string, checkoutId: string): Promise<void>;
  // These only change a pending order, so a repeated message from Stripe does
  // nothing. False if the order wasn't pending.
  markPaid(orderId: string, payment: Payment): Promise<boolean>;
  markCancelled(orderId: string): Promise<boolean>;
}
