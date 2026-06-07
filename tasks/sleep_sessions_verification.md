# `sleep_sessions` Table Verification

Queried: 2026-06-07

---

## 1. Columns

| # | column_name | data_type | is_nullable | column_default |
|---|---|---|---|---|
| 1 | `id` | uuid | NO | `gen_random_uuid()` |
| 2 | `user_id` | uuid | NO | — |
| 3 | `local_id` | text | YES | — |
| 4 | `sleep_start` | timestamp with time zone | NO | — |
| 5 | `wake_time` | timestamp with time zone | NO | — |
| 6 | `duration_minutes` | integer | YES | *(generated always, stored)* |
| 7 | `quality` | smallint | NO | — |
| 8 | `session_type` | text | NO | `'sleep'::text` |
| 9 | `cycle_number` | integer | YES | — |
| 10 | `notes` | text | YES | — |
| 11 | `has_dreams` | boolean | YES | — |
| 12 | `dream_notes` | text | YES | — |
| 13 | `interruption_count` | smallint | YES | — |
| 14 | `interruption_types` | ARRAY | YES | — |
| 15 | `medication_taken` | boolean | YES | — |
| 16 | `medication_timing` | text | YES | — |
| 17 | `is_deleted` | boolean | NO | `false` |
| 18 | `created_at` | timestamp with time zone | YES | `now()` |
| 19 | `updated_at` | timestamp with time zone | YES | `now()` |

---

## 2. RLS Policies

| policyname | cmd | qual | with_check |
|---|---|---|---|
| `sleep_sessions: owner access` | ALL | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |

One policy covers all operations (SELECT, INSERT, UPDATE, DELETE).
Users can only read and write their own rows.

---

## 3. RLS Enabled

| relname | relrowsecurity |
|---|---|
| `sleep_sessions` | `true` |

---

## Summary

- Table exists in the `public` schema with 19 columns.
- `duration_minutes` is a generated stored column — computed automatically from `wake_time - sleep_start`.
- RLS is **enabled**.
- Owner-access policy is in place: `auth.uid() = user_id` for all commands.
- No gaps or missing columns relative to the DDL definition.
