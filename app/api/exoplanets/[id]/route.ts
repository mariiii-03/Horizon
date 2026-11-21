import { getExoplanet } from "@/server/data/exoplanets";
import { errorResponse } from "@/server/http";

// Owner: Wasiq.
/** GET /api/exoplanets/trappist-1-e */
export async function GET(_request: Request, ctx: RouteContext<"/api/exoplanets/[id]">) {
  const { id } = await ctx.params;
  const planet = getExoplanet(id.toLowerCase());
  if (!planet) return errorResponse(404, "EXOPLANET_NOT_FOUND", `There is no exoplanet "${id}".`);
  return Response.json(planet);
}
