import { planets } from "@/server/data/planets";

// Owner: Wasiq.
export async function GET() {
  return Response.json(planets);
}
