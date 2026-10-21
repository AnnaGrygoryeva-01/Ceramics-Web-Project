import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <h1>About</h1>
      <p>
        Every piece in this shop is shaped, trimmed and glazed by hand in a small home studio.
        I work mostly with stoneware clay, throwing on the wheel and hand-building when a piece
        calls for it.
      </p>
      <p>
        I make in small batches, so stock is limited and each item is one of a kind. Thank you for
        supporting handmade work.
      </p>
    </>
  );
}
