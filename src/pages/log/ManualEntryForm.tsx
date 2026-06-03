import { useState } from 'react';
import type { createEntry } from '@/lib/db';
import type { InterruptionType, MedicationTiming } from '@/lib/circadian';
import QualityPicker from '@/components/ui/QualityPicker';

interface ManualEntryFormProps {
  onSaved: () => void;
  onCancel: () => void;
  createEntry: (draft: Parameters<typeof createEntry>[0]) => Promise<void>;
  error: string | null;
  isLoading: boolean;
  initialSleepStart?: string;
  initialWake?: string;
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

export default function ManualEntryForm({
  onSaved,
  onCancel,
  createEntry,
  error,
  isLoading,
}: ManualEntryFormProps) {
  const today = todayLocal();

  // Required fields
  const [sleepDate, setSleepDate] = useState(today);
  const [sleepTime, setSleepTime] = useState('');
  const [wakeDate,  setWakeDate]  = useState(today);
  const [wakeTime,  setWakeTime]  = useState('');
  const [quality,   setQuality]   = useState<number | null>(null);

  // Optional — always visible
  const [bedDate, setBedDate]   = useState(today);
  const [bedTime, setBedTime]   = useState('');
  const [notes,   setNotes]     = useState('');

  // Optional — collapsible
  const [showOptional,       setShowOptional]       = useState(false);
  const [hadDreams,          setHadDreams]          = useState<boolean | null>(null);
  const [dreamNotes,         setDreamNotes]         = useState('');
  const [activeInterruptions, setActiveInterruptions] = useState<Set<InterruptionType>>(new Set());
  const [interruptionNotes,  setInterruptionNotes]  = useState<Partial<Record<InterruptionType, string>>>({});
  const [medicationTaken,    setMedicationTaken]    = useState<boolean | null>(null);
  const [medicationTiming,   setMedicationTiming]   = useState<MedicationTiming | null>(null);

  // Inline validation errors
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

  async function handleSubmit() {
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

    const sleepStartUtc = toUtcIso(sleepDate, sleepTime)!;
    const wakeUtc       = toUtcIso(wakeDate, wakeTime)!;
    const bedTimeUtc    = toUtcIso(bedDate, bedTime) ?? undefined;
    const ianaTimezone  = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const interruptions = [...activeInterruptions].map(type => ({
      type,
      note: interruptionNotes[type] || undefined,
    }));

    await createEntry({
      sleepStartUtc,
      wakeUtc,
      bedTimeUtc,
      ianaTimezone,
      quality: quality as 1 | 2 | 3 | 4 | 5,
      notes: notes || undefined,
      hadDreams: hadDreams ?? undefined,
      dreamNotes: hadDreams ? dreamNotes || undefined : undefined,
      interruptions: interruptions.length > 0 ? interruptions : undefined,
      medications:
        medicationTaken && medicationTiming
          ? [{ name: 'Yes', timing: medicationTiming }]
          : undefined,
    });

    onSaved();
  }

  return (
    <div className="px-4 py-4 space-y-5 max-w-lg mx-auto">

      {/* Bed Time — optional */}
      <div>
        <label className="block text-sm font-medium text-circa-text-primary mb-1">
          Bed Time{' '}
          <span className="text-circa-text-muted font-normal">(optional)</span>
        </label>
        <div className="flex gap-2">
          <input
            id="bedDate"
            type="date"
            value={bedDate}
            onChange={e => setBedDate(e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <input
            id="bedTime"
            type="time"
            value={bedTime}
            onChange={e => setBedTime(e.target.value)}
            className={`${inputClass} w-32`}
          />
        </div>
        <p className="text-circa-text-muted text-xs mt-1">
          When did you get into bed? Leave blank if you don't remember.
        </p>
      </div>

      {/* Sleep Start — required */}
      <div>
        <label className="block text-sm font-medium text-circa-text-primary mb-1">
          Fell Asleep
        </label>
        <div className="flex gap-2">
          <input
            id="sleepDate"
            type="date"
            value={sleepDate}
            onChange={e => setSleepDate(e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <input
            id="sleepTime"
            type="time"
            value={sleepTime}
            onChange={e => setSleepTime(e.target.value)}
            className={`${inputClass} w-32`}
          />
        </div>
        {sleepError && <p className="text-red-400 text-xs mt-1">{sleepError}</p>}
      </div>

      {/* Wake Time — required */}
      <div>
        <label className="block text-sm font-medium text-circa-text-primary mb-1">
          Woke Up
        </label>
        <div className="flex gap-2">
          <input
            id="wakeDate"
            type="date"
            value={wakeDate}
            onChange={e => setWakeDate(e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <input
            id="wakeTime"
            type="time"
            value={wakeTime}
            onChange={e => setWakeTime(e.target.value)}
            className={`${inputClass} w-32`}
          />
        </div>
        {wakeError && <p className="text-red-400 text-xs mt-1">{wakeError}</p>}
      </div>

      {/* Quality — required */}
      <div>
        <QualityPicker label="Sleep Quality" value={quality} onChange={setQuality} />
        {qualityError && <p className="text-red-400 text-xs mt-1 text-center">{qualityError}</p>}
      </div>

      {/* Notes — optional */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-circa-text-primary mb-1">
          Notes
        </label>
        <textarea
          id="notes"
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
        onClick={() => setShowOptional(v => !v)}
        className="flex items-center gap-1 text-circa-accent-light text-sm mt-1"
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

          {/* Dream Notes — only when hadDreams is true */}
          {hadDreams === true && (
            <div>
              <label htmlFor="dreamNotes" className="block text-sm font-medium text-circa-text-primary mb-1">
                Dream Notes
              </label>
              <textarea
                id="dreamNotes"
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
            {/* Per-chip note inputs */}
            {[...activeInterruptions].map(type => (
              <div key={type} className="mt-2">
                <label
                  htmlFor={`interruption-note-${type}`}
                  className="block text-xs text-circa-text-secondary mb-1"
                >
                  {INTERRUPTION_TYPES.find(i => i.value === type)?.label} note (optional)
                </label>
                <input
                  id={`interruption-note-${type}`}
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

          {/* Medication timing — only when medicationTaken is true */}
          {medicationTaken === true && (
            <div>
              <p className="text-sm font-medium text-circa-text-primary mb-2">Timing</p>
              <div className="flex gap-2">
                {(['before', 'during', 'after'] as MedicationTiming[]).map(t => (
                  <button
                    key={t}
                    type="button"
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
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full bg-circa-accent text-white font-semibold py-3 rounded-xl
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving…' : 'Save Sleep Session'}
      </button>

      {/* Cancel */}
      <button
        type="button"
        onClick={onCancel}
        className="w-full text-circa-text-muted text-sm py-2"
      >
        Cancel
      </button>
    </div>
  );
}
