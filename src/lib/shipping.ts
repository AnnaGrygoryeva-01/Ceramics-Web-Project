import rates from "@/data/shipping.json";

// Orders of this much or more go free, in pence (see src/data/shipping.json)
export const FREE_SHIPPING_FROM = rates.freeFrom;

// What delivery costs most of the UK, in pence
export const STANDARD_SHIPPING = rates.standard.price;

// Whether some areas pay more, so the price is only known from the postcode
export const SHIPPING_HAS_ZONES = rates.zones.length > 0;
