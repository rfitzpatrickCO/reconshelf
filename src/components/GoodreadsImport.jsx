import { useRef, useState } from 'react'
import { parseGoodreadsCsv } from '../lib/goodreads'
import { bulkCreateBooks } from '../lib/db'
import Icon from './Icon'

/*
 * Goodreads CSV importer. Pick the exported file -> preview the parsed count ->
 * confirm to bulk-insert. Calls onImported(count) when done.
 */
export default function GoodreadsImport({ onImported }) {
  const inputRef = useRef(null)
  const [stage, setStage] = useState('idle') // idle | parsed | importing | done | error
  const [result, setResult] = useState(null) // { books, total, skipped }
  const [error, setError] = useState('')
  const [importedCount, setImportedCount] = useState(0)

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      const parsed = await parseGoodreadsCsv(file)
      if (parsed.books.length === 0) {
        setError('No books found in that file. Make sure it’s the Goodreads library export CSV.')
        setStage('error')
        return
      }
      setResult(parsed)
      setStage('parsed')
    } catch (err) {
      setError(err.message || 'Could not read that file.')
      setStage('error')
    }
  }

  async function doImport() {
    setStage('importing')
    try {
      const count = await bulkCreateBooks(result.books)
      setImportedCount(count)
      setStage('done')
      onImported?.(count)
    } catch (err) {
      setError(err.message || 'Import failed.')
      setStage('error')
    }
  }

  function reset() {
    setStage('idle')
    setResult(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const counts = result
    ? result.books.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1
        return acc
      }, {})
    : {}

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={onFile}
        style={{ display: 'none' }}
      />

      {stage === 'done' ? (
        <p className="rs-muted-line rs-auth-success">
          Imported {importedCount} book{importedCount === 1 ? '' : 's'} to your shelf.
        </p>
      ) : stage === 'parsed' ? (
        <div className="rs-note-item" style={{ borderLeftColor: 'var(--rs-forest)' }}>
          <p className="rs-book-title" style={{ whiteSpace: 'normal' }}>
            Found {result.books.length} book{result.books.length === 1 ? '' : 's'}
          </p>
          <p className="rs-note-meta" style={{ marginTop: 4 }}>
            {counts.debriefed ? `${counts.debriefed} debriefed · ` : ''}
            {counts.active ? `${counts.active} active · ` : ''}
            {counts.queued ? `${counts.queued} queued` : ''}
            {result.skipped ? ` · ${result.skipped} row(s) skipped` : ''}
          </p>
          <div className="rs-btn-row" style={{ marginTop: 12 }}>
            <button className="rs-btn rs-btn-primary" onClick={doImport}>
              Import {result.books.length}
            </button>
            <button className="rs-btn rs-btn-secondary" onClick={reset}>
              Choose another file
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            className="rs-btn rs-btn-secondary"
            onClick={() => inputRef.current?.click()}
            disabled={stage === 'importing'}
          >
            <Icon name="library" size={16} />
            {stage === 'importing' ? 'Importing…' : 'Choose Goodreads CSV'}
          </button>
          {error && <p className="rs-form-error" style={{ marginTop: 8 }}>{error}</p>}
        </>
      )}
    </div>
  )
}
