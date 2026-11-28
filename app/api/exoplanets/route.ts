import type { NextRequest } from "next/server";
import { exoplanets } from "@/server/data/exoplanets";

// Owner: Wasiq.
const PAGE_SIZE = 12;

/**
 * GET /api/exoplanets?q=&page=&habitable=
 * Returns Exoplanet[] with X-Total-Count header.
 * If `page` is omitted, returns all matching exoplanets; if `page` is a positive integer, returns that page.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim().toLowerCase() ?? "";
  const habitable = params.get("habitable");
  const pageParam = params.get("page");

  let filtered = exoplanets;

  if (q) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.hostStar.name.toLowerCase().includes(q) ||
        p.highlight.toLowerCase().includes(q) ||
        p.discoveryMethod.toLowerCase().includes(q) ||
        (p.hostStar.spectralType?.toLowerCase().includes(q) ?? false),
    );
  }

  if (habitable === "true") {
    filtered = filtered.filter((p) => Boolean(p.inHabitableZone));
  }

  const totalCount = filtered.length;
  let result = filtered;

  if (pageParam) {
    const page = Math.max(1, Number.parseInt(pageParam, 10) || 1);
    const start = (page - 1) * PAGE_SIZE;
    result = filtered.slice(start, start + PAGE_SIZE);
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Total-Count": String(totalCount),
      "Cache-Control": "no-store",
    },
  });
}
