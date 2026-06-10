import { useInsights } from '@/hooks/useInsights';

// ── Format helpers ──────────────────────────────────────────────────────────

// Converts a duration in minutes to "Xh Ym" or "Ym" for sub-hour values
function formatHm(minutes: number): string {
  const absMin = Math.abs(minutes);
  const h = Math.floor(absMin / 60);
  const m = Math.floor(absMin % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Converts a period expressed in decimal hours (e.g. 24.83) to "Xh Ym"
function formatPeriodHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

// Formats a YYYY-MM-DD date string as "DD Mon YYYY" (e.g. "07 Jun 2026").
// Noon anchor prevents UTC-midnight interpretation from crossing the date boundary.
function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr + 'T12:00:00'));
}

// ── Section heading ─────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="text-circa-text-muted text-xs uppercase tracking-wide mb-3">
      {children}
    </h2>
  );
}

// ── Stat card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  valueClassName?: string;
}

function StatCard({ label, value, subValue, valueClassName }: StatCardProps) {
  return (
    <div className="bg-circa-surface rounded-xl p-4 border border-circa-border">
      <p className="text-circa-text-muted text-xs uppercase tracking-wide">{label}</p>
      <p className={valueClassName ?? 'text-circa-accent font-heading text-2xl font-semibold mt-1'}>
        {value}
      </p>
      {subValue && (
        <p className="text-circa-text-secondary text-sm mt-1">{subValue}</p>
      )}
    </div>
  );
}

