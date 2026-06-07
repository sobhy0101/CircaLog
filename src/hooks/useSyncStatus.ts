// useSyncStatus.ts — exposes the current sync queue depth so the UI can
// show a "syncing" or "pending" indicator.

import { useState, useEffect } from 'react'
import { db } from '@/lib/db/db'
import { useAuth } from '@/hooks/useAuth'

export type SyncStatus =
  | 'signed-out'   // user is not signed in — no sync
  | 'synced'       // queue is empty — everything is in sync
  | 'pending'      // queue has entries waiting to be pushed
  | 'syncing'      // a sync operation is currently in progress (future use)

export function useSyncStatus() {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setPendingCount(0)
      return
    }

    // Poll the queue count every 5 seconds so the indicator stays current.
    // Dexie's hook API has TypeScript compatibility constraints in this version,
    // so polling is used here for reliability.
    const interval = setInterval(async () => {
      const count = await db.syncQueue.count()
      setPendingCount(count)
    }, 5000)

    // Also count immediately on mount / when user changes.
    db.syncQueue.count().then(setPendingCount)

    return () => clearInterval(interval)
  }, [user])

  const status: SyncStatus = !user
    ? 'signed-out'
    : pendingCount > 0
      ? 'pending'
      : 'synced'

  return { status, pendingCount }
}
