"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ErrorBanner,
  HeroHeader,
  LoadingPanel,
  MetricCell,
  PlanetDisc,
  SectionLabel,
  StatusPill,
  TelemetryPanel,
} from "@/components/ui/ObservatoryPrimitives";
import { fetchApi } from "@/lib/api";
import type { Planet } from "@/types/planet";
import { SolarSystemCanvas } from "./SolarSystemCanvas";

function formatNumber(n: number, decimals = 1): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

function formatRotation(hours: number): string {
  const abs = Math.abs(hours);
  const dir = hours < 0 ? " (Retrograde)" : "";
  if (abs >= 48) {
    return `${formatNumber(abs / 24, 1)} d${dir}`;
  }
  return `${formatNumber(abs, 1)} h${dir}`;
}

export function SolarSystemWorkspace() {
  const searchParams = useSearchParams();
  const initialPlanetParam = searchParams.get("planet")?.toLowerCase() ?? "saturn";

  const [planets, setPlanets] = useState<Planet[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialPlanetParam);
  const [selectedDetail, setSelectedDetail] = useState<Planet | null>(null);
  const [compareAId, setCompareAId] = useState<string>("earth");
  const [compareBId, setCompareBId] = useState<string>("saturn");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3D scene controls
  const [paused, setPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [scaleMode, setScaleMode] = useState<"observatory" | "proportional">("observatory");
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [cameraTargetId, setCameraTargetId] = useState<string>("overview");

  const loadPlanets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi<Planet[]>("/api/planets");
      setPlanets(data);
      const match = data.find((p) => p.id === initialPlanetParam) ?? data[3] ?? data[0];
      if (match) {
        setSelectedId(match.id);
        setSelectedDetail(match);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Solar System catalog.");
    } finally {
      setLoading(false);
    }
  }, [initialPlanetParam]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadPlanets();
    });
    return () => {
      active = false;
    };
  }, [loadPlanets]);

  // Fetch individual planet endpoint whenever selection changes to keep telemetry synchronized with /api/planets/[id]
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    fetchApi<Planet>(`/api/planets/${encodeURIComponent(selectedId)}`)
      .then((detail) => {
        if (active) setSelectedDetail(detail);
      })
      .catch(() => {
        // Keep existing list item if detail fetch fails
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  const handleSelectPlanet = useCallback((id: string) => {
    setSelectedId(id);
    setCameraTargetId(id);
    setFocusTrigger((n) => n + 1);
  }, []);

  const handleResetOverview = () => {
    setCameraTargetId("overview");
    setFocusTrigger((n) => n + 1);
  };

  const selectedPlanet = useMemo(() => {
    if (selectedDetail && selectedDetail.id === selectedId) return selectedDetail;
    return planets.find((p) => p.id === selectedId) ?? planets[0] ?? null;
  }, [planets, selectedDetail, selectedId]);

  const bodyA = useMemo(
    () => planets.find((p) => p.id === compareAId) ?? planets[3],
    [planets, compareAId],
  );
  const bodyB = useMemo(
    () => planets.find((p) => p.id === compareBId) ?? planets[6],
    [planets, compareBId],
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
      <HeroHeader
        eyebrow="ARCHITECTURE PORTAL 01 // KEPLERIAN HELIOCENTRIC PROJECTION"
        titleTop="INTERACTIVE"
        titleAccent="SOLAR SYSTEM"
        titleBottom="OBSERVATORY"
        subtitle="Navigate a real-time 3D heliocentric model of the Sun and eight planets. Inspect orbital eccentricities, axial inclinations, surface gravity, and proportional planetary radii."
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label="9 CATALOGED BODIES" tone="blue" />
            <StatusPill
              label={paused ? "SIMULATION PAUSED" : `${speedMultiplier}X ORBITAL RATE`}
              tone="gold"
            />
          </div>
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onRetry={loadPlanets} />
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <LoadingPanel height="h-[520px]" lines={4} />
          </div>
          <div className="lg:col-span-4">
            <LoadingPanel height="h-[520px]" lines={6} />
          </div>
        </div>
      ) : (
        <>
          {/* Planet Selector Strip */}
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {planets.map((p) => {
              const active = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPlanet(p.id)}
                  className={`flex items-center gap-2 rounded border px-3 py-1.5 font-mono text-[11px] tracking-[0.1em] uppercase transition ${
                    active
                      ? "border-[#8CB8FF] bg-[#8CB8FF]/18 text-white shadow-[0_0_16px_rgba(140,184,255,0.2)]"
                      : "border-white/10 bg-[#0B101A]/75 text-[#98A6B8] hover:border-white/25 hover:text-white"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}
                </button>
              );
            })}
          </div>

          {/* Main 3D Scene + Dossier Bento */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="relative">
                <SolarSystemCanvas
                  planets={planets}
                  selectedPlanetId={cameraTargetId === "overview" ? selectedId : cameraTargetId}
                  onSelectPlanet={handleSelectPlanet}
                  paused={paused}
                  speedMultiplier={speedMultiplier}
                  showOrbits={showOrbits}
                  showLabels={showLabels}
                  scaleMode={scaleMode}
                  focusTrigger={focusTrigger}
                />

                {/* Floating Scene HUD Controls */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/[0.08] bg-[#090E18]/90 px-4 py-2.5 backdrop-blur-md">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPaused((p) => !p)}
                      className="rounded border border-white/15 bg-white/[0.05] px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-[#E8EDF5] uppercase transition hover:border-[#8CB8FF]/50"
                    >
                      {paused ? "▶ Resume" : "❚❚ Pause"}
                    </button>

                    <div className="flex items-center gap-1 rounded border border-white/10 bg-black/30 p-0.5">
                      {[0.5, 1, 3, 8].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            setSpeedMultiplier(rate);
                            setPaused(false);
                          }}
                          className={`rounded px-2 py-0.5 font-mono text-[10px] transition ${
                            speedMultiplier === rate && !paused
                              ? "bg-[#8CB8FF] text-[#05070C] font-semibold"
                              : "text-[#8A97AA] hover:text-white"
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleResetOverview}
                      className="rounded border border-white/15 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] text-[#B7C4D6] uppercase transition hover:border-white/35 hover:text-white"
                    >
                      Reset Camera
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOrbits((v) => !v)}
                      className={`rounded border px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] uppercase transition ${
                        showOrbits
                          ? "border-[#8CB8FF]/40 bg-[#8CB8FF]/12 text-[#9EC4FF]"
                          : "border-white/10 text-[#7A879A]"
                      }`}
                    >
                      Orbits
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLabels((v) => !v)}
                      className={`rounded border px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] uppercase transition ${
                        showLabels
                          ? "border-[#8CB8FF]/40 bg-[#8CB8FF]/12 text-[#9EC4FF]"
                          : "border-white/10 text-[#7A879A]"
                      }`}
                    >
                      Labels
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setScaleMode((m) => (m === "observatory" ? "proportional" : "observatory"))
                      }
                      className="rounded border border-[#DFC99D]/35 bg-[#DFC99D]/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] text-[#E6D4B0] uppercase transition hover:bg-[#DFC99D]/20"
                    >
                      Scale: {scaleMode === "observatory" ? "Observatory" : "Proportional"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Body Telemetry Dossier */}
            <div className="lg:col-span-4">
              {selectedPlanet && (
                <TelemetryPanel className="flex h-full flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-4">
                      <div>
                        <div className="font-mono text-[10px] tracking-[0.18em] text-[#8CB8FF] uppercase">
                          {selectedPlanet.order === 0
                            ? "SOLAR CORE // ORDER 00"
                            : `PLANETARY BODY // ORBIT 0${selectedPlanet.order}`}
                        </div>
                        <h2 className="mt-1 text-2xl font-semibold tracking-wide text-white uppercase">
                          {selectedPlanet.name}
                        </h2>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <StatusPill label={selectedPlanet.type.replace("-", " ")} tone="gold" />
                          {selectedPlanet.hasRings && (
                            <StatusPill label="Ring System" tone="blue" />
                          )}
                        </div>
                      </div>
                      <PlanetDisc
                        color={selectedPlanet.color}
                        planetId={selectedPlanet.id}
                        hasRings={selectedPlanet.hasRings}
                        size={54}
                      />
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-[#AAB6C7]">
                      {selectedPlanet.summary}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-2.5">
                      <MetricCell
                        label="Mean Radius"
                        value={`${formatNumber(selectedPlanet.radiusKm, 0)} km`}
                        highlight
                      />
                      <MetricCell
                        label="Mass"
                        value={`${formatNumber(selectedPlanet.massEarths, 2)} M⊕`}
                      />
                      <MetricCell
                        label="Surface Gravity"
                        value={`${formatNumber(selectedPlanet.gravityMs2, 1)} m/s²`}
                      />
                      <MetricCell label="Mean Temp" value={`${selectedPlanet.meanTempC} °C`} />
                      <MetricCell
                        label="Rotation Period"
                        value={formatRotation(selectedPlanet.rotationHours)}
                      />
                      <MetricCell label="Axial Tilt" value={`${selectedPlanet.axialTiltDeg}°`} />
                      <MetricCell label="Confirmed Moons" value={String(selectedPlanet.moons)} />
                      <MetricCell
                        label="Semi-Major Axis"
                        value={
                          selectedPlanet.orbit
                            ? `${selectedPlanet.orbit.semiMajorAxisAu} AU`
                            : "0.00 AU (Center)"
                        }
                      />
                    </div>

                    {selectedPlanet.orbit && (
                      <div className="mt-3 rounded border border-white/[0.07] bg-[#060A11]/70 p-3">
                        <div className="font-mono text-[9px] tracking-[0.16em] text-[#78879C] uppercase">
                          Keplerian Orbital Elements
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-xs">
                          <div>
                            <div className="text-[9px] text-[#6D7C91]">PERIOD</div>
                            <div className="text-[#E5ECF6]">
                              {formatNumber(selectedPlanet.orbit.periodDays, 0)} d
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-[#6D7C91]">ECCENTRICITY</div>
                            <div className="text-[#E5ECF6]">
                              {selectedPlanet.orbit.eccentricity}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-[#6D7C91]">INCLINATION</div>
                            <div className="text-[#E5ECF6]">
                              {selectedPlanet.orbit.inclinationDeg}°
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedPlanet.id !== "sun" && (
                    <div className="mt-5 flex flex-col gap-2 border-t border-white/[0.08] pt-4">
                      <Link
                        href={`/academy?planet=${selectedPlanet.id}`}
                        className="inline-flex w-full items-center justify-center rounded bg-[#96BEFF] px-4 py-2 font-mono text-[11px] font-semibold tracking-[0.12em] text-[#05080F] uppercase transition hover:bg-[#B2D0FF]"
                      >
                        Study {selectedPlanet.name} in Space Academy →
                      </Link>
                    </div>
                  )}
                </TelemetryPanel>
              )}
            </div>
          </div>

          {/* Side-by-Side Planetary Size & Property Comparison */}
          {bodyA && bodyB && (
            <section className="mt-12">
              <SectionLabel
                eyebrow="[COMPARATIVE MORPHOLOGY // SIDE-BY-SIDE TELEMETRY]"
                title="Planetary Scale & Property Comparison"
                rightText="REAL-WORLD PHYSICAL RATIOS"
              />

              <TelemetryPanel>
                <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                  {/* Body A Selector */}
                  <div className="lg:col-span-3">
                    <label
                      htmlFor="compare-a"
                      className="block font-mono text-[10px] tracking-[0.14em] text-[#7D8C9F] uppercase"
                    >
                      Reference Body A
                    </label>
                    <select
                      id="compare-a"
                      value={bodyA.id}
                      onChange={(e) => setCompareAId(e.target.value)}
                      className="mt-1.5 w-full rounded border border-white/15 bg-[#070B14] px-3 py-2 text-sm text-white focus:border-[#8CB8FF] focus:outline-none"
                    >
                      {planets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <label
                      htmlFor="compare-b"
                      className="mt-4 block font-mono text-[10px] tracking-[0.14em] text-[#7D8C9F] uppercase"
                    >
                      Target Body B
                    </label>
                    <select
                      id="compare-b"
                      value={bodyB.id}
                      onChange={(e) => setCompareBId(e.target.value)}
                      className="mt-1.5 w-full rounded border border-white/15 bg-[#070B14] px-3 py-2 text-sm text-white focus:border-[#8CB8FF] focus:outline-none"
                    >
                      {planets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Visual Proportional Disc Comparison */}
                  <div className="flex flex-col items-center justify-center rounded border border-white/[0.07] bg-[#060911]/85 p-6 lg:col-span-5">
                    {(() => {
                      const maxR = Math.max(bodyA.radiusKm, bodyB.radiusKm);
                      const sizeA = Math.max(18, Math.round((bodyA.radiusKm / maxR) * 108));
                      const sizeB = Math.max(18, Math.round((bodyB.radiusKm / maxR) * 108));
                      return (
                        <div className="flex w-full items-center justify-around gap-6">
                          <div className="flex flex-col items-center">
                            <div className="flex h-32 items-center justify-center">
                              <PlanetDisc
                                color={bodyA.color}
                                planetId={bodyA.id}
                                hasRings={bodyA.hasRings}
                                size={sizeA}
                              />
                            </div>
                            <span className="mt-2 font-mono text-xs font-medium text-white uppercase">
                              {bodyA.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#8CB8FF]">
                              {formatNumber(bodyA.radiusKm, 0)} km
                            </span>
                          </div>

                          <span className="font-mono text-xs text-[#6E7D92]">VS</span>

                          <div className="flex flex-col items-center">
                            <div className="flex h-32 items-center justify-center">
                              <PlanetDisc
                                color={bodyB.color}
                                planetId={bodyB.id}
                                hasRings={bodyB.hasRings}
                                size={sizeB}
                              />
                            </div>
                            <span className="mt-2 font-mono text-xs font-medium text-white uppercase">
                              {bodyB.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#DFC99D]">
                              {formatNumber(bodyB.radiusKm, 0)} km
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Comparison Table */}
                  <div className="grid grid-cols-2 gap-2.5 lg:col-span-4">
                    <MetricCell
                      label="Radius Ratio (B / A)"
                      value={`${formatNumber(bodyB.radiusKm / bodyA.radiusKm, 2)}×`}
                      sub={`${bodyB.name} vs ${bodyA.name}`}
                      highlight
                    />
                    <MetricCell
                      label="Mass Ratio (B / A)"
                      value={`${formatNumber(bodyB.massEarths / bodyA.massEarths, 2)}×`}
                      sub={`${formatNumber(bodyB.massEarths, 2)} vs ${formatNumber(bodyA.massEarths, 2)} M⊕`}
                    />
                    <MetricCell
                      label="Gravity Delta"
                      value={`${formatNumber(bodyB.gravityMs2, 1)} vs ${formatNumber(bodyA.gravityMs2, 1)}`}
                      sub="m/s² surface"
                    />
                    <MetricCell
                      label="Temp Difference"
                      value={`${bodyB.meanTempC - bodyA.meanTempC > 0 ? "+" : ""}${bodyB.meanTempC - bodyA.meanTempC} °C`}
                      sub={`${bodyA.meanTempC}°C → ${bodyB.meanTempC}°C`}
                    />
                  </div>
                </div>
              </TelemetryPanel>
            </section>
          )}
        </>
      )}
    </main>
  );
}
