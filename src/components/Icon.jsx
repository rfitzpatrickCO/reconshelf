// Minimal inline-SVG icon set — self-contained, no icon-font / network dependency.
// Stroke inherits currentColor so it themes via CSS.
const PATHS = {
  shelf: <path d="M4 19V5M9 19V5M14 19l1-14 4 .5-1 14M4 19h16" />,
  library: <path d="M4 5h16M4 12h16M4 19h16" />,
  recap: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 14l3-4 3 2 4-6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  back: <path d="M15 18l-6-6 6-6" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.5" />
    </>
  ),
  star: <path d="M12 2l3 6.5 7 .9-5 4.8 1.3 7-6.3-3.4-6.3 3.4 1.3-7-5-4.8 7-.9z" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
}

export default function Icon({ name, size = 18, fill = 'none', className = '' }) {
  const inner = PATHS[name]
  if (!inner) return null
  return (
    <svg
      className={`rs-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {inner}
    </svg>
  )
}
