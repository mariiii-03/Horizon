import "server-only";
import { cacheLife } from "next/cache";
import { NasaError } from "@/server/nasa/client";
import type { Apod } from "@/types/apod";

// Owner: Aminah.
// APOD — new endpoint https://science.nasa.gov/wp-json/wp/v2/apod-basic (see README).

const APOD_BASE_URL = "https://science.nasa.gov/wp-json/wp/v2/apod-basic";

type RawApod = {
  date: string;
  title: string;
  media_type?: string;
  explanation?: string;
  credit?: string;
  copyright?: string;
  url?: string;
  hdurl?: string;
  basic_html?: string;
};

type RawApodList = {
  value?: RawApod[];
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&([a-zA-Z]+);/g, (match, name) => NAMED_ENTITIES[name] ?? match);
}

function stripHtml(html: string): string {
  const normalized = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(normalized)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanExplanation(raw: string): string {
  return stripHtml(raw)
    .replace(/^Explanation:\s*/i, "")
    .replace(/\n*Tomorrow's picture:[\s\S]*$/i, "")
    .trim();
}

function cleanCopyright(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = stripHtml(raw)
    .replace(/^Credit:\s*/i, "")
    .trim();
  return cleaned || undefined;
}

/** Extract a direct media URL (image, mp4, or embed iframe) from apod-basic's HTML when needed. */
function extractMediaUrl(raw: RawApod, mediaType: "image" | "video"): string {
  const html = raw.basic_html ?? "";

  if (mediaType === "video") {
    const videoSrc = html.match(/<video[^>]*>[\s\S]*?<source[^>]+src=["']([^"']+)["']/i)?.[1];
    if (videoSrc) return videoSrc;

    const iframeSrc = html.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1];
    if (iframeSrc) return iframeSrc;
  } else {
    const imgSrc = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    if (imgSrc) return imgSrc;
  }

  return raw.hdurl || raw.url || "";
}

function toApod(raw: RawApod): Apod {
  const mediaType: "image" | "video" = raw.media_type === "video" ? "video" : "image";
  const url = extractMediaUrl(raw, mediaType);
  const copyright = cleanCopyright(raw.copyright || raw.credit);

  return {
    date: raw.date,
    title: decodeEntities(raw.title).trim(),
    explanation: cleanExplanation(raw.explanation ?? ""),
    mediaType,
    url,
    ...(raw.hdurl ? { hdUrl: raw.hdurl } : {}),
    ...(copyright ? { copyright } : {}),
  };
}

/** Convert YYYY-MM-DD to APOD's YYMMDD slug. */
function toApodSlug(date: string): string {
  return `${date.slice(2, 4)}${date.slice(5, 7)}${date.slice(8, 10)}`;
}

async function fetchApodJson<T>(endpoint: string): Promise<T> {
  "use cache";
  cacheLife("hours");

  let res: Response;
  try {
    res = await fetch(endpoint);
  } catch {
    throw new NasaError("Could not reach NASA APOD service", 0);
  }

  if (!res.ok) {
    throw new NasaError(`NASA APOD returned ${res.status}`, res.status);
  }

  return (await res.json()) as T;
}

/** Fetch today's APOD, or a specific YYYY-MM-DD date from science.nasa.gov. */
export async function getApod(date?: string): Promise<Apod> {
  if (date) {
    const raw = await fetchApodJson<RawApod>(`${APOD_BASE_URL}/${toApodSlug(date)}`);
    if (!raw?.date || !raw?.title) {
      throw new NasaError(`No APOD entry found for ${date}`, 404);
    }
    return toApod(raw);
  }

  const list = await fetchApodJson<RawApod[] | RawApodList>(APOD_BASE_URL);
  const latest = Array.isArray(list) ? list[0] : list.value?.[0];
  if (!latest) {
    throw new NasaError("NASA APOD returned an empty list", 502);
  }
  return toApod(latest);
}
