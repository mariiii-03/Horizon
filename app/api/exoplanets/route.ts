import type { NextRequest } from "next/server";
import { exoplanets } from "@/server/data/exoplanets";

// Owner: Wasiq.
const PAGE_SIZE = 20;

/**
 * GET /api/exoplanets?q=kepler&habitable=true&page=1
 * - q: matches planet or star name
 * - habitable=true: only planets in their star's habitable zone
 * - page: 20 per page, nearest first
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim().toLowerCase() ?? "";
  const habitableOnly = params.get("habitable") === "true";
  const page = Math.max(1, Math.floor(Number(params.get("page"))) || 1);

  const matches = exoplanets.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q) || p.hostStar.name.toLowerCase().includes(q)) &&
      (!habitableOnly || p.inHabitableZone === true),
  );

  return Response.json(matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), {
    headers: { "X-Total-Count": String(matches.length) },
  });
}
