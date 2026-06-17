---
name: feedback-dexie4-boolean-fields
description: Dexie 4.x — boolean fields cannot be queried via .where(); fetch all and filter in JS instead
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1a002c84-8857-4c79-a31c-e3aeca4bc8bb
---

In Dexie 4.x, boolean fields cannot be used as index query keys. `.where('isDeleted').equals(0)` silently returns zero results with no error — it does not throw.

**Why:** The IndexedDB spec rejects booleans as index key types. Dexie 3.x coerced `false → 0` / `true → 1` before writing to the index. Dexie 4.x removed that coercion to stay spec-compliant.

**The correct pattern:**

```typescript
// WRONG — silently returns zero results in Dexie 4.x
const active = await db.sleepEntries.where('isDeleted').equals(0).toArray()

// CORRECT — fetch all, filter in JS
const all = await db.sleepEntries.toArray()
const active = all.filter(e => !e.isDeleted)
```

**How to apply:** Any time code queries a boolean field on any Dexie table, use the fetch-all + JS filter pattern. This applies to `isDeleted` and any other boolean. For future performance concerns at scale, the workaround is to store an integer flag (`0 | 1`) — but that requires a schema migration and is not needed at V1 scale.

*Discovered during Phase 1 Batch A DB layer task (Jun 2026).*
