import { getCatalogue } from "@/server/catalogue";

export async function GET() {
  const catalogue = await getCatalogue();
  return Response.json(await catalogue.listCollections());
}
