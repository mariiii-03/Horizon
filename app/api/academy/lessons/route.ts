import { lessons } from "@/server/data/academy/lessons";

// Owner: Wasiq.
export async function GET() {
  return Response.json(lessons);
}
