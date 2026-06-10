import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSleepLog } from '@/hooks/useSleepLog';
import type { SleepEntry } from '@/lib/circadian';
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
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function EntryCard({ entry, onView, onEdit, onDelete }: EntryCardProps) {
  const tz = entry.ianaTimezone;
  const date = formatLocalDate(entry.sleepStartUtc, tz);
  const startTime = formatLocalTime(entry.sleepStartUtc, tz);
  const endTime = formatLocalTime(entry.wakeUtc, tz);
  const duration = formatDuration(entry.sleepStartUtc, entry.wakeUtc);
  const typeLabel = entry.sessionType === 'nap' ? 'Nap' : 'Main Sleep';

  return (
    <div
      className="bg-circa-surface border border-circa-border rounded-xl p-4 cursor-pointer"
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onView(); }}
      aria-label={`View session #${entry.cycleNumber}`}
    >
      {/* Row 1: cycle badge + type + date + chevron */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="bg-circa-accent-subtle text-circa-accent-light text-xs font-semibold px-2 py-0.5 rounded-full">
            #{entry.cycleNumber}
          </span>
          {/* secondary (not muted) — readable content, not a placeholder */}
          <span className="text-circa-text-secondary text-xs">{typeLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-circa-text-secondary text-xs">{date}</span>
          {/* Chevron signals the card is navigable */}
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
            className="text-circa-text-muted"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Row 2: times + duration */}
      <p className="text-circa-text-primary text-sm font-medium mb-3">
        {startTime} → {endTime}
        {/* secondary (not muted) — duration is key data, not decorative */}
        <span className="text-circa-text-secondary font-normal ml-2">· {duration}</span>
      </p>

      {/* Row 3: quality + actions */}
      <div className="flex items-center justify-between">
        <QualityDots quality={entry.quality} />

        <div className="flex items-center gap-3">
          {/* Edit button — stopPropagation prevents card navigation from firing */}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onEdit(); }}
            aria-label="Edit session"
            className="text-circa-accent-light text-xs font-medium min-h-11 px-2
                       hover:text-circa-text-primary transition-colors"
          >
            Edit
          </button>

          {/* Delete button — secondary (not muted) so the icon is visible */}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete(); }}
            aria-label="Delete session"
            className="text-circa-text-secondary text-xs min-h-11 px-2
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

