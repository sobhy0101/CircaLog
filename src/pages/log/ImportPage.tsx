// ImportPage.tsx — Full-page CSV import flow for CircaLog sleep log data.
//
// Route: /log/import
// Entry point: Side Drawer → More → Import
//
// Four phases:
//   idle      — file picker shown
//   parsed    — preview table + confirm button
//   importing — row-by-row progress indicator
//   done      — success/error result

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useImport } from '@/hooks/useImport'
import type { ParsedRow } from '@/utils/csvParser'
import GoogleSignInButton from '@/components/ui/GoogleSignInButton'
import { FocusTrap } from 'focus-trap-react'

// ---------------------------------------------------------------------------
// Small helper — session type label derived from duration
// (preview only — sessionType is computed by createEntry at import time)
// ---------------------------------------------------------------------------

function previewSessionType(draft: Extract<ParsedRow, { status: 'ok' }>['draft']): string {
  const startMs = new Date(draft.sleepStartUtc).getTime()
  const wakeMs  = new Date(draft.wakeUtc).getTime()
  const hours   = (wakeMs - startMs) / 1000 / 3600
  return hours < 3 ? 'Nap' : 'Main Sleep'
}

function formatDuration(draft: Extract<ParsedRow, { status: 'ok' }>['draft']): string {
  const ms = new Date(draft.wakeUtc).getTime() - new Date(draft.sleepStartUtc).getTime()
  const totalMinutes = Math.round(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// Format a UTC ISO string as local HH:MM using the entry's ianaTimezone.
function formatLocalTime(utcIso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
    timeZone: tz,
  }).format(new Date(utcIso))
}

