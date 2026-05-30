// AppShell.tsx — the main PWA application shell (route: /log)
// This placeholder will be replaced with the full tab-based layout
// once routing is confirmed working.

import ThemeToggle from '@/components/ui/ThemeToggle';
// ThemeToggle is mounted here temporarily for testing.
// It will move to the side drawer in the App Shell task.

export default function AppShell() {
  return (
    // bg-circa-bg and text-circa-text-primary use the active theme tokens —
    // the background and text will switch correctly in both dark and light modes.
    <div className="min-h-screen bg-circa-bg flex flex-col items-center justify-center gap-4">
      <p className="text-circa-accent text-sm tracking-wide">
        CircaLog — app shell ✓
      </p>
      {/* Temporary: ThemeToggle placed here for visual testing.
          Will move to the side drawer once the App Shell task is complete. */}
      <ThemeToggle />
    </div>
  );
}
