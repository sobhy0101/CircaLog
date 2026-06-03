import { useState, useEffect } from 'react';
import {
  createEntry as dbCreate,
  getAllEntries,
  updateEntry as dbUpdate,
  softDeleteEntry as dbSoftDelete,
  hardDeleteEntry as dbHardDelete,
} from '@/lib/db';
import type { SleepEntry } from '@/lib/circadian';
import { SLEEP_IN_PROGRESS_KEY } from '@/lib/constants';

// UI-level state only — not a domain type; do not export
interface InProgressSession {
  bedTimeUtc: string;  // ISO 8601 UTC — when "Start Sleep" was tapped
  startedAt: string;   // ISO 8601 UTC — same value, kept for display
}

export function useSleepLog() {
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore in-progress session from localStorage on first render
  const [inProgress, setInProgress] = useState<InProgressSession | null>(() => {
    try {
      const raw = localStorage.getItem(SLEEP_IN_PROGRESS_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as InProgressSession;
    } catch {
      return null;
    }
  });

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
      await dbCreate(draft);
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
      await dbUpdate(id, changes);
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
      await dbSoftDelete(id);
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
      await dbHardDelete(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  function startSession(): void {
    const now = new Date().toISOString();
    const session: InProgressSession = { bedTimeUtc: now, startedAt: now };
    localStorage.setItem(SLEEP_IN_PROGRESS_KEY, JSON.stringify(session));
    setInProgress(session);
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
    // In-progress session
    inProgress,
    startSession,
    clearSession,
  };
}
