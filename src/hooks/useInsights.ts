import { useState, useEffect } from 'react';
import { getAllEntries } from '@/lib/db';
import {
  calculateRollingAverages,
  calculateDrift,
  estimateFreeRunningPeriod,
  normalizeSleepSpan,
  type FreeRunningPeriodResult,
  type SleepEntry,
} from '@/lib/circadian';

// Calendar date string (YYYY-MM-DD) of a sleep entry — used for streak and extremes
function entryDate(entry: SleepEntry): string {
  const span = normalizeSleepSpan(entry);
  // localBedDate is the "night anchor" date; fall back to sleep start if bed time absent
  return span.localBedDate ?? span.localSleepStartDate;
}

// Returns dateStr minus n days, formatted YYYY-MM-DD.
// Noon anchor avoids DST boundary issues when stepping backward.
function subtractDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - n);
  return new Intl.DateTimeFormat('en-CA').format(d);
}

function calculateStreak(active: SleepEntry[]): number {
  if (active.length === 0) return 0;

  const dateSet = new Set<string>();
  for (const entry of active) {
    dateSet.add(entryDate(entry));
  }

  const today = new Intl.DateTimeFormat('en-CA').format(new Date());
  const yesterday = subtractDays(today, 1);

  // Start from today; if no session today, start from yesterday — streak not broken
  let current = dateSet.has(today) ? today : dateSet.has(yesterday) ? yesterday : null;
  if (!current) return 0;

  let streak = 0;
  while (dateSet.has(current)) {
    streak++;
    current = subtractDays(current, 1);
  }
  return streak;
}

export interface InsightsData {
  isLoading: boolean;

  // Rolling averages — null when no entries fall in the window.
  // entryCount tells the UI how many sessions the average is based on.
  avg7d: { durationMinutes: number; quality: number; entryCount: number } | null;
  avg30d: { durationMinutes: number; quality: number; entryCount: number } | null;

  // Drift — null when fewer than 2 main-sleep sessions
  avgDriftMinutesPerCycle: number | null;

  // Session extremes across all active sessions
  longestSession: { durationMinutes: number; date: string } | null;
  shortestSession: { durationMinutes: number; date: string } | null;

  // Counts
  totalSessions: number;
  mainSleepCount: number;
  napCount: number;

  // Number of days spanned from earliest to latest active entry.
  // Used by the 30-Day Avg card to show a contextual note when the
  // dataset covers fewer than 30 days.
  dataSpanDays: number;

  // Streak — consecutive calendar days with at least one logged session
  currentStreakDays: number;

  // Free-running period — passed through from estimateFreeRunningPeriod()
  freeRunningPeriod: FreeRunningPeriodResult;
}

export function useInsights(): InsightsData {
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getAllEntries()
      .then(all => {
        if (cancelled) return;
        setEntries(all);
      })
      .catch(() => {
        // Silently swallow — display layer shows zeros / pending on empty data
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // All non-deleted entries — engine functions handle their own filtering too,
  // but we need the active set ourselves for totals, extremes, and streak
  const active = entries.filter(e => !e.isDeleted);

  // ── Rolling averages ───────────────────────────────────────────────────────

  const raw7d = calculateRollingAverages(entries, 7);
  const avg7d = raw7d.entryCount > 0
    ? { durationMinutes: raw7d.avgDurationMinutes, quality: raw7d.avgQuality, entryCount: raw7d.entryCount }
    : null;

  const raw30d = calculateRollingAverages(entries, 30);
  const avg30d = raw30d.entryCount > 0
    ? { durationMinutes: raw30d.avgDurationMinutes, quality: raw30d.avgQuality, entryCount: raw30d.entryCount }
    : null;

  // ── Drift ─────────────────────────────────────────────────────────────────

  const driftResult = calculateDrift(entries);
  // entryCount < 2 means calculateDrift() had no consecutive pair to compare
  const avgDriftMinutesPerCycle = driftResult.entryCount >= 2
    ? driftResult.minutesPerCycle
    : null;

  // ── Session extremes ───────────────────────────────────────────────────────

  let longestSession: InsightsData['longestSession'] = null;
  let shortestSession: InsightsData['shortestSession'] = null;

  for (const entry of active) {
    const durationMinutes =
      (new Date(entry.wakeUtc).getTime() - new Date(entry.sleepStartUtc).getTime()) / 60000;
    const date = entryDate(entry);

    if (!longestSession || durationMinutes > longestSession.durationMinutes) {
      longestSession = { durationMinutes, date };
    }
    if (!shortestSession || durationMinutes < shortestSession.durationMinutes) {
      shortestSession = { durationMinutes, date };
    }
  }

  // ── Session type counts ────────────────────────────────────────────────────

  const mainSleepCount = active.filter(e => e.sessionType === 'main').length;
  const napCount = active.filter(e => e.sessionType === 'nap').length;

  // ── Data span ─────────────────────────────────────────────────────────────
  // Days from the earliest to the latest active entry.
  // Requires at least 2 entries; returns 0 for 0 or 1 entries.

  let dataSpanDays = 0;
  if (active.length >= 2) {
    const times = active.map(e => new Date(e.sleepStartUtc).getTime());
    const earliestMs = Math.min(...times);
    const latestMs = Math.max(...times);
    dataSpanDays = Math.floor((latestMs - earliestMs) / (1000 * 60 * 60 * 24));
  }

  // ── Free-running period ────────────────────────────────────────────────────

  const freeRunningPeriod = estimateFreeRunningPeriod(entries);

  return {
    isLoading,
    avg7d,
    avg30d,
    avgDriftMinutesPerCycle,
    longestSession,
    shortestSession,
    totalSessions: active.length,
    mainSleepCount,
    napCount,
    dataSpanDays,
    currentStreakDays: calculateStreak(active),
    freeRunningPeriod,
  };
}