// Format a UTC ISO string as local DD/MM/YYYY.
function formatLocalDate(utcIso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day:      '2-digit',
    month:    '2-digit',
    year:     'numeric',
    timeZone: tz,
  }).format(new Date(utcIso))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportPage() {
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const ianaTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const {
    phase,
    parsedRows,
    gateError,
    progress,
    result,
    isImporting,
    handleFileSelect,
    startImport,
    reset,
  } = useImport(user)

  // Warn before navigating away during active import.
  const [showLeaveWarning, setShowLeaveWarning] = useState(false)
  const pendingNavRef = useRef<string | null>(null)

  function requestNavigate(to: string) {
    if (isImporting) {
      pendingNavRef.current = to
      setShowLeaveWarning(true)
    } else {
      navigate(to)
    }
  }

  function confirmLeave() {
    setShowLeaveWarning(false)
    const dest = pendingNavRef.current ?? '/log'
    pendingNavRef.current = null
    navigate(dest)
  }

  function cancelLeave() {
    setShowLeaveWarning(false)
    pendingNavRef.current = null
  }

  // File input ref — used to programmatically open the picker.
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file, ianaTimezone)
    // Reset so the same file can be re-selected if needed.
    e.target.value = ''
  }

  // Counts for the summary line.
  const okRows    = parsedRows.filter(r => r.status === 'ok')
  const errorRows = parsedRows.filter(r => r.status === 'error')

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col min-h-full bg-circa-bg text-circa-text-primary">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-circa-border">
        <button
          onClick={() => requestNavigate('/log')}
          aria-label="Back to log"
          className="
            p-2 -ml-2 rounded-md
            text-circa-text-secondary
            hover:text-circa-text-primary
            hover:bg-circa-surface-raised
            transition-colors
          "
        >
          {/* Left arrow icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="font-heading text-lg font-semibold text-circa-text-primary tracking-wide">
          Import Sleep Log
        </h1>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">

        {/* ── Not signed in ── */}
        {!user && (
          <div className="space-y-4">
            <p className="text-sm text-circa-text-secondary">
              Sign in with Google to import your data. Imported sessions are
              saved to your account so they sync across devices.
            </p>
            <GoogleSignInButton returnPath="/log/import" />
          </div>
        )}

        {/* ── Signed in ── */}
        {user && (
          <>
            {/* Phase: idle — file picker */}
            {(phase === 'idle') && (
              <div className="space-y-4">
                <p className="text-sm text-circa-text-secondary">
                  Select a CSV file exported from your CircaLog Daily Tracker
                  spreadsheet. Duplicate entries are detected automatically and
                  will be skipped.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleInputChange}
                  aria-label="Select CSV file"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="
                    w-full flex flex-col items-center justify-center gap-2
                    px-4 py-8 rounded-xl border-2 border-dashed
                    border-circa-border
                    hover:border-circa-accent hover:bg-circa-accent-subtle
                    text-circa-text-secondary hover:text-circa-accent
                    transition-colors cursor-pointer
                  "
                >
                  {/* Upload icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="text-sm font-medium">Tap to select a CSV file</span>
                  <span className="text-xs">.csv only</span>
                </button>

                {gateError && (
                  <p role="alert" className="text-sm text-circa-error px-1">{gateError}</p>
                )}
              </div>
            )}

            {/* Phase: parsed — preview table + confirm */}
            {(phase === 'parsed' || phase === 'gating') && (
              <div className="space-y-4">

                {/* Summary line */}
                <p className="text-sm text-circa-text-secondary">
                  <span className="text-circa-text-primary font-medium">{okRows.length}</span>
                  {' '}ready to import
                  {errorRows.length > 0 && (
                    <> · <span className="text-circa-error font-medium">{errorRows.length} error{errorRows.length !== 1 ? 's' : ''}</span></>
                  )}
                </p>

                {/* Preview table — horizontally scrollable on mobile */}
                <div className="overflow-x-auto rounded-lg border border-circa-border">
                  <table className="min-w-full text-xs">
                    <thead className="bg-circa-surface-raised">
                      <tr>
                        {['#', 'Date', 'Sleep Start', 'Wake Time', 'Duration', 'Quality', 'Type', 'Status'].map(h => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left font-semibold text-circa-text-secondary whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, i) => {
                        const isOk = row.status === 'ok'
                        const draft = isOk ? (row as Extract<ParsedRow, { status: 'ok' }>).draft : null

                        return (
                          <tr
                            key={i}
                            className={`
                              border-t border-circa-border
                              ${i % 2 === 0 ? 'bg-circa-surface' : 'bg-circa-surface-raised'}
                            `}
                          >
                            {/* Row number */}
                            <td className="px-3 py-2 text-circa-text-secondary">{i + 1}</td>

                            {/* Date */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              {draft
                                ? formatLocalDate(draft.bedTimeUtc ?? draft.sleepStartUtc, ianaTimezone)
                                : '—'}
                            </td>

                            {/* Sleep Start */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              {draft ? formatLocalTime(draft.sleepStartUtc, ianaTimezone) : '—'}
                            </td>

                            {/* Wake Time */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              {draft ? formatLocalTime(draft.wakeUtc, ianaTimezone) : '—'}
                            </td>

                            {/* Duration */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              {draft ? formatDuration(draft) : '—'}
                            </td>

                            {/* Quality */}
                            <td className="px-3 py-2">
                              {draft ? draft.quality : '—'}
                            </td>

                            {/* Session type */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              {draft ? previewSessionType(draft) : '—'}
                            </td>

                            {/* Status badge */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.status === 'ok' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-circa-success/15 text-circa-success">
                                  Ready
                                </span>
                              )}
                              {row.status === 'error' && (
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-circa-error/15 text-circa-error"
                                  title={row.reason}
                                >
                                  {row.reason.startsWith('⚠️') ? row.reason : `⚠️ ${row.reason}`}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Gate error */}
                {gateError && (
                  <div
                    role="alert"
                    className="rounded-lg bg-circa-error/10 border border-circa-error/30 px-4 py-3"
                  >
                    <p className="text-sm text-circa-error">{gateError}</p>
                    <button
                      onClick={() => startImport(ianaTimezone)}
                      className="mt-2 text-sm font-medium text-circa-error underline underline-offset-2"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={reset}
                    className="
                      flex-1 px-4 py-3 rounded-xl text-sm font-medium
                      border border-circa-border
                      text-circa-text-secondary
                      hover:bg-circa-surface-raised
                      transition-colors
                    "
                  >
                    Choose different file
                  </button>

                  <button
                    onClick={() => startImport(ianaTimezone)}
                    disabled={okRows.length === 0 || phase === 'gating'}
                    className="
                      flex-1 px-4 py-3 rounded-xl text-sm font-medium
                      bg-circa-accent text-white
                      hover:bg-circa-accent-hover
                      disabled:opacity-40 disabled:cursor-not-allowed
                      transition-colors
                    "
                  >
                    {phase === 'gating'
                      ? 'Checking…'
                      : `Import ${okRows.length} session${okRows.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            )}

            {/* Phase: importing — progress */}
            {phase === 'importing' && progress && (
              <div className="space-y-4">
                <p
                  aria-live="polite"
                  aria-atomic="true"
                  className="text-sm text-circa-text-secondary"
                >
                  Importing row{' '}
                  <span className="text-circa-text-primary font-medium">{progress.current}</span>
                  {' '}of{' '}
                  <span className="text-circa-text-primary font-medium">{progress.total}</span>
                  …
                </p>

                {/* Progress bar */}
                <div
                  role="progressbar"
                  aria-valuenow={progress.current}
                  aria-valuemin={0}
                  aria-valuemax={progress.total}
                  aria-label="Import progress"
                  className="w-full h-2 rounded-full bg-circa-surface-raised overflow-hidden"
                >
                  <div
                    className="h-full rounded-full bg-circa-accent transition-all duration-300"
                    style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                  />
                </div>

                <p className="text-xs text-circa-text-secondary">
                  Please keep this page open until the import completes.
                </p>
              </div>
            )}

            {/* Phase: done — result */}
            {phase === 'done' && result && (
              <div role="status" className="space-y-4">

                {/* Success summary */}
                <div className="rounded-xl bg-circa-success/10 border border-circa-success/30 px-4 py-4 space-y-1">
                  <p className="text-sm font-medium text-circa-success">
                    ✅ Import complete
                  </p>
                  <p className="text-sm text-circa-text-secondary">
                    <span className="text-circa-text-primary font-medium">{result.imported}</span> imported
                    {result.skipped > 0 && (
                      <> · <span className="text-circa-text-primary font-medium">{result.skipped}</span> skipped (duplicates)</>
                    )}
                    {result.errors > 0 && (
                      <> · <span className="text-circa-error font-medium">{result.errors}</span> not imported (parse errors)</>
                    )}
                  </p>
                </div>

                {/* Sync error block */}
                {result.syncError && (
                  <div
                    role="alert"
                    className="rounded-xl bg-circa-error/10 border border-circa-error/30 px-4 py-4 space-y-2"
                  >
                    <p className="text-sm font-medium text-circa-error">
                      ⚠️ SYNC_ERR_{result.syncError.code}: {result.syncError.message}
                    </p>
                    <p className="text-sm text-circa-text-secondary">
                      Your sessions were saved to this device but could not reach
                      the server. They will sync automatically when connectivity
                      is restored.
                    </p>
                    <p className="text-xs text-circa-text-secondary">
                      If this keeps happening, contact us at{' '}
                      <a
                        href="mailto:circalog.app@gmail.com"
                        className="text-circa-accent underline underline-offset-2"
                      >
                        circalog.app@gmail.com
                      </a>
                    </p>
                  </div>
                )}

                {/* Navigation */}
                <button
                  onClick={() => navigate('/log')}
                  className="
                    w-full px-4 py-3 rounded-xl text-sm font-medium
                    bg-circa-accent text-white
                    hover:bg-circa-accent-hover
                    transition-colors
                  "
                >
                  Back to Log
                </button>

                {result.errors > 0 && (
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
                    Import another file
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Leave-during-import warning dialog ── */}
      {showLeaveWarning && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" aria-hidden="true" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            {/* allowOutsideClick: false — the positioning div has no click handler;
                the import dialog has no "tap outside to dismiss" behaviour. */}
            <FocusTrap
              focusTrapOptions={{
                escapeDeactivates: false,
                returnFocusOnDeactivate: true,
                allowOutsideClick: false,
              }}
            >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="leave-warning-title"
              className="w-full max-w-sm rounded-2xl bg-circa-surface border border-circa-border p-6 space-y-4"
              onKeyDown={(e) => { if (e.key === 'Escape') cancelLeave(); }}
            >
              <h2 id="leave-warning-title" className="font-heading text-base font-semibold text-circa-text-primary">
                Import in progress
              </h2>
              <p className="text-sm text-circa-text-secondary">
                Leaving now will stop the import. Any sessions already processed
                will be kept, but the rest will not be imported.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelLeave}
                  className="
                    flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                    bg-circa-accent text-white
                    hover:bg-circa-accent-hover
                    transition-colors
                  "
                >
                  Stay
                </button>
                <button
                  onClick={confirmLeave}
                  className="
                    flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                    border border-circa-border
                    text-circa-text-secondary
                    hover:bg-circa-surface-raised
                    transition-colors
                  "
                >
                  Leave anyway
                </button>
              </div>
            </div>
            </FocusTrap>
          </div>
        </>
      )}

    </div>
  )
}
