# Side Drawer — Missing / Unlinked Entries

**Date:** 2026-06-12
**Purpose:** Inventory of drawer buttons that have no route or action wired up, to inform To-Do List updates.

---

## Summary

The Side Drawer has **13 entries** (excluding the Dark Mode toggle in the footer). Five of them are currently dead buttons — they render and respond to hover, but have no `onClick` handler or `navigate()` call attached.

---

## Status by Entry

### Section 1 — Navigate

| Entry | Route | Status |
|---|---|---|
| Log | `/log` | ✅ Live |
| Chart | `/log/chart` | ✅ Live |
| History | `/log/history` | ✅ Live |
| Insights | `/log/insights` | ✅ Live |

### Section 2 — More

| Entry | Route / Action | Status |
|---|---|---|
| What's New | `onOpenChangelog()` — opens in-app modal | ✅ Live |
| **Settings** | *(none)* | ❌ Dead button |
| **Reports** | *(none)* | ❌ Dead button |
| Export | `/log/export` | ✅ Live |
| Import | `/log/import` | ✅ Live |
| Restore Backup | `/log/restore` | ✅ Live |
| **About** | *(none)* | ❌ Dead button |
| **Privacy Policy** | *(none)* | ❌ Dead button |
| **Terms & Conditions** | *(none)* | ❌ Dead button |

---

## Per-Entry Notes

### Settings
- No route, no modal. The To-Do List marks the task "Populate drawer links" (line 128) as done, but that only confirmed the button was rendered — the destination was never created.
- Settings-related sub-tasks are scattered through V2 (Caffeine reference table, Medication Library, Meal Library, etc.), suggesting a **Settings page** is an implicit V2 prerequisite that hasn't been captured as its own task.
- **To-Do List gap:** No standalone task for `Settings page` or `/log/settings` route exists.

### Reports
- No route, no modal.
- V2 has a full `📤 Reports & Export` section (line 309) covering the Doctor Report PDF, so the destination is planned but the page and route don't exist yet.
- **To-Do List gap:** The Reports entry in the drawer will need to navigate somewhere (e.g. `/log/reports`). That route/page creation is implied by the V2 section but not explicitly called out as a separate task.

### About
- No route, no modal. The drawer button shows a generic info circle icon.
- Line 475 in the To-Do List mentions an `"About Non-24" section in side drawer`, which suggests this was originally conceived as an in-drawer panel rather than a dedicated page. The current button does nothing.
- **To-Do List gap:** The existing task on line 475 may need to be clarified: is About a full page at `/log/about`, or a modal/drawer panel? Either way, the wiring task is missing.

### Privacy Policy
- No route, no modal.
- Listed in the new `📃 Policies` section you added (line 486).
- **To-Do List gap:** The task exists but doesn't yet call out creating the route or deciding whether the page is internal (`/log/privacy`) or an external link (e.g. to a hosted doc). That decision and the wiring need to be added.

### Terms & Conditions
- No route, no modal.
- Listed in the new `📃 Policies` section you added (line 487).
- Same gap as Privacy Policy — the task exists but the routing decision and implementation step are not yet specified.

---

## Recommended To-Do Additions

The following items are missing from the To-Do List entirely and would close the gaps above:

1. **Settings page task** — Create `/log/settings` route and a `SettingsPage` component. Wire the drawer button.
2. **Reports page task** — Create `/log/reports` route (even as a stub/placeholder) and wire the drawer button. Can be fleshed out when the V2 Doctor Report work begins.
3. **About page task** — Decide: full page vs. modal. Then create the destination and wire the button.
4. **Policy routing tasks** (Privacy Policy, Terms & Conditions) — For each, decide between internal route vs. external URL, then add the wiring sub-task under `📃 Policies`.

---

*Source files inspected:*
- `src/components/layout/SideDrawer.tsx`
- `src/App.tsx`
- `docs/CircaLog-TO-DO-list.md`
