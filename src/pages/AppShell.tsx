// AppShell.tsx — the main PWA application shell (route: /log).
// Holds drawer open/close state and composes BottomTabBar + SideDrawer.

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BottomTabBar    from '@/components/layout/BottomTabBar';
import SideDrawer      from '@/components/layout/SideDrawer';
import Toast           from '@/components/ui/Toast';
import { useAuth }     from '@/hooks/useAuth';
import { useSyncStatus } from '@/hooks/useSyncStatus';

export default function AppShell() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { activeToast, clearToast } = useAuth();
  const { status } = useSyncStatus();

  return (
    // Outer wrapper fills the viewport
    <div className="min-h-screen bg-circa-bg text-circa-text-primary flex flex-col">

      {/* Auth toast — success / neutral / error (z-60, above drawer at z-50) */}
      {activeToast && (
        <Toast variant={activeToast.variant} message={activeToast.message} onDismiss={clearToast} />
      )}

      {/* Sync status tab — shows only when signed in.
          Tab shape: flat top anchored to viewport top, rounded bottom corners.
          Sits above page content without floating over it. */}
      {status !== 'signed-out' && (
        <div
          aria-live="polite"
          aria-label={
            status === 'syncing' ? 'Syncing data' :
            status === 'error'   ? 'Sync error — some entries could not be saved to the cloud' :
            status === 'pending' ? 'Sync pending' :
            status === 'offline' ? 'Offline — data saved locally' :
            'Data synced'
          }
          className={[
            'fixed top-0 left-1/2 -translate-x-1/2 z-50',
            'flex items-center gap-1.5',
            'rounded-b-xl px-4 py-1.5 text-xs font-medium',
            'border-x border-b transition-colors duration-300 select-none',
            'shadow-md',
            status === 'synced'
              ? 'bg-circa-surface border-circa-border text-circa-text-muted'
              : status === 'offline'
                ? 'bg-circa-surface border-circa-border text-circa-text-secondary'
                : status === 'syncing'
                  ? 'bg-circa-warning-subtle border-circa-warning text-circa-warning'
                  : status === 'error'
                    ? 'bg-circa-error-subtle border-circa-error text-circa-error'
                    : /* pending */
                      'bg-circa-accent-subtle border-circa-accent text-circa-accent',
          ].join(' ')}
        >
          {/* Icon */}
          {status === 'syncing' ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
              style={{ animation: 'spin-slow 1.5s linear infinite' }}
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          ) : status === 'offline' ? (
            /* Cloud-off icon — offline is neutral, not an error */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
              aria-hidden="true"
            >
              <path d="M2 2l20 20" />
              <path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-8.814" />
              <path d="M21.532 12.6A4.5 4.5 0 0 0 17.5 6a4.49 4.49 0 0 0-1.785.366" />
            </svg>
          ) : status === 'error' ? (
            <span className="h-1.5 w-1.5 rounded-full bg-circa-error" aria-hidden="true" />
          ) : status === 'pending' ? (
            <span className="h-1.5 w-1.5 rounded-full bg-circa-error animate-pulse" aria-hidden="true" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-circa-text-muted" aria-hidden="true" />
          )}

          {/* Label */}
          {status === 'synced'   && 'Synced'}
          {status === 'syncing'  && 'Syncing…'}
          {status === 'pending'  && 'Pending sync'}
          {status === 'error'    && 'Sync error'}
          {status === 'offline'  && 'Saved — Offline'}
        </div>
      )}

      {/* Side drawer (fixed, sits above everything) */}
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Main scrollable content area — pb-16 clears the 64px tab bar */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Bottom tab bar (fixed to bottom) */}
      <BottomTabBar onOpenDrawer={() => setIsDrawerOpen(true)} />

    </div>
  );
}
