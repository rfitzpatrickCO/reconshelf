-- ============================================================
-- Migration 001 — profile fields on settings
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Adds identity fields used by onboarding + the Profile page. RLS already
-- covers the settings table, so these columns inherit the same privacy.
-- ============================================================

alter table public.settings
  add column if not exists display_name   text,
  add column if not exists favorite_genre text,
  add column if not exists onboarded      boolean not null default false;
