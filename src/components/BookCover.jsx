import { useState } from 'react'
import { statusMeta } from '../lib/status'

/*
 * Book cover. Renders the real cover image when available (e.g. from Google
 * Books), falling back to the flat status-colored bar otherwise — or if the
 * image fails to load. `variant="dossier"` uses the larger detail-page size.
 */
export default function BookCover({ book, variant }) {
  const [failed, setFailed] = useState(false)
  const meta = statusMeta(book.status)
  const base = variant === 'dossier' ? 'rs-dossier-cover' : 'rs-book-cover'
  const className = `${base} ${meta.cover}`

  if (book.cover_url && !failed) {
    return (
      <img
        className={className}
        src={book.cover_url}
        alt={`Cover of ${book.title}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div className={className} style={book.cover_color ? { background: book.cover_color } : undefined} />
  )
}
