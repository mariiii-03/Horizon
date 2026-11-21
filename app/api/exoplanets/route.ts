import type { NextRequest } from "next/server";
import type { Exoplanet } from "@/types/exoplanet";
import data from "@/server/data/exoplanets.json";

// Owner: Wasiq.
const exoplanets = data as Exoplanet[];
const PAGE_SIZE = 20;

/** GET /api/exoplanets?q=kepler&page=1 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);

  const matches = q
    ? exoplanets.filter(
        (p) => p.name.toLowerCase().includes(q) || p.hostStar.name.toLowerCase().includes(q),
      )
    : exoplanets;

  return Response.json(matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
}
