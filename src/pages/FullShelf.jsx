import { useEffect, useMemo, useState } from 'react'
import { listBooks } from '../lib/db'
import BookRow from '../components/BookRow'
import EmptyState from '../components/EmptyState'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'queued', label: 'Queued' },
  { key: 'debriefed', label: 'Debriefed' },
  { key: 'stalled', label: 'Stalled' },
]

export default function FullShelf() {
  const [books, setBooks] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('updated')
  const [query, setQuery] = useState('')

  useEffect(() => {
    listBooks()
      .then(setBooks)
      .catch((e) => setError(e.message))
  }, [])

  const visible = useMemo(() => {
    if (!books) return []
    let list = books
    if (filter !== 'all') list = list.filter((b) => b.status === filter)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q)
      )
    }
    const sorted = [...list]
    if (sort === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title))
    else if (sort === 'author') sorted.sort((a, b) => (a.author || '').localeCompare(b.author || ''))
    else sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    return sorted
  }, [books, filter, sort, query])

  if (error) return <p className="rs-form-error">Could not load the library: {error}</p>
  if (!books) return <p className="rs-muted-line">Indexing the library…</p>

  return (
    <>
      <div className="rs-page-head">
        <h1 className="rs-page-title">Full library</h1>
        <select
          className="rs-select-inline"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort"
        >
          <option value="updated">Recently updated</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
        </select>
      </div>

      <div className="rs-block">
        <input
          type="search"
          placeholder="Search title or author…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%', marginBottom: 'var(--rs-space-4)' }}
        />
        <div className="rs-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`rs-filter ${filter === f.key ? 'is-active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="library"
          title="nothing here"
          subtitle={query ? 'No books match your search.' : 'No books in this status yet.'}
        />
      ) : (
        visible.map((b) => <BookRow key={b.id} book={b} />)
      )}
    </>
  )
}
