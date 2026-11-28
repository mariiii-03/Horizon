"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
import { fetchApi } from "@/lib/api";
import { useHasHydrated, useHorizonStore } from "@/store/useHorizonStore";
import type {
  CoronalMassEjection,
  GeomagneticStorm,
  SolarFlare,
  SpaceWeatherEvent,
} from "@/types/space-weather";

function flareToScore(classType: string): number {
  const trimmed = classType.trim().toUpperCase();
  const letter = trimmed.charAt(0);
  const mag = parseFloat(trimmed.slice(1)) || 1;
  const mult: Record<string, number> = { A: 1, B: 10, C: 100, M: 1000, X: 10000 };
  return (mult[letter] ?? 10) * mag;
}

function formatUtc(iso: string): string {
  if (!iso) return "Unknown UTC";
  return iso.replace("T", " ").replace(/:\d{2}Z$/, " UTC");
}

function kpToScale(kp: number): string {
  if (kp >= 9) return "G5 (Extreme)";
  if (kp >= 8) return "G4 (Severe)";
  if (kp >= 7) return "G3 (Strong)";
  if (kp >= 6) return "G2 (Moderate)";
  if (kp >= 5) return "G1 (Minor)";
  return "G0 (Quiet)";
}

export function SpaceWeatherWorkspace() {
  const hydrated = useHasHydrated();
  const alertKpThreshold = useHorizonStore((s) => s.alertKpThreshold);
  const alertFlareClass = useHorizonStore((s) => s.alertFlareClass);
  const alertsEnabled = useHorizonStore((s) => s.alertsEnabled);
  const setAlertPreferences = useHorizonStore((s) => s.setAlertPreferences);

  const [days, setDays] = useState<7 | 14 | 30>(30);
  const [events, setEvents] = useState<SpaceWeatherEvent[]>([]);
  const [kindFilter, setKindFilter] = useState<"all" | "flare" | "storm" | "cme">("all");
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = useCallback(async (windowDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi<SpaceWeatherEvent[]>(`/api/space-weather?days=${windowDays}`);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load NASA DONKI telemetry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadWeather(days);
    });
    return () => {
      active = false;
    };
  }, [days, loadWeather]);

  const flares = useMemo(() => events.filter((e): e is SolarFlare => e.kind === "flare"), [events]);
  const storms = useMemo(
    () => events.filter((e): e is GeomagneticStorm => e.kind === "storm"),
    [events],
  );
  const cmes = useMemo(
    () => events.filter((e): e is CoronalMassEjection => e.kind === "cme"),
    [events],
  );

  const peakFlare = useMemo(() => {
    if (flares.length === 0) return null;
    return [...flares].sort((a, b) => flareToScore(b.classType) - flareToScore(a.classType))[0];
  }, [flares]);

  const peakStorm = useMemo(() => {
    if (storms.length === 0) return null;
    return [...storms].sort((a, b) => b.maxKp - a.maxKp)[0];
  }, [storms]);

  const fastestCme = useMemo(() => {
    if (cmes.length === 0) return null;
    return [...cmes].sort((a, b) => (b.speedKmPerSec ?? 0) - (a.speedKmPerSec ?? 0))[0];
  }, [cmes]);

  const flareChartData = useMemo(() => {
    return [...flares]
      .slice(0, 16)
      .reverse()
      .map((f) => ({
        date: f.startTime.slice(5, 10),
        intensity: Math.round(Math.log10(Math.max(1, flareToScore(f.classType))) * 10) / 10,
        classType: f.classType,
      }));
  }, [flares]);

  const cmeChartData = useMemo(() => {
    return [...cmes]
      .filter((c) => typeof c.speedKmPerSec === "number")
      .slice(0, 14)
      .reverse()
      .map((c) => ({
        date: c.startTime.slice(5, 10),
        speed: Math.round(c.speedKmPerSec ?? 0),
      }));
  }, [cmes]);

  const filteredEvents = useMemo(() => {
    if (kindFilter === "all") return events;
    return events.filter((e) => e.kind === kindFilter);
  }, [events, kindFilter]);

  const isEventAlert = useCallback(
    (event: SpaceWeatherEvent) => {
      if (!hydrated || !alertsEnabled) return false;
      if (event.kind === "storm") return event.maxKp >= alertKpThreshold;
      if (event.kind === "flare") {
        const order = { C: 1, M: 2, X: 3 };
        const letter = event.classType.trim().toUpperCase().charAt(0) as "C" | "M" | "X";
        return (order[letter] ?? 0) >= order[alertFlareClass];
      }
      return (event.speedKmPerSec ?? 0) >= 1000;
    },
    [hydrated, alertsEnabled, alertKpThreshold, alertFlareClass],
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
      <HeroHeader
        eyebrow="PORTAL 04 // NASA DONKI HELIOPHYSICS FEED"
        titleTop="SPACE WEATHER &"
        titleAccent="HELIOSPHERIC OBSERVATORY"
        subtitle="Live solar flare, geomagnetic storm (Kp index), and coronal mass ejection (CME) telemetry streamed from NASA's Space Weather Database Of Notifications, Knowledge, Information (DONKI)."
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={`${events.length} EVENTS (${days}D)`} tone="blue" />
            <div className="flex items-center gap-1 rounded border border-white/12 bg-[#080C15] p-1">
              {([7, 14, 30] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`rounded px-2.5 py-1 font-mono text-[10px] uppercase transition ${
                    days === d
                      ? "bg-[#8CB8FF] font-semibold text-[#05080F]"
                      : "text-[#8A97AA] hover:text-white"
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
        }
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onRetry={() => void loadWeather(days)} />
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <LoadingPanel height="h-64" lines={4} />
          <LoadingPanel height="h-64" lines={4} />
        </div>
      ) : (
        <>
          {/* Row 1: Solar Flare Eruption & Flux Profile (matches Prototype 7) */}
          <section className="grid gap-6 lg:grid-cols-12">
            <TelemetryPanel className="relative overflow-hidden lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[10px] tracking-[0.16em] text-[#DFC99D] uppercase">
                  SOLAR X-RAY FLARE TELEMETRY // {flares.length} RECORDED
                </span>
                <StatusPill
                  label={peakFlare ? `PEAK CLASS ${peakFlare.classType}` : "SOLAR QUIET"}
                  tone={peakFlare?.classType.startsWith("X") ? "danger" : "gold"}
                />
              </div>

              {/* Stylized Solar Magnetic Arc Visual */}
              <div className="relative mt-4 flex h-44 items-center justify-center overflow-hidden rounded border border-white/[0.07] bg-gradient-to-b from-[#160D06] via-[#09080E] to-[#05070C]">
                <svg viewBox="0 0 400 160" className="h-full w-full opacity-90">
                  <defs>
                    <radialGradient id="solarGlow" cx="50%" cy="100%" r="75%">
                      <stop offset="0%" stopColor="#FDB813" stopOpacity="0.65" />
                      <stop offset="55%" stopColor="#D97706" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#05070C" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="400" height="160" fill="url(#solarGlow)" />
                  <path
                    d="M 110 155 C 120 45, 220 25, 240 155"
                    fill="none"
                    stroke="#FDE68A"
                    strokeWidth="2"
                    strokeOpacity="0.7"
                  />
                  <path
                    d="M 145 155 C 165 65, 265 40, 290 155"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="1.6"
                    strokeOpacity="0.55"
                  />
                  <path
                    d="M 175 155 C 190 85, 235 80, 255 155"
                    fill="none"
                    stroke="#FFFBEB"
                    strokeWidth="1.2"
                    strokeOpacity="0.85"
                  />
                </svg>
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <div className="font-mono text-[9px] tracking-[0.15em] text-[#E8D5AF] uppercase">
                      STRONGEST WINDOW FLARE
                    </div>
                    <div className="text-lg font-medium text-white">
                      {peakFlare
                        ? `Class ${peakFlare.classType} Flare Eruption`
                        : "No Flares Logged"}
                    </div>
                  </div>
                  {peakFlare && (
                    <span className="font-mono text-[10px] text-[#B8C4D4]">
                      {formatUtc(peakFlare.startTime)}
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-4 text-sm text-[#A3B0C2]">
                {peakFlare
                  ? peakFlare.summary
                  : "No significant solar flare events detected in the selected DONKI telemetry window."}
              </p>
            </TelemetryPanel>

            <TelemetryPanel className="flex flex-col justify-between lg:col-span-5">
              <div>
                <div className="font-mono text-[10px] tracking-[0.16em] text-[#7D8C9F] uppercase">
                  THERMODYNAMICS &amp; LOG-SCALE INTENSITY
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#98A6B8]">
                  Solar flares are classified on a logarithmic scale (A, B, C, M, X) where each
                  letter represents a 10× increase in X-ray energy output.
                </p>
              </div>

              <div className="mt-4 h-44 w-full">
                {flareChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={flareChartData}>
                      <defs>
                        <linearGradient id="flareArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#DFC99D" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#DFC99D" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#6F7E93" fontSize={10} tickLine={false} />
                      <YAxis stroke="#6F7E93" fontSize={10} tickLine={false} domain={[0, 5]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#080C15",
                          border: "1px solid rgba(255,255,255,0.14)",
                          fontSize: "11px",
                          color: "#E8EDF5",
                        }}
                        formatter={(_val, _name, item) => [
                          item?.payload?.classType ?? "",
                          "Flare Class",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="intensity"
                        stroke="#DFC99D"
                        strokeWidth={2}
                        fill="url(#flareArea)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded border border-white/[0.06] font-mono text-xs text-[#708096]">
                    No flare curve data in window
                  </div>
                )}
              </div>
            </TelemetryPanel>
          </section>

          {/* Row 2: Magnetospheric Coupling & Geomagnetic Storms (staggered like Prototype 7) */}
          <section className="mt-6 grid gap-6 lg:grid-cols-12">
            <TelemetryPanel className="flex flex-col justify-between lg:col-span-5">
              <div>
                <div className="font-mono text-[10px] tracking-[0.16em] text-[#7D8C9F] uppercase">
                  MAGNETOSPHERIC COUPLING &amp; KP INDEX
                </div>
                <h2 className="mt-1.5 text-xl font-medium text-white">
                  Geomagnetic Storm Telemetry
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#9BA9BC]">
                  {peakStorm
                    ? peakStorm.summary
                    : "Earth's magnetosphere remained calm with no G1–G5 storms recorded in this period."}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <MetricCell
                  label="Peak Kp Index"
                  value={peakStorm ? `Kp ${peakStorm.maxKp}` : "Kp < 5"}
                  sub={peakStorm ? kpToScale(peakStorm.maxKp) : "Nominal"}
                  highlight
                />
                <MetricCell
                  label="Storm Events"
                  value={String(storms.length)}
                  sub={`Last ${days} days`}
                />
              </div>
            </TelemetryPanel>

            <TelemetryPanel className="relative overflow-hidden lg:col-span-7">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.16em] text-emerald-300 uppercase">
                  AURORAL OVAL &amp; MAGNETOPAUSE RESPONSE
                </span>
                <StatusPill
                  label={peakStorm ? kpToScale(peakStorm.maxKp) : "GEOMAGNETIC QUIET"}
                  tone={peakStorm && peakStorm.maxKp >= 6 ? "gold" : "emerald"}
                />
              </div>

              <div className="relative mt-4 flex h-48 items-center justify-center overflow-hidden rounded border border-white/[0.07] bg-gradient-to-b from-[#041418] via-[#060B16] to-[#05070C]">
                <svg viewBox="0 0 420 170" className="h-full w-full">
                  <defs>
                    <radialGradient id="auroraGlow" cx="50%" cy="68%" r="55%">
                      <stop offset="0%" stopColor="#34D399" stopOpacity="0.45" />
                      <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#05070C" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="420" height="170" fill="url(#auroraGlow)" />
                  <circle
                    cx="210"
                    cy="210"
                    r="135"
                    fill="#0A1B38"
                    stroke="#60A5FA"
                    strokeOpacity="0.4"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 110 120 Q 210 68 310 120"
                    fill="none"
                    stroke="#34D399"
                    strokeWidth="2.5"
                    strokeOpacity="0.8"
                  />
                  <path
                    d="M 135 130 Q 210 88 285 130"
                    fill="none"
                    stroke="#A7F3D0"
                    strokeWidth="1.5"
                    strokeOpacity="0.65"
                  />
                </svg>
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <div className="font-mono text-[9px] text-emerald-300 uppercase">
                      PEAK GEOMAGNETIC DISTURBANCE
                    </div>
                    <div className="text-lg font-medium text-white">
                      {peakStorm
                        ? `Kp ${peakStorm.maxKp} Geomagnetic Storm`
                        : "Magnetosphere Nominal"}
                    </div>
                  </div>
                  {peakStorm && (
                    <span className="font-mono text-[10px] text-[#B8C4D4]">
                      {formatUtc(peakStorm.startTime)}
                    </span>
                  )}
                </div>
              </div>
            </TelemetryPanel>
          </section>

          {/* Row 3: Coronal Mass Ejections (CMEs) */}
          <section className="mt-6 grid gap-6 lg:grid-cols-12">
            <TelemetryPanel className="lg:col-span-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.16em] text-[#8CB8FF] uppercase">
                  CORONAGRAPH HALO CME TELEMETRY // {cmes.length} EVENTS
                </span>
                <StatusPill
                  label={
                    fastestCme?.speedKmPerSec
                      ? `MAX ${Math.round(fastestCme.speedKmPerSec)} KM/S`
                      : "CME MONITOR"
                  }
                  tone="blue"
                />
              </div>

              <div className="relative mt-4 flex h-44 items-center justify-center overflow-hidden rounded border border-white/[0.07] bg-[#04070E]">
                <svg viewBox="0 0 260 150" className="h-full w-full">
                  <circle
                    cx="130"
                    cy="75"
                    r="56"
                    fill="none"
                    stroke="#8CB8FF"
                    strokeOpacity="0.18"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx="130"
                    cy="75"
                    r="38"
                    fill="none"
                    stroke="#8CB8FF"
                    strokeOpacity="0.35"
                  />
                  <circle cx="130" cy="75" r="24" fill="rgba(140,184,255,0.16)" />
                  <circle
                    cx="130"
                    cy="75"
                    r="15"
                    fill="#030509"
                    stroke="#DFC99D"
                    strokeWidth="1.2"
                  />
                </svg>
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <div className="font-mono text-[9px] text-[#8CB8FF] uppercase">
                      FASTEST CORONAL EJECTION
                    </div>
                    <div className="text-base font-medium text-white">
                      {fastestCme?.speedKmPerSec
                        ? `${Math.round(fastestCme.speedKmPerSec)} km/s Solar Plasma Cloud`
                        : "Coronal Mass Ejection"}
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-[#A3B0C2]">
                {fastestCme
                  ? fastestCme.summary
                  : "No coronal mass ejections recorded in this window."}
              </p>
            </TelemetryPanel>

            <TelemetryPanel className="flex flex-col justify-between lg:col-span-6">
              <div>
                <div className="font-mono text-[10px] tracking-[0.16em] text-[#7D8C9F] uppercase">
                  CME EXPANSION VELOCITY SPECTRUM (KM/S)
                </div>
                <p className="mt-1.5 text-xs text-[#98A6B8]">
                  Measured radial outflow speeds across recent LASCO/DONKI CME analyses.
                </p>
              </div>
              <div className="mt-3 h-48 w-full">
                {cmeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cmeChartData}>
                      <XAxis dataKey="date" stroke="#6F7E93" fontSize={10} tickLine={false} />
                      <YAxis stroke="#6F7E93" fontSize={10} tickLine={false} unit=" km/s" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#080C15",
                          border: "1px solid rgba(255,255,255,0.14)",
                          fontSize: "11px",
                          color: "#E8EDF5",
                        }}
                      />
                      <Bar
                        dataKey="speed"
                        name="CME Speed (km/s)"
                        fill="#8CB8FF"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded border border-white/[0.06] font-mono text-xs text-[#708096]">
                    No velocity-resolved CME events in window
                  </div>
                )}
              </div>
            </TelemetryPanel>
          </section>

          {/* Space Events Timeline & Archive (matches Prototype 7) */}
          <section className="mt-12">
            <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <SectionLabel
                eyebrow="CHRONOLOGICAL SOLAR TELEMETRY // NEWEST FIRST"
                title="Space Events Timeline & Archive"
              />

              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: "all", label: `All Events (${events.length})` },
                    { id: "flare", label: `Flares (${flares.length})` },
                    { id: "storm", label: `Storms (${storms.length})` },
                    { id: "cme", label: `CMEs (${cmes.length})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setKindFilter(tab.id)}
                    className={`rounded border px-3 py-1 font-mono text-[10px] tracking-[0.1em] uppercase transition ${
                      kindFilter === tab.id
                        ? "border-[#8CB8FF] bg-[#8CB8FF] font-semibold text-[#05080F]"
                        : "border-white/15 bg-[#0A0F1A] text-[#9AA7B9] hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <TelemetryPanel>
                <p className="py-8 text-center text-sm text-[#8A97AA]">
                  No space weather events found for this filter in the last {days} days.
                </p>
              </TelemetryPanel>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => {
                  const alertMatch = isEventAlert(event);
                  const badgeLabel =
                    event.kind === "flare"
                      ? `SOLAR FLARE // ${event.classType}`
                      : event.kind === "storm"
                        ? `GEOMAGNETIC STORM // KP ${event.maxKp}`
                        : `CME // ${event.speedKmPerSec ? `${Math.round(event.speedKmPerSec)} KM/S` : "SPEED UNRESOLVED"}`;

                  const tone =
                    event.kind === "flare"
                      ? event.classType.startsWith("X")
                        ? "danger"
                        : "gold"
                      : event.kind === "storm"
                        ? event.maxKp >= 6
                          ? "gold"
                          : "emerald"
                        : "blue";

                  return (
                    <TelemetryPanel
                      key={event.id}
                      className={`observatory-panel-hover ${
                        alertMatch ? "border-[#DFC99D]/45" : ""
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] text-[#7D8C9F]">
                              {formatUtc(event.startTime)}
                            </span>
                            <StatusPill label={badgeLabel} tone={tone} />
                            {alertMatch && <StatusPill label="THRESHOLD ALERT" tone="danger" />}
                          </div>
                          <p className="text-sm leading-relaxed text-[#D8E1EE]">{event.summary}</p>
                        </div>

                        <div className="shrink-0 text-right">
                          <a
                            href={event.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded border border-white/15 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-[#8CB8FF] uppercase transition hover:border-[#8CB8FF]/50 hover:text-white"
                          >
                            DONKI Log ↗
                          </a>
                        </div>
                      </div>
                    </TelemetryPanel>
                  );
                })}
              </div>
            )}

            {/* Heliospheric Early Warning Subscription Bar (matches bottom of Prototype 7) */}
            <TelemetryPanel className="mt-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="text-sm font-medium text-white">
                    Heliospheric Early Warning Thresholds
                  </div>
                  <p className="mt-0.5 text-xs text-[#8A97AA]">
                    Highlight events exceeding Kp {hydrated ? alertKpThreshold : 5}+ geomagnetic
                    storms or {hydrated ? alertFlareClass : "M"}-class solar flares.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAlertPanelOpen((o) => !o)}
                  className="shrink-0 rounded bg-[#96BEFF] px-4 py-2 font-mono text-[11px] font-semibold tracking-[0.12em] text-[#05080F] uppercase transition hover:bg-[#B2D0FF]"
                >
                  {alertPanelOpen ? "Hide Alert Config" : "Configure Alerts"}
                </button>
              </div>

              {alertPanelOpen && hydrated && (
                <div className="mt-4 grid gap-4 border-t border-white/[0.08] pt-4 sm:grid-cols-3">
                  <div>
                    <label className="block font-mono text-[10px] text-[#8A97AA] uppercase">
                      Alert Status
                    </label>
                    <button
                      type="button"
                      onClick={() => setAlertPreferences({ alertsEnabled: !alertsEnabled })}
                      className={`mt-1.5 rounded border px-3 py-1.5 font-mono text-xs uppercase ${
                        alertsEnabled
                          ? "border-emerald-400/45 bg-emerald-400/15 text-emerald-300"
                          : "border-white/15 text-[#8A97AA]"
                      }`}
                    >
                      {alertsEnabled ? "Active Monitoring" : "Muted"}
                    </button>
                  </div>
                  <div>
                    <label
                      htmlFor="kp-thresh"
                      className="block font-mono text-[10px] text-[#8A97AA] uppercase"
                    >
                      Min Kp Threshold ({alertKpThreshold})
                    </label>
                    <input
                      id="kp-thresh"
                      type="range"
                      min={3}
                      max={9}
                      value={alertKpThreshold}
                      onChange={(e) =>
                        setAlertPreferences({ alertKpThreshold: Number(e.target.value) })
                      }
                      className="mt-2 w-full accent-[#8CB8FF]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="flare-thresh"
                      className="block font-mono text-[10px] text-[#8A97AA] uppercase"
                    >
                      Min Flare Class
                    </label>
                    <select
                      id="flare-thresh"
                      value={alertFlareClass}
                      onChange={(e) =>
                        setAlertPreferences({
                          alertFlareClass: e.target.value as "C" | "M" | "X",
                        })
                      }
                      className="mt-1.5 w-full rounded border border-white/15 bg-[#060912] px-3 py-1.5 font-mono text-xs text-white"
                    >
                      <option value="C">C-Class &amp; Above</option>
                      <option value="M">M-Class &amp; Above</option>
                      <option value="X">X-Class Extreme Only</option>
                    </select>
                  </div>
                </div>
              )}
            </TelemetryPanel>
          </section>
        </>
      )}
    </main>
  );
}
