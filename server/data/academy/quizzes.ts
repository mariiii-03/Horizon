import "server-only";
import type { Quiz } from "@/types/academy";

// Owner: Wasiq. Keyed by topic; served by GET /api/academy/quizzes/[topic].

export const quizzes: Record<string, Quiz> = {
  mars: {
    topic: "mars",
    title: "Mars basics",
    level: "beginner",
    questions: [
      {
        question: "Why does Mars look red?",
        options: [
          "It is very hot",
          "Iron oxide (rust) in its dust",
          "It reflects light from the Sun's flares",
          "Its atmosphere is red gas",
        ],
        answer: 1,
        explanation:
          "Mars' surface dust is rich in iron oxide, which is reddish, like rust on Earth.",
      },
    ],
  },
};
