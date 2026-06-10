import { useState } from 'react';
import Actogram from '@/components/chart/Actogram';
import { useActogramData } from '@/hooks/useActogramData';
import type { TimeRange } from '@/hooks/useActogramData';

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <span className="text-4xl mb-4" aria-hidden="true">🌙</span>
      <p className="text-circa-text-secondary text-sm">No sleep data yet.</p>
      <p className="text-circa-text-muted text-xs mt-1">
        Head to the Log tab to record your first session.
      </p>
    </div>
  );
}

// ── ChartPage ─────────────────────────────────────────────────────────────────

export default function ChartPage() {
  // TODO: change default to '1W' once production data accumulates
  const [range, setRange] = useState<TimeRange>('All');

  const { cycles, yMax, isEmpty, isLoading, error } = useActogramData(range);

  const subtitle = cycles.length > 0
    ? `${cycles.length} cycle${cycles.length !== 1 ? 's' : ''}`
    : null;

  return (
    <div>
      <header className="px-4 pt-5 pb-2">
        <h1 className="text-circa-text-primary font-heading text-lg font-semibold tracking-wide">
          Chart
        </h1>
        {!isLoading && subtitle && (
          <p className="text-circa-text-secondary text-xs mt-0.5">{subtitle}</p>
        )}
      </header>

      {error && (
        <div className="mx-4 mb-3 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm">
          {error}
        </div>
      )}

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

      {!isLoading && isEmpty && <EmptyState />}

      {!isLoading && !isEmpty && (
        <Actogram
          data={{ cycles, yMax, isEmpty }}
          selectedRange={range}
          onRangeChange={setRange}
        />
      )}
    </div>
  );
}
