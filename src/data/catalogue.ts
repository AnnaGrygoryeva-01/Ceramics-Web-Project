import type { CatalogueFiles, ProductFileEntry } from "@/server/adapters/json/catalogue-reader";
import collections from "./collections.json";
import brushes from "./products/brushes.json";
import christmasCollection from "./products/christmas-collection.json";
import floralCollection from "./products/floral-collection.json";

// The shop's collections and products. A new collection needs an entry in
// collections.json, a file in products/ named after its slug, and a line here.
export const catalogueFiles: CatalogueFiles = {
  collections,
  products: {
    "christmas-collection": christmasCollection as ProductFileEntry[],
    "floral-collection": floralCollection as ProductFileEntry[],
    brushes: brushes as ProductFileEntry[],
  },
};
