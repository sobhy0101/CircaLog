---
name: feedback-backup-strategy
description: C:\Users\sobhy\.claude\ is backed up by Google Drive — no need to push auto-memory files to git
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 50cd53ff-463d-4509-b850-f9a42208d606
---

`C:\Users\sobhy\.claude\` is synced to Google Drive and does not need to be committed to any git repository.

**Why:** The directory is already backed up externally, so keeping auto-memory files in sync with the project repo is unnecessary overhead.

**How to apply:** When auto-memory files (under `C:\Users\sobhy\.claude\projects\...`) are updated, do not stage or push them to git. Only push the in-repo copies under `.claude/memory/` when they change.
