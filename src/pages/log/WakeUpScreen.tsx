import { useState, useEffect } from 'react';
import type { createEntry } from '@/lib/db';
import type { InterruptionType, MedicationTiming } from '@/lib/circadian';
import QualityPicker from '@/components/ui/QualityPicker';
import { parseElapsed } from '@/utils/parseElapsed';

interface WakeUpScreenProps {
  inProgress: { mode: 'simple' | 'detailed'; bedTimeUtc: string; sleepStartUtc: string };
  onComplete: () => void;
  onAbandon: () => void;
  createEntry: (draft: Parameters<typeof createEntry>[0]) => Promise<void>;
  clearSession: () => void;
  error: string | null;
  isLoading: boolean;
}

/**
 * Converts a local YYYY-MM-DD date string and HH:MM time string to a
 * UTC ISO 8601 string using the browser's local timezone.
 * Returns null if either input is empty.
 */
function toUtcIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  return new Date(`${date}T${time}`).toISOString();
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowTimeLocal(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}


const INTERRUPTION_TYPES: { value: InterruptionType; label: string }[] = [
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'thirst',   label: 'Thirst'   },
  { value: 'hunger',   label: 'Hunger'   },
  { value: 'pain',     label: 'Pain'     },
  { value: 'other',    label: 'Other'    },
];

const inputClass =
  'bg-circa-surface-raised border border-circa-border rounded-lg px-3 py-2 ' +
  'text-circa-text-primary text-sm focus:outline-none focus:border-circa-border-strong w-full';

