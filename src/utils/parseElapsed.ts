/**
 * Converts an elapsed duration in milliseconds into hours and minutes.
 * Used by the in-progress timer screens (InBedScreen, WakeUpScreen) to
 * render a live "Xh Ym" counter.
 */
export function parseElapsed(ms: number): { h: number; m: number } {
  const totalMin = Math.floor(ms / 60000);
  return { h: Math.floor(totalMin / 60), m: totalMin % 60 };
}
