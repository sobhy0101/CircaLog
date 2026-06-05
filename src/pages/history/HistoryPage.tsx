import { useState } from 'react';
import { useSleepLog } from '@/hooks/useSleepLog';
import type { SleepEntry } from '@/lib/circadian';
import ManualEntryForm from '@/pages/log/ManualEntryForm';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';

// ── Display helpers ─────────────────────────────────────────────────────────

// Formats a UTC timestamp as a local date string, e.g. "Thu, 5 Jun 2026"
function formatLocalDate(utcIso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(utcIso));
}

// Formats a UTC timestamp as a local 24h time string, e.g. "02:37"
function formatLocalTime(utcIso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(utcIso));
}

// Formats a duration in ms as "Xh Ym" or "Ym" for sub-hour sessions
function formatDuration(startUtc: string, endUtc: string): string {
  const ms = new Date(endUtc).getTime() - new Date(startUtc).getTime();
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// ── Quality dots ─────────────────────────────────────────────────────────────

function QualityDots({ quality }: { quality: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Quality ${quality} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={i <= quality ? 'text-circa-accent-light' : 'text-circa-text-muted'}
          aria-hidden="true"
        >
          ●
        </span>
      ))}
    </div>
  );
}

// ── Entry card ───────────────────────────────────────────────────────────────

interface EntryCardProps {
  entry: SleepEntry;
  onEdit: () => void;
  onDelete: () => void;
}

function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const tz = entry.ianaTimezone;
  const date = formatLocalDate(entry.sleepStartUtc, tz);
  const startTime = formatLocalTime(entry.sleepStartUtc, tz);
  const endTime = formatLocalTime(entry.wakeUtc, tz);
  const duration = formatDuration(entry.sleepStartUtc, entry.wakeUtc);
  const typeLabel = entry.sessionType === 'nap' ? 'Nap' : 'Main Sleep';

  return (
    <div className="bg-circa-surface border border-circa-border rounded-xl p-4">
      {/* Row 1: cycle badge + type + date */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="bg-circa-accent-subtle text-circa-accent-light text-xs font-semibold px-2 py-0.5 rounded-full">
            #{entry.cycleNumber}
          </span>
          <span className="text-circa-text-muted text-xs">{typeLabel}</span>
        </div>
        <span className="text-circa-text-secondary text-xs">{date}</span>
      </div>

      {/* Row 2: times + duration */}
      <p className="text-circa-text-primary text-sm font-medium mb-3">
        {startTime} → {endTime}
        <span className="text-circa-text-muted font-normal ml-2">· {duration}</span>
      </p>

      {/* Row 3: quality + actions */}
      <div className="flex items-center justify-between">
        <QualityDots quality={entry.quality} />

        <div className="flex items-center gap-3">
          {/* Edit button */}
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit session"
            className="text-circa-accent-light text-xs font-medium min-h-[44px] px-2
                       hover:text-circa-text-primary transition-colors"
          >
            Edit
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete session"
            className="text-circa-text-muted text-xs min-h-[44px] px-2
                       hover:text-red-400 transition-colors"
          >
            {/* Trash icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-circa-text-muted mb-4"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 15" />
      </svg>
      <p className="text-circa-text-secondary text-sm">No sleep sessions yet.</p>
      <p className="text-circa-text-muted text-xs mt-1">
        Head to the Log tab to record your first session.
      </p>
    </div>
  );
}

// ── HistoryPage ──────────────────────────────────────────────────────────────

type HistoryView = 'list' | 'edit';

export default function HistoryPage() {
  const { entries, isLoading, error, updateEntry, softDeleteEntry } = useSleepLog();

  const [view, setView] = useState<HistoryView>('list');
  const [editingEntry, setEditingEntry] = useState<SleepEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SleepEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleEditClick(entry: SleepEntry) {
    setEditingEntry(entry);
    setView('edit');
  }

  function handleDeleteClick(entry: SleepEntry) {
    setDeleteTarget(entry);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await softDeleteEntry(deleteTarget.id);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  // ── Edit view ──────────────────────────────────────────────────────────────

  if (view === 'edit' && editingEntry) {
    return (
      <div>
        <header className="px-4 pt-5 pb-2 flex items-center justify-between">
          <h1 className="text-circa-text-primary font-display text-lg font-semibold tracking-wide">
            Edit Session
          </h1>
          <button
            onClick={() => { setView('list'); setEditingEntry(null); }}
            className="text-circa-accent-light text-sm"
          >
            ← Back
          </button>
        </header>

        <ManualEntryForm
          editEntry={editingEntry}
          updateEntry={updateEntry}
          onSaved={() => { setView('list'); setEditingEntry(null); }}
          onCancel={() => { setView('list'); setEditingEntry(null); }}
          error={error}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  return (
    <div>
      <header className="px-4 pt-5 pb-2">
        <h1 className="text-circa-text-primary font-display text-lg font-semibold tracking-wide">
          History
        </h1>
        {!isLoading && entries.length > 0 && (
          <p className="text-circa-text-muted text-xs mt-0.5">
            {entries.length} session{entries.length !== 1 ? 's' : ''}
          </p>
        )}
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-3 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="bg-circa-surface border border-circa-border rounded-xl p-4 animate-pulse h-24"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && entries.length === 0 && <EmptyState />}

      {/* Entry list — newest first (hook already reverses the array) */}
      {!isLoading && entries.length > 0 && (
        <div className="px-4 pb-6 space-y-3">
          {entries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={() => handleEditClick(entry)}
              onDelete={() => handleDeleteClick(entry)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          entry={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
