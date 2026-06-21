// Status vocabulary + the CSS class hooks each status maps to.
// Terminology follows the spec §3 copy table — do not invent new jargon.
export const STATUS = {
  queued: {
    label: 'queued',
    badge: 'rs-badge--queued',
    cover: 'rs-book-cover--active', // queued covers use the brass edge (default)
    fill: 'rs-progress-fill', // brass
  },
  active: {
    label: 'active',
    badge: 'rs-badge--active',
    cover: 'rs-book-cover--active',
    fill: 'rs-progress-fill--forest',
  },
  debriefed: {
    label: 'debriefed',
    badge: 'rs-badge--debriefed',
    cover: 'rs-book-cover--done',
    fill: 'rs-progress-fill--forest',
  },
  stalled: {
    label: 'stalled',
    badge: 'rs-badge--stalled',
    cover: 'rs-book-cover--stalled',
    fill: 'rs-progress-fill--rust',
  },
}

export const STATUS_ORDER = ['active', 'queued', 'stalled', 'debriefed']

export function statusMeta(status) {
  return STATUS[status] || STATUS.queued
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
