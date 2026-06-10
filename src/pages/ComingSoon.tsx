// ComingSoon.tsx — the landing page at circalog.app (route: /)
// This page is shown before the app launches publicly.
// The logo is a text placeholder — it will be replaced with an SVG logo later.

import ThemeToggle from '@/components/ui/ThemeToggle'
import EmailCapture from '@/components/ui/EmailCapture'

export default function ComingSoon() {
  return (
    // relative is required so the absolutely-positioned ThemeToggle stays
    // within the page boundary rather than the viewport.
    <div className="relative min-h-screen bg-circa-bg flex flex-col items-center justify-center px-6 text-center">

      {/* ── Theme toggle ───────────────────────────────────────────────── */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* ── Logo placeholder ───────────────────────────────────────────── */}
      {/* A styled circle with the initials "CL" stands in for the real logo.
          Replace this entire block when the actual SVG logo is ready. */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div

        >
          {/* Two logos rendered simultaneously; CSS hides the inactive one. */}
          <img
            src="/images/brand/logo/circalog-dark-logo.svg"
            alt="CircaLog"
            className="w-64 h-auto object-contain mb-8 hidden dark:block"
          />
          <img
            src="/images/brand/logo/circalog-light-logo.svg"
            alt="CircaLog"
            className="w-64 h-auto object-contain mb-8 block dark:hidden"
          />
        </div>

        {/* App name — styled as the wordmark until a proper logo is designed */}
        {/* <h1 className="text-4xl font-bold tracking-tight text-circa-text-primary font-heading">
          Circa<span className="text-circa-accent">Log</span>
        </h1> */}
      </div>

      {/* ── Headline ───────────────────────────────────────────────────── */}
      <p className="text-2xl font-semibold text-circa-accent-light mb-3 font-heading">
        Coming Soon
      </p>

      {/* ── Tagline ────────────────────────────────────────────────────── */}
      <p className="max-w-sm text-circa-text-secondary text-base leading-relaxed font-sans">
        A sleep tracker built for Non-24-Hour Sleep–Wake Disorder.
        <br />
        Something's taking shape, hopefully in the dark.
      </p>

      {/* ── Email capture ──────────────────────────────────────────────── */}
      <div className="mt-10">
        <EmailCapture />
      </div>

      {/* ── Footer links — pinned to bottom, outside the centered stack ── */}
      <footer className="absolute bottom-6 flex items-center gap-6 text-xs font-sans">
        <a
          href="https://github.com/sobhy0101/CircaLog"
          target="_blank"
          rel="noopener noreferrer"
          className="text-circa-text-muted hover:text-circa-text-secondary no-underline hover:underline transition-colors duration-150"
        >
          GitHub
        </a>
        <a
          href="https://github.com/sobhy0101"
          target="_blank"
          rel="noopener noreferrer"
          className="text-circa-text-muted hover:text-circa-text-secondary no-underline hover:underline transition-colors duration-150"
        >
          sobhy0101
        </a>
      </footer>

    </div>
  )
}
