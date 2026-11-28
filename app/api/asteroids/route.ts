import type { NextRequest } from "next/server";
import { errorResponse } from "@/server/http";
import { addDaysIso, inclusiveDaysBetween, isValidIsoDate, todayUtcIso } from "@/server/nasa/dates";
import { nasaErrorResponse } from "@/server/nasa/errors";
import { getAsteroids } from "@/server/nasa/neows";

// Owner: Aminah.
const MAX_RANGE_DAYS = 7;

/**
 * GET /api/asteroids?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Defaults to a 7-day window starting today when omitted.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const startParam = params.get("start")?.trim();
  const endParam = params.get("end")?.trim();

  if (startParam && !isValidIsoDate(startParam)) {
    return errorResponse(400, "INVALID_DATE", "Start date must be a valid YYYY-MM-DD date.");
  }
  if (endParam && !isValidIsoDate(endParam)) {
    return errorResponse(400, "INVALID_DATE", "End date must be a valid YYYY-MM-DD date.");
  }

  let start = startParam;
  let end = endParam;

  if (!start && !end) {
    start = todayUtcIso();
    end = addDaysIso(start, MAX_RANGE_DAYS - 1);
  } else if (start && !end) {
    end = addDaysIso(start, MAX_RANGE_DAYS - 1);
  } else if (!start && end) {
    start = addDaysIso(end, -(MAX_RANGE_DAYS - 1));
  }

  if (start! > end!) {
    return errorResponse(400, "INVALID_RANGE", "Start date must be on or before end date.");
  }

  if (inclusiveDaysBetween(start!, end!) > MAX_RANGE_DAYS) {
    return errorResponse(400, "RANGE_TOO_LONG", "Pick 7 days or fewer.");
  }

  try {
    const asteroids = await getAsteroids(start!, end!);
    return Response.json(asteroids);
  } catch (err) {
    return nasaErrorResponse(err);
  }
}
