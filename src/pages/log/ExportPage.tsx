import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllEntries } from '@/lib/db'
import { useExport } from '@/hooks/useExport'

export default function ExportPage() {
  const navigate = useNavigate()
  const { exportBackup, status, errorMessage } = useExport()
  const [entryCount, setEntryCount] = useState<number | null>(null)

  useEffect(() => {
    getAllEntries().then(entries => setEntryCount(entries.length))
  }, [])

  return (
    <div className="flex flex-col min-h-full bg-circa-bg text-circa-text-primary">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-circa-border">
        <button
          onClick={() => navigate(-1)}
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
          Export
        </h1>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 max-w-lg mx-auto w-full">

        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="p-4 rounded-full bg-circa-accent-subtle">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
              className="text-circa-accent-light" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-circa-text-primary">
            Export your sleep data
          </h2>
          <p className="text-sm text-circa-text-secondary leading-relaxed">
            Downloads a complete backup of all your sleep sessions as a JSON file.
            Store it safely on: Google Drive, email to yourself, a USB drive.
          </p>
        </div>

        {/* Entry count */}
        <p className="text-center text-sm text-circa-text-secondary">
          {entryCount === null
            ? 'Loading…'
            : <><span className="text-circa-text-primary font-medium">{entryCount}</span> session{entryCount !== 1 ? 's' : ''} will be exported</>
          }
        </p>

        {/* Download button */}
        <button
          onClick={exportBackup}
          disabled={status === 'exporting'}
          className="
            w-full px-4 py-3 rounded-xl text-sm font-medium
            bg-circa-accent text-white
            hover:opacity-90
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-opacity
          "
        >
          {status === 'exporting' ? 'Exporting…' : 'Download Backup (.json)'}
        </button>

        {/* Success */}
        {status === 'done' && (
          <div className="rounded-xl bg-circa-success/10 border border-circa-success/30 px-4 py-3">
            <p className="text-sm font-medium text-circa-success">
              ✓ Backup saved. Keep this file somewhere safe.
            </p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && errorMessage && (
          <div className="rounded-xl bg-circa-error/10 border border-circa-error/30 px-4 py-3">
            <p className="text-sm text-circa-error">{errorMessage}</p>
          </div>
        )}

        {/* Info section */}
        <div className="rounded-xl bg-circa-surface border border-circa-border p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-circa-text-primary mb-2">
              What's included
            </h3>
            <ul className="space-y-1 text-sm text-circa-text-secondary list-disc list-inside">
              <li>All active sleep sessions</li>
              <li>Sleep start and wake times, quality ratings, notes, and all optional fields</li>
              <li>Cycle numbers and session types</li>
            </ul>
          </div>
          <div className="border-t border-circa-border pt-4">
            <h3 className="text-sm font-semibold text-circa-text-primary mb-2">
              What's not included
            </h3>
            <ul className="space-y-1 text-sm text-circa-text-secondary list-disc list-inside">
              <li>Deleted sessions</li>
              <li>Account or profile information</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
