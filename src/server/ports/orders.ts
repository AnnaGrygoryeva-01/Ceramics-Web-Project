import type { NewOrder } from "../domain/order";

export interface OrderStore {
  // Saves the order. Stock lives in the product files, so nothing is taken: the
  // stock check in priceOrder is all there is for now.
  place(order: NewOrder): Promise<void>;
}
