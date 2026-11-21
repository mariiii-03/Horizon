import "server-only";
import type { Exoplanet } from "@/types/exoplanet";
import data from "./exoplanets.json";

// Owner: Wasiq. Snapshot written by `npm run data:exoplanets`; do not edit the JSON by hand.

export const exoplanets = data as Exoplanet[];

export function getExoplanet(id: string): Exoplanet | undefined {
  return exoplanets.find((p) => p.id === id);
}
