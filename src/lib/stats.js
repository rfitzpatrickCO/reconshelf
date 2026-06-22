/*
 * Pure, derived-stat helpers. Nothing here is stored — these are computed from
 * Book / ReadingSession rows on the fly (see feature spec §5).
 */

export function progressPct(book) {
  if (!book?.total_pages || book.total_pages <= 0) return 0
  return Math.min(100, Math.round(((book.current_page || 0) / book.total_pages) * 100))
}

export function pagesLeft(book) {
  if (!book?.total_pages) return null
  return Math.max(0, book.total_pages - (book.current_page || 0))
}

/* "Op tempo": longest run of consecutive calendar days that have >= 1 session. */
export function longestOpTempo(sessions) {
  if (!sessions?.length) return 0
  const days = [...new Set(sessions.map((s) => s.logged_at))].sort()
  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + 'T00:00:00')
    const cur = new Date(days[i] + 'T00:00:00')
    const diffDays = Math.round((cur - prev) / 86400000)
    if (diffDays === 1) {
      run += 1
      longest = Math.max(longest, run)
    } else if (diffDays > 1) {
      run = 1
    }
  }
  return longest
}

/* Current "op tempo": consecutive days with activity ending today (or yesterday,
   so a streak isn't broken until you miss a full day). */
export function currentOpTempo(sessions) {
  if (!sessions?.length) return 0
  const days = new Set(sessions.map((s) => s.logged_at))
  const iso = (d) => d.toISOString().slice(0, 10)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  // Streak is only "current" if there was activity today or yesterday.
  let cursor
  if (days.has(iso(today))) cursor = today
  else if (days.has(iso(yesterday))) cursor = yesterday
  else return 0

  let count = 0
  const d = new Date(cursor)
  while (days.has(iso(d))) {
    count += 1
    d.setDate(d.getDate() - 1)
  }
  return count
}

/* Average days between started_at and finished_at across debriefed books. */
export function avgTimeOnTarget(books) {
  const spans = books
    .filter((b) => b.status === 'debriefed' && b.started_at && b.finished_at)
    .map((b) => {
      const start = new Date(b.started_at)
      const end = new Date(b.finished_at)
      return Math.max(0, Math.round((end - start) / 86400000))
    })
  if (!spans.length) return null
  return Math.round(spans.reduce((a, b) => a + b, 0) / spans.length)
}

export function debriefedInYear(books, year) {
  return books.filter(
    (b) => b.status === 'debriefed' && b.finished_at && new Date(b.finished_at).getFullYear() === year
  )
}

/* Sum of total_pages for the given set of (debriefed) books. */
export function pagesDownrange(books) {
  return books.reduce((sum, b) => sum + (b.total_pages || 0), 0)
}

/* Category counts, sorted desc, capped at `cap` with the remainder as "other". */
export function theaterCounts(books, cap = 5) {
  const counts = {}
  for (const b of books) {
    const key = (b.category || '').trim() || 'Uncategorized'
    counts[key] = (counts[key] || 0) + 1
  }
  const sorted = Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
  if (sorted.length <= cap) return sorted
  const top = sorted.slice(0, cap - 1)
  const otherCount = sorted.slice(cap - 1).reduce((s, x) => s + x.count, 0)
  return [...top, { label: 'Other', count: otherCount }]
}

/*
 * Commendation (standout book of the year).
 * RULE (documented per spec §6.5): the debriefed book with the fastest reading
 * pace — highest pages-per-day, computed as total_pages / (finished_at - started_at).
 * Ties and books missing dates/pages fall back to highest rating, then most pages.
 */
export function commendation(debriefedBooks) {
  if (!debriefedBooks.length) return null
  const scored = debriefedBooks.map((b) => {
    let pace = 0
    if (b.total_pages && b.started_at && b.finished_at) {
      const days = Math.max(1, Math.round((new Date(b.finished_at) - new Date(b.started_at)) / 86400000))
      pace = b.total_pages / days
    }
    return { book: b, pace }
  })
  scored.sort((a, b) => {
    if (b.pace !== a.pace) return b.pace - a.pace
    if ((b.book.rating || 0) !== (a.book.rating || 0)) return (b.book.rating || 0) - (a.book.rating || 0)
    return (b.book.total_pages || 0) - (a.book.total_pages || 0)
  })
  return scored[0].book
}
