import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { upsertSettings } from '../lib/db'
import Logo from '../components/Logo'
import GoodreadsImport from '../components/GoodreadsImport'

const GENRES = [
  'Military thriller',
  'Espionage',
  'Thriller',
  'History',
  'Biography',
  'Memoir',
  'Nonfiction',
  'Science fiction',
  'Fantasy',
  'Mystery',
  'Literary fiction',
]

const TOTAL_STEPS = 4

export default function Onboarding({ onComplete }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [genre, setGenre] = useState('')
  const [goal, setGoal] = useState('')
  const [imported, setImported] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function finish() {
    setSaving(true)
    setError('')
    try {
      await upsertSettings({
        display_name: name.trim() || null,
        favorite_genre: genre.trim() || null,
        yearly_goal: goal ? parseInt(goal, 10) : null,
        onboarded: true,
      })
      onComplete?.()
    } catch (err) {
      setError(err.message || 'Could not save your profile.')
      setSaving(false)
    }
  }

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1))
  const back = () => setStep((s) => Math.max(1, s - 1))

  return (
    <div className="rs-auth">
      <div className="rs-auth-card" style={{ maxWidth: 440 }}>
        <Logo />
        <p className="rs-eyebrow" style={{ marginTop: 'var(--rs-space-4)', textAlign: 'center' }}>
          Enlistment · step {step} of {TOTAL_STEPS}
        </p>

        {step === 1 && (
          <>
            <h1 className="rs-auth-title">Report for duty</h1>
            <p className="rs-auth-sub">
              Welcome to your private reading log. First — what should we call you?
            </p>
            <div className="rs-field" style={{ textAlign: 'left' }}>
              <label htmlFor="ob-name">call sign / name</label>
              <input
                id="ob-name"
                type="text"
                placeholder="e.g. Reece"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <p className="rs-auth-note">Signed in as {user?.email}</p>
            <button
              className="rs-btn rs-btn-primary"
              style={{ width: '100%', marginTop: 'var(--rs-space-3)' }}
              onClick={next}
              disabled={!name.trim()}
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="rs-auth-title">Primary theater</h1>
            <p className="rs-auth-sub">What kind of books do you gravitate to? (optional)</p>
            <div className="rs-field" style={{ textAlign: 'left' }}>
              <label htmlFor="ob-genre">favorite genre</label>
              <input
                id="ob-genre"
                type="text"
                list="ob-genres"
                placeholder="e.g. Military thriller"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                autoFocus
              />
              <datalist id="ob-genres">
                {GENRES.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <div className="rs-btn-row" style={{ marginTop: 'var(--rs-space-3)' }}>
              <button className="rs-btn rs-btn-secondary" onClick={back}>
                Back
              </button>
              <button className="rs-btn rs-btn-primary" onClick={next}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="rs-auth-title">Mission parameters</h1>
            <p className="rs-auth-sub">
              Set a reading goal for {new Date().getFullYear()}. (optional — change it anytime)
            </p>
            <div className="rs-field" style={{ textAlign: 'left' }}>
              <label htmlFor="ob-goal">books to read this year</label>
              <input
                id="ob-goal"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="e.g. 24"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                autoFocus
              />
            </div>
            <div className="rs-btn-row" style={{ marginTop: 'var(--rs-space-3)' }}>
              <button className="rs-btn rs-btn-secondary" onClick={back}>
                Back
              </button>
              <button className="rs-btn rs-btn-primary" onClick={next}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="rs-auth-title">Deploy your shelf</h1>
            <p className="rs-auth-sub">
              Already track books on Goodreads? Import your library now, or start fresh and add
              books yourself.
            </p>
            <div style={{ textAlign: 'left' }}>
              <GoodreadsImport onImported={(n) => setImported(n)} />
              {imported > 0 && (
                <p className="rs-auth-note rs-auth-success" style={{ textAlign: 'left' }}>
                  {imported} book{imported === 1 ? '' : 's'} ready on your shelf.
                </p>
              )}
            </div>
            {error && <p className="rs-form-error" style={{ marginTop: 8 }}>{error}</p>}
            <div className="rs-btn-row" style={{ marginTop: 'var(--rs-space-4)' }}>
              <button className="rs-btn rs-btn-secondary" onClick={back} disabled={saving}>
                Back
              </button>
              <button className="rs-btn rs-btn-primary" onClick={finish} disabled={saving}>
                {saving ? 'Saving…' : imported > 0 ? 'Enter your shelf' : 'Start fresh'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
