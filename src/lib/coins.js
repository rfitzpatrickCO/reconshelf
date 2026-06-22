import { longestOpTempo } from './stats'

/*
 * Challenge coins — milestone achievements earned automatically from the user's
 * data (no separate tracking table). Each coin's `check(ctx)` returns:
 *   { earned, date?, current, target, note? }
 * `current`/`target` drive the progress shown on locked coins.
 */

function byFinish(a, b) {
  return new Date(a.finished_at) - new Date(b.finished_at)
}

// A coin for "debrief N books" — earned date is the finish date of the Nth book.
function booksCoin(id, name, n) {
  return {
    id,
    name,
    center: String(n),
    desc: `Debrief ${n} book${n === 1 ? '' : 's'}.`,
    check: ({ debriefed }) => ({
      earned: debriefed.length >= n,
      date: debriefed[n - 1]?.finished_at,
      current: debriefed.length,
      target: n,
    }),
  }
}

// A coin for an N-day reading streak.
function streakCoin(id, name, n) {
  return {
    id,
    name,
    center: `${n}`,
    desc: `Read on ${n} consecutive days.`,
    check: ({ longestStreak }) => ({
      earned: longestStreak >= n,
      current: longestStreak,
      target: n,
    }),
  }
}

export const COINS = [
  booksCoin('first-contact', 'First Contact', 1),
  booksCoin('double-digits', 'Double Digits', 10),
  booksCoin('quarter-century', 'Quarter Century', 25),
  booksCoin('half-hundred', 'Half Hundred', 50),
  {
    id: 'mission-accomplished',
    name: 'Mission Accomplished',
    center: '★',
    desc: 'Reach your yearly reading goal.',
    check: ({ debriefedThisYear, goal }) => {
      if (!goal) return { earned: false, current: 0, target: 0, note: 'Set a yearly goal' }
      const sorted = [...debriefedThisYear].sort(byFinish)
      const earned = sorted.length >= goal
      return {
        earned,
        date: earned ? sorted[goal - 1]?.finished_at : undefined,
        current: sorted.length,
        target: goal,
      }
    },
  },
  streakCoin('op-tempo', 'Op Tempo', 7),
  streakCoin('forced-march', 'Forced March', 30),
  streakCoin('iron-discipline', 'Iron Discipline', 365),
  {
    id: 'ten-k-club',
    name: 'Ten-K Club',
    center: '10K',
    desc: 'Read 10,000 pages.',
    check: ({ pagesTotal }) => ({
      earned: pagesTotal >= 10000,
      current: pagesTotal,
      target: 10000,
    }),
  },
  {
    id: 'joint-operations',
    name: 'Joint Operations',
    center: '5',
    desc: 'Read across 5 different categories.',
    check: ({ categoriesCount }) => ({
      earned: categoriesCount >= 5,
      current: categoriesCount,
      target: 5,
    }),
  },
]

export function evaluateCoins({ books = [], sessions = [], settings = null }) {
  const debriefed = books.filter((b) => b.status === 'debriefed' && b.finished_at).sort(byFinish)
  const year = new Date().getFullYear()
  const debriefedThisYear = debriefed.filter(
    (b) => new Date(b.finished_at).getFullYear() === year
  )
  const ctx = {
    debriefed,
    debriefedThisYear,
    longestStreak: longestOpTempo(sessions),
    pagesTotal: debriefed.reduce((sum, b) => sum + (b.total_pages || 0), 0),
    categoriesCount: new Set(books.map((b) => (b.category || '').trim()).filter(Boolean)).size,
    goal: settings?.yearly_goal || 0,
  }
  return COINS.map((coin) => ({ ...coin, ...coin.check(ctx) }))
}
