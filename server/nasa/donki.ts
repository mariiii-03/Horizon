import "server-only";
import { nasaGet } from "@/server/nasa/client";
import { addDaysIso, todayUtcIso } from "@/server/nasa/dates";
import { getNasaStatus } from "@/server/nasa/errors";
import type {
  CoronalMassEjection,
  GeomagneticStorm,
  SolarFlare,
  SpaceWeatherEvent,
} from "@/types/space-weather";

// Owner: Aminah.
// DONKI — /DONKI/FLR, /DONKI/GST, /DONKI/CME

type RawFlare = {
  flrID: string;
  beginTime?: string;
  peakTime?: string;
  startTime?: string;
  classType?: string;
  link?: string;
};

type RawStorm = {
  gstID: string;
  startTime: string;
  allKpIndex?: Array<{ kpIndex: number }>;
  link?: string;
};

type RawCme = {
  activityID: string;
  startTime: string;
  cmeAnalyses?: Array<{ isMostAccurate?: boolean; speed?: number | null }>;
  link?: string;
};

const DONKI_FALLBACK_LINK = "https://kauai.ccmc.gsfc.nasa.gov/DONKI/";

function summarizeFlare(classType: string): string {
  const letter = classType.trim().toUpperCase().charAt(0);
  switch (letter) {
    case "X":
      return `A strong ${classType} flare. It can briefly black out radio on the sunlit side of Earth.`;
    case "M":
      return `A moderate ${classType} flare. It can cause brief radio blackouts near the poles.`;
    case "C":
      return `A minor ${classType} flare with little noticeable effect on Earth.`;
    case "B":
    case "A":
      return `A weak ${classType} flare with no impact on Earth.`;
    default:
      return "A solar flare recorded on the Sun.";
  }
}

function summarizeStorm(maxKp: number): string {
  if (maxKp >= 9) {
    return "An extreme (G5) geomagnetic storm. Widespread power grid issues and auroras are possible.";
  }
  if (maxKp >= 8) {
    return "A severe (G4) geomagnetic storm. Auroras may appear much closer to the equator than usual.";
  }
  if (maxKp >= 7) {
    return "A strong (G3) geomagnetic storm. Auroras may be visible at mid-latitudes.";
  }
  if (maxKp >= 6) {
    return "A moderate (G2) geomagnetic storm. Auroras may be visible farther from the poles.";
  }
  if (maxKp >= 5) {
    return "A minor (G1) geomagnetic storm. Auroras are likely near the poles.";
  }
  return "Mild geomagnetic activity with no major storm impact.";
}

function summarizeCme(speedKmPerSec?: number): string {
  if (speedKmPerSec !== undefined) {
    return `A cloud of solar material left the Sun at about ${Math.round(speedKmPerSec)} km/s.`;
  }
  return "A cloud of solar material (coronal mass ejection) erupted from the Sun.";
}

function toSolarFlare(raw: RawFlare): SolarFlare {
  const classType = raw.classType?.trim() || "Unknown";
  return {
    id: raw.flrID,
    kind: "flare",
    classType,
    startTime: raw.beginTime || raw.startTime || raw.peakTime || "",
    summary: summarizeFlare(classType),
    link: raw.link || DONKI_FALLBACK_LINK,
  };
}

function toGeomagneticStorm(raw: RawStorm): GeomagneticStorm {
  const kpValues = (raw.allKpIndex ?? []).map((k) => k.kpIndex).filter(Number.isFinite);
  const maxKp = kpValues.length > 0 ? Math.max(...kpValues) : 0;
  return {
    id: raw.gstID,
    kind: "storm",
    maxKp,
    startTime: raw.startTime,
    summary: summarizeStorm(maxKp),
    link: raw.link || DONKI_FALLBACK_LINK,
  };
}

function toCme(raw: RawCme): CoronalMassEjection {
  const analyses = raw.cmeAnalyses ?? [];
  const primary = analyses.find((a) => a.isMostAccurate) ?? analyses[0];
  const speedKmPerSec =
    typeof primary?.speed === "number" && Number.isFinite(primary.speed)
      ? primary.speed
      : undefined;

  return {
    id: raw.activityID,
    kind: "cme",
    ...(speedKmPerSec !== undefined ? { speedKmPerSec } : {}),
    startTime: raw.startTime,
    summary: summarizeCme(speedKmPerSec),
    link: raw.link || DONKI_FALLBACK_LINK,
  };
}

async function fetchDonkiList<T>(path: string, startDate: string, endDate: string): Promise<T[]> {
  const data = await nasaGet<T[] | null | string>(path, { startDate, endDate });
  return Array.isArray(data) ? data : [];
}

/** Fetch FLR, GST, and CME events for the past `days` days, merged and sorted newest-first. */
export async function getSpaceWeather(days: number): Promise<SpaceWeatherEvent[]> {
  const endDate = todayUtcIso();
  const startDate = addDaysIso(endDate, -(days - 1));

  const [flrRes, gstRes, cmeRes] = await Promise.allSettled([
    fetchDonkiList<RawFlare>("/DONKI/FLR", startDate, endDate),
    fetchDonkiList<RawStorm>("/DONKI/GST", startDate, endDate),
    fetchDonkiList<RawCme>("/DONKI/CME", startDate, endDate),
  ]);

  const results = [flrRes, gstRes, cmeRes];
  const rateLimited = results.find(
    (r): r is PromiseRejectedResult => r.status === "rejected" && getNasaStatus(r.reason) === 429,
  );
  if (rateLimited) throw rateLimited.reason;

  // If all three fail, surface the upstream failure instead of returning an empty timeline.
  if (results.every((r) => r.status === "rejected")) {
    throw (results[0] as PromiseRejectedResult).reason;
  }

  const events: SpaceWeatherEvent[] = [];

  if (flrRes.status === "fulfilled") {
    events.push(...flrRes.value.map(toSolarFlare));
  } else if (getNasaStatus(flrRes.reason) !== 404) {
    throw flrRes.reason;
  }

  if (gstRes.status === "fulfilled") {
    events.push(...gstRes.value.map(toGeomagneticStorm));
  } else {
    throw gstRes.reason;
  }

  if (cmeRes.status === "fulfilled") {
    events.push(...cmeRes.value.map(toCme));
  } else {
    throw cmeRes.reason;
  }

  return events.sort((a, b) => Date.parse(b.startTime) - Date.parse(a.startTime));
}
