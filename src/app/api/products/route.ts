import type { NextRequest } from "next/server";
import { getCatalogue } from "@/server/catalogue";

export async function GET(request: NextRequest) {
  const catalogue = await getCatalogue();
  const collection = request.nextUrl.searchParams.get("collection") ?? undefined;
  // Pieces too: the cart needs their stock
  return Response.json(await catalogue.listProducts({ collection, includeHidden: true }));
}
