"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ErrorBanner,
  HeroHeader,
  LoadingPanel,
  MetricCell,
  SectionLabel,
  StatusPill,
  TelemetryPanel,
} from "@/components/ui/ObservatoryPrimitives";
import { fetchApi, fetchApiWithHeaders } from "@/lib/api";
import { useHasHydrated, useHorizonStore } from "@/store/useHorizonStore";
import type { Exoplanet } from "@/types/exoplanet";

function estimateEsi(p: Exoplanet): number {
  const r = p.radiusEarth ?? 1.2;
  const t = p.equilibriumTempK ?? 255;
  const rScore = 1 - Math.min(0.9, Math.abs(r - 1) / (r + 1));
  const tScore = 1 - Math.min(0.9, Math.abs(t - 255) / (t + 255));
  return Number(((rScore * 0.45 + tScore * 0.55) * 0.98).toFixed(2));
}

function planetOrbGradient(p: Exoplanet): string {
  const t = p.equilibriumTempK ?? 300;
  if (p.inHabitableZone) {
    return "radial-gradient(circle at 32% 30%, #6FB3FF 0%, #245B9E 45%, #0D203D 82%, #050912 100%)";
  }
  if (t > 900) {
    return "radial-gradient(circle at 32% 30%, #FFB06B 0%, #B83A1E 48%, #3B100A 84%, #080507 100%)";
  }
  if ((p.radiusEarth ?? 1) > 4) {
    return "radial-gradient(circle at 32% 30%, #E7C896 0%, #9E7342 48%, #3C2814 84%, #090706 100%)";
  }
  return "radial-gradient(circle at 32% 30%, #D47A6A 0%, #7C2B2B 48%, #290E14 84%, #07050A 100%)";
}

