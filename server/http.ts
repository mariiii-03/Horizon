import "server-only";
import type { ApiError } from "@/types/api";

/** Build an error response in the shape every route shares (see types/api.ts). */
export function errorResponse(status: number, code: string, message: string) {
  const body: ApiError = { error: { code, message } };
  return Response.json(body, { status });
}
