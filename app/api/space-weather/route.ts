import type { NextRequest } from "next/server";
import { errorResponse } from "@/server/http";
import { getSpaceWeather } from "@/server/nasa/donki";
import { nasaErrorResponse } from "@/server/nasa/errors";

// Owner: Aminah.
const DEFAULT_DAYS = 30;
const MAX_DAYS = 30;

/** GET /api/space-weather?days=30 */
export async function GET(request: NextRequest) {
  const daysParam = request.nextUrl.searchParams.get("days")?.trim();
  let days = DEFAULT_DAYS;

  if (daysParam) {
    const parsed = Number(daysParam);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_DAYS) {
      return errorResponse(
        400,
        "INVALID_DAYS",
        `Days must be a whole number between 1 and ${MAX_DAYS}.`,
      );
    }
    days = parsed;
  }

  try {
    const events = await getSpaceWeather(days);
    return Response.json(events);
  } catch (err) {
    return nasaErrorResponse(err);
  }
}
