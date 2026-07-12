import { useState } from 'react'
import BookCover from './BookCover'
import Icon from './Icon'

/*
 * Shown when a book is marked debriefed — a "mission complete" stamp slam plus a
 * quick after-action card (pages downrange, days on target, Nth debrief of the
 * year) and the rating stars. Tasteful, on-brand; no confetti.
 */
function daysOnTarget(book) {
  if (!book.started_at || !book.finished_at) return null
  const start = new Date(book.started_at)
  const end = new Date(book.finished_at)
  if (Number.isNaN(start) || Number.isNaN(end)) return null
  return Math.max(0, Math.round((end - start) / 86400000))
}

export default function DebriefCelebration({ book, count, next, onRate, onClose, onNext }) {
  const [rating, setRating] = useState(book.rating || 0)
  const days = daysOnTarget(book)

  function rate(n) {
    setRating(n)
    onRate?.(n)
  }

  return (
    <div className="rs-debrief" role="dialog" aria-label="Book debriefed">
      <div className="rs-debrief-card">
        <BookCover book={book} variant="dossier" />
        <div className="rs-debrief-stamp">Mission complete</div>

        <h2 className="rs-debrief-title">{book.title}</h2>
        <p className="rs-debrief-author">{book.author}</p>

        <div className="rs-debrief-stats">
          <div>
            <p className="rs-stat-label">pages downrange</p>
            <p className="rs-stat-value rs-stat-value--brass">
              {book.total_pages ? book.total_pages.toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="rs-stat-label">days on target</p>
            <p className="rs-stat-value rs-stat-value--forest">{days ?? '—'}</p>
          </div>
          <div>
            <p className="rs-stat-label">this year</p>
            <p className="rs-stat-value rs-stat-value--steel">#{count}</p>
          </div>
        </div>

        <p className="rs-debrief-rate-label">Rate this one</p>
        <div className="rs-stars" style={{ justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`rs-star ${rating >= n ? 'is-on' : ''}`}
              onClick={() => rate(n)}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
            >
              <Icon name="star" size={26} fill={rating >= n ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>

        {next && (
          <button
            className="rs-btn rs-btn-primary"
            style={{ width: '100%', marginTop: 'var(--rs-space-5)' }}
            onClick={() => onNext?.(next.id)}
          >
            Next in series: {next.title}
          </button>
        )}
        <button
          className={`rs-btn ${next ? 'rs-btn-secondary' : 'rs-btn-primary'}`}
          style={{ width: '100%', marginTop: next ? 'var(--rs-space-2)' : 'var(--rs-space-5)' }}
          onClick={onClose}
        >
          Dismissed
        </button>
      </div>
    </div>
  )
}
