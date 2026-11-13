import type { Metadata } from "next";
import { formatPrice } from "@/lib/products";
import { FREE_SHIPPING_FROM, STANDARD_SHIPPING } from "@/lib/shipping";

export const metadata: Metadata = { title: "FAQ" };

// An answer is one paragraph, or several. Delivery prices come from
// src/data/shipping.json, so they match checkout.
const faqs: { q: string; a: string | string[] }[] = [
  {
    q: "Are your pieces food safe?",
    a: "Yes. All functional pieces are glazed with lead-free, food-safe glazes and fired to stoneware temperatures.",
  },
  {
    q: "Are they dishwasher and microwave safe?",
    a: "Mugs, bowls and plates are dishwasher and microwave safe. Hand washing will keep them looking their best for longer. Vases are decorative only.",
  },
  {
    q: "Will my piece look exactly like the photo?",
    a: "Every piece is made by hand, so small variations in shape, size and glaze are part of the charm. No two are identical.",
  },
  {
    q: "How much is delivery?",
    a: [
      `UK delivery is ${formatPrice(STANDARD_SHIPPING)}, and free on orders of ${formatPrice(FREE_SHIPPING_FROM)} or more.`,
      "We deliver anywhere in the UK, but not to Jersey, Guernsey or the Isle of Man at the moment.",
    ],
  },
  {
    q: "How long does delivery take?",
    a: [
      "Dispatch: orders are packed and posted within 1–3 working days (Mon–Fri). Every piece is carefully wrapped to arrive safely.",
      "Delivery: sent by Royal Mail Tracked 48, which aims to deliver in 2–3 working days after dispatch. You’ll receive a tracking link by email.",
      "So please allow around 3–6 working days in total. Remote areas may take a little longer.",
    ],
  },
  {
    q: "What if my order arrives broken?",
    a: "Contact us within 7 days with a photo of the damage and we'll send a replacement or a full refund.",
  },
  {
    q: "Do you take custom orders?",
    a: "Sometimes! Send us a message through the contact page with what you have in mind.",
  },
];

export default function FaqPage() {
  return (
    <>
      <h1>Frequently Asked Questions</h1>
      {faqs.map(({ q, a }) => (
        <details key={q}>
          <summary>{q}</summary>
          {(Array.isArray(a) ? a : [a]).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </details>
      ))}
    </>
  );
}
