import React from 'react';
// useTheme.ts
//
// Reactive dark/light mode hook for CircaLog.
//
// Architecture note: this hook does NOT use React Context. Each call site
// gets its own instance. All instances share the <html> DOM class as the
// single source of truth — toggling .dark on the root element causes every
// component using circa-* tokens to re-render with the correct values.
// This is an intentional V1 choice; do not add a Context wrapper.
//
// THEME_KEY is exported as a named constant so the localStorage key is
// defined in exactly one place. The FOUC inline script in index.html uses
// the same key string — if this value ever changes, update that script too.

// The localStorage key used to persist the user's theme preference.
// Must match the key read by the FOUC inline script in index.html.
export const THEME_KEY = 'circalog-theme';

// Theme type — the only two valid stored values.
type Theme = 'dark' | 'light';

// Returns the active theme by reading the .dark class on <html>.
// This is the source of truth at runtime, not localStorage.
function getActiveTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

// Applies a theme to the DOM and saves it to localStorage.
function applyTheme(theme: Theme): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem(THEME_KEY, theme);
}

export function useTheme() {
  // Derive initial state from the DOM class — the FOUC script has already
  // set this correctly before React mounts, so there is no flash.
  const [theme, setThemeState] = React.useState<Theme>(getActiveTheme);

  // toggleTheme switches between dark and light, applies the change to the
  // DOM, saves it to localStorage, and updates local React state so any
  // component using this hook re-renders with the new icon/label.
  function toggleTheme(): void {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setThemeState(next);
  }

  return {
    theme,       // 'dark' | 'light' — the currently active theme
    isDark: theme === 'dark',
    toggleTheme,
  };
}
