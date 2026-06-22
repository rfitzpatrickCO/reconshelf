import Papa from 'papaparse'

/*
 * Goodreads CSV import.
 * Goodreads removed its public API in 2020, so the supported path is the user's
 * own library export (Goodreads -> My Books -> Import/Export -> Export Library).
 * This parses that CSV and maps each row onto our Book model.
 */

// "read" -> debriefed, "currently-reading" -> active, "to-read" -> queued
function statusFromShelf(shelf) {
  switch ((shelf || '').trim()) {
    case 'read':
      return 'debriefed'
    case 'currently-reading':
      return 'active'
    case 'to-read':
    default:
      return 'queued'
  }
}

// Goodreads dates look like "2023/05/12"; normalize to "2023-05-12".
function parseDate(value) {
  const v = (value || '').trim()
  if (!v) return null
  const d = new Date(v.replace(/\//g, '-'))
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

function toInt(value) {
  const n = parseInt(String(value ?? '').replace(/[^0-9]/g, ''), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

// Goodreads wraps ISBNs like ="9781476789385" — strip everything but digits/X.
// Prefer the 13-digit ISBN; fall back to the 10-digit one.
function parseIsbn(row) {
  const clean = (v) => String(v ?? '').replace(/[^0-9Xx]/g, '')
  const isbn13 = clean(row['ISBN13'])
  if (isbn13.length === 13) return isbn13
  const isbn10 = clean(row['ISBN'])
  return isbn10.length === 10 ? isbn10 : null
}

// First custom shelf (excluding the exclusive shelves) makes a reasonable category.
function categoryFromShelves(bookshelves) {
  const tags = (bookshelves || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !['read', 'currently-reading', 'to-read'].includes(s))
  return tags[0] || null
}

// Goodreads' standard export reliably includes "Date Read" (finish) but NOT a
// start date. We still look for the common start-date column names in case the
// export came from a tool/plugin that adds one — if absent, started_at stays null.
function pickDate(row, names) {
  for (const n of names) {
    const d = parseDate(row[n])
    if (d) return d
  }
  return null
}

function mapRow(row) {
  const title = (row['Title'] || '').trim()
  const author = (row['Author'] || '').trim()
  if (!title || !author) return null

  const status = statusFromShelf(row['Exclusive Shelf'])
  const totalPages = toInt(row['Number of Pages'])
  const myRating = toInt(row['My Rating'])
  const startedAt = pickDate(row, ['Date Started', 'Started', 'Read Start Date'])
  const finishedAt = pickDate(row, ['Date Read', 'Date Finished'])

  return {
    title,
    author,
    total_pages: totalPages,
    current_page: status === 'debriefed' && totalPages ? totalPages : 0,
    status,
    rating: status === 'debriefed' && myRating ? myRating : null,
    category: categoryFromShelves(row['Bookshelves']),
    started_at: startedAt,
    finished_at: status === 'debriefed' ? finishedAt : null,
    isbn: parseIsbn(row),
    cover_color: null,
  }
}

/*
 * Parse a Goodreads export File into an array of insert-ready book objects.
 * Resolves with { books, total, skipped }.
 */
export function parseGoodreadsCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data || []
        const books = []
        let skipped = 0
        for (const row of rows) {
          const mapped = mapRow(row)
          if (mapped) books.push(mapped)
          else skipped += 1
        }
        resolve({ books, total: rows.length, skipped })
      },
      error: (err) => reject(err),
    })
  })
}
