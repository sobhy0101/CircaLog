import { useState, useEffect } from 'react';
import { parseElapsed } from '@/utils/parseElapsed';

interface InBedScreenProps {
  inProgress: { bedTimeUtc: string };
  onGoingToSleep: () => void;
  onAbandon: () => void;
  clearSession: () => void;
}

const GRACE_PERIOD_MS = 10_000;

export default function InBedScreen({
  inProgress,
  onGoingToSleep,
  onAbandon,
  clearSession,
}: InBedScreenProps) {
  const [elapsed, setElapsed] = useState(() =>
    parseElapsed(Date.now() - new Date(inProgress.bedTimeUtc).getTime())
  );
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => {
      setElapsed(parseElapsed(Date.now() - new Date(inProgress.bedTimeUtc).getTime()));
    }, 1000);
    const grace = setTimeout(() => setCanProceed(true), GRACE_PERIOD_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(grace);
    };
  }, [inProgress.bedTimeUtc]);

  function handleAbandon() {
    clearSession();
    onAbandon();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
      <div className="text-center">
        <p className="text-circa-text-secondary text-sm mb-1">In bed for</p>
        <p className="text-circa-text-primary font-heading text-4xl font-semibold tracking-tight tabular-nums">
          {elapsed.h}h {String(elapsed.m).padStart(2, '0')}m
        </p>
      </div>

      <button
        type="button"
        onClick={onGoingToSleep}
        disabled={!canProceed}
        className="w-48 h-48 rounded-full bg-circa-accent flex items-center justify-center
                   shadow-lg active:scale-95 transition-transform disabled:opacity-40
                   disabled:active:scale-100"
      >
        <span className="text-white font-heading font-semibold text-xl text-center px-4">
          Going to Sleep?
        </span>
      </button>

      <button
        type="button"
        onClick={handleAbandon}
        className="text-circa-text-muted text-sm py-2 min-h-11"
      >
        Abandon session
      </button>
    </div>
  );
}
