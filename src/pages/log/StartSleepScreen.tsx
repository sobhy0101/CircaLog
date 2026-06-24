import type { SleepLogMode } from '@/hooks/useSleepLog';

interface StartSleepScreenProps {
  mode: SleepLogMode;
  onModeChange: (mode: SleepLogMode) => void;
  onStartSleep: () => void;
  inProgress: { bedTimeUtc: string; sleepStartUtc?: string } | null;
}

export default function StartSleepScreen({
  mode,
  onModeChange,
  onStartSleep,
  inProgress,
}: StartSleepScreenProps) {
  if (inProgress) {
    // LogPage redirects to InBedScreen or WakeUpScreen when inProgress is set; this is a safety fallback
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-circa-text-muted text-sm">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">

      <div className="flex gap-2" role="group" aria-label="Sleep log mode">
        {(['simple', 'detailed'] as const).map(m => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => onModeChange(m)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium capitalize min-h-11',
              mode === m
                ? 'bg-circa-accent text-white'
                : 'bg-circa-surface-raised text-circa-text-secondary',
            ].join(' ')}
          >
            {m}
          </button>
        ))}
      </div>

      <p className="text-circa-text-secondary text-sm text-center">
        {mode === 'simple'
          ? "Tap when you're ready to sleep. CircaLog will record the time."
          : "Tap when you get into bed. We'll ask again when you're actually falling asleep."}
      </p>

      <button
        onClick={onStartSleep}
        className="w-48 h-48 rounded-full bg-circa-accent flex items-center justify-center
                   shadow-lg active:scale-95 transition-transform"
      >
        <span className="text-white font-heading font-semibold text-xl">
          {mode === 'simple' ? 'Start Sleep' : 'In Bed?'}
        </span>
      </button>

    </div>
  );
}
