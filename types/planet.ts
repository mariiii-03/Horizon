// Contract — owner: Wasiq. This decides what the 3D scene and info panel receive.

export type BodyType = "star" | "terrestrial" | "gas-giant" | "ice-giant";

/** Returned as Planet[] (the Sun + 8 planets) by GET /api/planets */
export type Planet = {
  /** Lowercase slug used in URLs and lessons, e.g. "mars". */
  id: string;
  name: string;
  type: BodyType;
  // TODO(Wasiq): add the physical and orbital fields the 3D scene and info panel need.
};
