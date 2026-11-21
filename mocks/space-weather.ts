import type { SpaceWeatherEvent } from "@/types/space-weather";

// Sample response for frontend work until /api/space-weather is implemented.
export const spaceWeatherMock: SpaceWeatherEvent[] = [
  {
    id: "sample-flr-1",
    kind: "flare",
    classType: "X1.2",
    startTime: "2026-11-18T09:14:00Z",
    summary: "A strong X-class flare. It can briefly black out radio on the sunlit side of Earth.",
    link: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
  },
  {
    id: "sample-gst-1",
    kind: "storm",
    maxKp: 6,
    startTime: "2026-11-16T21:00:00Z",
    summary: "A moderate (G2) geomagnetic storm. Auroras may be visible farther from the poles.",
    link: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
  },
  {
    id: "sample-cme-1",
    kind: "cme",
    speedKmPerSec: 850,
    startTime: "2026-11-15T04:36:00Z",
    summary: "A cloud of solar material left the Sun at about 850 km/s.",
    link: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
  },
];
