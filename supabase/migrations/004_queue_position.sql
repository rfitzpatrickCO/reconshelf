-- ============================================================
-- Migration 004 — manual deployment-queue order
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Lets the user drag-reorder their queue; lower number = higher in the queue.
-- Null positions sort last (fall back to recently-updated). RLS already covers books.
-- ============================================================

alter table public.books
  add column if not exists queue_position integer;
