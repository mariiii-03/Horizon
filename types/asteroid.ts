// DRAFT contract — owner: Aminah. Change freely, but tell the frontend team.

/** One near-Earth object, returned as Asteroid[] by GET /api/asteroids?start=&end= */
export type Asteroid = {
  id: string;
  name: string;
  closeApproachDate: string; // YYYY-MM-DD
  diameterKm: { min: number; max: number };
  velocityKmPerSec: number;
  missDistanceKm: number;
  /** Miss distance in lunar distances (1 LD ≈ 384,400 km) — easier for students. */
  missDistanceLunar: number;
  isPotentiallyHazardous: boolean;
  nasaJplUrl: string;
};
