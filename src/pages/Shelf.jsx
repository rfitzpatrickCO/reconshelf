import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listBooks } from '../lib/db'
import { debriefedInYear } from '../lib/stats'
import { seriesSuggestions } from '../lib/series'
import StatCard from '../components/StatCard'
import BookRow from '../components/BookRow'
import EmptyState from '../components/EmptyState'
import DeploymentQueue from '../components/DeploymentQueue'
import Icon from '../components/Icon'

// Queue order: manual queue_position first (ascending), then recently updated.
function queueSort(a, b) {
  const pa = a.queue_position
  const pb = b.queue_position
  if (pa == null && pb == null) return new Date(b.updated_at) - new Date(a.updated_at)
  if (pa == null) return 1
  if (pb == null) return -1
  return pa - pb
}

export default function Shelf() {
  const navigate = useNavigate()
  const [books, setBooks] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listBooks()
      .then(setBooks)
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="rs-form-error">Could not load your shelf: {error}</p>
  if (!books) return <p className="rs-muted-line">Standing up the shelf…</p>

  const active = books.filter((b) => b.status === 'active')
  const queued = books.filter((b) => b.status === 'queued').sort(queueSort)
  const debriefedThisYear = debriefedInYear(books, new Date().getFullYear())
  const suggestions = seriesSuggestions(books)

  return (
    <>
      <div className="rs-page-head">
        <h1 className="rs-page-title">The reading list</h1>
      </div>

      {/* stat row */}
      <div className="rs-block">
        <div className="rs-stat-grid">
          <StatCard label="on the shelf" value={books.length} />
          <StatCard label="active recon" value={active.length} tone="forest" />
          <StatCard label="debriefed this year" value={debriefedThisYear.length} tone="brass" />
        </div>
      </div>

      {/* active recon */}
      <div className="rs-block">
        <p className="rs-section-title">Active recon</p>
        {active.length === 0 ? (
          <EmptyState
            icon="target"
            title="no active recon"
            subtitle="deploy your first book to get moving."
          />
        ) : (
          active.map((b) => <BookRow key={b.id} book={b} />)
        )}
      </div>

      {/* continue the series */}
      {suggestions.length > 0 && (
        <div className="rs-block">
          <p className="rs-section-title">Continue the series</p>
          {suggestions.map(({ series, book }) => (
            <div
              key={book.id}
              className="rs-series-suggest"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/book/${book.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate(`/book/${book.id}`)
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p className="rs-eyebrow" style={{ margin: '0 0 2px' }}>
                  Next in {series}
                </p>
                <p className="rs-series-suggest-title">{book.title}</p>
                <p className="rs-book-author">{book.author}</p>
              </div>
              <Icon name="next" size={18} className="rs-text-faint" />
            </div>
          ))}
        </div>
      )}

      {/* deployment queue (drag to reorder) */}
      {queued.length > 0 && (
        <div className="rs-block">
          <p className="rs-section-title">Deployment queue</p>
          <DeploymentQueue books={queued} />
        </div>
      )}

      {/* bottom actions */}
      <div className="rs-btn-row">
        <button className="rs-btn rs-btn-primary" onClick={() => navigate('/book/new')}>
          Add to shelf
        </button>
        <button className="rs-btn rs-btn-secondary" onClick={() => navigate('/profile')}>
          Set goal
        </button>
      </div>
    </>
  )
}
