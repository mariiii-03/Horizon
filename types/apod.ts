// DRAFT contract — owner: Aminah. Change freely, but tell the frontend team.

/** Astronomy Picture of the Day, returned by GET /api/apod?date=YYYY-MM-DD */
export type Apod = {
  date: string; // YYYY-MM-DD
  title: string;
  explanation: string;
  /** Some days APOD is a video, not an image. */
  mediaType: "image" | "video";
  url: string;
  hdUrl?: string;
  copyright?: string;
};
