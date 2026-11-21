import type { Apod } from "@/types/apod";

// Sample response for frontend work until /api/apod is implemented.
export const apodMock: Apod = {
  date: "2026-11-19",
  title: "Sample: The Pillars of Creation",
  explanation:
    "Sample text. Towering columns of cold gas and dust in the Eagle Nebula, about 6,500 light-years away, are slowly being eroded by light from nearby young stars.",
  mediaType: "image",
  url: "https://apod.nasa.gov/apod/image/sample.jpg",
};
