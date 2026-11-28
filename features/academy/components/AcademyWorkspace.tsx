"use client";

import Link from "next/link";
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
import type { Lesson, Quiz } from "@/types/academy";
import type { Planet } from "@/types/planet";

type QuizSummary = {
  topic: string;
  title: string;
  level: string;
  questionCount: number;
};

export function AcademyWorkspace() {
  const hydrated = useHasHydrated();
  const completedLessons = useHorizonStore((s) => s.completedLessons);
  const toggleLessonComplete = useHorizonStore((s) => s.toggleLessonComplete);
  const markLessonComplete = useHorizonStore((s) => s.markLessonComplete);
  const quizResults = useHorizonStore((s) => s.quizResults);
  const saveQuizResult = useHorizonStore((s) => s.saveQuizResult);
  const resetAcademyProgress = useHorizonStore((s) => s.resetAcademyProgress);

  const [planets, setPlanets] = useState<Planet[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>("saturn");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [quizLoading, setQuizLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCurriculum = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [planetData, lessonData, quizList] = await Promise.all([
        fetchApi<Planet[]>("/api/planets"),
        fetchApi<Lesson[]>("/api/academy/lessons"),
        fetchApi<QuizSummary[]>("/api/academy/quizzes"),
      ]);
      setPlanets(planetData.filter((p) => p.id !== "sun"));
      setLessons(lessonData);
      setQuizzes(quizList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Space Academy curriculum.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQuizTopic = useCallback(async (topic: string) => {
    setQuizLoading(true);
    try {
      const quizData = await fetchApi<Quiz>(`/api/academy/quizzes/${encodeURIComponent(topic)}`);
      setActiveQuiz(quizData);
      setQuestionIndex(0);
      setSelectedAnswers({});
      setQuizSubmitted(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz.");
    } finally {
      setQuizLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchApi<Planet[]>("/api/planets"),
      fetchApi<Lesson[]>("/api/academy/lessons"),
      fetchApi<QuizSummary[]>("/api/academy/quizzes"),
      fetchApi<Quiz>("/api/academy/quizzes/saturn"),
    ])
      .then(([planetData, lessonData, quizList, quizData]) => {
        if (!active) return;
        setPlanets(planetData.filter((p) => p.id !== "sun"));
        setLessons(lessonData);
        setQuizzes(quizList);
        setActiveQuiz(quizData);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load Space Academy curriculum.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedPlanet = useMemo(
    () => planets.find((p) => p.id === selectedPlanetId) ?? planets[0] ?? null,
    [planets, selectedPlanetId],
  );

  const selectedLesson = useMemo(
    () =>
      lessons.find((l) => l.planetId === selectedPlanetId) ??
      lessons.find((l) => l.id.startsWith(selectedPlanetId)) ??
      lessons[0] ??
      null,
    [lessons, selectedPlanetId],
  );

  const handleSelectOption = (optionIndex: number) => {
    if (!activeQuiz || quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleFinishQuiz = () => {
    if (!activeQuiz) return;
    let score = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) score += 1;
    });
    setQuizSubmitted(true);
    saveQuizResult({
      topic: activeQuiz.topic,
      score,
      total: activeQuiz.questions.length,
      answers: selectedAnswers,
      completedAt: new Date().toISOString(),
    });
    const matchingLesson = lessons.find((l) => l.planetId === activeQuiz.topic);
    if (matchingLesson) {
      markLessonComplete(matchingLesson.id);
    }
  };

  const proficiencyStats = useMemo(() => {
    const entries = hydrated ? Object.values(quizResults) : [];
    const totalCorrect = entries.reduce((acc, r) => acc + r.score, 0);
    const totalQuestions = entries.reduce((acc, r) => acc + r.total, 0);
    const pct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    return {
      entries,
      totalCorrect,
      totalQuestions,
      pct,
      completedLessonCount: hydrated ? completedLessons.length : 0,
    };
  }, [hydrated, quizResults, completedLessons]);

  const currentQuestion = activeQuiz?.questions[questionIndex] ?? null;
  const chosenOption = selectedAnswers[questionIndex];
  const hasChosenCurrent = typeof chosenOption === "number";

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
      <HeroHeader
        eyebrow="ARCHITECTURE PORTAL 06 // CELESTIAL PEDAGOGY"
        titleTop="SPACE ACADEMY"
        titleAccent="CELESTIAL PEDAGOGY"
        titleBottom="& KNOWLEDGE."
        subtitle="Structured astrophysical dossiers and interactive planetary assessments synced directly with NASA fact-sheet telemetry."
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              label={`${proficiencyStats.completedLessonCount} / ${lessons.length || 8} LESSONS`}
              tone="blue"
            />
            <StatusPill
              label={`${proficiencyStats.entries.length} / ${quizzes.length || 8} QUIZZES`}
              tone="emerald"
            />
          </div>
        }
      />

      {error && <ErrorBanner message={error} onRetry={() => void loadCurriculum()} />}

      {loading && planets.length === 0 ? <LoadingPanel lines={4} height="h-56" /> : null}

      {/* Section 1: Planetary Profiles of the Solar System */}
      {planets.length > 0 && (
        <section className="mt-2">
          <TelemetryPanel>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <SectionLabel
                  eyebrow="SOLAR SYSTEM DOSSIERS"
                  title="Planetary Profiles of the Solar System"
                />
                <p className="mt-1 text-xs text-[#95A3B6]">
                  Select any planetary dossier to study physical benchmarks, orbital dynamics, and
                  complete its mastery check.
                </p>
              </div>
              <Link
                href="/solar-system"
                className="font-mono text-[10px] tracking-[0.14em] text-[#8CB8FF] uppercase hover:underline"
              >
                Open 3D Solar System →
              </Link>
            </div>

            <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {planets.map((planet) => {
                const isSelected = planet.id === selectedPlanetId;
                const matchingLesson = lessons.find((l) => l.planetId === planet.id);
                const lessonDone =
                  hydrated && matchingLesson ? completedLessons.includes(matchingLesson.id) : false;

                return (
                  <button
                    key={planet.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlanetId(planet.id);
                      void loadQuizTopic(planet.id);
                    }}
                    className={`group flex flex-col justify-between rounded border p-4 text-left transition ${
                      isSelected
                        ? "border-[#8CB8FF] bg-[#0D172B] shadow-[0_0_24px_rgba(140,184,255,0.16)]"
                        : "border-white/[0.08] bg-[#060912] hover:border-white/25"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.14em] text-[#78879C] uppercase">
                        <span>ORBIT 0{planet.order}</span>
                        <span className={lessonDone ? "text-emerald-300" : "text-[#DFC99D]"}>
                          {lessonDone ? "COMPLETED ✓" : `${planet.moons} MOONS`}
                        </span>
                      </div>

                      <div className="my-4 flex justify-center">
                        <div
                          className="relative h-16 w-16 rounded-full shadow-lg transition-transform duration-300 group-hover:scale-105"
                          style={{
                            background: `radial-gradient(circle at 32% 30%, ${planet.color} 0%, #101522 85%)`,
                          }}
                        >
                          {planet.hasRings && (
                            <div className="absolute top-1/2 left-1/2 h-5 w-24 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-full border border-[#DFC99D]/55" />
                          )}
                        </div>
                      </div>

                      <div className="font-mono text-sm font-semibold tracking-wide text-white uppercase">
                        {planet.name}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#95A3B6]">
                        {planet.summary}
                      </p>
                    </div>

                    <div
                      className={`mt-4 rounded py-1.5 text-center font-mono text-[10px] tracking-[0.12em] uppercase ${
                        isSelected
                          ? "bg-[#96BEFF] font-semibold text-[#05080F]"
                          : "border border-white/10 text-[#8CB8FF]"
                      }`}
                    >
                      {isSelected ? "Dossier Engaged" : "Explore Profile →"}
                    </div>
                  </button>
                );
              })}
            </div>
          </TelemetryPanel>
        </section>
      )}

      {/* Section 2: Selected Planet In-Depth Analysis & Field Lesson */}
      {selectedPlanet && selectedLesson && (
        <section className="mt-8">
          <TelemetryPanel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] tracking-[0.16em] text-[#DFC99D] uppercase">
                  FIELD DOSSIER // {selectedLesson.level}
                </div>
                <h2 className="mt-1 text-2xl font-medium uppercase text-[#EFF4FC]">
                  {selectedPlanet.name} IN-DEPTH ANALYSIS
                </h2>
              </div>
              <button
                type="button"
                onClick={() => toggleLessonComplete(selectedLesson.id)}
                className={`rounded px-4 py-2 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase transition ${
                  hydrated && completedLessons.includes(selectedLesson.id)
                    ? "border border-emerald-400/50 bg-emerald-400/15 text-emerald-300"
                    : "bg-[#96BEFF] text-[#05080F] hover:bg-[#B2D0FF]"
                }`}
              >
                {hydrated && completedLessons.includes(selectedLesson.id)
                  ? "Lesson Completed ✓"
                  : "Mark Lesson Complete"}
              </button>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7 flex flex-col justify-between rounded border border-white/[0.08] bg-[#060912] p-5">
                <div>
                  <h3 className="text-lg font-medium text-white">{selectedLesson.title}</h3>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#B4C0D2]">
                    {selectedLesson.body.split("\n\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
                  <span className="font-mono text-[10px] text-[#78879C]">
                    NASA PLANETARY FACT SHEET VERIFIED
                  </span>
                  <Link
                    href={`/solar-system?planet=${selectedPlanet.id}`}
                    className="font-mono text-[10px] tracking-[0.14em] text-[#8CB8FF] uppercase hover:underline"
                  >
                    Launch {selectedPlanet.name} in 3D →
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 grid grid-cols-2 gap-2.5">
                <MetricCell
                  label="MEAN RADIUS"
                  value={`${selectedPlanet.radiusKm.toLocaleString()} km`}
                  highlight
                />
                <MetricCell
                  label="SURFACE GRAVITY"
                  value={`${selectedPlanet.gravityMs2} m/s²`}
                  highlight
                />
                <MetricCell label="MEAN TEMP" value={`${selectedPlanet.meanTempC} °C`} />
                <MetricCell
                  label="ORBITAL PERIOD"
                  value={
                    selectedPlanet.orbit
                      ? `${selectedPlanet.orbit.periodDays.toLocaleString()} d`
                      : "—"
                  }
                />
                <MetricCell label="AXIAL TILT" value={`${selectedPlanet.axialTiltDeg}°`} />
                <MetricCell label="CONFIRMED MOONS" value={`${selectedPlanet.moons}`} highlight />
              </div>
            </div>
          </TelemetryPanel>
        </section>
      )}

      {/* Section 3: Interactive Quiz Engine */}
      <section id="quiz" className="mt-8">
        <TelemetryPanel>
          <div className="text-center">
            <div className="font-mono text-[10px] tracking-[0.18em] text-[#DFC99D] uppercase">
              OBSERVATIONAL ASSESSMENT ENGINE
            </div>
            <h2 className="mt-1 text-2xl font-medium text-[#EFF4FC]">
              READY TO TEST YOUR SPACE KNOWLEDGE?
            </h2>
            <p className="mx-auto mt-1 max-w-xl text-xs text-[#95A3B6]">
              Select a planetary topic below to launch a timed-style scientific verification quiz
              with instant explanations.
            </p>
          </div>

          {/* Topic Selector Pills */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {quizzes.map((q) => {
              const isCurrent = activeQuiz?.topic === q.topic;
              const prevResult = hydrated ? quizResults[q.topic] : undefined;
              return (
                <button
                  key={q.topic}
                  type="button"
                  onClick={() => void loadQuizTopic(q.topic)}
                  className={`rounded border px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase transition ${
                    isCurrent
                      ? "border-[#8CB8FF] bg-[#96BEFF] font-semibold text-[#05080F]"
                      : prevResult
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:border-emerald-300"
                        : "border-white/10 bg-[#060912] text-[#B4C0D2] hover:border-white/30"
                  }`}
                >
                  {q.topic} {prevResult ? `(${prevResult.score}/${prevResult.total})` : ""}
                </button>
              );
            })}
          </div>

          {/* Active Question Card */}
          {quizLoading ? (
            <div className="mt-6">
              <LoadingPanel lines={4} height="h-52" />
            </div>
          ) : activeQuiz && currentQuestion ? (
            <div className="mt-6 rounded border border-white/[0.08] bg-[#060912] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-[#78879C] uppercase">
                <span>
                  MODULE // {activeQuiz.title} ({activeQuiz.level})
                </span>
                <span>
                  QUESTION {questionIndex + 1} OF {activeQuiz.questions.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1 w-full overflow-hidden rounded bg-white/10">
                <div
                  className="h-full bg-[#8CB8FF] transition-all duration-300"
                  style={{
                    width: `${((questionIndex + 1) / activeQuiz.questions.length) * 100}%`,
                  }}
                />
              </div>

              <h3 className="mt-5 text-lg font-medium text-white">{currentQuestion.question}</h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {currentQuestion.options.map((opt, idx) => {
                  const isChosen = chosenOption === idx;
                  const isCorrect = idx === currentQuestion.answer;
                  const showState = hasChosenCurrent || quizSubmitted;

                  let style =
                    "border-white/10 bg-[#0B101B] text-[#D8E1EE] hover:border-[#8CB8FF]/50";
                  if (showState) {
                    if (isCorrect) {
                      style = "border-emerald-400/70 bg-emerald-500/15 text-emerald-200";
                    } else if (isChosen && !isCorrect) {
                      style = "border-rose-400/70 bg-rose-500/15 text-rose-200";
                    }
                  } else if (isChosen) {
                    style = "border-[#8CB8FF] bg-[#8CB8FF]/15 text-white";
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      className={`rounded border p-3.5 text-left text-sm transition ${style}`}
                    >
                      <span className="mr-2 font-mono text-xs text-[#8CB8FF]">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {hasChosenCurrent && (
                <div className="mt-4 rounded border border-[#8CB8FF]/30 bg-[#0A1324] p-3.5 text-xs leading-relaxed text-[#C7D6EA]">
                  <span className="font-mono font-semibold text-[#8CB8FF] uppercase">
                    Scientific Explanation:{" "}
                  </span>
                  {currentQuestion.explanation}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
                <button
                  type="button"
                  disabled={questionIndex === 0}
                  onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                  className="rounded border border-white/15 px-3.5 py-2 font-mono text-[10px] tracking-[0.12em] text-[#B4C0D2] uppercase disabled:opacity-40"
                >
                  ← Previous
                </button>

                {questionIndex < activeQuiz.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setQuestionIndex((i) => Math.min(activeQuiz.questions.length - 1, i + 1))
                    }
                    className="rounded bg-[#96BEFF] px-4 py-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-[#05080F] uppercase hover:bg-[#B2D0FF]"
                  >
                    Next Question →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishQuiz}
                    className="rounded bg-emerald-400 px-4 py-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-[#05080F] uppercase hover:bg-emerald-300"
                  >
                    {quizSubmitted ? "Result Recorded ✓" : "Submit Assessment"}
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </TelemetryPanel>
      </section>

      {/* Section 4: Cadet Observational Proficiency & Benchmark Audit */}
      <section className="mt-8">
        <TelemetryPanel>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <SectionLabel
                eyebrow="ASSESSMENT TELEMETRY"
                title="Cadet Observational Proficiency & Benchmark Audit"
              />
            </div>
            <button
              type="button"
              onClick={resetAcademyProgress}
              className="rounded border border-white/15 px-3 py-1 font-mono text-[10px] tracking-[0.12em] text-[#95A3B6] uppercase transition hover:border-rose-400/50 hover:text-rose-200"
            >
              Reset Progress
            </button>
          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-12">
            <div className="flex flex-col items-center justify-center rounded border border-white/[0.08] bg-[#060912] p-5 md:col-span-4">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="#8CB8FF"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - proficiencyStats.pct / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="font-mono text-2xl font-semibold text-white">
                    {proficiencyStats.pct}%
                  </div>
                  <div className="font-mono text-[9px] text-[#78879C] uppercase">PROFICIENCY</div>
                </div>
              </div>
              <div className="mt-3 font-mono text-xs text-[#DFC99D]">
                {proficiencyStats.totalCorrect} / {proficiencyStats.totalQuestions} CORRECT
              </div>
            </div>

            <div className="space-y-3 rounded border border-white/[0.08] bg-[#060912] p-5 md:col-span-8">
              <div className="font-mono text-[10px] tracking-[0.14em] text-[#78879C] uppercase">
                DOMAIN ACCURACY BREAKDOWN
              </div>
              {quizzes.map((q) => {
                const res = hydrated ? quizResults[q.topic] : undefined;
                const pct = res ? Math.round((res.score / res.total) * 100) : 0;
                return (
                  <div key={q.topic}>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-[#D8E1EE] uppercase">{q.title}</span>
                      <span className="text-[#8CB8FF]">
                        {res ? `${pct}% (${res.score}/${res.total})` : "Not Attempted"}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-white/10">
                      <div
                        className="h-full bg-[#8CB8FF] transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TelemetryPanel>
      </section>
    </main>
  );
}
