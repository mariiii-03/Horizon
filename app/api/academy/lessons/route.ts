import type { NextRequest } from "next/server";
import { lessons } from "@/server/data/academy/lessons";

// Owner: Wasiq.
/**
 * GET /api/academy/lessons?level=beginner&planetId=mars
 * Both filters are optional.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const level = params.get("level");
  const planetId = params.get("planetId");

  return Response.json(
    lessons.filter((l) => (!level || l.level === level) && (!planetId || l.planetId === planetId)),
  );
}
