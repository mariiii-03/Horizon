"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Apod } from "@/types/apod";
import type { Exoplanet } from "@/types/exoplanet";

export type QuizResultEntry = {
  topic: string;
  score: number;
  total: number;
  answers: Record<number, number>;
  completedAt: string;
};

type HorizonState = {
  // Saved NASA Daily Discoveries (APOD)
  savedDiscoveries: Apod[];
  toggleSavedDiscovery: (apod: Apod) => void;
  isDiscoverySaved: (date: string) => boolean;

  // Exoplanets saved list
  savedExoplanets: Exoplanet[];
  toggleSavedExoplanet: (planet: Exoplanet) => void;
  isExoplanetSaved: (id: string) => boolean;

  // Asteroid Watchlist
  watchedAsteroids: string[];
  toggleWatchedAsteroid: (id: string) => void;

  // Space Weather Early Warning Preferences
  alertKpThreshold: number;
  alertFlareClass: "C" | "M" | "X";
  alertsEnabled: boolean;
  setAlertPreferences: (prefs: {
    alertKpThreshold?: number;
    alertFlareClass?: "C" | "M" | "X";
    alertsEnabled?: boolean;
  }) => void;

  // Space Academy Progress
  completedLessons: string[];
  toggleLessonComplete: (lessonId: string) => void;
  markLessonComplete: (lessonId: string) => void;
  quizResults: Record<string, QuizResultEntry>;
  saveQuizResult: (entry: QuizResultEntry) => void;
  resetAcademyProgress: () => void;
};

export const useHorizonStore = create<HorizonState>()(
  persist(
    (set, get) => ({
      // APOD
      savedDiscoveries: [],
      toggleSavedDiscovery: (apod) => {
        const exists = get().savedDiscoveries.some((d) => d.date === apod.date);
        set({
          savedDiscoveries: exists
            ? get().savedDiscoveries.filter((d) => d.date !== apod.date)
            : [apod, ...get().savedDiscoveries],
        });
      },
      isDiscoverySaved: (date) => get().savedDiscoveries.some((d) => d.date === date),

      // Exoplanets
      savedExoplanets: [],
      toggleSavedExoplanet: (planet) => {
        const exists = get().savedExoplanets.some((p) => p.id === planet.id);
        set({
          savedExoplanets: exists
            ? get().savedExoplanets.filter((p) => p.id !== planet.id)
            : [planet, ...get().savedExoplanets],
        });
      },
      isExoplanetSaved: (id) => get().savedExoplanets.some((p) => p.id === id),

      // Asteroids
      watchedAsteroids: [],
      toggleWatchedAsteroid: (id) => {
        const exists = get().watchedAsteroids.includes(id);
        set({
          watchedAsteroids: exists
            ? get().watchedAsteroids.filter((i) => i !== id)
            : [...get().watchedAsteroids, id],
        });
      },

      // Space Weather settings
      alertKpThreshold: 5,
      alertFlareClass: "M",
      alertsEnabled: true,
      setAlertPreferences: (prefs) =>
        set((state) => ({
          alertKpThreshold: prefs.alertKpThreshold ?? state.alertKpThreshold,
          alertFlareClass: prefs.alertFlareClass ?? state.alertFlareClass,
          alertsEnabled: prefs.alertsEnabled ?? state.alertsEnabled,
        })),

      // Academy progress
      completedLessons: [],
      toggleLessonComplete: (lessonId) => {
        const exists = get().completedLessons.includes(lessonId);
        set({
          completedLessons: exists
            ? get().completedLessons.filter((i) => i !== lessonId)
            : [...get().completedLessons, lessonId],
        });
      },
      markLessonComplete: (lessonId) => {
        if (!get().completedLessons.includes(lessonId)) {
          set({ completedLessons: [...get().completedLessons, lessonId] });
        }
      },
      quizResults: {},
      saveQuizResult: (entry) =>
        set((state) => ({
          quizResults: { ...state.quizResults, [entry.topic]: entry },
        })),
      resetAcademyProgress: () => set({ completedLessons: [], quizResults: {} }),
    }),
    { name: "horizon-observatory-store-v1" }
  )
);

const emptySubscribe = () => () => {};

/** Avoid SSR hydration mismatches when reading persisted Zustand state. */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
