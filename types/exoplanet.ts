// Contract — owner: Wasiq. Change freely, but tell the frontend team.

export type HostStar = {
  name: string;
  spectralType?: string;
  temperatureK?: number;
  /** Brightness compared with the Sun (Sun = 1). */
  luminositySuns?: number;
  /** Distance from Earth in light-years. */
  distanceLy?: number;
};

/** Returned as Exoplanet[] by GET /api/exoplanets?q=&page= */
export type Exoplanet = {
  /** URL-safe slug, e.g. "trappist-1-e". */
  id: string;
  name: string;
  /** One sentence on why this planet is interesting. */
  highlight: string;
  hostStar: HostStar;
  radiusEarth?: number;
  massEarth?: number;
  orbitalPeriodDays?: number;
  /** Average distance from its star in AU. */
  semiMajorAxisAu?: number;
  /** Estimated temperature if the planet were a perfect absorber, in kelvin. */
  equilibriumTempK?: number;
  discoveryYear: number;
  discoveryMethod: string;
  /** Computed by us from the star's luminosity; the archive does not provide it. */
  inHabitableZone?: boolean;
};
