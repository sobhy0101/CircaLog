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

      {/* Sync status pill — shows only when signed in.
          Positioned top-center to avoid overlapping page content. */}
      {status !== 'signed-out' && (
        <div
          aria-live="polite"
          aria-label={
            status === 'syncing' ? 'Syncing data' :
            status === 'error'   ? 'Sync error — some entries could not be saved to the cloud' :
            status === 'pending' ? 'Sync pending' :
            'Data synced'
          }
          className={[
            'fixed top-3 left-1/2 -translate-x-1/2 z-50',
            'flex items-center gap-1.5',
            'rounded-full px-3 py-1 text-xs font-medium',
            'border transition-colors duration-300 select-none',
            status === 'synced'
              ? 'bg-circa-surface border-circa-border text-circa-text-muted'
              : status === 'syncing'
                ? 'bg-circa-warning-subtle border-circa-warning text-circa-warning'
                : status === 'error'
                  ? 'bg-circa-error-subtle border-circa-error text-circa-error'
                  : /* pending */
                    'bg-circa-accent-subtle border-circa-accent text-circa-accent',
          ].join(' ')}
        >
          {/* Icon / indicator dot */}
          {status === 'syncing' ? (
            /* Rotating arrows SVG for the syncing state */
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
          ) : status === 'error' ? (
            /* Static dot for error */
            <span className="h-1.5 w-1.5 rounded-full bg-circa-error" aria-hidden="true" />
          ) : status === 'pending' ? (
            /* Pulsing red dot for pending — visible against the purple pill */
            <span className="h-1.5 w-1.5 rounded-full bg-circa-error animate-pulse" aria-hidden="true" />
          ) : (
            /* Static dot for synced */
            <span className="h-1.5 w-1.5 rounded-full bg-circa-text-muted" aria-hidden="true" />
          )}

          {/* Label */}
          {status === 'synced'   && 'Synced'}
          {status === 'syncing'  && 'Syncing…'}
          {status === 'pending'  && 'Pending sync'}
          {status === 'error'    && 'Sync error'}
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
