// Owner: Wasiq.
// Refreshes server/data/exoplanets.json from the NASA Exoplanet Archive (table: pscomppars),
// so the site never depends on the archive being up during the demo.
// Run with: npm run data:exoplanets

import { writeFile } from "node:fs/promises";
import type { Exoplanet } from "@/types/exoplanet";

const TAP_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
const OUT_FILE = new URL("../data/exoplanets.json", import.meta.url);
const PARSEC_TO_LY = 3.26156;

/** The curated set: archive name → why it's worth showing a student. */
const CURATED: Record<string, string> = {
  "Proxima Cen b": "Orbits the closest star to the Sun, just over 4 light-years away.",
  "Barnard b": "A small rocky world around Barnard's Star, the second-closest star system to us.",
  "TRAPPIST-1 b": "Innermost of seven Earth-sized planets packed around one tiny red star.",
  "TRAPPIST-1 c":
    "One of seven Earth-sized TRAPPIST-1 planets; JWST found little sign of a thick atmosphere.",
  "TRAPPIST-1 d": "On the inner edge of the TRAPPIST-1 habitable zone.",
  "TRAPPIST-1 e": "One of the best-known candidates for liquid water outside our Solar System.",
  "TRAPPIST-1 f": "A TRAPPIST-1 world in the habitable zone that may be icy.",
  "TRAPPIST-1 g": "The largest TRAPPIST-1 planet, near the outer edge of the habitable zone.",
  "TRAPPIST-1 h": "The outermost and coldest of the seven TRAPPIST-1 planets.",
  "Teegarden's Star b": "One of the most Earth-like planets known by size and starlight received.",
  "Ross 128 b": "A nearby rocky planet around a quiet red dwarf that rarely flares.",
  "LHS 1140 b": "A dense 'super-Earth' that may be covered by a global ocean.",
  "TOI-700 d": "An Earth-sized habitable-zone planet found by NASA's TESS mission.",
  "TOI-700 e": "TOI-700 d's slightly smaller neighbour, also in the habitable zone.",
  "Kepler-186 f": "The first Earth-sized planet found in a star's habitable zone (2014).",
  "Kepler-452 b": "Nicknamed 'Earth's cousin': it orbits a Sun-like star once every 385 days.",
  "Kepler-22 b":
    "Kepler's first confirmed planet in a habitable zone, about 2.1 times Earth's size.",
  "Kepler-442 b": "A rocky super-Earth that gets about two-thirds of the light Earth does.",
  "Kepler-62 f": "A super-Earth in the habitable zone that could hold surface water.",
  "Kepler-1649 c": "Found by re-checking old Kepler data; close to Earth in size and warmth.",
  "K2-18 b": "JWST detected methane and carbon dioxide in its atmosphere.",
  "GJ 667 C c": "Orbits one star in a triple-star system.",
  "LTT 1445 A b": "A rocky planet in a system of three red dwarf stars, 22 light-years away.",
  "GJ 1214 b": "A 'sub-Neptune' wrapped in a thick, hazy atmosphere.",
  "55 Cnc e": "A lava world so hot that one side may be covered in molten rock.",
  "Kepler-10 b": "Kepler's first confirmed rocky planet, with a year lasting less than a day.",
  "51 Peg b": "The first planet found around a Sun-like star (1995), a Nobel Prize discovery.",
  "HD 209458 b": "The first exoplanet seen passing in front of its star.",
  "HD 189733 b": "A deep blue gas giant where it may rain glass sideways.",
  "WASP-12 b": "A hot Jupiter being slowly torn apart and swallowed by its star.",
  "WASP-121 b": "An 'ultra-hot Jupiter' with metal clouds and iron in its air.",
  "KELT-9 b": "The hottest known giant planet, hotter than many stars.",
  "Kepler-16 b": "A real 'Tatooine': it orbits two suns at once.",
  "HR 8799 b": "One of four giant planets photographed directly around their star.",
  "PSR B1257+12 c": "Among the first exoplanets ever found (1992), orbiting a dead star (pulsar).",
};

