// Contract — owner: Wasiq. This decides what the 3D scene and info panel receive.
// All values are real-world units. The frontend decides how to scale them for the scene.

export type BodyType = "star" | "terrestrial" | "gas-giant" | "ice-giant";

export type Orbit = {
  /** Average distance from the Sun in AU (1 AU = 149,597,870.7 km). */
  semiMajorAxisAu: number;
  /** Time for one trip around the Sun, in Earth days. */
  periodDays: number;
  /** 0 = perfect circle; higher = more stretched. */
  eccentricity: number;
  /** Tilt of the orbit against Earth's orbital plane, in degrees. */
  inclinationDeg: number;
};

/** Returned as Planet[] (the Sun + 8 planets) by GET /api/planets, one by GET /api/planets/[id] */
export type Planet = {
  /** Lowercase slug used in URLs and lessons, e.g. "mars". */
  id: string;
  name: string;
  type: BodyType;
  /** Position from the Sun: 0 for the Sun, 1 for Mercury … 8 for Neptune. */
  order: number;
  /** One sentence for the info panel. */
  summary: string;

  /** Mean radius in km. */
  radiusKm: number;
  /** Mass compared with Earth (Earth = 1). */
  massEarths: number;
  /** Surface gravity in m/s² (Earth ≈ 9.8). For giants, measured where pressure is 1 bar. */
  gravityMs2: number;
  /** Mean temperature in °C. */
  meanTempC: number;

  /** Time to spin once, in hours. Negative means it spins backwards (retrograde). */
  rotationHours: number;
  /** Tilt of the spin axis, in degrees. */
  axialTiltDeg: number;

  /** null for the Sun. */
  orbit: Orbit | null;
  moons: number;
  hasRings: boolean;

  /** Fallback colour for the 3D scene before textures load. */
  color: string;
};
