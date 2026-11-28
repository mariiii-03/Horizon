import "server-only";
import { nasaGet } from "@/server/nasa/client";
import type { Asteroid } from "@/types/asteroid";

// Owner: Aminah.
// NeoWs — /neo/rest/v1/feed (max 7 days per request).

const KM_PER_LUNAR_DISTANCE = 384_400;

type RawCloseApproach = {
  close_approach_date: string;
  relative_velocity: {
    kilometers_per_second: string;
  };
  miss_distance: {
    kilometers: string;
    lunar?: string;
  };
};

type RawNeo = {
  id: string;
  name: string;
  nasa_jpl_url: string;
  is_potentially_hazardous_asteroid: boolean;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  close_approach_data: RawCloseApproach[];
};

type RawNeoFeed = {
  near_earth_objects: Record<string, RawNeo[]>;
};

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toAsteroid(raw: RawNeo, fallbackDate: string): Asteroid {
  const approach =
    raw.close_approach_data.find((a) => a.close_approach_date === fallbackDate) ??
    raw.close_approach_data[0];

  const missDistanceKm = Number(approach?.miss_distance.kilometers ?? 0);
  const rawLunar = approach?.miss_distance.lunar
    ? Number(approach.miss_distance.lunar)
    : missDistanceKm / KM_PER_LUNAR_DISTANCE;

  return {
    id: raw.id,
    name: raw.name,
    closeApproachDate: approach?.close_approach_date ?? fallbackDate,
    diameterKm: {
      min: round(raw.estimated_diameter.kilometers.estimated_diameter_min, 3),
      max: round(raw.estimated_diameter.kilometers.estimated_diameter_max, 3),
    },
    velocityKmPerSec: round(Number(approach?.relative_velocity.kilometers_per_second ?? 0), 2),
    missDistanceKm: Math.round(missDistanceKm),
    missDistanceLunar: round(rawLunar, 2),
    isPotentiallyHazardous: raw.is_potentially_hazardous_asteroid,
    nasaJplUrl: raw.nasa_jpl_url,
  };
}

/** Fetch near-Earth objects for a date range (inclusive, max 7 days). */
export async function getAsteroids(startDate: string, endDate: string): Promise<Asteroid[]> {
  const feed = await nasaGet<RawNeoFeed>("/neo/rest/v1/feed", {
    start_date: startDate,
    end_date: endDate,
  });

  const asteroids: Asteroid[] = [];
  for (const [dateKey, neos] of Object.entries(feed.near_earth_objects ?? {})) {
    for (const neo of neos) {
      asteroids.push(toAsteroid(neo, dateKey));
    }
  }

  return asteroids.sort(
    (a, b) =>
      a.closeApproachDate.localeCompare(b.closeApproachDate) || a.missDistanceKm - b.missDistanceKm,
  );
}