type ArchiveRow = {
  pl_name: string;
  hostname: string;
  pl_rade: number | null;
  pl_bmasse: number | null;
  pl_orbper: number | null;
  pl_orbsmax: number | null;
  pl_eqt: number | null;
  disc_year: number;
  discoverymethod: string;
  sy_dist: number | null;
  st_spectype: string | null;
  st_teff: number | null;
  /** log10 of luminosity in Suns. */
  st_lum: number | null;
};

/**
 * Is a planet inside its star's habitable zone, where liquid water could exist on the surface?
 *
 * @param luminositySuns  Star's brightness compared with the Sun (Sun = 1).
 * @param semiMajorAxisAu Planet's average distance from the star in AU.
 * @returns true / false, or undefined when there isn't enough data to say.
 */
export function isInHabitableZone(
  luminositySuns: number | undefined,
  semiMajorAxisAu: number | undefined,
): boolean | undefined {
  if (luminositySuns === undefined || semiMajorAxisAu === undefined) return undefined;
  if (luminositySuns <= 0 || semiMajorAxisAu <= 0) return undefined;

  // Conservative zone (Kopparapu et al. 2013): 0.95-1.67 AU for the Sun.
  // Light falls off with distance squared, so the zone moves out with sqrt(luminosity).
  const scale = Math.sqrt(luminositySuns);
  return semiMajorAxisAu >= 0.95 * scale && semiMajorAxisAu <= 1.67 * scale;
}

function round(value: number | null, digits: number): number | undefined {
  if (value === null) return undefined;
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toExoplanet(row: ArchiveRow): Exoplanet {
  const luminositySuns = row.st_lum === null ? undefined : round(10 ** row.st_lum, 4);
  const semiMajorAxisAu = round(row.pl_orbsmax, 4);
  return {
    id: slug(row.pl_name),
    name: row.pl_name,
    highlight: CURATED[row.pl_name],
    hostStar: {
      name: row.hostname,
      spectralType: row.st_spectype ?? undefined,
      temperatureK: round(row.st_teff, 0),
      luminositySuns,
      distanceLy: row.sy_dist === null ? undefined : round(row.sy_dist * PARSEC_TO_LY, 1),
    },
    radiusEarth: round(row.pl_rade, 2),
    massEarth: round(row.pl_bmasse, 2),
    orbitalPeriodDays: round(row.pl_orbper, 2),
    semiMajorAxisAu,
    equilibriumTempK: round(row.pl_eqt, 0),
    discoveryYear: row.disc_year,
    discoveryMethod: row.discoverymethod,
    inHabitableZone: isInHabitableZone(luminositySuns, semiMajorAxisAu),
  };
}

async function main() {
  const names = Object.keys(CURATED)
    .map((n) => `'${n.replace(/'/g, "''")}'`) // ADQL escapes ' as ''
    .join(",");
  const query =
    "select pl_name,hostname,pl_rade,pl_bmasse,pl_orbper,pl_orbsmax,pl_eqt,disc_year," +
    `discoverymethod,sy_dist,st_spectype,st_teff,st_lum from pscomppars where pl_name in (${names})`;

  const url = new URL(TAP_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Exoplanet Archive returned ${res.status}`);
  const rows = (await res.json()) as ArchiveRow[];

  const missing = Object.keys(CURATED).filter((n) => !rows.some((r) => r.pl_name === n));
  if (missing.length) console.warn(`Not found in the archive: ${missing.join(", ")}`);

  // Nearest first: a natural order for students browsing.
  const planets = rows
    .map(toExoplanet)
    .sort((a, b) => (a.hostStar.distanceLy ?? Infinity) - (b.hostStar.distanceLy ?? Infinity));

  await writeFile(OUT_FILE, JSON.stringify(planets, null, 2) + "\n");
  console.log(`Wrote ${planets.length} exoplanets to server/data/exoplanets.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
