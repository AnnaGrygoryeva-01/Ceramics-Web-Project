import Link from "next/link";
import type { Collection } from "@/lib/products";
import PhotoOrPlaceholder from "./PhotoOrPlaceholder";

// One card per collection: a picture that flips over to the description on hover
export default function CollectionCards({ collections }: { collections: Collection[] }) {
  return (
    <ul className="collection-cards">
      {collections.map((collection) => (
        <li key={collection.slug}>
          <Link href={`/shop/${collection.slug}`} prefetch className="collection-card">
            <div className="collection-card__flip">
              <div className="collection-card__front">
                <PhotoOrPlaceholder
                  src={collection.image}
                  alt=""
                  sizes="(max-width: 700px) 100vw, 280px"
                />
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
  );
}
