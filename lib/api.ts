import type { ApiError } from "@/types/api";

export class HorizonApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "HorizonApiError";
  }
}

export async function fetchApi<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let code = "REQUEST_FAILED";
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as Partial<ApiError>;
      if (body.error?.code) code = body.error.code;
      if (body.error?.message) message = body.error.message;
    } catch {
      // Ignore non-JSON error body
    }
    throw new HorizonApiError(code, message, res.status);
  }
  return (await res.json()) as T;
}

export async function fetchApiWithHeaders<T>(
  url: string,
  init?: RequestInit,
): Promise<{ data: T; headers: Headers }> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let code = "REQUEST_FAILED";
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as Partial<ApiError>;
      if (body.error?.code) code = body.error.code;
      if (body.error?.message) message = body.error.message;
    } catch {
      // Ignore non-JSON error body
    }
    throw new HorizonApiError(code, message, res.status);
  }
  const data = (await res.json()) as T;
  return { data, headers: res.headers };
}
