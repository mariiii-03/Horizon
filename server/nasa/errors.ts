import "server-only";
import { errorResponse } from "@/server/http";
import { NasaError } from "@/server/nasa/client";

// Owner: Aminah.
/**
 * Extract the upstream HTTP status from a NasaError (including errors that lost
 * their prototype after crossing a Next.js `"use cache"` boundary).
 */
export function getNasaStatus(err: unknown): number | null {
  if (err instanceof NasaError) return err.status;
  if (err instanceof Error) {
    const match = err.message.match(/NASA(?:\s+APOD)?\s+returned\s+(\d{3})\b/);
    if (match) return Number(match[1]);
    if (err.message.startsWith("Could not reach NASA")) return 0;
  }
  return null;
}

/** Convert a NasaError (or unexpected upstream failure) into our shared ApiError shape. */
export function nasaErrorResponse(err: unknown) {
  const status = getNasaStatus(err);
  if (status !== null) {
    if (status === 429) {
      return errorResponse(
        429,
        "NASA_RATE_LIMITED",
        "NASA API rate limit reached. Please try again in a few minutes.",
      );
    }
    if (status === 404) {
      return errorResponse(404, "NASA_NOT_FOUND", "No NASA data found for that request.");
    }
    return errorResponse(502, "NASA_UNAVAILABLE", "Could not load data from NASA right now.");
  }
  return errorResponse(500, "INTERNAL_ERROR", "An unexpected server error occurred.");
}
