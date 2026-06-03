interface StartSleepScreenProps {
  onStartSleep: () => void;
  inProgress: { bedTimeUtc: string; startedAt: string } | null;
}

export default function StartSleepScreen({ onStartSleep, inProgress }: StartSleepScreenProps) {
  if (inProgress) {
    // LogPage redirects to WakeUpScreen when inProgress is set; this is a safety fallback
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-circa-text-muted text-sm">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
      <p className="text-circa-text-secondary text-sm text-center">
        Tap when you're ready to sleep. CircaLog will record the time.
      </p>
      <button
        onClick={onStartSleep}
        className="w-48 h-48 rounded-full bg-circa-accent flex items-center justify-center
                   shadow-lg active:scale-95 transition-transform"
      >
        <span className="text-white font-display font-semibold text-xl">
          Start Sleep
        </span>
      </button>
    </div>
  );
}
