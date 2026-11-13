import rates from "@/data/shipping.json";

// Orders of this much or more go free, in pence (see src/data/shipping.json)
export const FREE_SHIPPING_FROM = rates.freeFrom;
