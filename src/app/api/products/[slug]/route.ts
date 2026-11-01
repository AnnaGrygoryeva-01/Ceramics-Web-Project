import type { NextRequest } from "next/server";
import { errorResponse } from "@/server/adapters/http/responses";
import { getCatalogue } from "@/server/catalogue";

export async function GET(_request: NextRequest, context: RouteContext<"/api/products/[slug]">) {
  const catalogue = await getCatalogue();
  const { slug } = await context.params;
  const product = await catalogue.getProduct(slug);
  return product ? Response.json(product) : errorResponse(404, "not-found", "There is no such product.");
}
