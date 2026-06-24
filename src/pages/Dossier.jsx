import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getBook, updateBook, deleteBook, listNotes, createNote, deleteNote, logPages } from '../lib/db'
import { progressPct, pagesLeft } from '../lib/stats'
import { statusMeta, formatDate } from '../lib/status'
import { useToast } from '../components/Toast'
import ProgressBar from '../components/ProgressBar'
import BookCover from '../components/BookCover'
import LoadingScreen from '../components/LoadingScreen'
import Icon from '../components/Icon'

export default function Dossier() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [book, setBook] = useState(null)
  const [notes, setNotes] = useState([])
  const [error, setError] = useState('')

  const [pageInput, setPageInput] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [notePage, setNotePage] = useState('')
  const [logging, setLogging] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', author: '', total_pages: '', category: '' })

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

  // Set the page you're currently on. We store that as current_page and log the
  // difference as a reading session so streaks (op tempo) still work.
  async function handleSetPage(e) {
    e.preventDefault()
    let page = parseInt(pageInput, 10)
    if (!Number.isFinite(page)) return
    if (page < 0) page = 0
    if (book.total_pages && page > book.total_pages) page = book.total_pages
    const delta = page - (book.current_page || 0)
    if (delta === 0) {
      setPageInput('')
      return
    }
    setLogging(true)
    const started = Date.now()
    try {
      await logPages(book, delta)
      await reload()
      setPageInput('')
      toast(`Now on page ${page}.`)
    } catch (err) {
      toast(err.message)
    } finally {
      // hold the quote on screen briefly so it reads as a beat, not a flash
      const elapsed = Date.now() - started
      if (elapsed < 1000) await new Promise((r) => setTimeout(r, 1000 - elapsed))
      setLogging(false)
    }
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

  // Explicitly start reading — records the start date (the app's own tracking,
  // since Goodreads exports don't include start dates).
  async function beginRecon() {
    const today = new Date().toISOString().slice(0, 10)
    await updateBook(book.id, { status: 'active', started_at: book.started_at || today })
    await reload()
    toast('Recon underway — start date logged.')
  }

  // Editable dates (also lets you backfill start dates on imported books).
  async function setDateField(field, value) {
    await updateBook(book.id, { [field]: value || null })
    await reload()
  }

  function startEdit() {
    setEditForm({
      title: book.title || '',
      author: book.author || '',
      total_pages: book.total_pages ? String(book.total_pages) : '',
      category: book.category || '',
    })
    setEditing(true)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editForm.title.trim() || !editForm.author.trim()) {
      toast('Title and author are required.')
      return
    }
    await updateBook(book.id, {
      title: editForm.title.trim(),
      author: editForm.author.trim(),
      total_pages: editForm.total_pages ? parseInt(editForm.total_pages, 10) : null,
      category: editForm.category.trim() || null,
    })
    await reload()
    setEditing(false)
    toast('Details updated.')
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
      {logging && <LoadingScreen />}
      <div className="rs-page-head">
        <button className="rs-back" onClick={() => navigate(-1)}>
          <Icon name="back" size={16} /> Dossier
        </button>
      </div>

      {/* header block */}
      <div className="rs-block">
        <div className="rs-dossier-header">
          <BookCover book={book} variant="dossier" />
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

      {/* meta — pages left, then aligned editable dates */}
      <div className="rs-block">
        <div style={{ marginBottom: 'var(--rs-space-4)' }}>
          <p className="rs-dossier-meta-label">pages left</p>
          <p className="rs-dossier-meta-value">{left ?? '—'}</p>
        </div>
        <div className="rs-date-row">
          <div className="rs-field">
            <label htmlFor="d-started">started</label>
            <input
              id="d-started"
              type="date"
              value={book.started_at || ''}
              onChange={(e) => setDateField('started_at', e.target.value)}
            />
          </div>
          <div className="rs-field">
            <label htmlFor="d-target">
              {book.status === 'debriefed' ? 'finished' : 'target date'}
            </label>
            <input
              id="d-target"
              type="date"
              value={(book.status === 'debriefed' ? book.finished_at : book.target_date) || ''}
              onChange={(e) =>
                setDateField(book.status === 'debriefed' ? 'finished_at' : 'target_date', e.target.value)
              }
            />
          </div>
        </div>
      </div>

      {/* edit details (correct edition page counts, titles, etc.) */}
      <div className="rs-block">
        {!editing ? (
          <button className="rs-btn rs-btn-secondary" onClick={startEdit}>
            <Icon name="edit" size={16} />
            Edit details
          </button>
        ) : (
          <form className="rs-form" onSubmit={saveEdit}>
            <p className="rs-section-title">Edit details</p>
            <div className="rs-field">
              <label htmlFor="e-title">title</label>
              <input
                id="e-title"
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="rs-field">
              <label htmlFor="e-author">author</label>
              <input
                id="e-author"
                type="text"
                value={editForm.author}
                onChange={(e) => setEditForm((f) => ({ ...f, author: e.target.value }))}
              />
            </div>
            <div className="rs-field-row">
              <div className="rs-field">
                <label htmlFor="e-pages">total pages</label>
                <input
                  id="e-pages"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={editForm.total_pages}
                  onChange={(e) => setEditForm((f) => ({ ...f, total_pages: e.target.value }))}
                />
              </div>
              <div className="rs-field">
                <label htmlFor="e-category">category</label>
                <input
                  id="e-category"
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
            </div>
            <div className="rs-btn-row">
              <button type="submit" className="rs-btn rs-btn-primary">
                Save
              </button>
              <button
                type="button"
                className="rs-btn rs-btn-secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
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
          <form className="rs-logpages" onSubmit={handleSetPage}>
            <div className="rs-field" style={{ flex: 1 }}>
              <label htmlFor="curpage">
                currently on page{book.total_pages ? ` (of ${book.total_pages})` : ''}
              </label>
              <input
                id="curpage"
                type="number"
                inputMode="numeric"
                min="0"
                max={book.total_pages || undefined}
                placeholder={`page ${book.current_page || 0}`}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
              />
            </div>
            <button type="submit" className="rs-btn rs-btn-primary">
              Update
            </button>
          </form>
        )}

        <div className="rs-btn-row" style={{ marginTop: 14 }}>
          {book.status === 'queued' && (
            <button className="rs-btn rs-btn-primary" onClick={beginRecon}>
              Begin recon
            </button>
          )}
          {book.status !== 'debriefed' ? (
            <button
              className={`rs-btn ${book.status === 'queued' ? 'rs-btn-secondary' : 'rs-btn-primary'}`}
              onClick={markDebriefed}
            >
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
