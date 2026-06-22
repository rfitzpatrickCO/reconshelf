// Google Books lookup — public volume search to auto-fill book details.
// The key is restricted (HTTP referrers + Books API only), so it's safe in the
// client. Search also works without a key at lower quota, so this degrades fine.
const KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

export const isGoogleBooksConfigured = Boolean(KEY)

export async function searchVolumes(query, { signal } = {}) {
  const params = new URLSearchParams({
    q: query,
    maxResults: '8',
    printType: 'books',
    fields: 'items(id,volumeInfo(title,authors,pageCount,categories,publishedDate,imageLinks/thumbnail))',
  })
  if (KEY) params.set('key', KEY)

  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`, { signal })
  if (!res.ok) throw new Error(`Search failed (${res.status})`)
  const data = await res.json()

  return mapItems(data.items)
}

function mapItems(items) {
  return (items || []).map((it) => {
    const v = it.volumeInfo || {}
    return {
      id: it.id,
      title: v.title || '',
      author: (v.authors && v.authors.join(', ')) || '',
      pageCount: v.pageCount || null,
      category: (v.categories && v.categories[0]) || '',
      // Google often returns http thumbnails — force https to avoid mixed content.
      thumbnail: v.imageLinks?.thumbnail ? v.imageLinks.thumbnail.replace(/^http:/, 'https:') : null,
      year: v.publishedDate ? String(v.publishedDate).slice(0, 4) : '',
    }
  })
}

// Find a cover image for a book, preferring an exact ISBN match for accuracy,
// then falling back to a title + author search. Returns a thumbnail URL or null.
export async function findCover({ isbn, title, author }) {
  const queries = []
  if (isbn) queries.push(`isbn:${isbn}`)
  if (title) queries.push(`${title} ${author || ''}`.trim())
  for (const q of queries) {
    try {
      const results = await searchVolumes(q)
      const hit = results.find((r) => r.thumbnail)
      if (hit) return hit.thumbnail
    } catch {
      // try the next query
    }
  }
  return null
}
