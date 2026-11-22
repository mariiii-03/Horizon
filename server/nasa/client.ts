import "server-only";
import { cacheLife } from "next/cache";

// Shared NASA client — owner: Wasiq.
// Every call to api.nasa.gov goes through here so the API key and caching live in one place.

const BASE_URL = "https://api.nasa.gov";

export class NasaError extends Error {
  constructor(
    message: string,
    /** HTTP status NASA returned (0 if the request never got a response). */
    readonly status: number,
  ) {
    super(message);
    this.name = "NasaError";
  }
}

/**
 * GET a NASA Open API endpoint and return its JSON.
 * Results are cached for about an hour, so many visitors cost NASA one request
 * (DEMO_KEY allows only 30 requests an hour).
 *
 * @example nasaGet<NeoFeed>("/neo/rest/v1/feed", { start_date: "2026-11-17", end_date: "2026-11-23" })
 */
export async function nasaGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  "use cache";
  cacheLife("hours");

  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  // `||`, not `??`: an empty NASA_API_KEY= line in .env should fall back to DEMO_KEY too.
  url.searchParams.set("api_key", process.env.NASA_API_KEY || "DEMO_KEY");

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new NasaError(`Could not reach NASA (${path})`, 0);
  }
  if (!res.ok) {
    throw new NasaError(`NASA returned ${res.status} for ${path}`, res.status);
  }
  return (await res.json()) as T;
}
