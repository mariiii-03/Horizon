import { asteroidsMock } from "@/mocks/asteroids";

// Owner: Aminah.
// Serves sample data until the real implementation lands, so the frontend can
// call this URL from day one. Replace with a call into server/nasa/.
export async function GET() {
  return Response.json(asteroidsMock);
}
