-- ============================================================
-- Migration 002 — book cover image URL
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Stores a cover image URL (e.g. from Google Books). Books without one fall
-- back to the flat colored cover bar. RLS already covers the books table.
-- ============================================================

alter table public.books
  add column if not exists cover_url text;
