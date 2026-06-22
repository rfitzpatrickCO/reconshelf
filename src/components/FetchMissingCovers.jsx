import { useState } from 'react'
import { listBooks, setBookCover } from '../lib/db'
import { findCover, isGoogleBooksConfigured } from '../lib/googleBooks'
import Icon from './Icon'

/*
 * Backfills covers for books that don't have one (e.g. Goodreads imports or
 * manually-added books). Looks each up on Google Books by title + author and
 * stores the first thumbnail. Runs sequentially with a small delay to stay
 * gentle on the API quota.
 */
export default function FetchMissingCovers({ onDone }) {
  const [state, setState] = useState('idle') // idle | running | done
  const [progress, setProgress] = useState({ done: 0, total: 0, updated: 0 })

  if (!isGoogleBooksConfigured) return null

  async function run() {
    setState('running')
    const books = await listBooks()
    const missing = books.filter((b) => !b.cover_url)
    setProgress({ done: 0, total: missing.length, updated: 0 })

    let updated = 0
    for (let i = 0; i < missing.length; i++) {
      const b = missing[i]
      try {
        const cover = await findCover({ isbn: b.isbn, title: b.title, author: b.author })
        if (cover) {
          await setBookCover(b.id, cover)
          updated += 1
        }
      } catch {
        // skip this one; keep going
      }
      setProgress({ done: i + 1, total: missing.length, updated })
      await new Promise((r) => setTimeout(r, 150))
    }
    setState('done')
    onDone?.()
  }

  if (state === 'running') {
    return (
      <p className="rs-muted-line">
        Fetching covers… {progress.done} / {progress.total} ({progress.updated} found)
      </p>
    )
  }

  if (state === 'done') {
    return (
      <p className="rs-muted-line rs-auth-success">
        Done — found {progress.updated} cover{progress.updated === 1 ? '' : 's'} for{' '}
        {progress.total} book{progress.total === 1 ? '' : 's'} without one.
      </p>
    )
  }

  return (
    <button className="rs-btn rs-btn-secondary" onClick={run}>
      <Icon name="search" size={16} />
      Fetch missing covers
    </button>
  )
}
