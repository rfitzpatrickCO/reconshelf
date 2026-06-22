import { useEffect, useState } from 'react'
import { listBooks, listSessions, getSettings } from '../lib/db'
import { currentOpTempo, longestOpTempo } from '../lib/stats'
import { evaluateCoins } from '../lib/coins'
import StatCard from '../components/StatCard'
import ContributionGraph from '../components/ContributionGraph'
import Coin from '../components/Coin'

export default function Commendations() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listBooks(), listSessions(), getSettings()])
      .then(([books, sessions, settings]) => setData({ books, sessions, settings }))
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="rs-form-error">Could not load commendations: {error}</p>
  if (!data) return <p className="rs-muted-line">Mustering commendations…</p>

  const current = currentOpTempo(data.sessions)
  const longest = longestOpTempo(data.sessions)
  const coins = evaluateCoins(data)
  // earned first, then by how close to earning
  const ordered = [...coins].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1
    const pa = a.target ? (a.current || 0) / a.target : 0
    const pb = b.target ? (b.current || 0) / b.target : 0
    return pb - pa
  })
  const earnedCount = coins.filter((c) => c.earned).length

  return (
    <>
      <h1 className="rs-page-title" style={{ marginBottom: 'var(--rs-space-5)' }}>
        Commendations
      </h1>

      {/* op tempo / streak */}
      <div className="rs-block">
        <p className="rs-section-title">Op tempo</p>
        <div className="rs-stat-grid" style={{ marginBottom: 'var(--rs-space-5)' }}>
          <StatCard label="current streak" value={`${current}d`} tone="forest" />
          <StatCard label="longest streak" value={`${longest}d`} tone="brass" />
          <StatCard label="days read" value={new Set(data.sessions.map((s) => s.logged_at)).size} />
        </div>
        <ContributionGraph sessions={data.sessions} />
        <p className="rs-text-faint" style={{ fontSize: 12, marginTop: 10 }}>
          Each square is a day. Log pages on a book to keep your streak alive.
        </p>
      </div>

      {/* challenge coins */}
      <div className="rs-block">
        <div className="rs-flex rs-justify-between rs-items-center" style={{ marginBottom: 'var(--rs-space-3)' }}>
          <p className="rs-section-title" style={{ margin: 0 }}>
            Challenge coins
          </p>
          <span className="rs-text-faint" style={{ fontSize: 12 }}>
            {earnedCount} / {coins.length} earned
          </span>
        </div>
        <div className="rs-coin-grid">
          {ordered.map((coin) => (
            <Coin key={coin.id} coin={coin} />
          ))}
        </div>
      </div>
    </>
  )
}
