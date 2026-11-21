// DRAFT contract — owner: Wasiq. Change freely, but tell the frontend team.

export type HostStar = {
  name: string;
  spectralType?: string;
  temperatureK?: number;
  /** Distance from Earth in light-years. */
  distanceLy?: number;
};

/** Returned as Exoplanet[] by GET /api/exoplanets?q=&page= */
export type Exoplanet = {
  name: string;
  hostStar: HostStar;
  radiusEarth?: number;
  massEarth?: number;
  orbitalPeriodDays?: number;
  discoveryYear: number;
  discoveryMethod: string;
  /** Computed by us from the star's luminosity; the archive does not provide it. */
  inHabitableZone?: boolean;
};
