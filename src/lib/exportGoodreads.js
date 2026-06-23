import Papa from 'papaparse'

/*
 * Export the library as a Goodreads-compatible CSV so users can take their data
 * with them / re-import it to Goodreads. Columns mirror Goodreads' own export so
 * its importer recognizes them. (Goodreads has no "started" date or "stalled"
 * shelf, so started_at can't round-trip and stalled maps to currently-reading.)
 */

function shelfFromStatus(status) {
  switch (status) {
    case 'debriefed':
      return 'read'
    case 'active':
    case 'stalled':
      return 'currently-reading'
    case 'queued':
    default:
      return 'to-read'
  }
}

// Goodreads dates look like 2024/05/12. Format the leading YYYY-MM-DD directly
// (works for date-only values and ISO timestamps) so a day-granular date never
// gets shifted by a timezone offset.
function gDate(value) {
  if (!value) return ''
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}/${m[2]}/${m[3]}` : ''
}

const COLUMNS = [
  'Title',
  'Author',
  'ISBN',
  'ISBN13',
  'My Rating',
  'Number of Pages',
  'Date Read',
  'Date Added',
  'Bookshelves',
  'Exclusive Shelf',
  'My Review',
]

export function booksToGoodreadsCsv(books) {
  const rows = books.map((b) => {
    const isbn = String(b.isbn || '').replace(/[^0-9Xx]/g, '')
    return {
      Title: b.title || '',
      Author: b.author || '',
      ISBN: isbn.length === 10 ? isbn : '',
      ISBN13: isbn.length === 13 ? isbn : '',
      'My Rating': b.rating || 0,
      'Number of Pages': b.total_pages || '',
      'Date Read': b.status === 'debriefed' ? gDate(b.finished_at) : '',
      'Date Added': gDate(b.created_at),
      Bookshelves: b.category || '',
      'Exclusive Shelf': shelfFromStatus(b.status),
      'My Review': '',
    }
  })
  return Papa.unparse(rows, { columns: COLUMNS })
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
