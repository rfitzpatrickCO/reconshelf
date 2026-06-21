import { useEffect, useState } from 'react'
import { getSettings, upsertSettings, listBooks } from '../lib/db'
import { debriefedInYear } from '../lib/stats'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/Toast'
import ProgressBar from '../components/ProgressBar'

export default function Settings() {
  const { user, signOut } = useAuth()
  const toast = useToast()

  const [goal, setGoal] = useState('')
  const [debriefedCount, setDebriefedCount] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getSettings(), listBooks()])
      .then(([settings, books]) => {
        if (settings?.yearly_goal) setGoal(String(settings.yearly_goal))
        setDebriefedCount(debriefedInYear(books, new Date().getFullYear()).length)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await upsertSettings({ yearly_goal: goal ? parseInt(goal, 10) : null })
      toast('Mission parameters updated.')
    } catch (err) {
      toast(err.message)
    } finally {
      setSaving(false)
    }
  }

  const goalNum = parseInt(goal, 10)
  const pct = goalNum > 0 ? Math.round((debriefedCount / goalNum) * 100) : 0

  if (!loaded) return <p className="rs-muted-line">Loading parameters…</p>

  return (
    <>
      <h1 className="rs-page-title" style={{ marginBottom: 8 }}>
        Mission parameters
      </h1>
      <p className="rs-muted-line rs-block">Set your reading goal for the year.</p>

      <form className="rs-form" onSubmit={save}>
        <div className="rs-field">
          <label htmlFor="goal">yearly reading goal (books)</label>
          <input
            id="goal"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="e.g. 24"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>

        {goalNum > 0 && (
          <div className="rs-block">
            <div className="rs-flex rs-justify-between" style={{ marginBottom: 6 }}>
              <span className="rs-stat-label" style={{ margin: 0 }}>
                {new Date().getFullYear()} progress
              </span>
              <span className="rs-text-muted" style={{ fontSize: 13 }}>
                {debriefedCount} / {goalNum} debriefed · {pct}%
              </span>
            </div>
            <ProgressBar pct={pct} fillClass="rs-progress-fill" wide />
          </div>
        )}

        <button type="submit" className="rs-btn rs-btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save parameters'}
        </button>
      </form>

      <div className="rs-block" style={{ marginTop: 'var(--rs-space-6)' }}>
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
