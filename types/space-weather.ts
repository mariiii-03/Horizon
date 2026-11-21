// DRAFT contract — owner: Aminah. Change freely, but tell the frontend team.

type BaseEvent = {
  id: string;
  startTime: string; // ISO 8601
  /** One plain-language sentence a student can understand. */
  summary: string;
  link: string;
};

export type SolarFlare = BaseEvent & {
  kind: "flare";
  /** e.g. "X2.1", "M5.0" — each letter (A, B, C, M, X) is 10x stronger than the last. */
  classType: string;
};

export type GeomagneticStorm = BaseEvent & {
  kind: "storm";
  /** Highest Kp index reached, 0–9. Kp 5+ is a storm (G1–G5). */
  maxKp: number;
};

export type CoronalMassEjection = BaseEvent & {
  kind: "cme";
  speedKmPerSec?: number;
};

/** Returned as SpaceWeatherEvent[] (merged, newest first) by GET /api/space-weather?days=30 */
export type SpaceWeatherEvent = SolarFlare | GeomagneticStorm | CoronalMassEjection;
