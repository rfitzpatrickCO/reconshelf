import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBook, listBooks } from '../lib/db'
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
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listBooks()
      .then((books) => {
        const cats = [...new Set(books.map((b) => b.category).filter(Boolean))].sort()
        setCategories(cats)
      })
      .catch(() => {})
  }, [])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
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

        <div className="rs-field">
          <label>cover color</label>
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
