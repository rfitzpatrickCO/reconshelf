-- ============================================================
-- Migration 005 — explicit series fields
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Lets a book be tagged with its series and position ("book X of Y"), which is
-- more reliable than parsing the title and powers next-in-series suggestions.
-- series_number is numeric to allow novellas like 15.5. RLS already covers books.
-- ============================================================

alter table public.books
  add column if not exists series_name   text,
  add column if not exists series_number numeric,
  add column if not exists series_total  integer;
