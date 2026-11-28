"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ErrorBanner,
  HeroHeader,
  LoadingPanel,
  MetricCell,
  SectionLabel,
  StatusPill,
  TelemetryPanel,
} from "@/components/ui/ObservatoryPrimitives";
import { fetchApi } from "@/lib/api";
import { useHasHydrated, useHorizonStore } from "@/store/useHorizonStore";
import type { Apod } from "@/types/apod";

const APOD_MIN_DATE = "1995-06-16";

function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftIsoDate(iso: string, deltaDays: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function randomArchiveDate(maxIso: string): string {
  const minMs = Date.parse(`${APOD_MIN_DATE}T00:00:00Z`);
  const maxMs = Date.parse(`${maxIso}T00:00:00Z`);
  const spanDays = Math.max(1, Math.floor((maxMs - minMs) / 86_400_000));
  const offset = Math.floor(Math.random() * spanDays);
  return shiftIsoDate(APOD_MIN_DATE, offset);
}

function renderApodMedia(apod: Apod) {
  if (apod.mediaType === "video") {
    const isDirectVideo = /\.(mp4|webm|mov)(\?|$)/i.test(apod.url);
    if (isDirectVideo) {
      return (
        <video
          src={apod.url}
          controls
          playsInline
          className="h-full min-h-[340px] w-full bg-black object-contain"
        />
      );
    }
    const isEmbeddable = /youtube\.com\/embed|player\.vimeo\.com/i.test(apod.url);
    if (isEmbeddable) {
      return (
        <iframe
          src={apod.url}
          title={apod.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video min-h-[340px] w-full bg-black"
        />
      );
    }
    return (
      <div className="flex min-h-[340px] flex-col items-center justify-center bg-[#060912] p-6 text-center">
        <StatusPill label="EXTERNAL VIDEO STREAM" tone="gold" />
        <p className="mt-3 max-w-sm text-sm text-[#A5B2C4]">
          This APOD dispatch links to an external NASA video broadcast.
        </p>
        <a
          href={apod.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 rounded bg-[#96BEFF] px-4 py-2 font-mono text-[11px] font-semibold tracking-[0.12em] text-[#05080F] uppercase"
        >
          Open Video Broadcast ↗
        </a>
      </div>
    );
  }

  return (
    // APOD images can come from arbitrary external domains not listed in next.config.ts remotePatterns.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={apod.url}
      alt={apod.title}
      className="h-full min-h-[340px] w-full max-h-[580px] object-cover"
    />
  );
}

export function DiscoveriesWorkspace() {
  const hydrated = useHasHydrated();
  const savedDiscoveries = useHorizonStore((s) => s.savedDiscoveries);
  const toggleSavedDiscovery = useHorizonStore((s) => s.toggleSavedDiscovery);

  const [featured, setFeatured] = useState<Apod | null>(null);
  const [recentArchive, setRecentArchive] = useState<Apod[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"archive" | "saved">("archive");
  const [loading, setLoading] = useState<boolean>(true);
  const [archiveLoading, setArchiveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [maxDate, setMaxDate] = useState<string>("2026-11-26");

  const loadRecentFromAnchor = useCallback(async (anchorDate: string) => {
    setArchiveLoading(true);
    const offsets = [-1, -2, -3, -4, -5, -6];
    const candidates = offsets
      .map((off) => shiftIsoDate(anchorDate, off))
      .filter((d) => d >= APOD_MIN_DATE);

    const results = await Promise.allSettled(
      candidates.map((date) => fetchApi<Apod>(`/api/apod?date=${encodeURIComponent(date)}`)),
    );

    const loaded: Apod[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") loaded.push(r.value);
    }
    setRecentArchive((prev) => {
      const merged = new Map<string, Apod>();
      for (const item of [...loaded, ...prev]) {
        merged.set(item.date, item);
      }
      return Array.from(merged.values()).sort((a, b) => b.date.localeCompare(a.date));
    });
    setArchiveLoading(false);
  }, []);

  const loadApod = useCallback(
    async (date?: string) => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = date ? `/api/apod?date=${encodeURIComponent(date)}` : "/api/apod";
        const data = await fetchApi<Apod>(endpoint);
        setFeatured(data);
        setSelectedDate(data.date);
        if (!date) {
          setMaxDate((prev) => (data.date > prev ? data.date : prev));
        }
        setRecentArchive((prev) => {
          const exists = prev.some((p) => p.date === data.date);
          if (exists) return prev;
          return [data, ...prev].sort((a, b) => b.date.localeCompare(a.date));
        });
        if (!date) {
          void loadRecentFromAnchor(data.date);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load Astronomy Picture of the Day.",
        );
      } finally {
        setLoading(false);
      }
    },
    [loadRecentFromAnchor],
  );

  useEffect(() => {
    let active = true;
    const today = todayIsoUtc();
    Promise.resolve().then(() => {
      if (!active) return;
      setMaxDate((prev) => (today > prev ? today : prev));
      void loadApod();
    });
    return () => {
      active = false;
    };
  }, [loadApod]);

  const isSaved = useMemo(() => {
    if (!hydrated || !featured) return false;
    return savedDiscoveries.some((d) => d.date === featured.date);
  }, [hydrated, featured, savedDiscoveries]);

  const displayedCards = useMemo(() => {
    const source = activeTab === "saved" ? (hydrated ? savedDiscoveries : []) : recentArchive;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.explanation.toLowerCase().includes(q) ||
        item.date.includes(q),
    );
  }, [activeTab, hydrated, savedDiscoveries, recentArchive, searchQuery]);

  const handleStepDay = (delta: number) => {
    if (!selectedDate) return;
    const next = shiftIsoDate(selectedDate, delta);
    if (next < APOD_MIN_DATE || next > maxDate) return;
    void loadApod(next);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
      <HeroHeader
        eyebrow="ARCHITECTURE PORTAL 02 // ASTRONOMY PICTURE OF THE DAY"
        titleTop="NASA"
        titleAccent="DAILY DISCOVERIES"
        titleBottom="& RESEARCH"
        subtitle="Direct scientific downlink stream from NASA's Astronomy Picture of the Day archive. Inspect daily deep-space observations, search historical entries back to 1995, and curate your personal research collection."
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label="ARCHIVE: 1995 — PRESENT" tone="blue" />
            <StatusPill label={`${hydrated ? savedDiscoveries.length : 0} SAVED`} tone="gold" />
          </div>
        }
      />

      {/* Archive Date & Search Toolbar */}
      <TelemetryPanel className="mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleStepDay(-1)}
              disabled={!selectedDate || selectedDate <= APOD_MIN_DATE || loading}
              className="rounded border border-white/15 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-[#DCE6F5] uppercase transition hover:border-[#8CB8FF]/50 disabled:opacity-40"
            >
              ← Prev Day
            </button>
            <input
              type="date"
              aria-label="Select APOD Archive Date"
              value={selectedDate}
              min={APOD_MIN_DATE}
              max={maxDate}
              onChange={(e) => {
                if (e.target.value) void loadApod(e.target.value);
              }}
              className="rounded border border-white/15 bg-[#060912] px-3 py-1.5 font-mono text-xs text-white focus:border-[#8CB8FF] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleStepDay(1)}
              disabled={!selectedDate || selectedDate >= maxDate || loading}
              className="rounded border border-white/15 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-[#DCE6F5] uppercase transition hover:border-[#8CB8FF]/50 disabled:opacity-40"
            >
              Next Day →
            </button>
            <button
              type="button"
              onClick={() => void loadApod(randomArchiveDate(maxDate))}
              disabled={loading}
              className="rounded border border-[#DFC99D]/35 bg-[#DFC99D]/10 px-3 py-1.5 font-mono text-[11px] text-[#E8D5AF] uppercase transition hover:bg-[#DFC99D]/20"
            >
              Random Epoch
            </button>
            <button
              type="button"
              onClick={() => void loadApod()}
              disabled={loading}
              className="rounded border border-[#8CB8FF]/35 bg-[#8CB8FF]/12 px-3 py-1.5 font-mono text-[11px] text-[#9EC4FF] uppercase transition hover:bg-[#8CB8FF]/20"
            >
              Latest APOD
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter archive or saved notes..."
              className="w-full rounded border border-white/15 bg-[#060912] px-3 py-1.5 text-xs text-white placeholder:text-[#6B7A90] focus:border-[#8CB8FF] focus:outline-none sm:w-64"
            />
          </div>
        </div>
      </TelemetryPanel>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onRetry={() => void loadApod(selectedDate || undefined)} />
        </div>
      )}

      {/* Featured APOD Hero Split Card (matches Prototype 6) */}
      {loading ? (
        <LoadingPanel height="h-[460px]" lines={6} />
      ) : (
        featured && (
          <TelemetryPanel className="overflow-hidden p-0 sm:p-0">
            <div className="grid lg:grid-cols-12">
              <div className="relative bg-black lg:col-span-7">
                <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
                  <span className="rounded-sm border border-white/15 bg-[#05070C]/85 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-[#E8EDF5] uppercase backdrop-blur-md">
                    ASTRONOMY PICTURE OF THE DAY // {featured.date}
                  </span>
                </div>
                {renderApodMedia(featured)}
              </div>

              <div className="flex flex-col justify-between p-6 sm:p-7 lg:col-span-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <StatusPill
                      label={featured.mediaType === "video" ? "VIDEO STREAM" : "OPTICAL / IR FRAME"}
                      tone="blue"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSavedDiscovery(featured)}
                      className={`rounded border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] uppercase transition ${
                        isSaved
                          ? "border-[#DFC99D] bg-[#DFC99D]/20 text-[#DFC99D]"
                          : "border-white/15 bg-white/[0.04] text-[#9AA7B9] hover:border-white/35 hover:text-white"
                      }`}
                    >
                      {isSaved ? "★ Saved" : "☆ Save Discovery"}
                    </button>
                  </div>

                  <h2 className="mt-4 font-serif text-3xl leading-tight font-medium text-[#F5F1E8]">
                    {featured.title}
                  </h2>

                  <p className="mt-4 max-h-60 overflow-y-auto pr-1 text-sm leading-relaxed text-[#AAB6C8]">
                    {featured.explanation}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2.5">
                    <MetricCell label="Observation Date" value={featured.date} highlight />
                    <MetricCell
                      label="Credit / Attribution"
                      value={
                        featured.copyright ? featured.copyright.slice(0, 26) : "NASA Public Domain"
                      }
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-white/[0.08] pt-4">
                  <a
                    href={featured.hdUrl || featured.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center rounded bg-[#96BEFF] px-4 py-2.5 font-mono text-[11px] font-semibold tracking-[0.12em] text-[#05080F] uppercase transition hover:bg-[#B2D0FF]"
                  >
                    Explore HD Source ↗
                  </a>
                </div>
              </div>
            </div>
          </TelemetryPanel>
        )
      )}

      {/* Archive / Saved Collection Tabs */}
      <section className="mt-12">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <SectionLabel
            eyebrow="OBSERVATIONAL LOGS // CURATED ARCHIVE"
            title={
              activeTab === "archive" ? "Recent Daily Breakthroughs" : "Saved Favourites Collection"
            }
          />
          <div className="flex items-center gap-1.5 self-start rounded border border-white/10 bg-[#080C15] p-1">
            <button
              type="button"
              onClick={() => setActiveTab("archive")}
              className={`rounded px-3 py-1 font-mono text-[10px] tracking-[0.12em] uppercase transition ${
                activeTab === "archive"
                  ? "bg-[#8CB8FF] font-semibold text-[#05080F]"
                  : "text-[#8A97AA] hover:text-white"
              }`}
            >
              Recent Feed ({recentArchive.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={`rounded px-3 py-1 font-mono text-[10px] tracking-[0.12em] uppercase transition ${
                activeTab === "saved"
                  ? "bg-[#DFC99D] font-semibold text-[#05080F]"
                  : "text-[#8A97AA] hover:text-white"
              }`}
            >
              Saved Collection ({hydrated ? savedDiscoveries.length : 0})
            </button>
          </div>
        </div>

        {archiveLoading && recentArchive.length <= 1 ? (
          <div className="grid gap-5 md:grid-cols-2">
            <LoadingPanel height="h-72" lines={3} />
            <LoadingPanel height="h-72" lines={3} />
          </div>
        ) : displayedCards.length === 0 ? (
          <TelemetryPanel>
            <p className="py-6 text-center text-sm text-[#8A97AA]">
              {activeTab === "saved"
                ? "No discoveries saved yet. Click '☆ Save Discovery' on any APOD entry to build your research dossier."
                : "No archive entries match your filter."}
            </p>
          </TelemetryPanel>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {displayedCards.map((item) => {
              const itemSaved = hydrated && savedDiscoveries.some((d) => d.date === item.date);
              return (
                <TelemetryPanel
                  key={item.date}
                  className="observatory-panel-hover flex flex-col justify-between overflow-hidden p-0 sm:p-0"
                >
                  <div>
                    <div className="relative h-52 w-full overflow-hidden bg-black">
                      {item.mediaType === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.url}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-500 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-[#060912]">
                          <StatusPill label="VIDEO ENTRY" tone="gold" />
                        </div>
                      )}
                      <span className="absolute top-3 left-3 rounded-sm border border-white/15 bg-[#05070C]/80 px-2 py-0.5 font-mono text-[10px] text-[#DCE6F5] backdrop-blur-md">
                        {item.date}
                      </span>
                    </div>

                    <div className="p-5">
                      <h3 className="font-serif text-xl font-medium text-[#F2EEE5]">
                        {item.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#95A3B7]">
                        {item.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSavedDiscovery(item)}
                      className="font-mono text-[10px] tracking-[0.12em] text-[#DFC99D] uppercase hover:underline"
                    >
                      {itemSaved ? "★ Saved" : "☆ Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFeatured(item);
                        setSelectedDate(item.date);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="font-mono text-[10px] tracking-[0.14em] text-[#8CB8FF] uppercase hover:underline"
                    >
                      Inspect Dossier →
                    </button>
                  </div>
                </TelemetryPanel>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
