import "server-only";
import type { Quiz } from "@/types/academy";

// Owner: Wasiq. Keyed by topic (the planet id); served by GET /api/academy/quizzes/[topic].
// Every answer must be covered by the matching lesson in lessons.ts.

export const quizzes: Record<string, Quiz> = {
  mercury: {
    topic: "mercury",
    title: "Mercury basics",
    level: "beginner",
    questions: [
      {
        question: "How long does Mercury take to orbit the Sun?",
        options: ["88 days", "365 days", "687 days", "12 years"],
        answer: 0,
        explanation:
          "Mercury is the fastest planet: one trip around the Sun takes just 88 Earth days.",
      },
      {
        question: "Why does Mercury get so cold at night?",
        options: [
          "It is far from the Sun",
          "It has almost no atmosphere to hold in heat",
          "Its moons block the sunlight",
          "It is made of ice",
        ],
        answer: 1,
        explanation:
          "Without a thick atmosphere, heat escapes quickly, so nights drop to about −180 °C.",
      },
      {
        question: "How many moons does Mercury have?",
        options: ["2", "1", "0", "14"],
        answer: 2,
        explanation: "Mercury has no moons, just like Venus.",
      },
    ],
  },
  venus: {
    topic: "venus",
    title: "Venus basics",
    level: "beginner",
    questions: [
      {
        question: "Which planet is the hottest?",
        options: ["Mercury", "Venus", "Mars", "Jupiter"],
        answer: 1,
        explanation: "Venus's thick carbon dioxide atmosphere traps heat, keeping it near 464 °C.",
      },
      {
        question: "What is unusual about how Venus spins?",
        options: [
          "It doesn't spin at all",
          "It spins faster than any planet",
          "It spins backwards, and very slowly",
          "It spins on its side",
        ],
        answer: 2,
        explanation:
          "Venus spins backwards, and one spin (243 days) takes longer than its year (225 days).",
      },
      {
        question: "Venus is closest in size to which planet?",
        options: ["Earth", "Mars", "Jupiter", "Mercury"],
        answer: 0,
        explanation:
          "Venus is almost the same size as Earth, which is why it's called Earth's twin.",
      },
    ],
  },
  earth: {
    topic: "earth",
    title: "Earth basics",
    level: "beginner",
    questions: [
      {
        question: "What causes Earth's seasons?",
        options: [
          "Earth getting closer to and farther from the Sun",
          "The tilt of Earth's axis",
          "The Moon's gravity",
          "Changes in the Sun's brightness",
        ],
        answer: 1,
        explanation:
          "Earth's 23.4° tilt means each half leans towards the Sun for part of the year.",
      },
      {
        question: "About how much of Earth's surface is covered by water?",
        options: ["30%", "50%", "71%", "95%"],
        answer: 2,
        explanation: "About 71% of Earth's surface is ocean, lakes and rivers.",
      },
      {
        question: "Earth is which planet from the Sun?",
        options: ["First", "Second", "Fourth", "Third"],
        answer: 3,
        explanation: "Mercury, Venus, then Earth: we're the third planet.",
      },
    ],
  },
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
          "It reflects light from solar flares",
          "Its atmosphere is red gas",
        ],
        answer: 1,
        explanation:
          "Mars' surface dust is rich in iron oxide, which is reddish, like rust on Earth.",
      },
      {
        question: "What is Olympus Mons?",
        options: [
          "Mars' largest moon",
          "A rover",
          "The tallest volcano in the Solar System",
          "A dust storm",
        ],
        answer: 2,
        explanation: "Olympus Mons on Mars is the tallest volcano in the Solar System.",
      },
      {
        question: "How strong is gravity on Mars compared with Earth?",
        options: ["About 38%", "About the same", "Twice as strong", "About 10%"],
        answer: 0,
        explanation: "Mars' gravity is about 38% of Earth's, so you'd weigh much less there.",
      },
    ],
  },
  jupiter: {
    topic: "jupiter",
    title: "Jupiter basics",
    level: "beginner",
    questions: [
      {
        question: "What is the Great Red Spot?",
        options: [
          "A volcano",
          "A storm bigger than Earth",
          "A crater from an asteroid",
          "One of Jupiter's moons",
        ],
        answer: 1,
        explanation: "The Great Red Spot is a giant storm that has lasted for centuries.",
      },
      {
        question: "Which is the largest moon in the Solar System?",
        options: ["Titan", "Earth's Moon", "Europa", "Ganymede"],
        answer: 3,
        explanation: "Jupiter's moon Ganymede is the largest, bigger even than Mercury.",
      },
      {
        question: "How long is a day on Jupiter?",
        options: ["Under 10 hours", "24 hours", "10 days", "1 year"],
        answer: 0,
        explanation: "Jupiter spins faster than any other planet, once every 9.9 hours.",
      },
    ],
  },
  saturn: {
    topic: "saturn",
    title: "Saturn basics",
    level: "beginner",
    questions: [
      {
        question: "What are Saturn's rings made of?",
        options: ["Gas", "Pieces of ice and rock", "Dust from the Sun", "Liquid water"],
        answer: 1,
        explanation:
          "The rings are billions of chunks of ice and rock, from tiny grains to house-sized.",
      },
      {
        question: "Which of Saturn's moons has lakes of liquid methane?",
        options: ["Ganymede", "Phobos", "Titan", "Triton"],
        answer: 2,
        explanation: "Titan has a thick atmosphere and lakes of liquid methane on its surface.",
      },
      {
        question: "About how long does Saturn take to orbit the Sun?",
        options: ["1 year", "12 years", "84 years", "29 years"],
        answer: 3,
        explanation: "One Saturn year lasts about 29 Earth years.",
      },
    ],
  },
  uranus: {
    topic: "uranus",
    title: "Uranus basics",
    level: "beginner",
    questions: [
      {
        question: "What is unusual about Uranus?",
        options: [
          "It has no atmosphere",
          "It is tilted on its side",
          "It is the hottest planet",
          "It has no moons",
        ],
        answer: 1,
        explanation: "Uranus is tilted by about 98°, so it rolls around the Sun on its side.",
      },
      {
        question: "What gives Uranus its blue-green colour?",
        options: [
          "Oceans",
          "Methane in its atmosphere",
          "Ice rings",
          "Reflected light from Neptune",
        ],
        answer: 1,
        explanation: "Methane gas absorbs red light, so Uranus looks blue-green.",
      },
      {
        question: "About how long does each pole of Uranus stay in sunlight?",
        options: ["12 hours", "1 year", "42 years", "84 years"],
        answer: 2,
        explanation: "Each pole gets about 42 years of sunlight, then about 42 years of darkness.",
      },
    ],
  },
  neptune: {
    topic: "neptune",
    title: "Neptune basics",
    level: "beginner",
    questions: [
      {
        question: "How was Neptune first found?",
        options: [
          "A spacecraft flew past it",
          "It is visible without a telescope",
          "Astronomers predicted it using maths",
          "A rover landed on it",
        ],
        answer: 2,
        explanation:
          "Its pull on Uranus told astronomers where to look, and they found it in 1846.",
      },
      {
        question: "What record does Neptune hold?",
        options: ["Most moons", "Fastest winds", "Largest size", "Hottest surface"],
        answer: 1,
        explanation: "Neptune's winds reach more than 2,000 km/h, the fastest in the Solar System.",
      },
      {
        question: "About how long does one Neptune year last?",
        options: ["29 Earth years", "84 Earth years", "164 Earth years", "1,000 Earth years"],
        answer: 2,
        explanation:
          "Neptune is about 30 times farther from the Sun than Earth, so one orbit takes about 164 years.",
      },
    ],
  },
};

/**
 * Look up a quiz by topic. Uses Object.hasOwn so URL values like "constructor" or
 * "__proto__" can't reach built-in object properties.
 */
export function getQuiz(topic: string): Quiz | undefined {
  return Object.hasOwn(quizzes, topic) ? quizzes[topic] : undefined;
}
