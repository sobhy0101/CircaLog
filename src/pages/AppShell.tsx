// AppShell.tsx — the main PWA application shell (route: /log).
// Holds drawer open/close state and composes BottomTabBar + SideDrawer.
// <Outlet /> for React Router will be added in a future routing batch.

import { useState } from 'react';
import BottomTabBar from '@/components/layout/BottomTabBar';
import SideDrawer   from '@/components/layout/SideDrawer';

export default function AppShell() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    // Outer wrapper fills the viewport
    <div className="min-h-screen bg-circa-bg text-circa-text-primary flex flex-col">

      {/* Side drawer (fixed, sits above everything) */}
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Main scrollable content area — pb-16 clears the 64px tab bar */}
      <main className="flex-1 overflow-y-auto pb-16">
        {/* Page content will be rendered here via React Router <Outlet> in a future batch. */}
        <div className="flex items-center justify-center h-full min-h-[calc(100vh-4rem)]">
          <p className="text-circa-accent text-sm tracking-wide">
            CircaLog — app shell ✓
          </p>
        </div>
      </main>

      {/* Bottom tab bar (fixed to bottom) */}
      <BottomTabBar onOpenDrawer={() => setIsDrawerOpen(true)} />

    </div>
  );
}
