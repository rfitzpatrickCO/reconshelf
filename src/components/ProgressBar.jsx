export default function ProgressBar({ pct = 0, fillClass = 'rs-progress-fill', wide = false }) {
  return (
    <div className={`rs-progress-track ${wide ? 'rs-progress-track--wide' : ''}`}>
      <div className={fillClass} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  )
}
