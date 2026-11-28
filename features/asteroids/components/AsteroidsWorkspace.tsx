"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ErrorBanner,
  HeroHeader,
  LoadingPanel,
  MetricCell,
  StatusPill,
  TelemetryPanel,
} from "@/components/ui/ObservatoryPrimitives";
import { fetchApi } from "@/lib/api";
import { useHasHydrated, useHorizonStore } from "@/store/useHorizonStore";
import type { Asteroid } from "@/types/asteroid";

function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysUtc(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function hashAngle(id: string, index: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 360;
  }
  return ((h + index * 29) % 360) * (Math.PI / 180);
}

export function AsteroidsWorkspace() {
  const hydrated = useHasHydrated();
  const watchedAsteroids = useHorizonStore((s) => s.watchedAsteroids);
  const toggleWatchedAsteroid = useHorizonStore((s) => s.toggleWatchedAsteroid);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [radarMode, setRadarMode] = useState<"ecliptic" | "vector">("ecliptic");
  const [hazardOnly, setHazardOnly] = useState(false);
  const [watchedOnly, setWatchedOnly] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<"distance" | "date" | "velocity" | "diameter">("distance");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAsteroids = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi<Asteroid[]>(
        `/api/asteroids?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
      );
      setAsteroids(data);
      if (data.length > 0) {
        const nearest = [...data].sort((a, b) => a.missDistanceKm - b.missDistanceKm)[0];
        setSelectedId(nearest.id);
      } else {
        setSelectedId("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load NASA NeoWs asteroid feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const today = todayIsoUtc();
    const end = addDaysUtc(today, 6);
    Promise.resolve().then(() => {
      if (!active) return;
      setStartDate(today);
      setEndDate(end);
      void loadAsteroids(today, end);
    });
    return () => {
      active = false;
    };
  }, [loadAsteroids]);

  const filteredAsteroids = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const list = asteroids.filter((a) => {
      if (hazardOnly && !a.isPotentiallyHazardous) return false;
      if (watchedOnly && hydrated && !watchedAsteroids.includes(a.id)) return false;
      if (q && !a.name.toLowerCase().includes(q) && !a.closeApproachDate.includes(q)) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "distance") return a.missDistanceKm - b.missDistanceKm;
      if (sortBy === "velocity") return b.velocityKmPerSec - a.velocityKmPerSec;
      if (sortBy === "diameter") return b.diameterKm.max - a.diameterKm.max;
      return a.closeApproachDate.localeCompare(b.closeApproachDate);
    });
  }, [asteroids, hazardOnly, watchedOnly, hydrated, watchedAsteroids, searchText, sortBy]);

  const selectedAsteroid = useMemo(() => {
    return (
      asteroids.find((a) => a.id === selectedId) ?? filteredAsteroids[0] ?? asteroids[0] ?? null
    );
  }, [asteroids, filteredAsteroids, selectedId]);

  const hazardousCount = useMemo(
    () => asteroids.filter((a) => a.isPotentiallyHazardous).length,
    [asteroids],
  );

  const velocityChartData = useMemo(() => {
    return [...asteroids]
      .sort((a, b) => a.missDistanceKm - b.missDistanceKm)
      .slice(0, 10)
      .map((a) => ({
        name: a.name.replace(/[()]/g, "").slice(0, 10),
        velocity: a.velocityKmPerSec,
        hazardous: a.isPotentiallyHazardous,
        id: a.id,
      }));
  }, [asteroids]);

  const applyRange = (e: React.FormEvent) => {
    e.preventDefault();
    void loadAsteroids(startDate, endDate);
  };

  const applyPreset = (offsetDays: number) => {
    const base = todayIsoUtc();
    const s = addDaysUtc(base, offsetDays);
    const e = addDaysUtc(s, 6);
    setStartDate(s);
    setEndDate(e);
    void loadAsteroids(s, e);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
      <HeroHeader
        eyebrow="ARCHITECTURE PORTAL 03 // NASA NEOWS INTERCEPT TELEMETRY"
        titleTop="DEEP SPACE"
        titleAccent="OBSERVATORY"
        subtitle="Real-time near-Earth object (NEO) trajectory monitoring powered by NASA's NeoWs feed. Inspect lunar miss distances, kinetic velocities, diameter estimates, and potentially hazardous classifications."
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={`${asteroids.length} CATALOGED NEOs`} tone="blue" />
            <StatusPill
              label={`${hazardousCount} POTENTIALLY HAZARDOUS`}
              tone={hazardousCount > 0 ? "danger" : "emerald"}
            />
          </div>
        }
      />

      {/* Date Range Window Selector (7-day max enforced by backend) */}
      <TelemetryPanel className="mb-6">
        <form
          onSubmit={applyRange}
          className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="neo-start"
                className="block font-mono text-[9px] tracking-[0.15em] text-[#78879C] uppercase"
              >
                Window Start (UTC)
              </label>
              <input
                id="neo-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 rounded border border-white/15 bg-[#060912] px-3 py-1.5 font-mono text-xs text-white focus:border-[#8CB8FF] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="neo-end"
                className="block font-mono text-[9px] tracking-[0.15em] text-[#78879C] uppercase"
              >
                Window End (Max 7 Days)
              </label>
              <input
                id="neo-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 rounded border border-white/15 bg-[#060912] px-3 py-1.5 font-mono text-xs text-white focus:border-[#8CB8FF] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-[#96BEFF] px-4 py-1.5 font-mono text-[11px] font-semibold tracking-[0.12em] text-[#05080F] uppercase transition hover:bg-[#B2D0FF] disabled:opacity-50"
            >
              Scan Window
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => applyPreset(-7)}
              className="rounded border border-white/12 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-[#B7C4D6] uppercase hover:border-[#8CB8FF]/45"
            >
              Past 7d
            </button>
            <button
              type="button"
              onClick={() => applyPreset(0)}
              className="rounded border border-[#8CB8FF]/35 bg-[#8CB8FF]/12 px-2.5 py-1 font-mono text-[10px] text-[#9EC4FF] uppercase hover:bg-[#8CB8FF]/20"
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => applyPreset(7)}
              className="rounded border border-white/12 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-[#B7C4D6] uppercase hover:border-[#8CB8FF]/45"
            >
              Next 7d
            </button>
          </div>
        </form>
      </TelemetryPanel>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onRetry={() => void loadAsteroids(startDate, endDate)} />
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <LoadingPanel height="h-[460px]" lines={5} />
          </div>
          <div className="lg:col-span-4">
            <LoadingPanel height="h-[460px]" lines={5} />
          </div>
        </div>
      ) : (
        <>
          {/* Top Bento Grid (matches Prototype 5) */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: Geo-Centric Intercept Radar */}
            <div className="lg:col-span-8">
              <TelemetryPanel className="h-full">
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#8CB8FF] shadow-[0_0_8px_#8CB8FF]" />
                    <h2 className="font-mono text-xs font-semibold tracking-[0.16em] text-[#E8EDF5] uppercase">
                      SOLAR SYSTEM GEO-CENTRIC INTERCEPT RADAR
                    </h2>
                  </div>

                  <div className="flex items-center gap-1 rounded border border-white/10 bg-[#060912] p-0.5">
                    <button
                      type="button"
                      onClick={() => setRadarMode("ecliptic")}
                      className={`rounded px-2.5 py-1 font-mono text-[10px] uppercase transition ${
                        radarMode === "ecliptic"
                          ? "bg-[#8CB8FF] font-semibold text-[#05080F]"
                          : "text-[#8A97AA] hover:text-white"
                      }`}
                    >
                      2D Ecliptic
                    </button>
                    <button
                      type="button"
                      onClick={() => setRadarMode("vector")}
                      className={`rounded px-2.5 py-1 font-mono text-[10px] uppercase transition ${
                        radarMode === "vector"
                          ? "bg-[#8CB8FF] font-semibold text-[#05080F]"
                          : "text-[#8A97AA] hover:text-white"
                      }`}
                    >
                      Vector Plot
                    </button>
                  </div>
                </div>

                {/* Radar Canvas */}
                <div className="relative overflow-hidden rounded border border-white/[0.08] bg-[#04070E] p-4 observatory-grid-bg">
                  {/* Active Target HUD */}
                  {selectedAsteroid && (
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded border border-white/[0.07] bg-[#080D18]/85 px-3 py-2">
                      <div>
                        <div className="font-mono text-[9px] tracking-[0.15em] text-[#7D8C9F] uppercase">
                          ACTIVE TARGET ACQUISITION
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-white">
                            {selectedAsteroid.name}
                          </span>
                          <StatusPill
                            label={
                              selectedAsteroid.isPotentiallyHazardous ? "HAZARDOUS" : "NOMINAL"
                            }
                            tone={selectedAsteroid.isPotentiallyHazardous ? "danger" : "blue"}
                          />
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-[9px] tracking-[0.14em] text-[#7D8C9F] uppercase">
                          CLOSEST APPROACH EPOCH
                        </div>
                        <div className="text-xs text-[#DFC99D]">
                          {selectedAsteroid.closeApproachDate}
                        </div>
                      </div>
                    </div>
                  )}

                  {radarMode === "ecliptic" ? (
                    <div className="flex justify-center py-2">
                      <svg
                        viewBox="-220 -160 440 320"
                        className="h-[290px] w-full max-w-[560px]"
                        role="img"
                        aria-label="Geo-centric asteroid proximity radar"
                      >
                        {/* Concentric Lunar Distance Rings */}
                        {[36, 72, 110, 148].map((r, idx) => (
                          <circle
                            key={r}
                            cx={0}
                            cy={0}
                            r={r}
                            fill="none"
                            stroke={idx === 0 ? "rgba(223,201,157,0.38)" : "rgba(140,184,255,0.14)"}
                            strokeDasharray={idx === 0 ? "3 3" : "2 4"}
                            strokeWidth={1}
                          />
                        ))}

                        {/* Crosshairs */}
                        <line x1={-190} y1={0} x2={190} y2={0} stroke="rgba(255,255,255,0.06)" />
                        <line x1={0} y1={-150} x2={0} y2={150} stroke="rgba(255,255,255,0.06)" />

                        {/* Subtle Rotating Radar Sweep */}
                        <g className="animate-radar-sweep">
                          <path
                            d="M 0 0 L 148 -28 A 150 150 0 0 1 148 28 Z"
                            fill="rgba(140,184,255,0.06)"
                          />
                          <line
                            x1={0}
                            y1={0}
                            x2={148}
                            y2={0}
                            stroke="rgba(140,184,255,0.35)"
                            strokeWidth={1}
                          />
                        </g>

                        {/* Earth Center */}
                        <circle
                          cx={0}
                          cy={0}
                          r={8}
                          fill="#2F6FDB"
                          stroke="#9EC4FF"
                          strokeWidth={1.5}
                        />
                        <text x={12} y={4} fill="#9EC4FF" fontSize="8" fontFamily="monospace">
                          EARTH
                        </text>

                        {/* Ring Labels */}
                        <text x={38} y={-4} fill="#DFC99D" fontSize="7.5" fontFamily="monospace">
                          1 LD
                        </text>
                        <text x={74} y={-4} fill="#6F8098" fontSize="7.5" fontFamily="monospace">
                          15 LD
                        </text>
                        <text x={112} y={-4} fill="#6F8098" fontSize="7.5" fontFamily="monospace">
                          40 LD
                        </text>
                        <text x={150} y={-4} fill="#6F8098" fontSize="7.5" fontFamily="monospace">
                          100+ LD
                        </text>

                        {/* Asteroid Blips */}
                        {asteroids.slice(0, 32).map((neo, idx) => {
                          const angle = hashAngle(neo.id, idx);
                          // Log-ish radial mapping so close approaches (1-20 LD) and distant ones (100+ LD) both fit nicely
                          const normR = Math.min(
                            146,
                            24 + (Math.log10(Math.max(0.5, neo.missDistanceLunar) + 1) / 2.3) * 120,
                          );
                          const x = Math.cos(angle) * normR;
                          const y = Math.sin(angle) * normR;
                          const isSelected = selectedAsteroid?.id === neo.id;
                          const color = neo.isPotentiallyHazardous ? "#FB7185" : "#8CB8FF";

                          return (
                            <g
                              key={neo.id}
                              className="cursor-pointer"
                              onClick={() => setSelectedId(neo.id)}
                            >
                              {isSelected && (
                                <>
                                  <line
                                    x1={0}
                                    y1={0}
                                    x2={x}
                                    y2={y}
                                    stroke="rgba(223,201,157,0.45)"
                                    strokeDasharray="3 3"
                                  />
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r={9}
                                    fill="none"
                                    stroke="#DFC99D"
                                    strokeWidth={1.2}
                                  />
                                </>
                              )}
                              <circle
                                cx={x}
                                cy={y}
                                r={isSelected ? 4.8 : 3.4}
                                fill={color}
                                opacity={isSelected ? 1 : 0.85}
                              />
                              {isSelected && (
                                <text
                                  x={x + 11}
                                  y={y + 3}
                                  fill="#F4F7FC"
                                  fontSize="8.5"
                                  fontFamily="monospace"
                                >
                                  {neo.name}
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  ) : (
                    <div className="h-[290px] w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={velocityChartData}>
                          <XAxis dataKey="name" stroke="#6F7E93" fontSize={10} tickLine={false} />
                          <YAxis stroke="#6F7E93" fontSize={10} tickLine={false} unit=" km/s" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#080C15",
                              border: "1px solid rgba(255,255,255,0.14)",
                              fontSize: "11px",
                              color: "#E8EDF5",
                            }}
                          />
                          <Bar dataKey="velocity" name="Rel. Velocity (km/s)" radius={[3, 3, 0, 0]}>
                            {velocityChartData.map((entry) => (
                              <Cell
                                key={entry.id}
                                fill={entry.hazardous ? "#FB7185" : "#8CB8FF"}
                                className="cursor-pointer"
                                onClick={() => setSelectedId(entry.id)}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Bottom Telemetry Strip */}
                  {selectedAsteroid && (
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-3">
                      <div>
                        <div className="font-mono text-[9px] text-[#708096] uppercase">
                          MISS DISTANCE
                        </div>
                        <div className="font-mono text-xs font-semibold text-white">
                          {selectedAsteroid.missDistanceKm.toLocaleString("en-US")} km
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[9px] text-[#708096] uppercase">
                          LUNAR EQUIVALENT
                        </div>
                        <div className="font-mono text-xs font-semibold text-[#DFC99D]">
                          {selectedAsteroid.missDistanceLunar} LD
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[9px] text-[#708096] uppercase">
                          RELATIVE VELOCITY
                        </div>
                        <div className="font-mono text-xs font-semibold text-[#8CB8FF]">
                          {selectedAsteroid.velocityKmPerSec} km/s
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TelemetryPanel>
            </div>

            {/* Right Column: Physical Parameters & Defense Risk */}
            <div className="flex flex-col gap-6 lg:col-span-4">
              {selectedAsteroid && (
                <>
                  <TelemetryPanel>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-mono text-xs font-semibold tracking-[0.14em] text-[#E8EDF5] uppercase">
                        PHYSICAL PARAMETERS
                      </h3>
                      <span className="font-mono text-[9px] text-[#6E7E94]">
                        ID: {selectedAsteroid.id}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <MetricCell
                        label="Min Diameter"
                        value={`${selectedAsteroid.diameterKm.min} km`}
                      />
                      <MetricCell
                        label="Max Diameter"
                        value={`${selectedAsteroid.diameterKm.max} km`}
                        highlight
                      />
                      <MetricCell
                        label="Velocity (km/s)"
                        value={`${selectedAsteroid.velocityKmPerSec} km/s`}
                        sub={`${Math.round(selectedAsteroid.velocityKmPerSec * 3600).toLocaleString("en-US")} km/h`}
                      />
                      <MetricCell
                        label="Lunar Distance"
                        value={`${selectedAsteroid.missDistanceLunar} LD`}
                        sub="1 LD ≈ 384,400 km"
                      />
                    </div>
                  </TelemetryPanel>

                  <TelemetryPanel className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-mono text-xs font-semibold tracking-[0.14em] text-[#E8EDF5] uppercase">
                          DEFENSE &amp; IMPACT RISK
                        </h3>
                        <StatusPill
                          label={selectedAsteroid.isPotentiallyHazardous ? "PHA ALERT" : "NOMINAL"}
                          tone={selectedAsteroid.isPotentiallyHazardous ? "danger" : "emerald"}
                        />
                      </div>
                      <div className="space-y-2.5 rounded border border-white/[0.07] bg-[#060A12] p-3.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#78879C]">PHA Classification:</span>
                          <span
                            className={
                              selectedAsteroid.isPotentiallyHazardous
                                ? "font-semibold text-rose-300"
                                : "text-emerald-300"
                            }
                          >
                            {selectedAsteroid.isPotentiallyHazardous
                              ? "Potentially Hazardous"
                              : "Non-Hazardous"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#78879C]">Approach Date:</span>
                          <span className="font-mono text-white">
                            {selectedAsteroid.closeApproachDate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#78879C]">Miss Distance:</span>
                          <span className="font-mono text-[#8CB8FF]">
                            {selectedAsteroid.missDistanceKm.toLocaleString("en-US")} km
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => toggleWatchedAsteroid(selectedAsteroid.id)}
                        className={`w-full rounded border px-3 py-2 font-mono text-[10px] tracking-[0.12em] uppercase transition ${
                          hydrated && watchedAsteroids.includes(selectedAsteroid.id)
                            ? "border-[#DFC99D] bg-[#DFC99D]/18 text-[#DFC99D]"
                            : "border-white/15 bg-white/[0.04] text-[#C5D0E0] hover:border-white/35"
                        }`}
                      >
                        {hydrated && watchedAsteroids.includes(selectedAsteroid.id)
                          ? "★ Tracked in Watchlist"
                          : "☆ Add to Watchlist"}
                      </button>
                      <a
                        href={selectedAsteroid.nasaJplUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center rounded bg-[#96BEFF] px-4 py-2 font-mono text-[11px] font-semibold tracking-[0.12em] text-[#05080F] uppercase transition hover:bg-[#B2D0FF]"
                      >
                        Inspect JPL Orbital Data ↗
                      </a>
                    </div>
                  </TelemetryPanel>
                </>
              )}
            </div>
          </div>

          {/* Near-Earth Objects Approach Timeline Table */}
          <section className="mt-10">
            <TelemetryPanel>
              <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.16em] text-[#7D8C9F] uppercase">
                    NEAR-EARTH OBJECTS APPROACH TIMELINE
                  </div>
                  <p className="mt-0.5 text-xs text-[#8A97AA]">
                    Showing {filteredAsteroids.length} of {asteroids.length} objects in window{" "}
                    {startDate} → {endDate}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Filter designation..."
                    className="rounded border border-white/15 bg-[#060912] px-3 py-1.5 text-xs text-white placeholder:text-[#6B7A90] focus:border-[#8CB8FF] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setHazardOnly((v) => !v)}
                    className={`rounded border px-2.5 py-1.5 font-mono text-[10px] uppercase transition ${
                      hazardOnly
                        ? "border-rose-400/50 bg-rose-500/18 text-rose-200"
                        : "border-white/15 text-[#98A6B8] hover:text-white"
                    }`}
                  >
                    Hazardous Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setWatchedOnly((v) => !v)}
                    className={`rounded border px-2.5 py-1.5 font-mono text-[10px] uppercase transition ${
                      watchedOnly
                        ? "border-[#DFC99D]/50 bg-[#DFC99D]/18 text-[#DFC99D]"
                        : "border-white/15 text-[#98A6B8] hover:text-white"
                    }`}
                  >
                    Watchlist ({hydrated ? watchedAsteroids.length : 0})
                  </button>
                  <select
                    aria-label="Sort asteroids"
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "distance" | "date" | "velocity" | "diameter")
                    }
                    className="rounded border border-white/15 bg-[#060912] px-2.5 py-1.5 font-mono text-[10px] text-white uppercase focus:border-[#8CB8FF] focus:outline-none"
                  >
                    <option value="distance">Sort: Closest</option>
                    <option value="date">Sort: Date</option>
                    <option value="velocity">Sort: Fastest</option>
                    <option value="diameter">Sort: Largest</option>
                  </select>
                </div>
              </div>

              {filteredAsteroids.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#8A97AA]">
                  No near-Earth objects match your active filters.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[10px] tracking-[0.14em] text-[#6F7E93] uppercase">
                        <th className="py-2.5 pr-4 font-medium">Designation</th>
                        <th className="py-2.5 pr-4 font-medium">Close Approach</th>
                        <th className="py-2.5 pr-4 font-medium">Miss Distance</th>
                        <th className="py-2.5 pr-4 font-medium">Rel. Velocity</th>
                        <th className="py-2.5 pr-4 font-medium">Est. Diameter</th>
                        <th className="py-2.5 pr-4 font-medium">Defense Status</th>
                        <th className="py-2.5 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {filteredAsteroids.map((a) => {
                        const active = selectedAsteroid?.id === a.id;
                        return (
                          <tr
                            key={a.id}
                            onClick={() => setSelectedId(a.id)}
                            className={`cursor-pointer transition ${
                              active ? "bg-[#8CB8FF]/10" : "hover:bg-white/[0.025]"
                            }`}
                          >
                            <td className="py-3 pr-4 font-medium text-white">
                              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#8CB8FF]" />
                              {a.name}
                            </td>
                            <td className="py-3 pr-4 tabular-nums text-[#B4C0D2]">
                              {a.closeApproachDate}
                            </td>
                            <td className="py-3 pr-4 tabular-nums text-[#B4C0D2]">
                              {a.missDistanceKm.toLocaleString("en-US")} km{" "}
                              <span className="text-[#78879C]">({a.missDistanceLunar} LD)</span>
                            </td>
                            <td className="py-3 pr-4 tabular-nums text-[#B4C0D2]">
                              {a.velocityKmPerSec} km/s
                            </td>
                            <td className="py-3 pr-4 tabular-nums text-[#B4C0D2]">
                              {a.diameterKm.min} – {a.diameterKm.max} km
                            </td>
                            <td className="py-3 pr-4">
                              <StatusPill
                                label={a.isPotentiallyHazardous ? "Hazardous" : "Nominal"}
                                tone={a.isPotentiallyHazardous ? "danger" : "emerald"}
                              />
                            </td>
                            <td className="py-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(a.id);
                                    window.scrollTo({ top: 140, behavior: "smooth" });
                                  }}
                                  className="rounded border border-[#8CB8FF]/35 bg-[#8CB8FF]/12 px-2 py-1 text-[10px] text-[#9EC4FF] uppercase hover:bg-[#8CB8FF]/25"
                                >
                                  Focus
                                </button>
                                <a
                                  href={a.nasaJplUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] text-[#8A97AA] uppercase hover:text-white"
                                >
                                  JPL ↗
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TelemetryPanel>
          </section>
        </>
      )}
    </main>
  );
}
