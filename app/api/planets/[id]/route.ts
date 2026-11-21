import { getPlanet } from "@/server/data/planets";
import { errorResponse } from "@/server/http";

// Owner: Wasiq.
/** GET /api/planets/mars */
export async function GET(_request: Request, ctx: RouteContext<"/api/planets/[id]">) {
  const { id } = await ctx.params;
  const planet = getPlanet(id.toLowerCase());
  if (!planet) return errorResponse(404, "PLANET_NOT_FOUND", `There is no planet called "${id}".`);
  return Response.json(planet);
}
