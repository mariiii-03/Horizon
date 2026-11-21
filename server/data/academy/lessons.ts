import "server-only";
import type { Lesson } from "@/types/academy";

// Owner: Wasiq. One lesson per planet to start.

export const lessons: Lesson[] = [
  {
    id: "mars-intro",
    title: "Mars: the red planet",
    level: "beginner",
    planetId: "mars",
    body: "Mars is the fourth planet from the Sun. Its red colour comes from iron oxide, the same thing as rust, in its dust and rocks.\n\nA day on Mars lasts 24 hours and 37 minutes, very close to an Earth day.",
  },
];
