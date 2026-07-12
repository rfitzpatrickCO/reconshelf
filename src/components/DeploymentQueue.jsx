import { useEffect, useState } from 'react'
import { reorderQueue } from '../lib/db'
import BookRow from './BookRow'
import Icon from './Icon'

// Move item at `from` to `to`, returning a new array.
function move(items, from, to) {
  const next = items.slice()
  const [x] = next.splice(from, 1)
  next.splice(to, 0, x)
  return next
}

/*
 * Deployment queue with up/down reordering. Order persists via queue_position.
 * Reliable on every device (no drag library) — tap the arrows to move a book;
 * tap the row to open its dossier.
 */
export default function DeploymentQueue({ books }) {
  const [items, setItems] = useState(books)

  // Re-sync when the set of queued books changes (added/removed), but not on a
  // pure reorder — otherwise an optimistic move would get reset.
  useEffect(() => {
    const incoming = [...books.map((b) => b.id)].sort().join(',')
    const current = [...items.map((b) => b.id)].sort().join(',')
    if (incoming !== current) setItems(books)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books])

  function reorder(from, to) {
    if (to < 0 || to >= items.length) return
    const next = move(items, from, to)
    setItems(next)
    reorderQueue(next.map((b) => b.id)).catch(() => {})
  }

  return (
    <div>
      {items.map((book, i) => (
        <div key={book.id} className="rs-queue-item">
          <div className="rs-queue-reorder">
            <button
              className="rs-reorder-btn"
              onClick={() => reorder(i, i - 1)}
              disabled={i === 0}
              aria-label="Move up in queue"
            >
              <Icon name="chevron-up" size={16} />
            </button>
            <button
              className="rs-reorder-btn"
              onClick={() => reorder(i, i + 1)}
              disabled={i === items.length - 1}
              aria-label="Move down in queue"
            >
              <Icon name="chevron-down" size={16} />
            </button>
          </div>
          <BookRow book={book} />
        </div>
      ))}
    </div>
  )
}
