"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HeroHeader, StatusPill, TelemetryPanel } from "@/components/ui/ObservatoryPrimitives";
import { SolarSystemCanvas } from "@/features/solar-system/components/SolarSystemCanvas";
import { fetchApi, fetchApiWithHeaders } from "@/lib/api";
import { useHasHydrated, useHorizonStore } from "@/store/useHorizonStore";
import type { Lesson } from "@/types/academy";
import type { Apod } from "@/types/apod";
import type { Asteroid } from "@/types/asteroid";
import type { Exoplanet } from "@/types/exoplanet";
import type { Planet } from "@/types/planet";
import type { SpaceWeatherEvent } from "@/types/space-weather";

type QuizSummary = {
  topic: string;
  title: string;
  level: string;
  questionCount: number;
};

export function HomeObservatory() {
  const hydrated = useHasHydrated();
  const completedLessons = useHorizonStore((s) => s.completedLessons);
  const quizResults = useHorizonStore((s) => s.quizResults);

  const [planets, setPlanets] = useState<Planet[]>([]);
  const [selectedPlanetId, setSelectedPlanetId] = useState("saturn");
  const [apod, setApod] = useState<Apod | null>(null);
  const [apodError, setApodError] = useState<string | null>(null);
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [asteroidsError, setAsteroidsError] = useState<string | null>(null);
  const [weather, setWeather] = useState<SpaceWeatherEvent[]>([]);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [exoplanets, setExoplanets] = useState<Exoplanet[]>([]);
  const [exoplanetTotal, setExoplanetTotal] = useState<number>(35);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);

  useEffect(() => {
    fetchApi<Planet[]>("/api/planets")
      .then(setPlanets)
      .catch(() => {});

    fetchApi<Apod>("/api/apod")
      .then(setApod)
      .catch((err) => setApodError(err instanceof Error ? err.message : "APOD feed unavailable"));

    fetchApi<Asteroid[]>("/api/asteroids")
      .then(setAsteroids)
      .catch((err) =>
        setAsteroidsError(err instanceof Error ? err.message : "NeoWs feed unavailable"),
      );

    fetchApi<SpaceWeatherEvent[]>("/api/space-weather?days=30")
      .then(setWeather)
      .catch((err) =>
        setWeatherError(err instanceof Error ? err.message : "DONKI feed unavailable"),
      );

    fetchApiWithHeaders<Exoplanet[]>("/api/exoplanets?page=1")
      .then(({ data, headers }) => {
        setExoplanets(data);
        const total = Number(headers.get("X-Total-Count"));
        if (Number.isFinite(total) && total > 0) setExoplanetTotal(total);
      })
      .catch(() => {});

    fetchApi<Lesson[]>("/api/academy/lessons")
      .then(setLessons)
      .catch(() => {});

    fetchApi<QuizSummary[]>("/api/academy/quizzes")
      .then(setQuizzes)
      .catch(() => {});
  }, []);

  const selectedPlanet = useMemo(
    () => planets.find((p) => p.id === selectedPlanetId) ?? planets[6] ?? planets[0],
    [planets, selectedPlanetId],
  );

  const weatherSummary = useMemo(() => {
    const flares = weather.filter((e) => e.kind === "flare");
    const storms = weather.filter((e) => e.kind === "storm");
    const cmes = weather.filter((e) => e.kind === "cme");

    const topFlare = flares[0]?.classType ?? "Nominal";
    const maxKp = storms.reduce((acc, s) => Math.max(acc, s.maxKp), 0);
    const maxCmeSpeed = cmes.reduce((acc, c) => Math.max(acc, c.speedKmPerSec ?? 0), 0);
    const latestSummary = weather[0]?.summary ?? "Monitoring NASA DONKI heliospheric telemetry.";

    return { topFlare, maxKp, maxCmeSpeed, latestSummary };
  }, [weather]);

  const nearestAsteroids = useMemo(
    () => [...asteroids].sort((a, b) => a.missDistanceKm - b.missDistanceKm).slice(0, 4),
    [asteroids],
  );

  const closestExoplanet = exoplanets[0];
  const habitableCount = useMemo(
    () => exoplanets.filter((p) => p.inHabitableZone).length,
    [exoplanets],
  );

  const completedQuizCount = hydrated ? Object.keys(quizResults).length : 0;
  const completedLessonCount = hydrated ? completedLessons.length : 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
      {/* Hero Header (matches Prototypes 2 & 4) */}
      <HeroHeader
        titleTop="EXPLORE"
        titleAccent="BEYOND OUR"
        titleBottom="UNIVERSE."
        subtitle="Direct scientific downlink stream observing solar heliospheric flux, near-Earth orbital vectors, planetary dynamics, and confirmed exoplanet systems."
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label="LIVE NASA DOWNLINK" tone="blue" />
            <Link
              href="/solar-system"
              className="rounded bg-[#96BEFF] px-4 py-2 font-mono text-[11px] font-semibold tracking-[0.12em] text-[#05080F] uppercase transition hover:bg-[#B2D0FF]"
            >
              Launch 3D Explorer →
            </Link>
          </div>
        }
      />

      {/* ARCHITECTURE PORTAL 01: Interactive Solar System */}
      <section className="mt-4">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-[#7D8C9F] uppercase">
              ARCHITECTURE PORTAL 01
            </div>
            <h2 className="mt-0.5 text-2xl font-medium text-[#EFF4FC]">Interactive Solar System</h2>
          </div>
          <Link
            href="/solar-system"
            className="font-mono text-[10px] tracking-[0.16em] text-[#8CB8FF] uppercase transition hover:text-white"
          >
            KEPLERIAN HELIOCENTRIC PROJECTION →
          </Link>
        </div>

        <TelemetryPanel>
          <SolarSystemCanvas
            planets={planets}
            selectedPlanetId={selectedPlanetId}
            onSelectPlanet={setSelectedPlanetId}
            speedMultiplier={1}
            showOrbits
            showLabels={false}
            compact
          />

          <div className="mt-4 grid gap-4 border-t border-white/[0.07] pt-4 sm:grid-cols-3">
            <div>
              <div className="font-mono text-[9px] tracking-[0.16em] text-[#748499] uppercase">
                SELECTED TELEMETRY FOCUS
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#AEB9C9]">
                {selectedPlanet
                  ? `${selectedPlanet.name} (${selectedPlanet.type.replace("-", " ")}) — ${selectedPlanet.summary}`
                  : "Click any orbiting body in the 3D viewport to inspect its orbital telemetry."}
              </p>
            </div>
            <div>
              <div className="font-mono text-[9px] tracking-[0.16em] text-[#748499] uppercase">
                AXIAL INCLINATION &amp; ORBIT
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#AEB9C9]">
                {selectedPlanet
                  ? `Axial tilt ${selectedPlanet.axialTiltDeg}°. ${
                      selectedPlanet.orbit
                        ? `Semi-major axis ${selectedPlanet.orbit.semiMajorAxisAu} AU with ${selectedPlanet.orbit.periodDays.toLocaleString("en-US")} day period.`
                        : "Central yellow dwarf star holding 99.8% of system mass."
                    }`
                  : "Calibrated to NASA Planetary Fact Sheet orbital elements."}
              </p>
            </div>
            <div className="flex flex-col justify-between gap-2">
              <div>
                <div className="font-mono text-[9px] tracking-[0.16em] text-[#748499] uppercase">
                  OBSERVATIONAL MODE
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#AEB9C9]">
                  3D WebGL heliocentric viewport with orbital path comparison &amp; physical ratio
                  analyzer.
                </p>
              </div>
              <Link
                href={`/solar-system${selectedPlanet ? `?planet=${selectedPlanet.id}` : ""}`}
                className="font-mono text-[10px] tracking-[0.14em] text-[#8CB8FF] uppercase hover:underline"
              >
                Inspect Full 3D System →
              </Link>
            </div>
          </div>
        </TelemetryPanel>
      </section>

      {/* ARCHITECTURE PORTAL 02: NASA Daily Discoveries */}
      <section className="mt-12">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-[#7D8C9F] uppercase">
              ARCHITECTURE PORTAL 02
            </div>
            <h2 className="mt-0.5 text-2xl font-medium text-[#EFF4FC]">NASA Daily Discoveries</h2>
          </div>
          <Link
            href="/discoveries"
            className="font-mono text-[10px] tracking-[0.16em] text-[#8CB8FF] uppercase transition hover:text-white"
          >
            OPEN ARCHIVE &amp; FAVOURITES →
          </Link>
        </div>

        <TelemetryPanel>
          {apod ? (
            <div className="grid gap-6 md:grid-cols-12 md:items-center">
              <div className="overflow-hidden rounded border border-white/10 bg-black/50 md:col-span-6">
                {apod.mediaType === "video" ? (
                  <div className="flex aspect-video items-center justify-center bg-[#060912] p-4 text-center">
                    <div>
                      <StatusPill label="APOD VIDEO DISPATCH" tone="gold" />
                      <p className="mt-2 text-xs text-[#9AA6B8]">
                        Today&apos;s featured Astronomy Picture of the Day is a video stream.
                      </p>
                      <Link
                        href="/discoveries"
                        className="mt-3 inline-block font-mono text-[11px] text-[#8CB8FF] uppercase hover:underline"
                      >
                        Play in Discoveries →
                      </Link>
                    </div>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={apod.url}
                    alt={apod.title}
                    className="aspect-video w-full object-cover transition duration-500 hover:scale-[1.02]"
                  />
                )}
              </div>

              <div className="md:col-span-6">
                <div className="flex items-center gap-2">
                  <StatusPill label={`APOD // ${apod.date}`} tone="blue" />
                  {apod.copyright && (
                    <span className="truncate font-mono text-[10px] text-[#7A879A]">
                      © {apod.copyright}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-serif text-2xl font-medium tracking-wide text-[#F3EFE6] sm:text-3xl">
                  {apod.title}
                </h3>
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-[#A3B0C2]">
                  {apod.explanation}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    href="/discoveries"
                    className="rounded bg-[#96BEFF] px-4 py-2 font-mono text-[11px] font-semibold tracking-[0.12em] text-[#05080F] uppercase transition hover:bg-[#B2D0FF]"
                  >
                    Explore Discovery →
                  </Link>
                  <span className="font-mono text-[10px] text-[#6E7E94]">
                    SOURCE: SCIENCE.NASA.GOV APOD
                  </span>
                </div>
              </div>
            </div>
          ) : apodError ? (
            <div className="flex flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center">
              <p className="text-sm text-[#9AA6B8]">{apodError}</p>
              <Link
                href="/discoveries"
                className="rounded border border-white/15 px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-[#8CB8FF] uppercase"
              >
                Open Discoveries Archive →
              </Link>
            </div>
          ) : (
            <div className="h-48 animate-pulse rounded bg-white/[0.04]" />
          )}
        </TelemetryPanel>
      </section>

      {/* ARCHITECTURE PORTAL 03: Asteroid Tracker & Orbital Vectors */}
      <section className="mt-12">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-[#7D8C9F] uppercase">
              ARCHITECTURE PORTAL 03
            </div>
            <h2 className="mt-0.5 text-2xl font-medium text-[#EFF4FC]">
              Asteroid Tracker &amp; Orbital Vectors
            </h2>
          </div>
          <Link
            href="/asteroids"
            className="font-mono text-[10px] tracking-[0.16em] text-[#8CB8FF] uppercase transition hover:text-white"
          >
            OPEN INTERCEPT RADAR →
          </Link>
        </div>

        <TelemetryPanel>
          {/* Lunar Distance Axis */}
          <div className="mb-5 rounded border border-white/[0.07] bg-[#060911]/85 p-4">
            <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.15em] text-[#78879C] uppercase">
              <span>EARTH PROXIMITY AXIS (0.0 — 60+ LUNAR DISTANCES)</span>
              <span className="text-[#8CB8FF]">{asteroids.length} NEOs TRACKED THIS WEEK</span>
            </div>
            <div className="relative mt-4 h-3 rounded-full bg-white/[0.05]">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#8CB8FF]/60 to-transparent"
                style={{ width: "22%" }}
              />
              {nearestAsteroids.map((neo) => {
                const pct = Math.min(96, Math.max(4, (neo.missDistanceLunar / 65) * 100));
                return (
                  <div
                    key={neo.id}
                    title={`${neo.name}: ${neo.missDistanceLunar} LD`}
                    className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                      neo.isPotentiallyHazardous
                        ? "border-rose-300 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                        : "border-[#8CB8FF] bg-[#8CB8FF] shadow-[0_0_8px_rgba(140,184,255,0.7)]"
                    }`}
                    style={{ left: `${pct}%` }}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[9px] text-[#6E7D92]">
              <span>0.0 LD (EARTH)</span>
              <span>1.0 LD (384,400 KM // MOON)</span>
              <span>30 LD</span>
              <span>65+ LD</span>
            </div>
          </div>

          {nearestAsteroids.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[10px] tracking-[0.14em] text-[#6F7E93] uppercase">
                    <th className="py-2 pr-4 font-medium">Designation</th>
                    <th className="py-2 pr-4 font-medium">Miss Distance</th>
                    <th className="py-2 pr-4 font-medium">Rel. Velocity</th>
                    <th className="py-2 pr-4 font-medium">Est. Diameter</th>
                    <th className="py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {nearestAsteroids.map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 pr-4 font-medium text-[#E8EDF5]">{a.name}</td>
                      <td className="py-2.5 pr-4 tabular-nums text-[#AEB9C9]">
                        {a.missDistanceKm.toLocaleString("en-US")} km ({a.missDistanceLunar} LD)
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums text-[#AEB9C9]">
                        {a.velocityKmPerSec} km/s
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums text-[#AEB9C9]">
                        {a.diameterKm.min} – {a.diameterKm.max} km
                      </td>
                      <td className="py-2.5 text-right">
                        <StatusPill
                          label={a.isPotentiallyHazardous ? "HAZARDOUS" : "NOMINAL"}
                          tone={a.isPotentiallyHazardous ? "danger" : "emerald"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : asteroidsError ? (
            <p className="text-sm text-[#9AA6B8]">{asteroidsError}</p>
          ) : (
            <div className="h-32 animate-pulse rounded bg-white/[0.04]" />
          )}
        </TelemetryPanel>
      </section>

      {/* PORTAL 04 // HELIOPHYSICS & PORTAL 05 // DEEP HORIZON */}
      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <TelemetryPanel className="observatory-panel-hover flex flex-col justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-[#7D8C9F] uppercase">
              PORTAL 04 // HELIOPHYSICS
            </div>
            <h3 className="mt-1 text-xl font-medium text-[#EFF4FC]">
              Space Weather &amp; Solar Flux
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-[#9AA6B8]">
              {weatherError ? weatherError : weatherSummary.latestSummary}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              <div className="rounded border border-white/[0.07] bg-[#060A12] p-3">
                <div className="font-mono text-[9px] tracking-[0.14em] text-[#6F7E93] uppercase">
                  RECENT FLARE
                </div>
                <div className="mt-1 font-mono text-base font-semibold text-[#E8EDF5]">
                  {weatherSummary.topFlare}
                </div>
              </div>
              <div className="rounded border border-white/[0.07] bg-[#060A12] p-3">
                <div className="font-mono text-[9px] tracking-[0.14em] text-[#6F7E93] uppercase">
                  PEAK KP INDEX
                </div>
                <div className="mt-1 font-mono text-base font-semibold text-emerald-300">
                  {weatherSummary.maxKp > 0 ? `Kp ${weatherSummary.maxKp}` : "Quiet"}
                </div>
              </div>
              <div className="rounded border border-white/[0.07] bg-[#060A12] p-3">
                <div className="font-mono text-[9px] tracking-[0.14em] text-[#6F7E93] uppercase">
                  MAX CME VEL
                </div>
                <div className="mt-1 font-mono text-base font-semibold text-[#8CB8FF]">
                  {weatherSummary.maxCmeSpeed > 0
                    ? `${Math.round(weatherSummary.maxCmeSpeed)} km/s`
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-white/[0.07] pt-3">
            <Link
              href="/space-weather"
              className="font-mono text-[10px] tracking-[0.15em] text-[#8CB8FF] uppercase hover:underline"
            >
              Open Heliospheric Observatory →
            </Link>
          </div>
        </TelemetryPanel>

        <TelemetryPanel className="observatory-panel-hover flex flex-col justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-[#7D8C9F] uppercase">
              PORTAL 05 // DEEP HORIZON
            </div>
            <h3 className="mt-1 text-xl font-medium text-[#EFF4FC]">Beyond Our Solar System</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-[#9AA6B8]">
              {closestExoplanet
                ? closestExoplanet.highlight
                : "Confirmed exoplanets from the NASA Exoplanet Archive, including habitable-zone candidates and multi-planet star systems."}
            </p>
            <div className="mt-5 space-y-2 rounded border border-white/[0.07] bg-[#060A12] p-3.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#78879C]">Nearest Confirmed Exoplanet:</span>
                <span className="text-[#DFC99D]">
                  {closestExoplanet
                    ? `${closestExoplanet.name} (${closestExoplanet.hostStar.distanceLy ?? "?"} ly)`
                    : "Proxima Cen b (4.2 ly)"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#78879C]">Cataloged Worlds / Habitable Sample:</span>
                <span className="text-[#8CB8FF]">
                  {exoplanetTotal} Worlds · {habitableCount} HZ in Page 1
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-white/[0.07] pt-3">
            <Link
              href="/exoplanets"
              className="font-mono text-[10px] tracking-[0.15em] text-[#8CB8FF] uppercase hover:underline"
            >
              Explore Exoplanet Catalog →
            </Link>
          </div>
        </TelemetryPanel>
      </section>

      {/* ARCHITECTURE PORTAL 06: Space Academy // Research Division */}
      <section className="mt-12">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-[#7D8C9F] uppercase">
              ARCHITECTURE PORTAL 06
            </div>
            <h2 className="mt-0.5 text-2xl font-medium text-[#EFF4FC]">
              Space Academy // Research Division
            </h2>
          </div>
          <Link
            href="/academy"
            className="font-mono text-[10px] tracking-[0.16em] text-[#8CB8FF] uppercase transition hover:text-white"
          >
            CURRICULUM &amp; ASSESSMENTS →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/academy" className="group">
            <TelemetryPanel className="observatory-panel-hover h-full">
              <div className="font-mono text-[10px] tracking-[0.16em] text-[#DFC99D] uppercase">
                MODULE 01 // PLANETARY PROFILES
              </div>
              <h3 className="mt-2 text-lg font-medium text-white group-hover:text-[#8CB8FF]">
                Solar System Field Curriculum
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#95A3B6]">
                {lessons.length > 0
                  ? `${lessons.length} structured planetary dossiers synced directly with NASA fact-sheet telemetry.`
                  : "Structured planetary dossiers from Mercury to Neptune."}
              </p>
              <div className="mt-4 font-mono text-[10px] text-[#8CB8FF]">
                {completedLessonCount} / {lessons.length || 8} LESSONS COMPLETED
              </div>
            </TelemetryPanel>
          </Link>

          <Link href="/academy#quiz" className="group">
            <TelemetryPanel className="observatory-panel-hover h-full">
              <div className="font-mono text-[10px] tracking-[0.16em] text-[#DFC99D] uppercase">
                MODULE 02 // KNOWLEDGE CHECKS
              </div>
              <h3 className="mt-2 text-lg font-medium text-white group-hover:text-[#8CB8FF]">
                Topic Mastery Assessments
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#95A3B6]">
                {quizzes.length > 0
                  ? `${quizzes.length} topic quizzes with instant scientific explanations and proficiency tracking.`
                  : "Interactive planetary quizzes with instant scientific feedback."}
              </p>
              <div className="mt-4 font-mono text-[10px] text-[#8CB8FF]">
                {completedQuizCount} / {quizzes.length || 8} QUIZZES COMPLETED
              </div>
            </TelemetryPanel>
          </Link>

          <Link href="/solar-system" className="group">
            <TelemetryPanel className="observatory-panel-hover h-full">
              <div className="font-mono text-[10px] tracking-[0.16em] text-[#DFC99D] uppercase">
                MODULE 03 // 3D CORRELATION
              </div>
              <h3 className="mt-2 text-lg font-medium text-white group-hover:text-[#8CB8FF]">
                Orbital Mechanics Lab
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#95A3B6]">
                Cross-reference Academy lessons with the live 3D Solar System scale &amp;
                eccentricity visualizer.
              </p>
              <div className="mt-4 font-mono text-[10px] text-[#8CB8FF]">
                LAUNCH 3D CORRELATION →
              </div>
            </TelemetryPanel>
          </Link>
        </div>
      </section>
    </main>
  );
}
