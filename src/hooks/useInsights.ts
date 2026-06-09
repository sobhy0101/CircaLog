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

  // Rolling averages — null when no entries fall in the window
  avg7d: { durationMinutes: number; quality: number } | null;
  avg30d: { durationMinutes: number; quality: number } | null;

  // Drift — null when fewer than 2 main-sleep sessions
  avgDriftMinutesPerCycle: number | null;

  // Session extremes across all active sessions
  longestSession: { durationMinutes: number; date: string } | null;
  shortestSession: { durationMinutes: number; date: string } | null;

  // Counts
  totalSessions: number;

  // Streak — consecutive calendar days with at least one logged session
  currentStreakDays: number;

  // Free-running period — passed through from estimateFreeRunningPeriod()
  freeRunningPeriod: FreeRunningPeriodResult;

  // Needed by the component to display "Log N more days to unlock" in pending state
  mainSleepCount: number;
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
    ? { durationMinutes: raw7d.avgDurationMinutes, quality: raw7d.avgQuality }
    : null;

  const raw30d = calculateRollingAverages(entries, 30);
  const avg30d = raw30d.entryCount > 0
    ? { durationMinutes: raw30d.avgDurationMinutes, quality: raw30d.avgQuality }
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

  // ── Free-running period ────────────────────────────────────────────────────

  const freeRunningPeriod = estimateFreeRunningPeriod(entries);
  const mainSleepCount = active.filter(e => e.sessionType === 'main').length;

  return {
    isLoading,
    avg7d,
    avg30d,
    avgDriftMinutesPerCycle,
    longestSession,
    shortestSession,
    totalSessions: active.length,
    currentStreakDays: calculateStreak(active),
    freeRunningPeriod,
    mainSleepCount,
  };
}
