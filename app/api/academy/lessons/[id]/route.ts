import { getLesson } from "@/server/data/academy/lessons";
import { errorResponse } from "@/server/http";

// Owner: Wasiq.
/** GET /api/academy/lessons/mars-intro */
export async function GET(_request: Request, ctx: RouteContext<"/api/academy/lessons/[id]">) {
  const { id } = await ctx.params;
  const lesson = getLesson(id);
  if (!lesson) return errorResponse(404, "LESSON_NOT_FOUND", `There is no lesson "${id}".`);
  return Response.json(lesson);
}
