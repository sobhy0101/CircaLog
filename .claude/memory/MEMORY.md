# CircaLog Memory Index

- [CircaLog Project](project_circalog.md) — Purpose, tech stack, V1 status (auth done; sync service + CSV import + insights remain)
- [Auth System](project_auth_system.md) — useAuth API, Toast variants, key files, non-obvious Supabase event behavior
- [React TSX Patterns](feedback_react_tsx_patterns.md) — No bare React import in .tsx; use ReactElement not JSX.Element
- [Report Conventions](feedback_report_conventions.md) — REPORT_ prefix naming, blank lines around all code fences (MD031)
- [Backup Strategy](feedback_backup_strategy.md) — C:\Users\sobhy\.claude\ is on Google Drive; no need to push auto-memory to git
- [Nav Gate Placement](feedback_nav_gate_placement.md) — Auth gates belong on destination pages, not drawer entries; drawer items always render unconditionally
- [Vitest 4 + Vite 8 Type Conflict](feedback_vitest_vite_conflict.md) — `UserConfig` not exported from `vitest/config`; use `as any` on `defineConfig` call
- [Dexie 4.x Boolean Fields](feedback_dexie4_boolean_fields.md) — `.where(boolField).equals(0)` silently returns nothing; fetch all + filter in JS
- [Sleep Session Three-Date Model](project_sleep_session_model.md) — bedTimeUtc/sleepStartUtc/wakeUtc: what each answers and how display layers use them
