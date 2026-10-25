import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { collections } from "@/lib/products";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <>
      <h1>Shop</h1>
      <section>
        <h2>
          <Link href="/shop/all" prefetch>Shop All</Link>
        </h2>
        <p>A mix of everything from every collection</p>
      </section>

      {/* One card per collection: a picture that flips over to the description on hover */}
      <ul className="collection-cards">
        {collections.map((collection) => (
          <li key={collection.slug}>
            <Link href={`/shop/${collection.slug}`} prefetch className="collection-card">
              <div className="collection-card__flip">
                <div className="collection-card__front">
                  {collection.image && (
                    <Image
                      src={collection.image}
                      alt=""
                      fill
                      sizes="(max-width: 700px) 100vw, 280px"
                    />
                  )}
                </div>
                <div className="collection-card__back">
                  <p>{collection.description}</p>
                </div>
              </div>
              <h2 className="collection-card__name">{collection.name}</h2>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
