import { supabase } from './supabase'

/*
 * Data access layer. Every query runs as the signed-in user; row-level
 * security in Supabase (see supabase/schema.sql) guarantees a user can only
 * read or write their own rows. `user_id` is filled by a column default of
 * auth.uid() on the database side, so the client never sets it.
 */

// ---- Books ----

export async function listBooks() {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getBook(id) {
  const { data, error } = await supabase.from('books').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createBook(fields) {
  const { data, error } = await supabase.from('books').insert(fields).select().single()
  if (error) throw error
  return data
}

// Bulk insert (used by Goodreads import). Chunked so large libraries don't hit
// request-size limits. user_id is filled by the column default (auth.uid()).
export async function bulkCreateBooks(books) {
  let inserted = 0
  for (let i = 0; i < books.length; i += 200) {
    const chunk = books.slice(i, i + 200)
    const { error } = await supabase.from('books').insert(chunk)
    if (error) throw error
    inserted += chunk.length
  }
  return inserted
}

export async function updateBook(id, patch) {
  const { data, error } = await supabase
    .from('books')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBook(id) {
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) throw error
}

// ---- Field notes ----

export async function listNotes(bookId) {
  const { data, error } = await supabase
    .from('field_notes')
    .select('*')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createNote({ book_id, body, page_number }) {
  const { data, error } = await supabase
    .from('field_notes')
    .insert({ book_id, body, page_number: page_number ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteNote(id) {
  const { error } = await supabase.from('field_notes').delete().eq('id', id)
  if (error) throw error
}

// ---- Reading sessions (op tempo) ----

export async function listSessions() {
  const { data, error } = await supabase
    .from('reading_sessions')
    .select('*')
    .order('logged_at', { ascending: true })
  if (error) throw error
  return data
}

/*
 * Log pages read on a book. Advances current_page, records a reading_session
 * for streak ("op tempo") tracking, and auto-promotes a queued book to active.
 */
export async function logPages(book, pagesRead) {
  const next = Math.max(0, (book.current_page || 0) + pagesRead)
  const total = book.total_pages
  const patch = {
    current_page: total ? Math.min(next, total) : next,
  }
  // queued -> active on first logged progress
  if (book.status === 'queued') {
    patch.status = 'active'
    patch.started_at = book.started_at || new Date().toISOString().slice(0, 10)
  }
  const updated = await updateBook(book.id, patch)

  if (pagesRead > 0) {
    const { error } = await supabase.from('reading_sessions').insert({
      book_id: book.id,
      pages_read: pagesRead,
      logged_at: new Date().toISOString().slice(0, 10),
    })
    if (error) throw error
  }
  return updated
}

// ---- Settings (per-user, single row) ----

export async function getSettings() {
  const { data, error } = await supabase.from('settings').select('*').maybeSingle()
  if (error) throw error
  return data
}

export async function upsertSettings(patch) {
  // settings.user_id is the primary key (default auth.uid()); upsert on it.
  const { data, error } = await supabase
    .from('settings')
    .upsert(patch, { onConflict: 'user_id' })
    .select()
    .maybeSingle()
  if (error) throw error
  return data
}
