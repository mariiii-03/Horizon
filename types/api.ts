/** Every API route returns errors in this one shape. */
export type ApiError = {
  error: {
    /** Machine-readable, e.g. "RANGE_TOO_LONG", "NASA_UNAVAILABLE". */
    code: string;
    /** Human-readable, safe to show on screen. */
    message: string;
  };
};
