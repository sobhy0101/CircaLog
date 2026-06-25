// useSyncStatus.ts — exposes the current sync state so the UI can show
// an accurate status tab (synced / syncing / pending / error / offline / signed-out)
// plus diagnostic detail for any permanently-failed entries.

import { useState, useEffect } from 'react'
import { db } from '@/lib/db/db'
import { useAuth } from '@/hooks/useAuth'
import { isSyncing, errorCount } from '@/lib/supabase/syncService'
import type { SyncQueueEntry } from '@/lib/circadian'

export type SyncStatus =
  | 'signed-out'  // user is not signed in — tab hidden
  | 'offline'     // navigator.onLine is false — data saved locally only
  | 'syncing'     // a sync operation is currently in progress
  | 'error'       // one or more entries have failed 3+ times
  | 'pending'     // entries are queued but no error yet
  | 'synced'      // queue is empty and no errors — fully in sync

export function useSyncStatus() {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [isActivelySyncing, setIsActivelySyncing] = useState(false)
  const [hasError, setHasError] = useState(false)
  // Entries with failCount >= 3 — surfaced in the sync error detail panel
  // so the user can see the error code/message and report it.
  const [erroredEntries, setErroredEntries] = useState<SyncQueueEntry[]>([])
  // Initialised from navigator.onLine so the very first render is correct.
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  // Track browser online/offline events independently of the polling interval.
  useEffect(() => {
    function handleOnline()  { setIsOnline(true)  }
    function handleOffline() { setIsOnline(false) }
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setPendingCount(0)
      setIsActivelySyncing(false)
      setHasError(false)
      setErroredEntries([])
      return
    }

    // Poll every 2 seconds — fast enough to feel responsive without
    // being expensive. Reads from the syncQueue table and the
    // syncService module-level flags on every tick.
    async function poll() {
      const all = await db.syncQueue.toArray()
      setPendingCount(all.length)
      setErroredEntries(all.filter(e => e.failCount >= 3))
      setIsActivelySyncing(isSyncing())
      setHasError(errorCount() > 0)
    }

    poll() // run immediately on mount
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [user])

  // Priority order: signed-out → offline → syncing → error → pending → synced
  const status: SyncStatus = !user
    ? 'signed-out'
    : !isOnline
      ? 'offline'
      : isActivelySyncing
        ? 'syncing'
        : hasError
          ? 'error'
          : pendingCount > 0
            ? 'pending'
            : 'synced'

  return { status, pendingCount, erroredEntries }
}
