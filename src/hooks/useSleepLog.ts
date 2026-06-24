import { useState, useEffect } from 'react';
import {
  createEntry as dbCreate,
  getAllEntries,
  updateEntry as dbUpdate,
  softDeleteEntry as dbSoftDelete,
  hardDeleteEntry as dbHardDelete,
} from '@/lib/db';
import type { SleepEntry } from '@/lib/circadian';
import { SLEEP_IN_PROGRESS_KEY, SLEEP_LOG_MODE_KEY } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

// UI-level state only — not a domain type. Exported (unlike
// InProgressSession below, which stays unexported) because LogPage and
// StartSleepScreen need it for prop typing.
export type SleepLogMode = 'simple' | 'detailed';

// UI-level state only — not a domain type; do not export
interface InProgressSession {
  mode: SleepLogMode;
  bedTimeUtc: string;        // always set — Step 1 tap (detailed) or the
                             // single tap (simple)
  sleepStartUtc?: string;    // set once Step 2 happens. In simple mode this
                             // is set immediately, equal to bedTimeUtc —
                             // identical to today's behavior.
}

export function useSleepLog() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore in-progress session from localStorage on first render.
  // If the stored session is missing 'mode' it's from before the two-step
  // redesign — discard it rather than risk an inconsistent mid-session state.
  const [inProgress, setInProgress] = useState<InProgressSession | null>(() => {
    try {
      const raw = localStorage.getItem(SLEEP_IN_PROGRESS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<InProgressSession>;
      if (!parsed.mode || !parsed.bedTimeUtc) {
        // Stale shape from before the two-step redesign — discard rather
        // than risk an inconsistent mid-session state.
        localStorage.removeItem(SLEEP_IN_PROGRESS_KEY);
        return null;
      }
      return parsed as InProgressSession;
    } catch {
      return null;
    }
  });

  const [mode, setModeState] = useState<SleepLogMode>(() => {
    const stored = localStorage.getItem(SLEEP_LOG_MODE_KEY);
    return stored === 'detailed' ? 'detailed' : 'simple';
  });

  // Updates the active mode AND persists it as the new default. This is
  // intentional — see the doc comment on SLEEP_LOG_MODE_KEY in constants.ts.
  function setMode(next: SleepLogMode): void {
    localStorage.setItem(SLEEP_LOG_MODE_KEY, next);
    setModeState(next);
  }

  // Load all entries on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getAllEntries()
      .then(all => {
        if (cancelled) return;
        // Newest first — service returns ascending, so reverse here
        setEntries([...all].reverse());
        setError(null);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Re-fetches the full entry list; called after every mutation
  async function refresh(): Promise<void> {
    const all = await getAllEntries();
    setEntries([...all].reverse());
  }

  async function createEntry(
    draft: Parameters<typeof dbCreate>[0]
  ): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      await dbCreate(draft, user);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function updateEntry(
    id: string,
    changes: Parameters<typeof dbUpdate>[1]
  ): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      await dbUpdate(id, changes, user);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function softDeleteEntry(id: string): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      await dbSoftDelete(id, user);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function hardDeleteEntry(id: string): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      await dbHardDelete(id, user);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  // Reads from the in-memory entries array — no DB call needed.
  function getEntryById(id: string): SleepEntry | undefined {
    return entries.find(e => e.id === id);
  }

  function startSession(currentMode: SleepLogMode): void {
    const now = new Date().toISOString();
    const session: InProgressSession =
      currentMode === 'simple'
        ? { mode: 'simple', bedTimeUtc: now, sleepStartUtc: now }
        : { mode: 'detailed', bedTimeUtc: now, sleepStartUtc: undefined };
    localStorage.setItem(SLEEP_IN_PROGRESS_KEY, JSON.stringify(session));
    setInProgress(session);
  }

  // Called when the user taps "Going to Sleep?" in detailed mode Step 1
  function markSleepStart(): void {
    setInProgress(prev => {
      if (!prev) return prev;
      const updated: InProgressSession = {
        ...prev,
        sleepStartUtc: new Date().toISOString(),
      };
      localStorage.setItem(SLEEP_IN_PROGRESS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function clearSession(): void {
    localStorage.removeItem(SLEEP_IN_PROGRESS_KEY);
    setInProgress(null);
  }

  return {
    // DB state
    entries,
    isLoading,
    error,
    // DB mutations
    createEntry,
    updateEntry,
    softDeleteEntry,
    hardDeleteEntry,
    // Lookup
    getEntryById,
    // Mode
    mode,
    setMode,
    // In-progress session
    inProgress,
    startSession,
    markSleepStart,
    clearSession,
  };
}
