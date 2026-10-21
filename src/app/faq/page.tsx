import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ" };

const faqs = [
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
    q: "How long does shipping take?",
    a: "Orders ship within 3–5 business days. Every piece is carefully wrapped to arrive safely.",
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
          <p>{a}</p>
        </details>
      ))}
    </>
  );
}
