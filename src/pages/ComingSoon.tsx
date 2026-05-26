// ComingSoon.tsx — the landing page at circalog.app (route: /)
// This page is shown before the app launches publicly.
// The logo is a text placeholder — it will be replaced with an SVG logo later.

export default function ComingSoon() {
  return (
    // Full-screen dark background, centred layout
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6 text-center">

      {/* ── Logo placeholder ───────────────────────────────────────────── */}
      {/* A styled circle with the initials "CL" stands in for the real logo.
          Replace this entire block when the actual SVG logo is ready. */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div
          className="
            w-24 h-24 rounded-full
            bg-violet-950 border-2 border-violet-500
            flex items-center justify-center
          "
        >
          {/* Initials placeholder — swap for <img> or <svg> when logo exists */}
          <span className="text-3xl font-bold tracking-widest text-violet-300 select-none">
            CL
          </span>
        </div>

        {/* App name — styled as the wordmark until a proper logo is designed */}
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Circa<span className="text-violet-400">Log</span>
        </h1>
      </div>

      {/* ── Headline ───────────────────────────────────────────────────── */}
      <p className="text-2xl font-semibold text-violet-200 mb-3">
        Coming Soon
      </p>

      {/* ── Tagline ────────────────────────────────────────────────────── */}
      <p className="max-w-sm text-neutral-400 text-base leading-relaxed">
        A sleep tracker built for Non-24-Hour Sleep–Wake Disorder.
        <br />
        Something's taking shape, hopefully in the dark.
      </p>

      {/* ── Subtle footer note ─────────────────────────────────────────── */}
      <p className="mt-16 text-xs text-neutral-700 select-none">
        circalog.app
      </p>

    </div>
  )
}
