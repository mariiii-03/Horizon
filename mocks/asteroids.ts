import type { Asteroid } from "@/types/asteroid";

// Sample response for frontend work until /api/asteroids is implemented.
export const asteroidsMock: Asteroid[] = [
  {
    id: "sample-1",
    name: "(2026 AB1) sample",
    closeApproachDate: "2026-11-20",
    diameterKm: { min: 0.12, max: 0.27 },
    velocityKmPerSec: 14.2,
    missDistanceKm: 4_612_000,
    missDistanceLunar: 12,
    isPotentiallyHazardous: false,
    nasaJplUrl: "https://ssd.jpl.nasa.gov/",
  },
  {
    id: "sample-2",
    name: "(2019 XY3) sample",
    closeApproachDate: "2026-11-22",
    diameterKm: { min: 0.45, max: 1.01 },
    velocityKmPerSec: 21.7,
    missDistanceKm: 6_920_000,
    missDistanceLunar: 18,
    isPotentiallyHazardous: true,
    nasaJplUrl: "https://ssd.jpl.nasa.gov/",
  },
];
