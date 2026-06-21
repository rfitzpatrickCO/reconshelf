import { useNavigate } from 'react-router-dom'
import ProgressBar from './ProgressBar'
import { progressPct } from '../lib/stats'
import { statusMeta } from '../lib/status'

export default function BookRow({ book }) {
  const navigate = useNavigate()
  const meta = statusMeta(book.status)
  const pct = progressPct(book)

  return (
    <div
      className="rs-book-row"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/book/${book.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/book/${book.id}`)
        }
      }}
    >
      <div
        className={`rs-book-cover ${meta.cover}`}
        style={book.cover_color ? { background: book.cover_color } : undefined}
      />
      <div className="rs-book-info">
        <p className="rs-book-title">{book.title}</p>
        <p className="rs-book-author">{book.author}</p>
      </div>
      <div className="rs-book-progress">
        <p className="rs-book-progress-pct" style={{ color: 'var(--rs-text-secondary)' }}>
          {book.total_pages ? `${pct}%` : '—'}
        </p>
        <ProgressBar pct={pct} fillClass={meta.fill} />
      </div>
    </div>
  )
}
