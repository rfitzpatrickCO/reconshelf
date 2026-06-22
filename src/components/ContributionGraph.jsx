/*
 * GitHub-style contribution heatmap of days read. Each cell is a day; intensity
 * (forest green) scales with pages logged that day. Horizontally scrollable on
 * narrow screens. Built from reading_sessions (logged_at, pages_read).
 */
const WEEKS = 53

const LEVEL_BG = [
  'var(--rs-surface-raised)', // 0 — no reading
  'rgba(143, 174, 122, 0.30)', // 1
  'rgba(143, 174, 122, 0.55)', // 2
  'rgba(143, 174, 122, 0.78)', // 3
  'var(--rs-forest)', // 4
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function level(pages) {
  if (!pages) return 0
  if (pages < 25) return 1
  if (pages < 75) return 2
  if (pages < 150) return 3
  return 4
}

export default function ContributionGraph({ sessions }) {
  const iso = (d) => d.toISOString().slice(0, 10)

  const byDay = {}
  for (const s of sessions || []) {
    byDay[s.logged_at] = (byDay[s.logged_at] || 0) + (s.pages_read || 0)
  }

  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7) // back to a Sunday

  const columns = []
  const monthLabels = []
  const cursor = new Date(start)
  for (let w = 0; w < WEEKS; w++) {
    const col = []
    let labelForWeek = ''
    for (let d = 0; d < 7; d++) {
      const ds = iso(cursor)
      const isFuture = cursor > today
      // place a month label on the week where a new month first appears
      if (d === 0 && cursor.getDate() <= 7) labelForWeek = MONTHS[cursor.getMonth()]
      col.push({ date: ds, pages: byDay[ds] || 0, isFuture })
      cursor.setDate(cursor.getDate() + 1)
    }
    columns.push(col)
    monthLabels.push(labelForWeek)
  }

  return (
    <div className="rs-cal-scroll">
      <div className="rs-cal">
        <div className="rs-cal-months">
          {monthLabels.map((m, i) => (
            <span key={i} className="rs-cal-month" style={{ gridColumn: i + 1 }}>
              {m}
            </span>
          ))}
        </div>
        <div className="rs-cal-grid">
          {columns.map((col, wi) => (
            <div key={wi} className="rs-cal-col">
              {col.map((cell) =>
                cell.isFuture ? (
                  <span key={cell.date} className="rs-cal-cell" style={{ visibility: 'hidden' }} />
                ) : (
                  <span
                    key={cell.date}
                    className="rs-cal-cell"
                    style={{ background: LEVEL_BG[level(cell.pages)] }}
                    title={`${cell.date}: ${cell.pages} page${cell.pages === 1 ? '' : 's'}`}
                  />
                )
              )}
            </div>
          ))}
        </div>
        <div className="rs-cal-legend">
          <span>Less</span>
          {LEVEL_BG.map((bg, i) => (
            <span key={i} className="rs-cal-cell" style={{ background: bg }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
