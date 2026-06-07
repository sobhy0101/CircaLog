// useSyncStatus.ts — exposes the current sync state so the UI can show
// an accurate status pill (synced / syncing / pending / error / signed-out).

import { useState, useEffect } from 'react'
import { db } from '@/lib/db/db'
import { useAuth } from '@/hooks/useAuth'
import { isSyncing, errorCount } from '@/lib/supabase/syncService'

export type SyncStatus =
  | 'signed-out'  // user is not signed in — pill hidden
  | 'syncing'     // a sync operation is currently in progress
  | 'error'       // one or more entries have failed 3+ times
  | 'pending'     // entries are queued but no error yet
  | 'synced'      // queue is empty and no errors — fully in sync

export function useSyncStatus() {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [isActivelySyncing, setIsActivelySyncing] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!user) {
      setPendingCount(0)
      setIsActivelySyncing(false)
      setHasError(false)
      return
    }

    // Poll every 2 seconds — fast enough to feel responsive without
    // being expensive. Reads three values per tick:
    //   - syncQueue row count (pending entries)
    //   - isSyncing() flag from syncService (active operation in flight)
    //   - errorCount() flag from syncService (entries that failed 3+ times)
    async function poll() {
      const count = await db.syncQueue.count()
      setPendingCount(count)
      setIsActivelySyncing(isSyncing())
      setHasError(errorCount() > 0)
    }

    poll() // run immediately on mount
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [user])

  // Priority order: signed-out → syncing → error → pending → synced
  const status: SyncStatus = !user
    ? 'signed-out'
    : isActivelySyncing
      ? 'syncing'
      : hasError
        ? 'error'
        : pendingCount > 0
          ? 'pending'
          : 'synced'

  return { status, pendingCount }
}
