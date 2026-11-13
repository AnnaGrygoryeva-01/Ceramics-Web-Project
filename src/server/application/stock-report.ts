import type { Collection, Product } from "../domain/catalogue";
import type { HeldStock } from "../ports/orders";

export type StockRow = {
  collection: string;
  name: string; // A piece is named with its label, e.g. "Rocking Horse Ornament, No. 2"
  made: number; // The stock in the files
  sold: number; // Paid or shipped
  inCheckout: number; // Unpaid, still within their 30 minutes
  left: number;
};

// One row per product that has stock of its own, in the shop's order. Sets and
// products with pieces have none: their pieces are listed instead.
export function stockReport(collections: Collection[], products: Product[], held: HeldStock): StockRow[] {
  const collectionName = (slug: string) => collections.find((c) => c.slug === slug)?.name ?? slug;
  return products
    .filter((p): p is Product & { stock: number } => p.stock !== undefined)
    .map((p) => {
      const sold = held.sold[p.slug] ?? 0;
      const inCheckout = held.inCheckout[p.slug] ?? 0;
      return {
        collection: collectionName(p.collection),
        name: p.name,
        made: p.stock,
        sold,
        inCheckout,
        left: Math.max(0, p.stock - sold - inCheckout),
      };
    });
}

const HEADINGS = ["Collection", "Product", "Made", "Sold", "In checkout", "Left"];

// The report as a text table for the terminal, with totals underneath
export function formatStockReport(rows: StockRow[]) {
  const cells = rows.map((r) => [
    r.collection,
    r.name,
    String(r.made),
    String(r.sold),
    String(r.inCheckout),
    String(r.left),
  ]);
  const widths = HEADINGS.map((h, i) => Math.max(h.length, ...cells.map((row) => row[i].length)));
  // Text columns line up on the left, numbers on the right
  const line = (row: string[]) =>
    row.map((cell, i) => (i < 2 ? cell.padEnd(widths[i]) : cell.padStart(widths[i]))).join("   ").trimEnd();

  const total = (key: "made" | "sold" | "inCheckout" | "left") => rows.reduce((sum, r) => sum + r[key], 0);
  const soldOut = rows.filter((r) => r.left === 0).length;
  return [
    line(HEADINGS),
    widths.map((w) => "-".repeat(w)).join("   "),
    ...cells.map((row, i) => line(row) + (rows[i].left === 0 ? "   sold out" : "")),
    "",
    `${total("made")} made, ${total("sold")} sold, ${total("inCheckout")} in checkout, ${total("left")} left. ` +
      `${soldOut} of ${rows.length} sold out.`,
  ].join("\n");
}