export function ExoplanetsWorkspace() {
  const hydrated = useHasHydrated();
  const savedExoplanets = useHorizonStore((s) => s.savedExoplanets);
  const toggleSavedExoplanet = useHorizonStore((s) => s.toggleSavedExoplanet);

  const [planets, setPlanets] = useState<Exoplanet[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedId, setSelectedId] = useState<string>("trappist-1-e");
  const [selectedDetail, setSelectedDetail] = useState<Exoplanet | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "habitable" | "saved">("all");
  const [sortBy, setSortBy] = useState<"distance" | "radius" | "mass" | "year">("distance");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadExoplanets = useCallback(async (q = "") => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = q.trim()
        ? `/api/exoplanets?q=${encodeURIComponent(q.trim())}`
        : "/api/exoplanets";
      const { data, headers } = await fetchApiWithHeaders<Exoplanet[]>(endpoint);
      setPlanets(data);
      const headerTotal = Number(headers.get("X-Total-Count"));
      setTotalCount(Number.isFinite(headerTotal) && headerTotal > 0 ? headerTotal : data.length);
      if (data.length > 0) {
        setSelectedId((prev) => (data.some((p) => p.id === prev) ? prev : data[0].id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exoplanet catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchApiWithHeaders<Exoplanet[]>("/api/exoplanets")
      .then(({ data, headers }) => {
        if (!active) return;
        setPlanets(data);
        const headerTotal = Number(headers.get("X-Total-Count"));
        setTotalCount(Number.isFinite(headerTotal) && headerTotal > 0 ? headerTotal : data.length);
        if (data.length > 0) {
          setSelectedId((prev) => (data.some((p) => p.id === prev) ? prev : data[0].id));
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load exoplanet catalog.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetchApi<Exoplanet>(`/api/exoplanets/${encodeURIComponent(selectedId)}`)
      .then(setSelectedDetail)
      .catch(() => {
        const fallback = planets.find((p) => p.id === selectedId) ?? null;
        setSelectedDetail(fallback);
      });
  }, [selectedId, planets]);

  const featured = useMemo(() => {
    return (
      selectedDetail ??
      planets.find((p) => p.id === selectedId) ??
      planets[0] ??
      null
    );
  }, [selectedDetail, planets, selectedId]);

  const filteredPlanets = useMemo(() => {
    let list = activeTab === "saved" ? (hydrated ? savedExoplanets : []) : planets;
    if (activeTab === "habitable") {
      list = list.filter((p) => Boolean(p.inHabitableZone));
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.hostStar.name.toLowerCase().includes(q) ||
          p.highlight.toLowerCase().includes(q) ||
          p.discoveryMethod.toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === "distance") {
        return (a.hostStar.distanceLy ?? 99999) - (b.hostStar.distanceLy ?? 99999);
      }
      if (sortBy === "radius") {
        return (b.radiusEarth ?? 0) - (a.radiusEarth ?? 0);
      }
      if (sortBy === "mass") {
        return (b.massEarth ?? 0) - (a.massEarth ?? 0);
      }
      return b.discoveryYear - a.discoveryYear;
    });
  }, [activeTab, hydrated, savedExoplanets, planets, searchQuery, sortBy]);

  const habitableCount = useMemo(
    () => planets.filter((p) => Boolean(p.inHabitableZone)).length,
    [planets],
  );

  // Multi-planet systems grouped from backend data
  const starSystems = useMemo(() => {
    const map = new Map<string, Exoplanet[]>();
    for (const p of planets) {
      const key = p.hostStar.name;
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .map(([starName, worlds]) => ({
        starName,
        hostStar: worlds[0].hostStar,
        worlds: [...worlds].sort(
          (a, b) => (a.semiMajorAxisAu ?? 99) - (b.semiMajorAxisAu ?? 99),
        ),
      }))
      .sort((a, b) => b.worlds.length - a.worlds.length)
      .slice(0, 5);
  }, [planets]);

  // Comparative morphology benchmarks
  const morphologyClusters = useMemo(() => {
    const rocky =
      planets.find((p) => p.id === "trappist-1-e") ??
      planets.find((p) => (p.radiusEarth ?? 9) <= 1.5) ??
      planets[0];
    const hotJupiter =
      planets.find((p) => (p.radiusEarth ?? 0) >= 8 && (p.equilibriumTempK ?? 0) >= 800) ??
      planets.find((p) => (p.radiusEarth ?? 0) >= 8) ??
      planets[1];
    const subNeptune =
      planets.find(
        (p) => (p.radiusEarth ?? 0) > 1.5 && (p.radiusEarth ?? 0) < 5 && p.inHabitableZone,
      ) ??
      planets.find((p) => (p.radiusEarth ?? 0) > 1.5 && (p.radiusEarth ?? 0) < 5) ??
      planets[2];
    return { rocky, hotJupiter, subNeptune };
  }, [planets]);

  // Temperature & insolation chart across featured/nearest worlds
  const spectrumChartData = useMemo(() => {
    return [...planets]
      .filter((p) => typeof p.equilibriumTempK === "number")
      .slice(0, 12)
      .map((p) => ({
        name: p.name.length > 12 ? p.name.slice(0, 12) : p.name,
        tempK: p.equilibriumTempK ?? 0,
        radius: p.radiusEarth ?? 1,
      }));
  }, [planets]);

  const isFeaturedSaved = useMemo(() => {
    if (!hydrated || !featured) return false;
    return savedExoplanets.some((p) => p.id === featured.id);
  }, [hydrated, featured, savedExoplanets]);

  const handleExportTelemetry = () => {
    if (!featured) return;
    const blob = new Blob([JSON.stringify(featured, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${featured.id}-telemetry.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
      <HeroHeader
        eyebrow="ARCHITECTURE PORTAL 05 // DEEP HORIZON ARCHIVE"
        titleTop="BEYOND OUR"
        titleAccent="SOLAR SYSTEM"
        subtitle="Direct scientific downlink stream from the NASA Exoplanet Archive. Inspect confirmed extrasolar worlds, habitable-zone candidates, host star spectral classes, and multi-planet orbital architectures."
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={`${totalCount || planets.length} CONFIRMED WORLDS`} tone="blue" />
            <StatusPill label={`${habitableCount} HABITABLE ZONE`} tone="emerald" />
          </div>
        }
      />

      {error && <ErrorBanner message={error} onRetry={() => void loadExoplanets(searchQuery)} />}

      {loading && planets.length === 0 ? (
        <LoadingPanel lines={5} height="h-64" />
      ) : null}

      {/* Featured Exoplanet Telemetry & Visual Dossier */}
      {featured && (
        <section className="grid gap-6 lg:grid-cols-12">
          <TelemetryPanel className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <StatusPill label="LOCKED EPHEMERIS" tone="blue" />
                <StatusPill
                  label={featured.inHabitableZone ? "HABITABLE ZONE CANDIDATE" : "EXTRASOLAR WORLD"}
                  tone={featured.inHabitableZone ? "emerald" : "gold"}
                />
              </div>

              {/* Procedural Exoplanet Orb Render */}
              <div className="relative mt-4 flex h-56 items-center justify-center overflow-hidden rounded border border-white/[0.08] bg-[#04060B]">
                <div
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 50% 50%, rgba(140,184,255,0.22) 0%, transparent 65%)",
                  }}
                />
                <div
                  className="relative h-32 w-32 rounded-full shadow-[0_0_50px_rgba(140,184,255,0.25)] transition-all duration-500"
                  style={{ background: planetOrbGradient(featured) }}
                >
                  {featured.inHabitableZone && (
                    <div className="absolute -inset-4 rounded-full border border-dashed border-emerald-400/40" />
                  )}
                </div>
                <div className="absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.14em] text-[#8CB8FF] uppercase">
                  TARGET // {featured.name}
                </div>
                <div className="absolute right-3 bottom-3 rounded border border-[#8CB8FF]/40 bg-[#0A1324]/90 px-2.5 py-1 font-mono text-[10px] text-[#8CB8FF]">
                  ESI {estimateEsi(featured)}
                </div>
              </div>

              <h2 className="mt-4 text-2xl font-medium text-[#EFF4FC]">{featured.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#9AA6B8]">{featured.highlight}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => toggleSavedExoplanet(featured)}
                className={`flex-1 rounded px-4 py-2.5 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase transition ${
                  isFeaturedSaved
                    ? "border border-[#DFC99D]/60 bg-[#DFC99D]/15 text-[#DFC99D]"
                    : "bg-[#96BEFF] text-[#05080F] hover:bg-[#B2D0FF]"
                }`}
              >
                {isFeaturedSaved ? "Saved in Research Log ★" : "Save Exoplanet Dossier"}
              </button>
              <button
                type="button"
                onClick={handleExportTelemetry}
                className="rounded border border-white/15 bg-[#060912] px-4 py-2.5 font-mono text-[11px] tracking-[0.12em] text-[#B4C0D2] uppercase transition hover:border-[#8CB8FF]/50 hover:text-white"
              >
                Export JSON
              </button>
            </div>
          </TelemetryPanel>

          <div className="flex flex-col gap-5 lg:col-span-6">
            <TelemetryPanel>
              <SectionLabel
                eyebrow="TARGET TELEMETRY"
                title="Host Star & Planetary Telemetry"
              />
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <MetricCell
                  label="HOST STAR"
                  value={featured.hostStar.name}
                  sub={featured.hostStar.spectralType ?? "Spectral N/A"}
                />
                <MetricCell
                  label="DISTANCE"
                  value={
                    featured.hostStar.distanceLy != null
                      ? `${featured.hostStar.distanceLy} ly`
                      : "—"
                  }
                  sub={
                    featured.hostStar.temperatureK != null
                      ? `Star ${featured.hostStar.temperatureK} K`
                      : undefined
                  }
                  highlight
                />
                <MetricCell
                  label="PLANET RADIUS"
                  value={featured.radiusEarth != null ? `${featured.radiusEarth} R⊕` : "—"}
                  sub={featured.massEarth != null ? `${featured.massEarth} M⊕` : "Mass N/A"}
                  highlight
                />
                <MetricCell
                  label="ORBITAL PERIOD"
                  value={
                    featured.orbitalPeriodDays != null ? `${featured.orbitalPeriodDays} d` : "—"
                  }
                  sub={
                    featured.semiMajorAxisAu != null ? `${featured.semiMajorAxisAu} AU` : undefined
                  }
                />
                <MetricCell
                  label="EQUILIBRIUM TEMP"
                  value={
                    featured.equilibriumTempK != null ? `${featured.equilibriumTempK} K` : "—"
                  }
                  sub={
                    featured.equilibriumTempK != null
                      ? `${Math.round(featured.equilibriumTempK - 273.15)} °C`
                      : undefined
                  }
                  highlight={Boolean(featured.inHabitableZone)}
                />
                <MetricCell
                  label="DISCOVERY"
                  value={`${featured.discoveryYear}`}
                  sub={featured.discoveryMethod}
                />
              </div>
            </TelemetryPanel>

            <TelemetryPanel className="flex-1">
              <SectionLabel
                eyebrow="THERMAL RADIATION"
                title="Equilibrium Temperature Profile (K)"
                rightText={`SAMPLE: ${spectrumChartData.length} WORLDS`}
              />
              <div className="mt-3 h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spectrumChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="exoTempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8CB8FF" stopOpacity={0.42} />
                        <stop offset="95%" stopColor="#8CB8FF" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#78879C", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#78879C", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#080D17",
                        border: "1px solid rgba(140,184,255,0.3)",
                        borderRadius: "6px",
                        fontSize: "11px",
                        color: "#E8EDF5",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="tempK"
                      stroke="#8CB8FF"
                      strokeWidth={2}
                      fill="url(#exoTempGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TelemetryPanel>
          </div>
        </section>
      )}

      {/* Comparative Morphology // Benchmark Clusters */}
      {morphologyClusters.rocky && morphologyClusters.hotJupiter && morphologyClusters.subNeptune && (
        <section className="mt-10">
          <TelemetryPanel>
            <div className="font-mono text-[10px] tracking-[0.16em] text-[#7D8C9F] uppercase">
              [COMPARATIVE MORPHOLOGY // BENCHMARK CLUSTERS]
            </div>
            <h2 className="mt-1 text-xl font-medium text-[#EFF4FC]">
              PROPORTIONAL PLANETARY TAXONOMY
            </h2>
            <p className="mt-1 text-xs text-[#95A3B6]">
              Direct scale normalization against Solar System archetypes using live NASA Exoplanet Archive parameters.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "CLUSTER 01 // TERRESTRIAL SILICATE",
                  refName: "EARTH",
                  refRadius: "1.00 R⊕",
                  refTemp: "255 K",
                  exo: morphologyClusters.rocky,
                },
                {
                  title: "CLUSTER 02 // GAS GIANT VS HOT JUPITER",
                  refName: "JUPITER",
                  refRadius: "11.2 R⊕",
                  refTemp: "163 K",
                  exo: morphologyClusters.hotJupiter,
                },
                {
                  title: "CLUSTER 03 // SUB-NEPTUNE / SUPER-EARTH",
                  refName: "NEPTUNE",
                  refRadius: "3.88 R⊕",
                  refTemp: "72 K",
                  exo: morphologyClusters.subNeptune,
                },
              ].map((cluster) => (
                <div
                  key={cluster.title}
                  className="rounded border border-white/[0.08] bg-[#060912] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.14em] text-[#8CB8FF] uppercase">
                      {cluster.title}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded border border-white/[0.06] bg-[#0B101B] p-3 text-center">
                      <div>
                        <div className="font-mono text-[9px] text-[#78879C]">{cluster.refName}</div>
                        <div className="mt-1 font-mono text-sm font-semibold text-white">
                          {cluster.refRadius}
                        </div>
                        <div className="font-mono text-[10px] text-[#78879C]">{cluster.refTemp}</div>
                      </div>
                      <div className="border-l border-white/[0.08] pl-2">
                        <div className="truncate font-mono text-[9px] text-[#DFC99D]">
                          {cluster.exo.name}
                        </div>
                        <div className="mt-1 font-mono text-sm font-semibold text-[#8CB8FF]">
                          {cluster.exo.radiusEarth != null ? `${cluster.exo.radiusEarth} R⊕` : "—"}
                        </div>
                        <div className="font-mono text-[10px] text-[#78879C]">
                          {cluster.exo.equilibriumTempK != null
                            ? `${cluster.exo.equilibriumTempK} K`
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(cluster.exo.id)}
                    className="mt-3 w-full rounded border border-white/10 py-1.5 font-mono text-[10px] tracking-[0.12em] text-[#8CB8FF] uppercase transition hover:border-[#8CB8FF]/40 hover:bg-[#8CB8FF]/10"
                  >
                    Inspect {cluster.exo.name} →
                  </button>
                </div>
              ))}
            </div>
          </TelemetryPanel>
        </section>
      )}

      {/* Multi-Planet Star Systems Architecture */}
      {starSystems.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="font-mono text-[10px] tracking-[0.18em] text-[#7D8C9F] uppercase">
                ORBITAL RESONANCE SURVEY
              </div>
              <h2 className="mt-0.5 text-xl font-medium text-[#EFF4FC]">
                MULTI-PLANET STAR SYSTEMS ARCHITECTURE
              </h2>
            </div>
          </div>

          <TelemetryPanel className="space-y-3">
            {starSystems.map((sys) => (
              <div
                key={sys.starName}
                className="rounded border border-white/[0.07] bg-[#060912] p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-mono text-xs font-semibold text-white">
                    {sys.starName}{" "}
                    <span className="font-normal text-[#78879C]">
                      {"// "}
                      {sys.hostStar.spectralType ?? "Star"} · {sys.worlds.length} cataloged{" "}
                      {sys.worlds.length === 1 ? "world" : "worlds"}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#DFC99D]">
                    {sys.hostStar.distanceLy != null ? `${sys.hostStar.distanceLy} LIGHT-YEARS` : ""}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#FDB813] shadow-[0_0_10px_#FDB813]" />
                  <div className="h-px flex-1 bg-white/10" />
                  {sys.worlds.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedId(w.id)}
                      className={`rounded border px-2.5 py-1 font-mono text-[10px] transition ${
                        selectedId === w.id
                          ? "border-[#8CB8FF] bg-[#8CB8FF]/20 text-white"
                          : w.inHabitableZone
                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:border-emerald-300"
                            : "border-white/10 bg-[#0B101B] text-[#B4C0D2] hover:border-white/30"
                      }`}
                    >
                      {w.name}
                      {w.semiMajorAxisAu != null ? ` (${w.semiMajorAxisAu} AU)` : ""}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </TelemetryPanel>
        </section>
      )}

      {/* Full Searchable Catalog */}
      <section className="mt-10">
        <TelemetryPanel className="mb-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition ${
                  activeTab === "all"
                    ? "bg-[#96BEFF] font-semibold text-[#05080F]"
                    : "border border-white/10 bg-[#060912] text-[#A5B2C4] hover:text-white"
                }`}
              >
                All Catalog ({planets.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("habitable")}
                className={`rounded px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition ${
                  activeTab === "habitable"
                    ? "bg-emerald-400 font-semibold text-[#05080F]"
                    : "border border-white/10 bg-[#060912] text-[#A5B2C4] hover:text-white"
                }`}
              >
                Habitable Zone ({habitableCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("saved")}
                className={`rounded px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition ${
                  activeTab === "saved"
                    ? "bg-[#DFC99D] font-semibold text-[#05080F]"
                    : "border border-white/10 bg-[#060912] text-[#A5B2C4] hover:text-white"
                }`}
              >
                Saved ({hydrated ? savedExoplanets.length : 0})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search planet, host star, method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded border border-white/15 bg-[#060912] px-3 py-1.5 font-mono text-xs text-white placeholder-[#5B697D] focus:border-[#8CB8FF] focus:outline-none sm:w-64"
              />
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "distance" | "radius" | "mass" | "year")
                }
                className="rounded border border-white/15 bg-[#060912] px-3 py-1.5 font-mono text-xs text-white focus:border-[#8CB8FF] focus:outline-none"
              >
                <option value="distance">Sort: Nearest</option>
                <option value="radius">Sort: Largest Radius</option>
                <option value="mass">Sort: Highest Mass</option>
                <option value="year">Sort: Discovery Year</option>
              </select>
            </div>
          </div>
        </TelemetryPanel>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlanets.map((p) => {
            const saved = hydrated && savedExoplanets.some((item) => item.id === p.id);
            const active = selectedId === p.id;
            return (
              <TelemetryPanel
                key={p.id}
                className={`observatory-panel-hover flex flex-col justify-between transition ${
                  active ? "border-[#8CB8FF]/60" : ""
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-[10px] tracking-[0.14em] text-[#7D8C9F] uppercase">
                        {p.hostStar.name} · {p.discoveryYear}
                      </div>
                      <h3 className="mt-0.5 text-lg font-medium text-white">{p.name}</h3>
                    </div>
                    <StatusPill
                      label={p.inHabitableZone ? "HZ" : p.discoveryMethod}
                      tone={p.inHabitableZone ? "emerald" : "blue"}
                    />
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-[#9AA6B8]">{p.highlight}</p>

                  <div className="mt-4 grid grid-cols-3 gap-2 rounded border border-white/[0.06] bg-[#060912] p-2.5 font-mono text-[10px]">
                    <div>
                      <div className="text-[#6F7E93]">DIST</div>
                      <div className="mt-0.5 text-white">
                        {p.hostStar.distanceLy != null ? `${p.hostStar.distanceLy} ly` : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#6F7E93]">RADIUS</div>
                      <div className="mt-0.5 text-[#8CB8FF]">
                        {p.radiusEarth != null ? `${p.radiusEarth} R⊕` : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#6F7E93]">TEMP</div>
                      <div className="mt-0.5 text-[#DFC99D]">
                        {p.equilibriumTempK != null ? `${p.equilibriumTempK} K` : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(p.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex-1 rounded border border-white/15 bg-[#060912] py-1.5 font-mono text-[10px] tracking-[0.12em] text-[#8CB8FF] uppercase transition hover:border-[#8CB8FF]/50 hover:text-white"
                  >
                    Inspect Dossier
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSavedExoplanet(p)}
                    className={`rounded px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase transition ${
                      saved
                        ? "bg-[#DFC99D] font-semibold text-[#05080F]"
                        : "border border-white/15 bg-[#060912] text-[#A5B2C4] hover:text-white"
                    }`}
                  >
                    {saved ? "Saved ★" : "Save"}
                  </button>
                </div>
              </TelemetryPanel>
            );
          })}
        </div>
      </section>
    </main>
  );
}
