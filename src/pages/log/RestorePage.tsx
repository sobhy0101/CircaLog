import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRestore } from '@/hooks/useRestore'

// Format an ISO 8601 UTC string as a local date + time using the device locale.
function formatLocalDateTime(utcIso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(utcIso))
}

export default function RestorePage() {
  const navigate = useNavigate()
  const {
    phase,
    preview,
    restoredCount,
    errorMessage,
    handleFile,
    confirmReplace,
    confirmMerge,
    reset,
  } = useRestore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset so the same file can be re-selected after an error
    e.target.value = ''
  }

  // ── Spinner shared across loading phases ──────────────────────────────────
  const Spinner = (
    <div className="flex justify-center py-8">
      <div className="w-8 h-8 rounded-full border-2 border-circa-border border-t-circa-accent animate-spin" />
    </div>
  )

  // ── Header (shared across all phases) ─────────────────────────────────────
  const Header = (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-circa-border">
      <button
        onClick={() => { if (phase === 'idle' || phase === 'error') navigate(-1); else reset(); }}
        aria-label="Go back"
        className="
          p-2 -ml-2 rounded-md
          text-circa-text-secondary
          hover:text-circa-text-primary
          hover:bg-circa-surface-raised
          transition-colors
        "
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <h1 className="font-heading text-lg font-semibold text-circa-text-primary tracking-wide">
        Restore Backup
      </h1>
    </div>
  )

  // ── Phase: done ────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="flex flex-col min-h-full bg-circa-bg text-circa-text-primary">
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-6 text-center">
          <div className="p-4 rounded-full bg-circa-success/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
              className="text-circa-success" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div role="status" className="space-y-2">
            <h2 className="text-xl font-semibold text-circa-text-primary">Restore complete</h2>
            <p className="text-sm text-circa-text-secondary">
              <span className="text-circa-text-primary font-medium">{restoredCount ?? 0}</span> session(s) restored.
            </p>
          </div>
          <button
            onClick={() => navigate('/log/history')}
            className="
              px-6 py-3 rounded-xl text-sm font-medium
              bg-circa-accent text-white
              hover:opacity-90
              transition-opacity
            "
          >
            View sleep history
          </button>
        </div>
      </div>
    )
  }

  // ── Phase: error ───────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="flex flex-col min-h-full bg-circa-bg text-circa-text-primary">
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-6 text-center">
          <div className="p-4 rounded-full bg-circa-error/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
              className="text-circa-error" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <div role="alert" className="space-y-2">
            <h2 className="text-xl font-semibold text-circa-text-primary">Restore failed</h2>
            <p className="text-sm text-circa-text-secondary max-w-xs mx-auto">{errorMessage}</p>
          </div>
          <button
            onClick={reset}
            className="
              px-6 py-3 rounded-xl text-sm font-medium
              border border-circa-border
              text-circa-text-secondary
              hover:bg-circa-surface-raised
              transition-colors
            "
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // ── Phases: idle / parsing / previewing / restoring ────────────────────────
  return (
    <div className="flex flex-col min-h-full bg-circa-bg text-circa-text-primary">
      {Header}

      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 max-w-lg mx-auto w-full">

        {/* ── Phase: idle ── */}
        {phase === 'idle' && (
          <>
            <div className="flex flex-col items-center text-center gap-3 pt-2">
              <div className="p-4 rounded-full bg-circa-accent-subtle">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="text-circa-accent-light" aria-hidden="true">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-circa-text-primary">
                Restore from backup
              </h2>
              <p className="text-sm text-circa-text-secondary leading-relaxed">
                Select a CircaLog backup file (.json) to restore your sleep data.
                You will be able to preview what will be restored before confirming.
              </p>
            </div>

            {/* Hidden file input + styled tap target */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleInputChange}
              aria-label="Select backup file"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="
                w-full flex flex-col items-center justify-center gap-2
                px-4 py-8 rounded-xl border-2 border-dashed
                border-circa-border
                hover:border-circa-accent hover:bg-circa-accent-subtle
                text-circa-text-secondary hover:text-circa-accent-light
                transition-colors cursor-pointer
              "
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-sm font-medium">Choose backup file</span>
              <span className="text-xs">.json only</span>
            </button>

            {/* Warning callout */}
            <div className="rounded-xl bg-circa-warning/10 border border-circa-warning/30 px-4 py-3">
              <p className="text-sm text-circa-warning leading-relaxed">
                ⚠ Replace mode will permanently delete all current sessions before
                restoring. Merge mode is safer if you have any unsaved data.
              </p>
            </div>
          </>
        )}

        {/* ── Phase: parsing ── */}
        {phase === 'parsing' && (
          <div className="space-y-4">
            {Spinner}
            <p role="status" className="text-center text-sm text-circa-text-secondary">Reading backup file…</p>
          </div>
        )}

        {/* ── Phase: previewing ── */}
        {phase === 'previewing' && preview && (
          <div className="space-y-6">
            <div className="rounded-xl bg-circa-surface border border-circa-border p-5 space-y-3">
              <h2 className="text-sm font-semibold text-circa-text-primary">Backup summary</h2>
              <dl className="space-y-2 text-sm">
                {[
                  ['Exported',        formatLocalDateTime(preview.exportedAt)],
                  ['Sessions',        String(preview.entryCount)],
                  ['New to add',      String(preview.newCount)],
                  ['Already present', String(preview.duplicateCount)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-circa-text-secondary">{label}</dt>
                    <dd className="text-circa-text-primary font-medium text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <h2 className="text-sm font-semibold text-circa-text-primary">Choose restore mode</h2>

            {/* Merge — primary */}
            <button
              onClick={confirmMerge}
              disabled={preview.newCount === 0}
              className="
                w-full text-left px-5 py-4 rounded-xl border
                bg-circa-accent border-circa-accent
                text-white
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:opacity-90
                transition-opacity
                space-y-1
              "
            >
              <p className="font-medium text-sm">
                Merge — add {preview.newCount} new session(s)
              </p>
              <p className="text-xs opacity-80">
                Keeps your existing data. Skips {preview.duplicateCount} duplicate(s).
              </p>
            </button>

            {/* Replace — danger */}
            <button
              onClick={confirmReplace}
              className="
                w-full text-left px-5 py-4 rounded-xl border
                border-circa-error
                text-circa-error
                hover:bg-circa-error/10
                transition-colors
                space-y-1
              "
            >
              <p className="font-medium text-sm">
                Replace — delete everything and restore {preview.entryCount} session(s)
              </p>
              <p className="text-xs">
                All current sessions will be permanently deleted first.
              </p>
            </button>

            {/* Cancel */}
            <button
              onClick={reset}
              className="
                w-full px-4 py-3 rounded-xl text-sm font-medium
                border border-circa-border
                text-circa-text-secondary
                hover:bg-circa-surface-raised
                transition-colors
              "
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── Phase: restoring ── */}
        {phase === 'restoring' && (
          <div className="space-y-4">
            {Spinner}
            <p role="status" className="text-center text-sm text-circa-text-secondary">Restoring sessions…</p>
          </div>
        )}

      </div>
    </div>
  )
}
