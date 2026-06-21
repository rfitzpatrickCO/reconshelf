import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listBooks } from '../lib/db'
import { debriefedInYear } from '../lib/stats'
import StatCard from '../components/StatCard'
import BookRow from '../components/BookRow'
import EmptyState from '../components/EmptyState'

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
  const queued = books.filter((b) => b.status === 'queued')
  const debriefedThisYear = debriefedInYear(books, new Date().getFullYear())

  return (
    <>
      <div className="rs-page-head">
        <h1 className="rs-page-title">The shelf</h1>
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

      {/* deployment queue */}
      {queued.length > 0 && (
        <div className="rs-block">
          <p className="rs-section-title">Deployment queue</p>
          {queued.map((b) => (
            <BookRow key={b.id} book={b} />
          ))}
        </div>
      )}

      {/* bottom actions */}
      <div className="rs-btn-row">
        <button className="rs-btn rs-btn-primary" onClick={() => navigate('/book/new')}>
          Add to shelf
        </button>
        <button className="rs-btn rs-btn-secondary" onClick={() => navigate('/settings')}>
          Set goal
        </button>
      </div>
    </>
  )
}
