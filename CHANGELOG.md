# Changelog

All notable changes to CircaLog are documented here.
Entries are listed newest first, grouped by release version.

Each version contains up to three categories — only categories that have entries are shown:

- **New**: Features and capabilities that did not exist before
- **Improved**: Existing features that were changed, refined, or extended
- **Fixed**: Bugs, incorrect behavior, or broken states that were corrected

---

## [0.1.0] — 2026-06-11

### New

- Sleep log with manual time entry and one-tap sleep/wake timer
- Quality rating (1–5 stars) and optional fields: notes, dreams, interruptions, medication timing
- Automatic session classification: Main Sleep (≥ 3 hours) vs. Nap (< 3 hours)
- Automatic cycle number assignment, recalculated after every entry change
- History view with sort (newest / oldest / rating) and filter (session type / quality)
- Actogram chart: Diagonal drift visualization with time range toggle (1W / 1M / 3M / 6M / 1Y / All)
- Insights view: Average duration, drift rate, longest/shortest sessions, streak, free-running period estimate
- Google Sign-In (optional) with automatic IndexedDB → Supabase cloud sync
- CSV import from the CircaLog Daily Tracker spreadsheet
- JSON export (manual backup) and JSON restore (with merge or replace)
- Dark and light mode with system preference detection
- In-app changelog (this screen)
- Installable as a PWA on Android, iOS, and desktop (Add to Home Screen)
- Offline-first: All features work without an internet connection

---
