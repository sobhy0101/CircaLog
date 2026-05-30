// ThemeToggle.tsx
//
// A single icon button that switches between dark and light mode.
// Imports useTheme from the hook — no props needed.
//
// Temporary placement: mounted directly in AppShell.tsx for testing.
// This component will move to the side drawer in the App Shell task.

import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      // circa-surface-raised gives the button a slightly elevated background
      // that stands out from the page surface in both dark and light modes.
      // circa-text-primary ensures the icon is always readable.
      // The focus ring uses circa-accent to match the app's accent colour.
      className="
        p-2 rounded-lg
        bg-circa-surface-raised
        text-circa-text-primary
        hover:bg-circa-accent-subtle
        hover:text-circa-accent-light
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-circa-accent
        transition-colors duration-150
      "
    >
      {/* Moon icon for dark mode (shown when app is currently dark — click to go light) */}
      {/* Sun icon for light mode (shown when app is currently light — click to go dark) */}
      {isDark ? (
        // Moon — indicates current mode is dark
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // Sun — indicates current mode is light
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1"  x2="12" y2="3"  />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"  />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1"  y1="12" x2="3"  y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
        </svg>
      )}
    </button>
  );
}
