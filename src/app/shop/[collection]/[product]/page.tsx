import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import ProductImage from "@/components/ProductImage";
import SnowBackground from "@/components/SnowBackground";
import { formatPrice, hasSnow, type Product as ProductData } from "@/lib/products";
import { getCatalogue } from "@/server/catalogue";

export async function generateMetadata({
  params,
}: PageProps<"/shop/[collection]/[product]">): Promise<Metadata> {
  const { product } = await params;
  const catalogue = await getCatalogue();
  return { title: (await catalogue.getProduct(product))?.name ?? "Not found" };
}

// Reading the URL (params) and the database has to happen inside <Suspense> so
// navigations can start instantly. Links here use `prefetch`, so the content is
// usually ready before the click.
export default function ProductPage({ params }: PageProps<"/shop/[collection]/[product]">) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Product params={params} />
    </Suspense>
  );
}

async function Product({ params }: Pick<PageProps<"/shop/[collection]/[product]">, "params">) {
  const { collection: collectionSlug, product: productSlug } = await params;
  const catalogue = await getCatalogue();
  const [product, collection] = await Promise.all([
    catalogue.getProduct(productSlug),
    catalogue.getCollection(collectionSlug),
  ]);
  // A piece is reached through its product's page
  if (!product || product.hidden || !collection || product.collection !== collection.slug) notFound();
  const pieces = await getPieces(product);

  return (
    <article>
      {hasSnow(collection) && <SnowBackground />}
      <Link href={`/shop/${collection.slug}`} prefetch>&larr; Back to {collection.name}</Link>
      <ProductImage product={product} sizes="(max-width: 480px) 100vw, 420px" className="product-image--large" priority />
      <h1>{product.name}</h1>
      <p>{formatPrice(product.price)}</p>
      <p>{product.description}</p>
      {/* Sets have no stock of their own, it depends on the brushes picked */}
      {!product.options && <p>{product.stock ? `${product.stock} in stock` : "Sold out"}</p>}
      <AddToCartButton product={product} />
      {/* Every piece is a little different, so show them all to pick from */}
      {pieces.length > 0 && (
        <ul className="pieces">
          {pieces.map(({ name, piece }) => (
            <li key={name}>
              <ProductImage product={piece} sizes="200px" />
              <span>
                {name}
                {!piece.stock && " (sold)"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

// The pieces of a one-of-a-kind product (a single pick from hidden products), by
// the name the picker shows. None for other products, including sets.
async function getPieces(product: ProductData) {
  const { options } = product;
  if (options?.count !== 1) return [];
  const catalogue = await getCatalogue();
  const all = await catalogue.listProducts({ collection: product.collection, includeHidden: true });
  return Object.entries(options.values).flatMap(([name, slug]) => {
    const piece = all.find((p) => p.slug === slug);
    return piece?.hidden ? [{ name, piece }] : [];
  });
}
