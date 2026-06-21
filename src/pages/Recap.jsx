import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { listBooks, listSessions } from '../lib/db'
import {
  debriefedInYear,
  pagesDownrange,
  longestOpTempo,
  avgTimeOnTarget,
  theaterCounts,
  commendation,
} from '../lib/stats'
import { useToast } from '../components/Toast'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'

export default function Recap() {
  const { year } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const yr = parseInt(year, 10) || new Date().getFullYear()

  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listBooks(), listSessions()])
      .then(([books, sessions]) => setData({ books, sessions }))
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="rs-form-error">Could not compile the report: {error}</p>
  if (!data) return <p className="rs-muted-line">Compiling after-action report…</p>

  const debriefed = debriefedInYear(data.books, yr)
  // Op tempo / theaters scoped to sessions & books touched in this year.
  const yearSessions = data.sessions.filter((s) => new Date(s.logged_at).getFullYear() === yr)
  const theaters = theaterCounts(debriefed)
  const maxTheater = Math.max(1, ...theaters.map((t) => t.count))
  const star = commendation(debriefed)
  const avg = avgTimeOnTarget(debriefed)

  function shareReport() {
    const lines = [
      `RECON SHELF — After-action report, ${yr}`,
      `• Books debriefed: ${debriefed.length}`,
      `• Pages downrange: ${pagesDownrange(debriefed).toLocaleString()}`,
      `• Longest op tempo: ${longestOpTempo(yearSessions)} day streak`,
      `• Avg time on target: ${avg != null ? `${avg} days` : '—'}`,
      star ? `• Commendation: ${star.title} — ${star.author}` : null,
    ].filter(Boolean)
    const text = lines.join('\n')
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => toast('Report copied to clipboard.'),
        () => toast('Could not copy report.')
      )
    } else {
      toast('Clipboard not available.')
    }
  }

  return (
    <>
      <div className="rs-page-head">
        <h1 className="rs-page-title">After-action · {yr}</h1>
        <div className="rs-flex rs-gap-2">
          <button className="rs-filter" onClick={() => navigate(`/recap/${yr - 1}`)}>
            ‹ {yr - 1}
          </button>
          <button
            className="rs-filter"
            onClick={() => navigate(`/recap/${yr + 1}`)}
            disabled={yr >= new Date().getFullYear()}
          >
            {yr + 1} ›
          </button>
        </div>
      </div>

      {debriefed.length === 0 ? (
        <EmptyState
          icon="recap"
          title={`no debriefs in ${yr}`}
          subtitle="Debrief a book to start building this year's report."
        />
      ) : (
        <>
          {/* stat grid 2x2 */}
          <div className="rs-block">
            <div className="rs-stat-grid rs-stat-grid--4">
              <StatCard label="books debriefed" value={debriefed.length} tone="forest" />
              <StatCard
                label="pages downrange"
                value={pagesDownrange(debriefed).toLocaleString()}
                tone="brass"
              />
              <StatCard
                label="longest op tempo"
                value={`${longestOpTempo(yearSessions)}d`}
                tone="steel"
              />
              <StatCard label="avg time on target" value={avg != null ? `${avg}d` : '—'} />
            </div>
          </div>

          {/* commendation */}
          {star && (
            <div className="rs-block">
              <p className="rs-section-title">Commendation</p>
              <div className="rs-commendation">
                <Icon name="star" size={28} fill="var(--rs-brass)" className="" />
                <div>
                  <p className="rs-dossier-title" style={{ fontSize: 17 }}>
                    {star.title}
                  </p>
                  <p className="rs-dossier-author">{star.author}</p>
                  <p className="rs-note-meta" style={{ marginTop: 6 }}>
                    Fastest pace of the year{star.rating ? ` · rated ${star.rating}/5` : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* primary theaters */}
          <div className="rs-block">
            <p className="rs-section-title">Primary theaters</p>
            {theaters.map((t) => (
              <div className="rs-theater-row" key={t.label}>
                <span className="rs-theater-label">{t.label}</span>
                <div className="rs-progress-track rs-progress-track--wide">
                  <div
                    className="rs-progress-fill--steel"
                    style={{ height: '100%', width: `${(t.count / maxTheater) * 100}%` }}
                  />
                </div>
                <span className="rs-theater-count">{t.count}</span>
              </div>
            ))}
          </div>

          <button className="rs-btn rs-btn-secondary" onClick={shareReport}>
            Share report (copy summary)
          </button>
        </>
      )}
    </>
  )
}
