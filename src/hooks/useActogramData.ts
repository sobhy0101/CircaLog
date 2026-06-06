import { useMemo } from 'react';
import { useSleepLog } from '@/hooks/useSleepLog';
import { groupEntriesByCycle } from '@/lib/circadian';
import type { SleepEntry } from '@/lib/circadian';

export type TimeRange = '1W' | '2W' | '1M' | '3M' | '6M' | '1Y' | 'All';

export interface SleepBlock {
  entryId: string;
  cycleNumber: number;
  sessionType: 'main' | 'nap';
  // Minutes since midnight (00:00 = 0). Can exceed 1440 for sessions
  // that span into the next calendar day or beyond.
  startMinute: number;
  endMinute: number; // Always > startMinute; never wraps — extends past 1440
  quality: number;
  // For tooltip display
  sleepStartUtc: string;
  wakeUtc: string;
  ianaTimezone: string;
}

export interface ActogramCycle {
  cycleNumber: number;
  calendarDate: string; // YYYY-MM-DD — the primary entry's date
  blocks: SleepBlock[];
}

export interface ActogramData {
  cycles: ActogramCycle[]; // Sorted by cycleNumber ascending
  yMax: number;            // Dynamic Y axis ceiling in minutes
  isEmpty: boolean;
}

// Returns minutes since midnight for a UTC timestamp in the given IANA timezone.
// Uses Intl.DateTimeFormat.formatToParts to extract hours and minutes without
// timezone-offset arithmetic.
function toStartMinute(utcIso: string, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(utcIso));
  const h = parseInt(parts.find(p => p.type === 'hour')!.value, 10);
  const m = parseInt(parts.find(p => p.type === 'minute')!.value, 10);
  return h * 60 + m;
}

// Returns the cutoff date as YYYY-MM-DD (today - N days), or null for 'All'.
// Plain string comparison works because both sides are YYYY-MM-DD.
function getCutoffDate(range: TimeRange): string | null {
  if (range === 'All') return null;
  const daysMap: Record<Exclude<TimeRange, 'All'>, number> = {
    '1W': 7,
    '2W': 14,
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365,
  };
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysMap[range]);
  return cutoff.toISOString().slice(0, 10);
}

// Converts a SleepEntry to a SleepBlock.
// endMinute may exceed 1440 for sessions spanning multiple calendar days —
// this is intentional and required for correct actogram rendering.
function entryToBlock(entry: SleepEntry): SleepBlock {
  const startMinute = toStartMinute(entry.sleepStartUtc, entry.ianaTimezone);
  // Convert duration to minutes and add to startMinute so the bar never wraps.
  // A 51-hour session starting at minute 1320 produces endMinute = 4380.
  const durationMs =
    new Date(entry.wakeUtc).getTime() - new Date(entry.sleepStartUtc).getTime();
  const endMinute = startMinute + Math.round(durationMs / 60_000);
  return {
    entryId: entry.id,
    cycleNumber: entry.cycleNumber,
    sessionType: entry.sessionType,
    startMinute,
    endMinute,
    quality: entry.quality,
    sleepStartUtc: entry.sleepStartUtc,
    wakeUtc: entry.wakeUtc,
    ianaTimezone: entry.ianaTimezone,
  };
}

export function useActogramData(range: TimeRange): ActogramData & {
  isLoading: boolean;
  error: string | null;
} {
  const { entries, isLoading, error } = useSleepLog();

  const data = useMemo((): ActogramData => {
    // groupEntriesByCycle excludes soft-deleted entries and sorts ascending
    const cycles = groupEntriesByCycle(entries);

    // isEmpty = no entries exist in the database at all
    if (cycles.length === 0) {
      return { cycles: [], yMax: 1440, isEmpty: true };
    }

    // Apply time range filter based on each cycle's primary calendarDate
    const cutoff = getCutoffDate(range);
    const filtered = cutoff
      ? cycles.filter(c => c.calendarDate >= cutoff)
      : cycles;

    const actogramCycles: ActogramCycle[] = filtered.map(cycle => ({
      cycleNumber: cycle.cycleNumber,
      calendarDate: cycle.calendarDate,
      blocks: cycle.entries.map(entryToBlock),
    }));

    // Dynamic yMax: rounded up to next 6-hour boundary (360 min), minimum 1440.
    // Math.max with a spread of an empty array falls back to 1440 correctly.
    const allBlocks = actogramCycles.flatMap(c => c.blocks);
    const rawMax = Math.max(...allBlocks.map(b => b.endMinute), 1440);
    const yMax = Math.ceil(rawMax / 360) * 360;

    return { cycles: actogramCycles, yMax, isEmpty: false };
  }, [entries, range]);

  return { ...data, isLoading, error };
}
