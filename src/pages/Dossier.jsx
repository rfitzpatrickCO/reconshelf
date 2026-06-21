import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getBook, updateBook, deleteBook, listNotes, createNote, deleteNote, logPages } from '../lib/db'
import { progressPct, pagesLeft } from '../lib/stats'
import { statusMeta, formatDate } from '../lib/status'
import { useToast } from '../components/Toast'
import ProgressBar from '../components/ProgressBar'
import Icon from '../components/Icon'

export default function Dossier() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [book, setBook] = useState(null)
  const [notes, setNotes] = useState([])
  const [error, setError] = useState('')

  const [pagesInput, setPagesInput] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [notePage, setNotePage] = useState('')

  async function reload() {
    const [b, n] = await Promise.all([getBook(id), listNotes(id)])
    setBook(b)
    setNotes(n)
  }

  useEffect(() => {
    reload().catch((e) => setError(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (error) return <p className="rs-form-error">Could not open this dossier: {error}</p>
  if (!book) return <p className="rs-muted-line">Pulling the dossier…</p>

  const meta = statusMeta(book.status)
  const pct = progressPct(book)
  const left = pagesLeft(book)

  async function handleLogPages(e) {
    e.preventDefault()
    const n = parseInt(pagesInput, 10)
    if (!Number.isFinite(n) || n === 0) return
    try {
      await logPages(book, n)
      setPagesInput('')
      await reload()
      toast(`Logged ${n > 0 ? n : 0} page${Math.abs(n) === 1 ? '' : 's'}.`)
    } catch (err) {
      toast(err.message)
    }
  }

  async function setCurrentPage(value) {
    const target = parseInt(value, 10)
    if (!Number.isFinite(target)) return
    const delta = target - (book.current_page || 0)
    await logPages(book, delta)
    await reload()
  }

  async function markDebriefed() {
    await updateBook(book.id, {
      status: 'debriefed',
      finished_at: new Date().toISOString().slice(0, 10),
      current_page: book.total_pages || book.current_page,
    })
    await reload()
    toast('Marked debriefed. Set a rating below if you like.')
  }

  async function setRating(rating) {
    await updateBook(book.id, { rating })
    await reload()
  }

  async function markStalled() {
    await updateBook(book.id, { status: 'stalled' })
    await reload()
    toast('Filed as stalled.')
  }

  async function reactivate() {
    await updateBook(book.id, { status: 'active' })
    await reload()
  }

  async function addNote(e) {
    e.preventDefault()
    if (!noteBody.trim()) return
    await createNote({
      book_id: book.id,
      body: noteBody.trim(),
      page_number: notePage ? parseInt(notePage, 10) : null,
    })
    setNoteBody('')
    setNotePage('')
    await reload()
  }

  async function removeNote(noteId) {
    await deleteNote(noteId)
    await reload()
  }

  async function removeBook() {
    if (!window.confirm(`Remove "${book.title}" from your shelf? This cannot be undone.`)) return
    await deleteBook(book.id)
    navigate('/')
  }

  return (
    <>
      <div className="rs-page-head">
        <button className="rs-back" onClick={() => navigate(-1)}>
          <Icon name="back" size={16} /> Dossier
        </button>
      </div>

      {/* header block */}
      <div className="rs-block">
        <div className="rs-dossier-header">
          <div
            className={`rs-dossier-cover ${meta.cover}`}
            style={book.cover_color ? { background: book.cover_color } : undefined}
          />
          <div className="rs-dossier-head-info">
            <span className={`rs-badge ${meta.badge}`}>{meta.label}</span>
            <h1 className="rs-dossier-title">{book.title}</h1>
            <p className="rs-dossier-author">{book.author}</p>
            {book.total_pages ? (
              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <div className="rs-flex rs-justify-between" style={{ marginBottom: 6 }}>
                  <span className="rs-stat-label" style={{ margin: 0 }}>
                    progress
                  </span>
                  <span className="rs-text-muted" style={{ fontSize: 13 }}>
                    {pct}% · pg {book.current_page || 0}/{book.total_pages}
                  </span>
                </div>
                <ProgressBar pct={pct} fillClass={meta.fill} wide />
              </div>
            ) : (
              <p className="rs-muted-line">No page count on file.</p>
            )}
          </div>
        </div>
      </div>

      {/* meta grid */}
      <div className="rs-block">
        <div className="rs-dossier-meta-grid">
          <div>
            <p className="rs-dossier-meta-label">pages left</p>
            <p className="rs-dossier-meta-value">{left ?? '—'}</p>
          </div>
          <div>
            <p className="rs-dossier-meta-label">started</p>
            <p className="rs-dossier-meta-value">{formatDate(book.started_at)}</p>
          </div>
          <div>
            <p className="rs-dossier-meta-label">target date</p>
            <p className="rs-dossier-meta-value">{formatDate(book.target_date)}</p>
          </div>
        </div>
      </div>

      {/* rating (when debriefed) */}
      {book.status === 'debriefed' && (
        <div className="rs-block">
          <p className="rs-section-title">Commendation rating</p>
          <div className="rs-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`rs-star ${book.rating >= n ? 'is-on' : ''}`}
                onClick={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
              >
                <Icon name="star" size={22} fill={book.rating >= n ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* actions */}
      <div className="rs-block">
        <p className="rs-section-title">Operations</p>
        {book.status !== 'debriefed' && (
          <form className="rs-logpages" onSubmit={handleLogPages}>
            <div className="rs-field" style={{ flex: 1 }}>
              <label htmlFor="logpages">log pages (+/−)</label>
              <input
                id="logpages"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 25"
                value={pagesInput}
                onChange={(e) => setPagesInput(e.target.value)}
              />
            </div>
            <button type="submit" className="rs-btn rs-btn-primary">
              Log pages
            </button>
          </form>
        )}

        {book.total_pages && book.status !== 'debriefed' && (
          <div className="rs-field" style={{ marginTop: 12 }}>
            <label>or jump current page to</label>
            <input
              type="range"
              min="0"
              max={book.total_pages}
              value={book.current_page || 0}
              onChange={(e) => setCurrentPage(e.target.value)}
            />
          </div>
        )}

        <div className="rs-btn-row" style={{ marginTop: 14 }}>
          {book.status !== 'debriefed' ? (
            <button className="rs-btn rs-btn-primary" onClick={markDebriefed}>
              Mark debriefed
            </button>
          ) : (
            <button className="rs-btn rs-btn-secondary" onClick={reactivate}>
              Re-open recon
            </button>
          )}
          {book.status === 'active' && (
            <button className="rs-btn rs-btn-secondary" onClick={markStalled}>
              Mark stalled
            </button>
          )}
          {book.status === 'stalled' && (
            <button className="rs-btn rs-btn-secondary" onClick={reactivate}>
              Resume recon
            </button>
          )}
        </div>
      </div>

      {/* field notes */}
      <div className="rs-block">
        <p className="rs-section-title">Field notes</p>
        {notes.length === 0 && <p className="rs-muted-line">No field notes filed yet.</p>}
        {notes.map((note) => (
          <div className="rs-note-item" key={note.id}>
            <p className="rs-serif-note">{note.body}</p>
            <div className="rs-flex rs-justify-between rs-items-center">
              <p className="rs-note-meta">
                {note.page_number != null ? `pg ${note.page_number} · ` : ''}
                {formatDate(note.created_at)}
              </p>
              <button
                className="rs-back"
                onClick={() => removeNote(note.id)}
                aria-label="Delete note"
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          </div>
        ))}

        <form className="rs-note-add" onSubmit={addNote}>
          <textarea
            placeholder="Add a field note…"
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
          />
          <div className="rs-flex rs-gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="page #"
              style={{ width: 110 }}
              value={notePage}
              onChange={(e) => setNotePage(e.target.value)}
            />
            <button type="submit" className="rs-btn rs-btn-secondary" style={{ flex: 1 }}>
              Add note
            </button>
          </div>
        </form>
      </div>

      {/* danger zone */}
      <div className="rs-block">
        <button className="rs-signout" onClick={removeBook}>
          Remove from shelf
        </button>
      </div>
    </>
  )
}
