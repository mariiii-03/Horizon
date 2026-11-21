// DRAFT contract — owner: Wasiq. Change freely, but tell the frontend team.

export type Level = "beginner" | "intermediate" | "advanced";

/** Returned as Lesson[] by GET /api/academy/lessons */
export type Lesson = {
  id: string;
  title: string;
  level: Level;
  /** Links the lesson to a planet in the 3D view, e.g. "mars". */
  planetId?: string;
  /** Lesson text, paragraphs separated by blank lines. */
  body: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  /** Index into options. */
  answer: number;
  /** Shown after answering, right or wrong. */
  explanation: string;
};

/** Returned by GET /api/academy/quizzes/[topic] */
export type Quiz = {
  topic: string;
  title: string;
  level: Level;
  questions: QuizQuestion[];
};
