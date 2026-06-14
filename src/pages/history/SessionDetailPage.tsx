import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSleepLog } from '@/hooks/useSleepLog';
import ManualEntryForm from '@/pages/log/ManualEntryForm';

// ── Display helpers ──────────────────────────────────────────────────────────

function formatLocalDate(utcIso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(utcIso));
}

function formatLocalTime(utcIso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(utcIso));
}

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

// ── Section label ─────────────────────────────────────────────────────────────
// Muted, uppercase, small — clearly metadata, never competing with body text.

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="text-circa-text-muted text-xs uppercase tracking-wide mb-1">
      {children}
    </p>
  );
}

// ── Interruption label map ────────────────────────────────────────────────────

const INTERRUPTION_LABELS: Record<string, string> = {
  bathroom: 'Bathroom',
  thirst: 'Thirst',
  hunger: 'Hunger',
  pain: 'Pain',
  other: 'Other',
};

// ── SessionDetailPage ─────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoading, updateEntry, getEntryById, error } = useSleepLog();

  const entry = entryId ? getEntryById(entryId) : undefined;
  const isEditMode = searchParams.get('edit') === 'true';

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="px-4 space-y-3 pt-5">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="bg-circa-surface border border-circa-border rounded-xl animate-pulse h-24"
          />
        ))}
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-circa-text-secondary text-sm">Session not found.</p>
        <button
          type="button"
          onClick={() => navigate('/log/history')}
          className="text-circa-accent-light text-sm mt-3"
        >
          ← Back to History
        </button>
      </div>
    );
  }

  const tz = entry.ianaTimezone;

  // ── Edit mode ─────────────────────────────────────────────────────────────

  if (isEditMode) {
    return (
      <div>
        <header className="px-4 pt-5 pb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Back to session details"
            onClick={() => setSearchParams({})}
            className="text-circa-accent-light text-sm"
          >
            ← Back
          </button>
          <h1 className="text-circa-text-primary font-heading text-lg font-semibold tracking-wide">
            Edit Session
          </h1>
          {/* Spacer balances the header so the title appears centred */}
          <div className="w-14" aria-hidden="true" />
        </header>

        <ManualEntryForm
          editEntry={entry}
          updateEntry={updateEntry}
          onSaved={() => setSearchParams({})}
          onCancel={() => setSearchParams({})}
          error={error}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // ── Derived display values ────────────────────────────────────────────────

  const typeLabel = entry.sessionType === 'nap' ? 'Nap' : 'Main Sleep';
  const dateStr   = formatLocalDate(entry.sleepStartUtc, tz);
  const sleepTime = formatLocalTime(entry.sleepStartUtc, tz);
  const wakeTime  = formatLocalTime(entry.wakeUtc, tz);
  const duration  = formatDuration(entry.sleepStartUtc, entry.wakeUtc);
  const bedTime   = entry.bedTimeUtc ? formatLocalTime(entry.bedTimeUtc, tz) : null;
  const latency   = entry.bedTimeUtc ? formatDuration(entry.bedTimeUtc, entry.sleepStartUtc) : null;

  const hasOptional =
    entry.hadDreams !== undefined ||
    (entry.interruptions !== undefined && entry.interruptions.length > 0) ||
    (entry.medications !== undefined && entry.medications.length > 0) ||
    !!entry.notes;

  // ── Read-only view ────────────────────────────────────────────────────────

  return (
    <div>
      <header className="px-4 pt-5 pb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Back to history"
          onClick={() => navigate(-1)}
          className="text-circa-accent-light text-sm min-w-14"
        >
          ← Back
        </button>
        <h1 className="text-circa-text-primary font-heading text-lg font-semibold tracking-wide">
          Session #{entry.cycleNumber}
        </h1>
        <button
          type="button"
          onClick={() => setSearchParams({ edit: 'true' })}
          className="text-circa-accent-light text-sm min-w-14 text-right"
        >
          Edit
        </button>
      </header>

      <div className="px-4 space-y-5 max-w-lg mx-auto pb-6">

        {/* Date & type card */}
        <div className="bg-circa-surface border border-circa-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-circa-accent-subtle text-circa-accent-light text-xs font-semibold px-2 py-0.5 rounded-full">
                #{entry.cycleNumber}
              </span>
              <span className="text-circa-text-secondary text-xs">{typeLabel}</span>
            </div>
            <span className="text-circa-text-secondary text-xs">{dateStr}</span>
          </div>
        </div>

        {/* Times card */}
        <div className="bg-circa-surface border border-circa-border rounded-xl p-4 space-y-2">
          {bedTime && (
            <div className="flex justify-between">
              <span className="text-circa-text-primary text-sm">Bed</span>
              <span className="text-circa-text-primary text-sm">{bedTime}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-circa-text-primary text-sm">Fell asleep</span>
            <span className="text-circa-text-primary text-sm">{sleepTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-circa-text-primary text-sm">Woke up</span>
            <span className="text-circa-text-primary text-sm">{wakeTime}</span>
          </div>

          <div className="flex gap-3 pt-1">
            {latency && (
              <span className="text-circa-text-secondary text-xs">Latency: {latency}</span>
            )}
            <span className="text-circa-text-secondary text-xs">Duration: {duration}</span>
          </div>
        </div>

        {/* Quality card */}
        <div className="bg-circa-surface border border-circa-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-circa-text-primary text-sm">Sleep Quality</span>
            <QualityDots quality={entry.quality} />
          </div>
        </div>

        {/* Optional fields card — omitted when no optional data is present */}
        {hasOptional && (
          <div className="bg-circa-surface border border-circa-border rounded-xl p-4 space-y-4">

            {entry.hadDreams !== undefined && (
              <div>
                <FieldLabel>Dreams</FieldLabel>
                <p className="text-circa-text-primary text-sm">
                  {entry.hadDreams ? 'Yes' : 'No'}
                </p>
                {entry.hadDreams && entry.dreamNotes && (
                  <p className="text-circa-text-secondary text-sm mt-1">
                    {entry.dreamNotes}
                  </p>
                )}
              </div>
            )}

            {entry.interruptions && entry.interruptions.length > 0 && (
              <div>
                <FieldLabel>Interruptions</FieldLabel>
                {entry.interruptions.map(i => (
                  <p key={i.type} className="text-circa-text-primary text-sm">
                    {INTERRUPTION_LABELS[i.type] ?? i.type}
                    {i.note && (
                      <span className="text-circa-text-secondary">: {i.note}</span>
                    )}
                  </p>
                ))}
              </div>
            )}

            {entry.medications !== undefined && (
              <div>
                <FieldLabel>Medication</FieldLabel>
                <p className="text-circa-text-primary text-sm">
                  {entry.medications.length > 0
                    ? `Taken — ${entry.medications[0].timing}`
                    : 'Not taken'}
                </p>
              </div>
            )}

            {entry.notes && (
              <div>
                <FieldLabel>Notes</FieldLabel>
                <p className="text-circa-text-primary text-sm">{entry.notes}</p>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
