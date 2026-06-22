import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBook, listBooks } from '../lib/db'
import { searchVolumes, isGoogleBooksConfigured } from '../lib/googleBooks'
import { useToast } from '../components/Toast'
import Icon from '../components/Icon'

// Preset cover-bar swatches drawn from the design palette.
const SWATCHES = [
  { name: 'brass', value: '#c9a45c' },
  { name: 'forest', value: '#8fae7a' },
  { name: 'rust', value: '#c97a5c' },
  { name: 'steel', value: '#6a8aae' },
  { name: 'bone', value: '#cdc6b0' },
]

export default function AddBook() {
  const navigate = useNavigate()
  const toast = useToast()

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    title: '',
    author: '',
    total_pages: '',
    category: '',
    target_date: '',
    cover_color: '',
    cover_url: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Google Books search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    listBooks()
      .then((books) => {
        const cats = [...new Set(books.map((b) => b.category).filter(Boolean))].sort()
        setCategories(cats)
      })
      .catch(() => {})
  }, [])

  // Debounced Google Books lookup — searches 400ms after the user stops typing.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      setSearchError('')
      return
    }
    const controller = new AbortController()
    setSearching(true)
    const t = setTimeout(() => {
      searchVolumes(q, { signal: controller.signal })
        .then((r) => {
          setResults(r)
          setSearchError('')
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setSearchError('Search unavailable — you can still enter details manually below.')
          }
        })
        .finally(() => setSearching(false))
    }, 400)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [query])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function selectResult(r) {
    setForm((f) => ({
      ...f,
      title: r.title || f.title,
      author: r.author || f.author,
      total_pages: r.pageCount ? String(r.pageCount) : f.total_pages,
      category: r.category || f.category,
      cover_url: r.thumbnail || f.cover_url,
    }))
    setResults([])
    setQuery('')
    toast('Details filled from Google Books — review and add.')
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.author.trim()) {
      setError('Title and author are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createBook({
        title: form.title.trim(),
        author: form.author.trim(),
        total_pages: form.total_pages ? parseInt(form.total_pages, 10) : null,
        category: form.category.trim() || null,
        target_date: form.target_date || null,
        cover_color: form.cover_color || null,
        cover_url: form.cover_url || null,
        status: 'queued',
      })
      toast('Added to your deployment queue.')
      navigate('/')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <>
      <div className="rs-page-head">
        <button className="rs-back" onClick={() => navigate(-1)}>
          <Icon name="back" size={16} /> Back
        </button>
      </div>

      <h1 className="rs-page-title" style={{ marginBottom: 8 }}>
        Add to shelf
      </h1>
      <p className="rs-muted-line rs-block">
        New books land in the deployment queue. Log pages later to move them to active recon.
      </p>

      {isGoogleBooksConfigured && (
        <div className="rs-block">
          <div className="rs-field">
            <label htmlFor="gb-search">search google books</label>
            <div className="rs-gb-search">
              <Icon name="search" size={16} />
              <input
                id="gb-search"
                type="search"
                placeholder="Search by title or author…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {searching && (
            <p className="rs-muted-line" style={{ marginTop: 8 }}>
              Searching…
            </p>
          )}
          {searchError && (
            <p className="rs-form-error" style={{ marginTop: 8 }}>
              {searchError}
            </p>
          )}

          {results.length > 0 && (
            <div className="rs-gb-results">
              {results.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  className="rs-gb-item"
                  onClick={() => selectResult(r)}
                >
                  {r.thumbnail ? (
                    <img className="rs-gb-thumb" src={r.thumbnail} alt="" loading="lazy" />
                  ) : (
                    <span className="rs-gb-thumb rs-gb-thumb--empty" />
                  )}
                  <span className="rs-gb-meta">
                    <span className="rs-gb-title">{r.title}</span>
                    <span className="rs-gb-sub">
                      {r.author}
                      {r.year ? ` · ${r.year}` : ''}
                      {r.pageCount ? ` · ${r.pageCount}p` : ''}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <p className="rs-text-faint" style={{ fontSize: 12, marginTop: 10 }}>
            Pick a result to auto-fill the form, or enter details manually below.
          </p>
        </div>
      )}

      <form className="rs-form" onSubmit={onSubmit}>
        <div className="rs-field">
          <label htmlFor="title">title *</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
          />
        </div>

        <div className="rs-field">
          <label htmlFor="author">author *</label>
          <input
            id="author"
            type="text"
            value={form.author}
            onChange={(e) => set('author', e.target.value)}
            required
          />
        </div>

        <div className="rs-field-row">
          <div className="rs-field">
            <label htmlFor="pages">total pages</label>
            <input
              id="pages"
              type="number"
              inputMode="numeric"
              value={form.total_pages}
              onChange={(e) => set('total_pages', e.target.value)}
            />
          </div>
          <div className="rs-field">
            <label htmlFor="target">target date</label>
            <input
              id="target"
              type="date"
              value={form.target_date}
              onChange={(e) => set('target_date', e.target.value)}
            />
          </div>
        </div>

        <div className="rs-field">
          <label htmlFor="category">category / theater</label>
          <input
            id="category"
            type="text"
            list="rs-categories"
            placeholder="e.g. Military thriller"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          />
          <datalist id="rs-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        {form.cover_url && (
          <div className="rs-field">
            <label>cover</label>
            <div className="rs-flex rs-gap-3 rs-items-center">
              <img
                src={form.cover_url}
                alt=""
                style={{ width: 46, height: 66, objectFit: 'cover', borderRadius: 3 }}
              />
              <button type="button" className="rs-back" onClick={() => set('cover_url', '')}>
                Remove cover
              </button>
            </div>
          </div>
        )}

        <div className="rs-field">
          <label>cover color {form.cover_url ? '(fallback)' : ''}</label>
          <div className="rs-flex rs-gap-2 rs-items-center">
            {SWATCHES.map((s) => (
              <button
                type="button"
                key={s.value}
                onClick={() => set('cover_color', form.cover_color === s.value ? '' : s.value)}
                aria-label={s.name}
                style={{
                  width: 32,
                  height: 44,
                  borderRadius: 3,
                  background: s.value,
                  border:
                    form.cover_color === s.value
                      ? '2px solid var(--rs-text-primary)'
                      : '2px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>

        {error && <p className="rs-form-error">{error}</p>}

        <div className="rs-btn-row">
          <button type="submit" className="rs-btn rs-btn-primary" disabled={saving}>
            {saving ? 'Adding…' : 'Add to shelf'}
          </button>
          <button type="button" className="rs-btn rs-btn-secondary" onClick={() => navigate('/')}>
            Cancel
          </button>
        </div>
      </form>
    </>
  )
}
