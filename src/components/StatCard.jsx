export default function StatCard({ label, value, tone }) {
  const toneClass = tone ? `rs-stat-value--${tone}` : ''
  return (
    <div className="rs-stat-card">
      <p className="rs-stat-label">{label}</p>
      <p className={`rs-stat-value ${toneClass}`}>{value}</p>
    </div>
  )
}
