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

// First custom shelf (excluding the exclusive shelves) makes a reasonable category.
function categoryFromShelves(bookshelves) {
  const tags = (bookshelves || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !['read', 'currently-reading', 'to-read'].includes(s))
  return tags[0] || null
}

function mapRow(row) {
  const title = (row['Title'] || '').trim()
  const author = (row['Author'] || '').trim()
  if (!title || !author) return null

  const status = statusFromShelf(row['Exclusive Shelf'])
  const totalPages = toInt(row['Number of Pages'])
  const myRating = toInt(row['My Rating'])
  const finishedAt = status === 'debriefed' ? parseDate(row['Date Read']) : null

  return {
    title,
    author,
    total_pages: totalPages,
    current_page: status === 'debriefed' && totalPages ? totalPages : 0,
    status,
    rating: status === 'debriefed' && myRating ? myRating : null,
    category: categoryFromShelves(row['Bookshelves']),
    finished_at: finishedAt,
    started_at: null,
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
