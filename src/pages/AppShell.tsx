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

      {/* Sync status pill — shows only when signed in */}
      {status !== 'signed-out' && (
        <div
          aria-live="polite"
          className={[
            'fixed top-3 right-3 z-50 flex items-center gap-1.5',
            'rounded-full px-3 py-1 text-xs font-medium',
            'border transition-colors duration-300',
            status === 'synced'
              ? 'bg-circa-surface border-circa-border text-circa-text-muted'
              : 'bg-circa-accent-subtle border-circa-accent text-circa-accent',
          ].join(' ')}
        >
          <span
            className={[
              'h-1.5 w-1.5 rounded-full',
              status === 'synced' ? 'bg-circa-text-muted' : 'bg-circa-accent animate-pulse',
            ].join(' ')}
          />
          {status === 'synced' ? 'Synced' : 'Pending sync'}
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