type SortMode = 'newest' | 'oldest' | 'rating-asc' | 'rating-desc';
type FilterType = 'all' | 'main' | 'nap';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { entries, isLoading, error, softDeleteEntry } = useSleepLog();

  const [deleteTarget, setDeleteTarget] = useState<SleepEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterQuality, setFilterQuality] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // True when any filter differs from its default value
  const isFilterActive = filterType !== 'all' || filterQuality !== 0;

  // Sort a copy of the entries array by the selected sort mode
  const sortedEntries = useMemo(() => {
    const copy = [...entries];
    switch (sortMode) {
      case 'newest':
        return copy.sort((a, b) => b.sleepStartUtc.localeCompare(a.sleepStartUtc));
      case 'oldest':
        return copy.sort((a, b) => a.sleepStartUtc.localeCompare(b.sleepStartUtc));
      case 'rating-asc':
        return copy.sort((a, b) => a.quality - b.quality);
      case 'rating-desc':
        return copy.sort((a, b) => b.quality - a.quality);
    }
  }, [entries, sortMode]);

  // Apply type and quality filters on top of sorted entries
  const visibleEntries = useMemo(() => {
    return sortedEntries.filter(entry => {
      if (filterType === 'main' && entry.sessionType !== 'main') return false;
      if (filterType === 'nap' && entry.sessionType !== 'nap') return false;
      if (filterQuality !== 0 && entry.quality !== filterQuality) return false;
      return true;
    });
  }, [sortedEntries, filterType, filterQuality]);

  function clearFilters() {
    setFilterType('all');
    setFilterQuality(0);
  }

  function handleViewClick(entry: SleepEntry) {
    navigate(`/log/history/${entry.id}`);
  }

  function handleEditClick(entry: SleepEntry) {
    navigate(`/log/history/${entry.id}?edit=true`);
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

  // ── List view ──────────────────────────────────────────────────────────────

  // "N sessions" when no filter active; "N of M sessions" when filter is on
  const subtitleText =
    isFilterActive
      ? `${visibleEntries.length} of ${entries.length} session${entries.length !== 1 ? 's' : ''}`
      : `${entries.length} session${entries.length !== 1 ? 's' : ''}`;

  return (
    <div>
      <header className="px-4 pt-5 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-circa-text-primary font-display text-lg font-semibold tracking-wide">
            History
          </h1>
          {!isLoading && entries.length > 0 && (
            // secondary (not muted) — the session count is useful information
            <p className="text-circa-text-secondary text-xs mt-0.5">
              {subtitleText}
            </p>
          )}
        </div>

        {/* Filter icon button — shown only when there are entries to filter */}
        {!isLoading && entries.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen(prev => !prev)}
              aria-label={isFilterOpen ? 'Close filters' : 'Open filters'}
              className={`min-h-11 min-w-11 flex items-center justify-center ${
                isFilterActive ? 'text-circa-accent-light' : 'text-circa-text-secondary'
              }`}
            >
              {/* Funnel icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </button>
            {/* Dot indicator: visible when any filter is active */}
            {isFilterActive && (
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full bg-circa-accent"
                aria-hidden="true"
              />
            )}
          </div>
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

      {/* Empty state — DB has no entries at all */}
      {!isLoading && entries.length === 0 && <EmptyState />}

      {!isLoading && entries.length > 0 && (
        <>
          {/* Sort row */}
          <div className="overflow-x-auto flex gap-2 whitespace-nowrap px-4 py-2">
            {(
              [
                { mode: 'newest', label: 'Newest' },
                { mode: 'oldest', label: 'Oldest' },
                { mode: 'rating-asc', label: 'Rating ↑' },
                { mode: 'rating-desc', label: 'Rating ↓' },
              ] as { mode: SortMode; label: string }[]
            ).map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSortMode(mode)}
                className={`rounded-full text-xs px-3 border min-h-9 ${
                  sortMode === mode
                    ? 'text-circa-accent-light border-circa-accent-light'
                    : 'text-circa-text-secondary border-circa-border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Collapsible filter panel */}
          {isFilterOpen && (
            <div className="bg-circa-surface-raised border-b border-circa-border px-4 py-3">
              <div className="space-y-3">

                {/* Row 1 — Session type */}
                <div className="flex items-center gap-2">
                  <span className="text-circa-text-muted text-xs w-14 shrink-0">Type:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {(
                      [
                        { value: 'all', label: 'All' },
                        { value: 'main', label: 'Main Sleep' },
                        { value: 'nap', label: 'Nap' },
                      ] as { value: FilterType; label: string }[]
                    ).map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFilterType(value)}
                        className={`rounded-full text-xs px-2.5 border min-h-9 ${
                          filterType === value
                            ? 'bg-circa-accent-subtle text-circa-accent-light border-circa-accent-light'
                            : 'bg-transparent text-circa-text-secondary border-circa-border'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 2 — Quality rating */}
                <div className="flex items-center gap-2">
                  <span className="text-circa-text-muted text-xs w-14 shrink-0">Rating:</span>
                  <div className="overflow-x-auto flex gap-1.5 whitespace-nowrap">
                    {(
                      [
                        { value: 0, label: 'All' },
                        { value: 1, label: '★' },
                        { value: 2, label: '★★' },
                        { value: 3, label: '★★★' },
                        { value: 4, label: '★★★★' },
                        { value: 5, label: '★★★★★' },
                      ] as { value: 0 | 1 | 2 | 3 | 4 | 5; label: string }[]
                    ).map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFilterQuality(value)}
                        className={`rounded-full text-xs px-2.5 border min-h-9 ${
                          filterQuality === value
                            ? 'bg-circa-accent-subtle text-circa-accent-light border-circa-accent-light'
                            : 'bg-transparent text-circa-text-secondary border-circa-border'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear button — only shown when a filter is active */}
              {isFilterActive && (
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-circa-accent-light text-xs"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* No-match state — filters are on but nothing passes */}
          {visibleEntries.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-circa-text-secondary text-sm">
                No sessions match the current filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-circa-accent-light text-sm mt-2"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Entry list */}
          {visibleEntries.length > 0 && (
            <div className="px-4 pb-6 space-y-3">
              {visibleEntries.map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onView={() => handleViewClick(entry)}
                  onEdit={() => handleEditClick(entry)}
                  onDelete={() => handleDeleteClick(entry)}
                />
              ))}
            </div>
          )}
        </>
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
