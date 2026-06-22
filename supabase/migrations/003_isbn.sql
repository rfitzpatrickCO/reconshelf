-- ============================================================
-- Migration 003 — book ISBN
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Stores the ISBN (preferring ISBN-13) from Goodreads imports / manual entry.
-- Used to fetch more accurate cover art. RLS already covers the books table.
-- ============================================================

alter table public.books
  add column if not exists isbn text;
