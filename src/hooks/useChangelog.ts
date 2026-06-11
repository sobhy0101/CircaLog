import { useState, useEffect } from 'react'

export interface ChangelogEntry {
  version: string    // e.g. "0.1.0"
  date: string       // raw string from CHANGELOG.md — not a Date object
  new?: string[]
  improved?: string[]
  fixed?: string[]
}

function parseChangelog(content: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = []

  // Split on "## [" to isolate each version block; slice(1) discards the
  // preamble text before the first version header.
  const blocks = content.split(/^## \[/m).slice(1)

  for (const block of blocks) {
    const firstLine = block.split('\n')[0]
    const versionMatch = firstLine.match(/^([^\]]+)\]/)
    const dateMatch    = firstLine.match(/ — (.+)$/)
    if (!versionMatch) continue

    const entry: ChangelogEntry = {
      version: versionMatch[1].trim(),
      date:    dateMatch ? dateMatch[1].trim() : '',
    }

    // Split each block on "### " to get category subsections.
    // slice(1) drops the text before the first "### " (version header area).
    const subSections = block.split(/^### /m).slice(1)
    for (const sub of subSections) {
      const lines   = sub.split('\n')
      const heading = lines[0].trim()
      const items   = lines
        .slice(1)
        .filter(line => line.startsWith('- '))
        .map(line => line.slice(2).trim())
        .filter(Boolean)

      if (items.length === 0) continue
      if (heading === 'New')      entry.new      = items
      if (heading === 'Improved') entry.improved = items
      if (heading === 'Fixed')    entry.fixed    = items
    }

    entries.push(entry)
  }

  return entries
}

// Parsed once at module load — not re-parsed on every render.
// __CHANGELOG_CONTENT__ is replaced with the raw CHANGELOG.md text at build time.
export const PARSED_ENTRIES: ChangelogEntry[] = parseChangelog(__CHANGELOG_CONTENT__)

const LAST_SEEN_VERSION_KEY = 'circalog_last_seen_version'

export function useChangelog(): {
  isOpen: boolean
  entries: ChangelogEntry[]
  currentVersion: string
  open: () => void
  close: () => void
} {
  const [isOpen, setIsOpen] = useState(false)

  // On mount, check whether the user has already seen this version's changelog.
  // If not (or if it's their first install), open the modal automatically.
  useEffect(() => {
    const lastSeen = localStorage.getItem(LAST_SEEN_VERSION_KEY)
    if (lastSeen !== __APP_VERSION__) {
      setIsOpen(true)
    }
  }, [])

  function open() {
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
    // Record that the user has seen this version so the modal won't auto-open again
    // until the next app update bumps __APP_VERSION__.
    localStorage.setItem(LAST_SEEN_VERSION_KEY, __APP_VERSION__)
  }

  return { isOpen, entries: PARSED_ENTRIES, currentVersion: __APP_VERSION__, open, close }
}
