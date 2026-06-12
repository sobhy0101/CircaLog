// AboutPage — information about CircaLog and Non-24-Hour Sleep-Wake Disorder.
// Wired to /log/about from the side drawer.

import { useNavigate } from 'react-router-dom'

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-full bg-circa-bg text-circa-text-primary">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-circa-border">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="
            p-2 -ml-2 rounded-md
            text-circa-text-secondary
            hover:text-circa-text-primary
            hover:bg-circa-surface-raised
            transition-colors
          "
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="font-heading text-lg font-semibold text-circa-text-primary tracking-wide">
          About
        </h1>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 max-w-lg mx-auto w-full">

        {/* App section */}
        <div className="rounded-xl bg-circa-surface border border-circa-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-circa-text-primary">About CircaLog</h2>
          <p className="text-sm text-circa-text-secondary leading-relaxed">
            CircaLog is a sleep-tracking app built specifically for people with
            Non-24-Hour Sleep-Wake Disorder and other circadian rhythm conditions.
            It tracks your sleep and wake times, visualises your shifting cycle,
            and helps you build a record to share with your doctor.
          </p>
        </div>

        {/* Non-24 section */}
        <div className="rounded-xl bg-circa-surface border border-circa-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-circa-text-primary">About Non-24</h2>
          <p className="text-sm text-circa-text-secondary leading-relaxed">
            Non-24-Hour Sleep-Wake Disorder (Non-24) is a circadian rhythm condition
            in which the body's internal clock runs longer than 24 hours — typically
            24.5–25.5 hours. Because it never resets to the external day, sleep onset
            drifts later each day in a predictable cycle.
          </p>
          <p className="text-sm text-circa-text-secondary leading-relaxed">
            Non-24 is most common in people who are totally blind (loss of light
            perception removes the primary cue that anchors the clock to the 24-hour
            day), but it also affects some sighted individuals.
          </p>
          <p className="text-sm text-circa-text-secondary leading-relaxed">
            The "free-running period" (tau, τ) is the natural length of a person's
            circadian cycle. Knowing your tau helps predict when your sleep window
            will next align with conventional hours — and for how long.
          </p>
        </div>

        {/* Resources section — placeholder, links to be added in V2 */}
        <div className="rounded-xl bg-circa-surface border border-circa-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-circa-text-primary">Resources</h2>
          <p className="text-sm text-circa-text-secondary leading-relaxed">
            Curated links to reputable information about Non-24 and circadian rhythm
            disorders will be added here in a future update.
          </p>
        </div>

      </div>
    </div>
  )
}
