/**
 * CircaLog — Dev Seed Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Inserts 12 realistic test sleep entries directly into IndexedDB using the
 * same createEntry() service function the app uses. The data is modelled on
 * a real Non-24 patient: a free-running ~25h cycle drifting progressively
 * later each day, with a mix of main sleep and naps, varied quality ratings,
 * and occasional notes/interruptions.
 *
 * HOW TO USE
 * ──────────
 * 1. Open http://localhost:5173/log in Chrome (dev server must be running).
 * 2. Open DevTools → Console tab.
 * 3. Paste the entire contents of this file and press Enter.
 * 4. Wait for the "✅ Seed complete" message.
 * 5. Refresh the page — the History tab will show all 12 entries.
 *
 * To wipe the data and start fresh:
 *   indexedDB.deleteDatabase('circalog')  ← run in the console, then refresh.
 *
 * NOTES
 * ─────
 * - This script uses the app's own createEntry() which validates timestamps,
 *   derives sessionType, and runs assignCycleNumber — exactly as the app does.
 * - The timezone is hard-coded to "Africa/Cairo" (UTC+3 in summer, UTC+2 in
 *   winter with EET/EEST). Adjust the TZ constant below if needed.
 * - Run this script only once. Running it again will add 12 more entries.
 *   Use indexedDB.deleteDatabase('circalog') to reset first if needed.
 */

(async () => {
  // ── Configuration ──────────────────────────────────────────────────────────

  const TZ = 'Africa/Cairo';

  /**
   * Converts a local date/time string to a UTC ISO 8601 string, taking the
   * IANA timezone into account. Uses the Intl API — no library required.
   *
   * @param localDateStr  e.g. "2026-05-20"
   * @param localTimeStr  e.g. "02:30"
   * @returns ISO 8601 UTC string, e.g. "2026-05-19T23:30:00.000Z"
   */
  function toUtc(localDateStr, localTimeStr) {
    // Build a Date from the string as if it were UTC, then correct for the
    // actual UTC offset of the given IANA timezone at that moment.
    const naive = new Date(`${localDateStr}T${localTimeStr}:00`);

    // Use Intl to get the UTC offset for this timezone at this instant.
    // We format both UTC and local time then compute the difference.
    const utcParts  = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(naive);
    const tzParts   = new Intl.DateTimeFormat('en-GB', { timeZone: TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(naive);

    const p = arr => Object.fromEntries(arr.map(x => [x.type, x.value]));
    const u = p(utcParts);
    const t = p(tzParts);

    const utcMs  = Date.UTC(+u.year, +u.month - 1, +u.day, +u.hour, +u.minute);
    const locMs  = Date.UTC(+t.year, +t.month - 1, +t.day, +t.hour, +t.minute);
    const offsetMs = locMs - utcMs;           // positive = east of UTC

    // The correct UTC instant is: naive interpreted as local minus the offset.
    const corrected = new Date(naive.getTime() - offsetMs);
    return corrected.toISOString();
  }

  // ── Session definitions ───────────────────────────────────────────────────
  //
  // 12 entries spanning ~18 days. Sleep onset drifts ~60–90 min later per
  // cycle (a ~25h free-running period). Mix of long main sleeps, short main
  // sleeps, and two naps (< 3 hours). Quality varies from 1 to 5.
  //
  // Format: [date, bedTime, sleepStart, wakeTime, quality, notes?]
  // All times are local Cairo time (EET, UTC+3 in summer).

  const sessions = [
    // Cycle 1 — early start, decent sleep
    ['2026-05-16', '22:45', '23:30', '07:15', 4, 'Felt rested'],
    // Cycle 2 — drifting later
    ['2026-05-18', '00:10', '01:00', '09:20', 3, null],
    // Cycle 3 — nap (2h 10m, auto-tagged as nap)
    ['2026-05-19', '14:30', '14:45', '16:55', 2, 'Short recovery nap, pain woke me'],
    // Cycle 4 — drifting into afternoon sleep
    ['2026-05-20', '03:20', '04:15', '12:40', 4, null],
    // Cycle 5 — long sleep, high quality
    ['2026-05-22', '05:00', '05:50', '14:30', 5, 'Best sleep in weeks'],
    // Cycle 6 — fragmented, low quality
    ['2026-05-24', '07:30', '08:10', '14:45', 2, 'Woke up 3 times'],
    // Cycle 7 — evening sleep onset
    ['2026-05-26', '10:00', '10:55', '18:20', 3, null],
    // Cycle 8 — nap (1h 45m, auto-tagged as nap)
    ['2026-05-27', '20:15', '20:30', '22:15', 2, 'Could not stay asleep'],
    // Cycle 9 — late afternoon, good quality
    ['2026-05-28', '13:40', '14:20', '22:05', 4, null],
    // Cycle 10 — crossing into the night again
    ['2026-05-30', '16:30', '17:15', '01:50', 3, 'Woke early, could not go back'],
    // Cycle 11 — very poor night, short sleep
    ['2026-06-01', '19:50', '21:10', '03:30', 1, 'Terrible night, lots of pain'],
    // Cycle 12 — most recent, late night onset, solid sleep
    ['2026-06-03', '22:00', '23:20', '08:10', 4, 'Finally felt okay'],
  ];

  // ── Insert via app service ─────────────────────────────────────────────────

  // Dynamically import the compiled createEntry from the app's own module.
  // Vite exposes its module graph via import(), so this works in DevTools
  // when the dev server is running.
  let createEntry;
  try {
    const mod = await import('/src/lib/db/index.ts');
    createEntry = mod.createEntry;
  } catch (e) {
    console.error('❌ Could not import createEntry. Is the dev server running at /log?', e);
    return;
  }

  console.log(`🌙 CircaLog seed — inserting ${sessions.length} entries…`);

  let inserted = 0;
  for (const [date, bed, start, wake, quality, notes] of sessions) {
    try {
      await createEntry({
        bedTimeUtc:    toUtc(date, bed),
        sleepStartUtc: toUtc(date, start),
        // Wake may be next calendar day — detect midnight crossover
        wakeUtc: (() => {
          const wakeLocal = toUtc(date, wake);
          // If wake is before sleep start, it's the next day
          if (new Date(wakeLocal) <= new Date(toUtc(date, start))) {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            const nd = nextDay.toISOString().slice(0, 10);
            return toUtc(nd, wake);
          }
          return wakeLocal;
        })(),
        ianaTimezone: TZ,
        quality,
        notes: notes ?? undefined,
      });
      inserted++;
      console.log(`  ✓ ${date} ${start}→${wake}  quality=${quality}`);
    } catch (err) {
      console.warn(`  ✗ ${date} ${start}→${wake}  — ${err.message}`);
    }
  }

  console.log(`\n✅ Seed complete — ${inserted}/${sessions.length} entries inserted.`);
  console.log('Refresh the page and open the History tab to see them.');
  console.log('\nTo reset: run  indexedDB.deleteDatabase("circalog")  then refresh.');
})();
