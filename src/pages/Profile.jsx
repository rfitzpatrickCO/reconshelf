import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSettings, upsertSettings, listBooks } from '../lib/db'
import { debriefedInYear, pagesDownrange } from '../lib/stats'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/Toast'
import ProgressBar from '../components/ProgressBar'
import StatCard from '../components/StatCard'
import GoodreadsImport from '../components/GoodreadsImport'
import FetchMissingCovers from '../components/FetchMissingCovers'

const GENRES = [
  'Military thriller', 'Espionage', 'Thriller', 'History', 'Biography',
  'Memoir', 'Nonfiction', 'Science fiction', 'Fantasy', 'Mystery', 'Literary fiction',
]

export default function Profile() {
  const { user, signOut } = useAuth()
  const toast = useToast()

  const [name, setName] = useState('')
  const [genre, setGenre] = useState('')
  const [goal, setGoal] = useState('')
  const [books, setBooks] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [settings, bks] = await Promise.all([getSettings(), listBooks()])
    if (settings) {
      setName(settings.display_name || '')
      setGenre(settings.favorite_genre || '')
      if (settings.yearly_goal) setGoal(String(settings.yearly_goal))
    }
    setBooks(bks)
    setLoaded(true)
  }

  useEffect(() => {
    load().catch(() => setLoaded(true))
  }, [])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await upsertSettings({
        display_name: name.trim() || null,
        favorite_genre: genre.trim() || null,
        yearly_goal: goal ? parseInt(goal, 10) : null,
        onboarded: true,
      })
      toast('Profile updated.')
    } catch (err) {
      toast(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <p className="rs-muted-line">Loading profile…</p>

  const year = new Date().getFullYear()
  const debriefedThisYear = debriefedInYear(books, year).length
  const debriefedAll = books.filter((b) => b.status === 'debriefed')
  const goalNum = parseInt(goal, 10)
  const pct = goalNum > 0 ? Math.round((debriefedThisYear / goalNum) * 100) : 0

  return (
    <>
      <h1 className="rs-page-title" style={{ marginBottom: 8 }}>
        Profile
      </h1>
      <p className="rs-muted-line rs-block">
        {name ? `${name} · ` : ''}
        {user?.email}
      </p>

      {/* lifetime stats */}
      <div className="rs-block">
        <p className="rs-section-title">Service record</p>
        <div className="rs-stat-grid rs-stat-grid--4">
          <StatCard label="on the shelf" value={books.length} />
          <StatCard label="debriefed (all time)" value={debriefedAll.length} tone="forest" />
          <StatCard label="pages downrange" value={pagesDownrange(debriefedAll).toLocaleString()} tone="brass" />
          <StatCard label={`debriefed in ${year}`} value={debriefedThisYear} tone="steel" />
        </div>
        <Link
          to="/commendations"
          className="rs-btn rs-btn-secondary"
          style={{ width: '100%', marginTop: 'var(--rs-space-3)' }}
        >
          View commendations &amp; streak
        </Link>
      </div>

      {/* identity + goal */}
      <form className="rs-form rs-block" onSubmit={save}>
        <p className="rs-section-title">Identity &amp; mission parameters</p>
        <div className="rs-field">
          <label htmlFor="pf-name">name / call sign</label>
          <input id="pf-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="rs-field">
          <label htmlFor="pf-genre">favorite genre</label>
          <input
            id="pf-genre"
            type="text"
            list="pf-genres"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
          <datalist id="pf-genres">
            {GENRES.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        <div className="rs-field">
          <label htmlFor="pf-goal">yearly reading goal (books)</label>
          <input
            id="pf-goal"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="e.g. 24"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>

        {goalNum > 0 && (
          <div>
            <div className="rs-flex rs-justify-between" style={{ marginBottom: 6 }}>
              <span className="rs-stat-label" style={{ margin: 0 }}>
                {year} progress
              </span>
              <span className="rs-text-muted" style={{ fontSize: 13 }}>
                {debriefedThisYear} / {goalNum} · {pct}%
              </span>
            </div>
            <ProgressBar pct={pct} fillClass="rs-progress-fill" wide />
          </div>
        )}

        <button type="submit" className="rs-btn rs-btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      {/* import */}
      <div className="rs-block">
        <p className="rs-section-title">Import from Goodreads</p>
        <p className="rs-muted-line" style={{ marginBottom: 12 }}>
          Export your library on Goodreads (My Books → Import/Export → Export Library), then upload
          the CSV here.
        </p>
        <GoodreadsImport onImported={() => load()} />
      </div>

      {/* covers */}
      <div className="rs-block">
        <p className="rs-section-title">Book covers</p>
        <p className="rs-muted-line" style={{ marginBottom: 12 }}>
          Look up cover art on Google Books for any books that don't have one yet (e.g. Goodreads
          imports). Existing covers are left untouched.
        </p>
        <FetchMissingCovers onDone={() => load()} />
      </div>

      {/* account */}
      <div className="rs-block">
        <p className="rs-section-title">Account</p>
        <p className="rs-muted-line" style={{ marginBottom: 12 }}>
          Signed in as {user?.email}. Your shelf is private to this account.
        </p>
        <button className="rs-btn rs-btn-secondary" onClick={signOut}>
          Stand down (sign out)
        </button>
      </div>
    </>
  )
}
