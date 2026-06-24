/**
 * Shared localStorage key constants for CircaLog.
 *
 * Define every localStorage key here so no key string is duplicated
 * across the codebase. Import from this file wherever a key is needed.
 *
 * Note: THEME_KEY lives in src/hooks/useTheme.ts because it is tightly
 * coupled to the FOUC-prevention script in index.html. Keep it there.
 */

/**
 * Key used to persist an in-progress sleep session across page reloads.
 * Stored value is a JSON-serialised InProgressSession object.
 * Cleared when the session is completed or abandoned.
 */
export const SLEEP_IN_PROGRESS_KEY = 'circalog-sleep-in-progress';

/**
 * Key used to persist the user's preferred Sleep Log mode ('simple' or
 * 'detailed'). Defaults to 'simple' when absent — new users always see
 * today's one-tap timer behavior unless they explicitly switch.
 *
 * Set by the mode toggle on StartSleepScreen. There is currently no
 * separate Settings UI for this — the toggle on the Log screen IS the
 * mechanism for changing the default, by design (see CC_TASK_Phase1_
 * TimerTwoStepRedesign.md). When a real Settings page is built, it can
 * read/write this same key.
 */
export const SLEEP_LOG_MODE_KEY = 'circalog-sleep-log-mode';