// ── InsightsPage ────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const {
    isLoading,
    avg7d,
    avg30d,
    avgDriftMinutesPerCycle,
    longestSession,
    shortestSession,
    totalSessions,
    currentStreakDays,
    freeRunningPeriod,
    mainSleepCount,
  } = useInsights();

  return (
    <div className="px-4 pt-6 pb-4 flex flex-col gap-6">
      <h1 className="text-circa-text-primary font-heading text-lg font-semibold tracking-wide">
        Insights
      </h1>

      {/* Loading skeleton — same pattern as HistoryPage */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="bg-circa-surface animate-pulse rounded-xl h-24"
            />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── Section A: Rolling Averages ─────────────────────────────── */}
          <section>
            <SectionHeading>Sleep Averages</SectionHeading>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="7-Day Avg"
                value={avg7d ? formatHm(avg7d.durationMinutes) : '—'}
                subValue={avg7d ? `★ ${avg7d.quality.toFixed(1)}` : undefined}
              />
              <StatCard
                label="30-Day Avg"
                value={avg30d ? formatHm(avg30d.durationMinutes) : '—'}
                subValue={avg30d ? `★ ${avg30d.quality.toFixed(1)}` : undefined}
              />
            </div>
          </section>

          {/* ── Section B: Drift ─────────────────────────────────────────── */}
          <section>
            <SectionHeading>Circadian Drift</SectionHeading>
            <div className="bg-circa-surface rounded-xl p-4 border border-circa-border">
              <p className="text-circa-text-muted text-xs uppercase tracking-wide">
                Avg Drift per Cycle - vs. 24h Baseline
              </p>
              {avgDriftMinutesPerCycle === null ? (
                <>
                  <p className="text-circa-accent font-heading text-2xl font-semibold mt-1">—</p>
                  <p className="text-circa-text-muted text-sm mt-1">
                    Log 2+ sleep sessions to unlock
                  </p>
                </>
              ) : avgDriftMinutesPerCycle === 0 ? (
                <>
                  <p className="text-circa-success font-heading text-2xl font-semibold mt-1">
                    Stable
                  </p>
                  <p className="text-circa-text-secondary text-sm mt-1">
                    Your sleep onset is running exactly on a 24-hour cycle.
                  </p>
                </>
              ) : avgDriftMinutesPerCycle > 0 ? (
                <>
                  <p className="text-circa-warning font-heading text-2xl font-semibold mt-1">
                    +{formatHm(avgDriftMinutesPerCycle)} later
                  </p>
                  <p className="text-circa-text-secondary text-sm mt-1">
                    Each sleep cycle starts this much later than the previous one.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-circa-accent-light font-heading text-2xl font-semibold mt-1">
                    {formatHm(avgDriftMinutesPerCycle)} earlier
                  </p>
                  <p className="text-circa-text-secondary text-sm mt-1">
                    Each sleep cycle starts this much earlier than the previous one.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* ── Section C: Session Extremes ──────────────────────────────── */}
          <section>
            <SectionHeading>Session Extremes</SectionHeading>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Longest Sleep"
                value={longestSession ? formatHm(longestSession.durationMinutes) : '—'}
                subValue={longestSession ? formatDate(longestSession.date) : undefined}
              />
              <StatCard
                label="Shortest Sleep"
                value={shortestSession ? formatHm(shortestSession.durationMinutes) : '—'}
                subValue={shortestSession ? formatDate(shortestSession.date) : undefined}
              />
            </div>
          </section>

          {/* ── Section D: Totals & Streak ────────────────────────────────── */}
          <section>
            <SectionHeading>Activity</SectionHeading>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Sessions Logged"
                value={String(totalSessions)}
              />
              <div className="bg-circa-surface rounded-xl p-4 border border-circa-border">
                <p className="text-circa-text-muted text-xs uppercase tracking-wide">
                  Current Streak
                </p>
                {currentStreakDays === 0 ? (
                  <p className="text-circa-accent font-heading text-2xl font-semibold mt-1">
                    No streak yet
                  </p>
                ) : (
                  <p className="text-circa-accent font-heading text-2xl font-semibold mt-1">
                    {currentStreakDays === 1 ? '1 day' : `${currentStreakDays} days`}
                    {currentStreakDays >= 7 && ' 🔥'}
                  </p>
                )}
                <p className="text-circa-text-secondary text-sm mt-1">
                  Consecutive days logged
                </p>
              </div>
            </div>
          </section>

          {/* ── Section E: Free-Running Period ───────────────────────────── */}
          <section>
            <SectionHeading>Free-Running Period</SectionHeading>
            <div className="bg-circa-accent-subtle border border-circa-accent rounded-xl p-5">
              {freeRunningPeriod.status === 'pending' ? (
                <>
                  <p className="text-circa-text-secondary font-heading text-2xl">Pending</p>
                  <p className="text-circa-text-secondary text-sm mt-1">
                    Log {Math.max(0, 14 - mainSleepCount)} more days to unlock
                  </p>
                  <p className="text-circa-text-muted text-sm mt-3">
                    Your free-running period (τ) is an estimate of how long your circadian
                    clock actually takes to complete one full cycle. It requires at least
                    14 sleep sessions to calculate reliably.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-circa-accent font-heading text-3xl font-bold">
                    {formatPeriodHours(freeRunningPeriod.periodHours)}
                  </p>
                  <p className="text-circa-text-secondary text-sm mt-1">
                    Free-Running Period (τ)
                  </p>
                  <p className="text-circa-text-muted text-sm mt-2">
                    {Math.abs(freeRunningPeriod.periodHours - 24) <= 5 / 60
                      ? 'Your clock is running very close to 24 hours.'
                      : freeRunningPeriod.periodHours > 24
                      ? `Your clock runs ${formatPeriodHours(freeRunningPeriod.periodHours - 24)} longer than 24 hours, causing sleep to drift later each cycle.`
                      : `Your clock runs ${formatPeriodHours(24 - freeRunningPeriod.periodHours)} shorter than 24 hours, causing sleep to drift earlier each cycle.`}
                  </p>
                  <p className="text-circa-text-muted text-xs mt-3">
                    Estimated from {freeRunningPeriod.entryCount} sleep sessions via linear regression.
                  </p>
                </>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
