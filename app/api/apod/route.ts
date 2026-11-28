import type { NextRequest } from "next/server";
import { errorResponse } from "@/server/http";
import { getApod } from "@/server/nasa/apod";
import { isValidIsoDate, todayUtcIso } from "@/server/nasa/dates";
import { nasaErrorResponse } from "@/server/nasa/errors";

// Owner: Aminah.
const APOD_FIRST_DATE = "1995-06-16";

/** GET /api/apod?date=YYYY-MM-DD (defaults to the latest APOD). */
export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date")?.trim();

  if (dateParam) {
    if (!isValidIsoDate(dateParam)) {
      return errorResponse(400, "INVALID_DATE", "Date must be a valid YYYY-MM-DD date.");
    }
    const today = todayUtcIso();
    if (dateParam < APOD_FIRST_DATE || dateParam > today) {
      return errorResponse(
        400,
        "INVALID_DATE",
        `Choose a date between ${APOD_FIRST_DATE} and today.`,
      );
    }
  }

  try {
    const apod = await getApod(dateParam || undefined);
    return Response.json(apod);
  } catch (err) {
    return nasaErrorResponse(err);
  }
}
