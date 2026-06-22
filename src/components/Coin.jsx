import { formatDate } from '../lib/status'

/*
 * A challenge coin medallion. Earned coins are struck in brass; locked coins are
 * dimmed and show progress toward the milestone.
 */
export default function Coin({ coin }) {
  const { earned, center, name, date, current, target, note } = coin

  const ring = earned ? 'url(#coin-brass)' : '#2f2d26'
  const face = earned ? '#1c1b18' : '#23221a'
  const faceRing = earned ? '#8a6d2f' : '#3a382f'
  const txt = earned ? '#c9a45c' : '#7d7a6c'
  const star = earned ? '#c9a45c' : '#3a382f'
  const reed = earned ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.18)'

  const meta = earned
    ? date
      ? `Earned ${formatDate(date)}`
      : 'Earned'
    : note || `${(current ?? 0).toLocaleString()} / ${(target ?? 0).toLocaleString()}`

  return (
    <div className={`rs-coin ${earned ? 'rs-coin--earned' : 'rs-coin--locked'}`} title={coin.desc}>
      <svg className="rs-coin-medal" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <radialGradient id="coin-brass" cx="38%" cy="30%" r="78%">
            <stop offset="0%" stopColor="#ecd49a" />
            <stop offset="48%" stopColor="#c9a45c" />
            <stop offset="100%" stopColor="#8a6d2f" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill={ring} />
        {/* reeded edge */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={reed}
          strokeWidth="3"
          strokeDasharray="1.6 2.6"
        />
        {/* inner face */}
        <circle cx="50" cy="50" r="37" fill={face} stroke={faceRing} strokeWidth="1.5" />
        <text x="50" y="14" textAnchor="middle" dominantBaseline="central" fontSize="11" fill={star}>
          ★
        </text>
        <text x="50" y="86" textAnchor="middle" dominantBaseline="central" fontSize="11" fill={star}>
          ★
        </text>
        <text
          x="50"
          y="51"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={String(center).length >= 3 ? '19' : '27'}
          fill={txt}
          style={{ fontFamily: 'var(--rs-font-condensed)', fontWeight: 700, letterSpacing: '0.5px' }}
        >
          {center}
        </text>
      </svg>
      <span className="rs-coin-name">{name}</span>
      <span className="rs-coin-meta">{meta}</span>
    </div>
  )
}
