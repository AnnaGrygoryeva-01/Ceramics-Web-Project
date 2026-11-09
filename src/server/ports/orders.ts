import type { NewOrder } from "../domain/order";

export interface OrderStore {
  // Saves the order and takes its stock as one step: either both happen or neither
  place(order: NewOrder): Promise<"placed" | "out-of-stock">;
}
