import { quizzes } from "@/server/data/academy/quizzes";

// Owner: Wasiq.
/** GET /api/academy/quizzes — the list of quizzes, without their questions. */
export async function GET() {
  return Response.json(
    Object.values(quizzes).map(({ topic, title, level, questions }) => ({
      topic,
      title,
      level,
      questionCount: questions.length,
    })),
  );
}