export default function WakeUpScreen({
  inProgress,
  onComplete,
  onAbandon,
  createEntry,
  clearSession,
  error,
  isLoading,
}: WakeUpScreenProps) {
  const [elapsed, setElapsed] = useState(() =>
    parseElapsed(Date.now() - new Date(inProgress.sleepStartUtc).getTime())
  );
  const [colonVisible, setColonVisible] = useState(true);

  // Update elapsed every second and blink the colon separator
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(parseElapsed(Date.now() - new Date(inProgress.sleepStartUtc).getTime()));
      setColonVisible(v => !v);
    }, 1000);
    return () => clearInterval(id);
  }, [inProgress.sleepStartUtc]);

  // Sleep start — pre-filled from sleepStartUtc (= bedTimeUtc in simple mode), editable
  const [sleepDate, setSleepDate] = useState(() => {
    const d = new Date(inProgress.sleepStartUtc);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [sleepTime, setSleepTime] = useState(() => {
    const d = new Date(inProgress.sleepStartUtc);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // Wake time fields — pre-filled with current time
  const [wakeDate, setWakeDate] = useState(todayLocal);
  const [wakeTime, setWakeTime] = useState(nowTimeLocal);
  const [quality,  setQuality]  = useState<number | null>(null);
  const [notes,    setNotes]    = useState('');

  // Optional section
  const [showOptional,        setShowOptional]        = useState(false);
  const [hadDreams,           setHadDreams]           = useState<boolean | null>(null);
  const [dreamNotes,          setDreamNotes]          = useState('');
  const [activeInterruptions, setActiveInterruptions] = useState<Set<InterruptionType>>(new Set());
  const [interruptionNotes,   setInterruptionNotes]   = useState<Partial<Record<InterruptionType, string>>>({});
  const [medicationTaken,     setMedicationTaken]     = useState<boolean | null>(null);
  const [medicationTiming,    setMedicationTiming]    = useState<MedicationTiming | null>(null);

  // Inline errors
  const [sleepError,   setSleepError]   = useState('');
  const [wakeError,    setWakeError]    = useState('');
  const [qualityError, setQualityError] = useState('');

  function toggleInterruption(type: InterruptionType) {
    setActiveInterruptions(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  async function handleComplete() {
    let valid = true;

    if (!sleepDate || !sleepTime) {
      setSleepError('Sleep start time is required.');
      valid = false;
    } else {
      setSleepError('');
    }

    if (!wakeDate || !wakeTime) {
      setWakeError('Wake time is required.');
      valid = false;
    } else {
      setWakeError('');
    }

    if (quality === null) {
      setQualityError('Please rate your sleep quality.');
      valid = false;
    } else {
      setQualityError('');
    }

    if (!valid) return;

    const wakeUtc      = toUtcIso(wakeDate, wakeTime)!;
    const ianaTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const interruptions = [...activeInterruptions].map(type => ({
      type,
      note: interruptionNotes[type] || undefined,
    }));

    await createEntry({
      // bedTimeUtc is the moment "Start Sleep" was tapped
      bedTimeUtc:    inProgress.bedTimeUtc,
      // sleepStartUtc comes from the editable "Fell Asleep" field
      sleepStartUtc: toUtcIso(sleepDate, sleepTime)!,
      wakeUtc,
      ianaTimezone,
      quality: quality as 1 | 2 | 3 | 4 | 5,
      notes:    notes || undefined,
      hadDreams: hadDreams ?? undefined,
      dreamNotes: hadDreams ? dreamNotes || undefined : undefined,
      interruptions: interruptions.length > 0 ? interruptions : undefined,
      medications:
        medicationTaken && medicationTiming
          ? [{ name: 'Yes', timing: medicationTiming }]
          : undefined,
    });

    clearSession();
    onComplete();
  }

  function handleAbandon() {
    clearSession();
    onAbandon();
  }

  return (
    <form onSubmit={e => { e.preventDefault(); handleComplete(); }} className="px-4 py-6 space-y-6 max-w-lg mx-auto">

      {/* Elapsed timer — digits blink a colon separator every second to
          confirm the timer is live. colonVisible toggles each interval tick. */}
      <div className="text-center">
        <p className="text-circa-text-secondary text-sm mb-1">Sleep duration so far</p>
        <p className="text-circa-text-primary font-heading text-4xl font-semibold tracking-tight tabular-nums">
          {elapsed.h}
          <span
            className="transition-opacity duration-100"
            style={{ opacity: colonVisible ? 1 : 0 }}
          >
            :
          </span>
          {String(elapsed.m).padStart(2, '0')}
        </p>
      </div>

      {/* In Bed → Fell Asleep → Onset summary — read-only, updates live as the user edits */}
      {(() => {
        const bedMs = new Date(inProgress.bedTimeUtc).getTime();
        // Use the editable sleepDate/sleepTime state so the onset figure
        // updates live when the user adjusts the "Fell Asleep" fields below.
        const sleepUtc = toUtcIso(sleepDate, sleepTime);
        const sleepMs = sleepUtc ? new Date(sleepUtc).getTime() : bedMs;
        const onsetMin = Math.max(0, Math.round((sleepMs - bedMs) / 60000));
        const bedLabel = new Date(inProgress.bedTimeUtc).toLocaleTimeString([], {
          hour: 'numeric', minute: '2-digit',
        });
        const sleepLabel = sleepUtc
          ? new Date(sleepUtc).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : '—';
        return (
          <div className="text-center">
            <p className="text-circa-text-secondary text-sm">
              In bed: {bedLabel} → Fell asleep: {sleepLabel} → Onset: {onsetMin} min
            </p>
            {onsetMin === 0 && (
              <p className="text-circa-text-muted text-xs mt-1">
                Did you fall asleep immediately?
              </p>
            )}
          </div>
        );
      })()}

      {/* Fell Asleep — pre-filled from sleep start time, editable */}
      <div>
        <label htmlFor="sleepDate" className="block text-sm font-medium text-circa-text-primary mb-1">
          Fell Asleep
          <span className="text-circa-text-muted font-normal text-xs ml-1">
            (adjust if you lay awake)
          </span>
        </label>
        <div className="flex gap-2">
          <input
            id="sleepDate"
            type="date"
            value={sleepDate}
            onChange={e => setSleepDate(e.target.value)}
            aria-describedby={sleepError ? 'wake-sleep-error' : undefined}
            className={`${inputClass} flex-1`}
          />
          <input
            id="sleepTime"
            type="time"
            aria-label="Sleep start time"
            value={sleepTime}
            onChange={e => setSleepTime(e.target.value)}
            aria-describedby={sleepError ? 'wake-sleep-error' : undefined}
            className={`${inputClass} w-32`}
          />
        </div>
        {sleepError && (
          <p id="wake-sleep-error" role="alert" className="text-red-400 text-xs mt-1">
            {sleepError}
          </p>
        )}
      </div>

      {/* Wake Time */}
      <div>
        <label htmlFor="wakeDate" className="block text-sm font-medium text-circa-text-primary mb-1">
          Wake Time
        </label>
        <div className="flex gap-2">
          <input
            id="wakeDate"
            type="date"
            value={wakeDate}
            onChange={e => setWakeDate(e.target.value)}
            aria-describedby={wakeError ? 'wake-wake-error' : undefined}
            className={`${inputClass} flex-1`}
          />
          <input
            id="wakeTime"
            type="time"
            aria-label="Wake time"
            value={wakeTime}
            onChange={e => setWakeTime(e.target.value)}
            aria-describedby={wakeError ? 'wake-wake-error' : undefined}
            className={`${inputClass} w-32`}
          />
        </div>
        {wakeError && (
          <p id="wake-wake-error" role="alert" className="text-red-400 text-xs mt-1">
            {wakeError}
          </p>
        )}
      </div>

      {/* Quality */}
      <div>
        <QualityPicker label="How did you sleep?" value={quality} onChange={setQuality} errorId={qualityError ? 'wake-quality-error' : undefined} />
        {qualityError && (
          <p id="wake-quality-error" role="alert" className="text-red-400 text-xs mt-1 text-center">
            {qualityError}
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="wakeNotes" className="block text-sm font-medium text-circa-text-primary mb-1">
          Notes
        </label>
        <textarea
          id="wakeNotes"
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anything you want to remember about this session…"
          className={inputClass}
        />
      </div>

      {/* Optional fields toggle */}
      <button
        type="button"
        aria-expanded={showOptional}
        onClick={() => setShowOptional(v => !v)}
        className="flex items-center gap-1 text-circa-accent-light text-sm min-h-11"
      >
        <span>{showOptional ? '▾' : '▸'}</span>
        <span>{showOptional ? 'Hide optional fields' : 'More details'}</span>
      </button>

      {showOptional && (
        <div className="space-y-5">

          {/* Had Dreams */}
          <div>
            <p className="text-sm font-medium text-circa-text-primary mb-2">Had Dreams?</p>
            <div className="flex gap-2">
              {([true, false] as const).map(v => (
                <button
                  key={String(v)}
                  type="button"
                  aria-pressed={hadDreams === v}
                  onClick={() => setHadDreams(v)}
                  className={[
                    'px-5 py-2 rounded-lg text-sm font-medium min-w-[44px] min-h-[44px]',
                    hadDreams === v
                      ? 'bg-circa-accent text-white'
                      : 'bg-circa-surface-raised text-circa-text-secondary',
                  ].join(' ')}
                >
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          {hadDreams === true && (
            <div>
              <label htmlFor="wakeDreamNotes" className="block text-sm font-medium text-circa-text-primary mb-1">
                Dream Notes
              </label>
              <textarea
                id="wakeDreamNotes"
                rows={2}
                value={dreamNotes}
                onChange={e => setDreamNotes(e.target.value)}
                placeholder="Describe your dreams…"
                className={inputClass}
              />
            </div>
          )}

          {/* Interruptions */}
          <div>
            <p className="text-sm font-medium text-circa-text-primary mb-2">Interruptions</p>
            <div className="flex flex-wrap gap-2">
              {INTERRUPTION_TYPES.map(({ value: type, label }) => {
                const active = activeInterruptions.has(type);
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleInterruption(type)}
                    className={[
                      'px-3 py-1 rounded-full text-sm min-h-[44px]',
                      active
                        ? 'bg-circa-accent-subtle text-circa-accent-light'
                        : 'bg-circa-surface-raised text-circa-text-secondary',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {[...activeInterruptions].map(type => (
              <div key={type} className="mt-2">
                <label
                  htmlFor={`wake-interruption-note-${type}`}
                  className="block text-xs text-circa-text-secondary mb-1"
                >
                  {INTERRUPTION_TYPES.find(i => i.value === type)?.label} note (optional)
                </label>
                <input
                  id={`wake-interruption-note-${type}`}
                  type="text"
                  value={interruptionNotes[type] ?? ''}
                  onChange={e =>
                    setInterruptionNotes(prev => ({ ...prev, [type]: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          {/* Medication taken */}
          <div>
            <p className="text-sm font-medium text-circa-text-primary mb-2">Medication taken?</p>
            <div className="flex gap-2">
              {([true, false] as const).map(v => (
                <button
                  key={String(v)}
                  type="button"
                  aria-pressed={medicationTaken === v}
                  onClick={() => setMedicationTaken(v)}
                  className={[
                    'px-5 py-2 rounded-lg text-sm font-medium min-w-[44px] min-h-[44px]',
                    medicationTaken === v
                      ? 'bg-circa-accent text-white'
                      : 'bg-circa-surface-raised text-circa-text-secondary',
                  ].join(' ')}
                >
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          {medicationTaken === true && (
            <div>
              <p className="text-sm font-medium text-circa-text-primary mb-2">Timing</p>
              <div className="flex gap-2">
                {(['before', 'during', 'after'] as MedicationTiming[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={medicationTiming === t}
                    onClick={() => setMedicationTiming(t)}
                    className={[
                      'px-4 py-2 rounded-lg text-sm font-medium capitalize min-h-[44px]',
                      medicationTiming === t
                        ? 'bg-circa-accent text-white'
                        : 'bg-circa-surface-raised text-circa-text-secondary',
                    ].join(' ')}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DB error banner */}
      {error && (
        <div
          role="alert"
          className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm"
        >
          {error}
        </div>
      )}

      {/* Primary action */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-circa-accent text-white font-semibold py-3 rounded-xl
                   disabled:opacity-50"
      >
        {isLoading ? 'Saving…' : 'Save & Wake Up'}
      </button>

      {/* Abandon — secondary, destructive-ish */}
      <button
        type="button"
        onClick={handleAbandon}
        className="w-full text-circa-text-muted text-sm py-2 min-h-11"
      >
        Abandon session
      </button>
    </form>
  );
}
