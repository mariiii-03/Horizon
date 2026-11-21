import "server-only";
import type { Planet } from "@/types/planet";

// Owner: Wasiq. Fixed planet facts — no API call needed.
// Fill in the new fields here once types/planet.ts is extended.

export const planets: Planet[] = [
  { id: "sun", name: "Sun", type: "star" },
  { id: "mercury", name: "Mercury", type: "terrestrial" },
  { id: "venus", name: "Venus", type: "terrestrial" },
  { id: "earth", name: "Earth", type: "terrestrial" },
  { id: "mars", name: "Mars", type: "terrestrial" },
  { id: "jupiter", name: "Jupiter", type: "gas-giant" },
  { id: "saturn", name: "Saturn", type: "gas-giant" },
  { id: "uranus", name: "Uranus", type: "ice-giant" },
  { id: "neptune", name: "Neptune", type: "ice-giant" },
];
