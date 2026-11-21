import { getQuiz } from "@/server/data/academy/quizzes";
import { errorResponse } from "@/server/http";

// Owner: Wasiq.
/** GET /api/academy/quizzes/mars */
export async function GET(_request: Request, ctx: RouteContext<"/api/academy/quizzes/[topic]">) {
  const { topic } = await ctx.params;
  const quiz = getQuiz(topic);
  if (!quiz) return errorResponse(404, "QUIZ_NOT_FOUND", `There is no quiz for "${topic}" yet.`);
  return Response.json(quiz);
}
