/*
 * Series helpers. We derive the series name + number from the book title, which
 * Goodreads embeds like "Use of Force (Scot Harvath, #16)" or
 * "Savage Son (Terminal List #3)". No external API needed. Books whose titles
 * don't carry that suffix simply don't participate in series suggestions.
 */

// Parse a trailing "(Series, #N)" / "(Series #N)" -> { series, number }.
export function parseSeries(title) {
  if (!title) return null
  const m = String(title).match(/\(([^()#]+?)[,\s]*#(\d+(?:\.\d+)?)\)\s*$/)
  if (!m) return null
  return { series: m[1].trim(), number: parseFloat(m[2]) }
}

// A book's series — prefers the explicit series fields the user set, and falls
// back to parsing the title (so Goodreads imports work without editing).
export function getSeries(book) {
  if (book?.series_name && book.series_number != null && book.series_number !== '') {
    return { series: String(book.series_name).trim(), number: Number(book.series_number) }
  }
  return parseSeries(book?.title)
}

function sameSeries(a, b) {
  return a && b && a.toLowerCase() === b.toLowerCase()
}

/*
 * The next unread book in the same series that's already on the shelf — the
 * lowest-numbered book after this one that hasn't been debriefed. Used for the
 * "Next →" prompt when a book is debriefed.
 */
export function nextInSeries(book, allBooks) {
  const s = getSeries(book)
  if (!s) return null
  return allBooks
    .map((b) => ({ b, meta: getSeries(b) }))
    .filter(
      ({ b, meta }) =>
        meta && sameSeries(meta.series, s.series) && meta.number > s.number && b.status !== 'debriefed'
    )
    .sort((a, z) => a.meta.number - z.meta.number)
    .map((x) => x.b)[0] || null
}

/*
 * For every series you've started (finished or currently reading a book from),
 * the next book you already own but haven't started — queued or stalled. Drives
 * the "Continue the series" spotlight on the Reading screen.
 */
export function seriesSuggestions(allBooks) {
  const groups = {}
  for (const b of allBooks) {
    const meta = getSeries(b)
    if (!meta) continue
    const key = meta.series.toLowerCase()
    ;(groups[key] = groups[key] || []).push({ b, num: meta.number, series: meta.series })
  }

  const out = []
  for (const key of Object.keys(groups)) {
    const items = groups[key]
    const started = items.filter((x) => x.b.status === 'debriefed' || x.b.status === 'active')
    if (started.length === 0) continue
    const progress = Math.max(...started.map((x) => x.num))
    const next = items
      .filter((x) => (x.b.status === 'queued' || x.b.status === 'stalled') && x.num > progress)
      .sort((a, z) => a.num - z.num)[0]
    if (next) out.push({ series: next.series, book: next.b })
  }
  return out
}
