"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

// Empties the cart once the order is paid
export default function ClearCart() {
  useEffect(clearCart, []);
  return null;
}
