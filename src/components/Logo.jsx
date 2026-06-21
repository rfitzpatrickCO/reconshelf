// Crossed-tomahawks mark + lowercase wordmark, per spec §3 / §9.
export default function Logo({ size = 26, showText = true }) {
  return (
    <span className="rs-logo">
      <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
        <g stroke="var(--rs-brass)" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="22" x2="20" y2="6" />
          <line x1="22" y1="22" x2="6" y2="6" />
        </g>
        <g fill="var(--rs-brass)">
          <path d="M 17 3 L 23 5 L 21 9 L 17 7 Z" />
          <path d="M 9 3 L 3 5 L 5 9 L 9 7 Z" />
        </g>
      </svg>
      {showText && <span className="rs-logo-text">recon shelf</span>}
    </span>
  )
}
