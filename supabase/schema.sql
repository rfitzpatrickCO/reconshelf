-- ============================================================
-- RECON SHELF — Supabase schema
-- Run this once in your Supabase project: Dashboard -> SQL Editor -> New query
-- -> paste -> Run. It creates the tables and the row-level-security (RLS)
-- policies that make each account's data PRIVATE to that account.
--
-- Privacy model (feature spec §1, §7): there are NO social features. RLS below
-- ensures a signed-in user can only ever SELECT/INSERT/UPDATE/DELETE their own
-- rows. Two different accounts can never see each other's shelves.
-- ============================================================

-- ---- books ----
create table if not exists public.books (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title         text not null,
  author        text not null,
  cover_color   text,
  status        text not null default 'queued'
                  check (status in ('queued', 'active', 'debriefed', 'stalled')),
  total_pages   integer,
  current_page  integer not null default 0,
  category      text,
  started_at    date,
  finished_at   date,
  target_date   date,
  rating        integer check (rating between 1 and 5),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists books_user_idx on public.books (user_id, updated_at desc);

-- ---- field_notes ----
create table if not exists public.field_notes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade default auth.uid(),
  book_id       uuid not null references public.books (id) on delete cascade,
  body          text not null,
  page_number   integer,
  created_at    timestamptz not null default now()
);

create index if not exists field_notes_book_idx on public.field_notes (book_id, created_at desc);

-- ---- reading_sessions (op tempo / streaks) ----
create table if not exists public.reading_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade default auth.uid(),
  book_id       uuid not null references public.books (id) on delete cascade,
  pages_read    integer not null,
  logged_at     date not null default current_date,
  created_at    timestamptz not null default now()
);

create index if not exists reading_sessions_user_idx on public.reading_sessions (user_id, logged_at);

-- ---- settings (one row per user; mission parameters) ----
create table if not exists public.settings (
  user_id       uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  yearly_goal   integer,
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- Row-level security — the heart of the privacy model
-- ============================================================
alter table public.books            enable row level security;
alter table public.field_notes      enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.settings         enable row level security;

-- books
drop policy if exists "books are private" on public.books;
create policy "books are private" on public.books
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- field_notes
drop policy if exists "field_notes are private" on public.field_notes;
create policy "field_notes are private" on public.field_notes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- reading_sessions
drop policy if exists "reading_sessions are private" on public.reading_sessions;
create policy "reading_sessions are private" on public.reading_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- settings
drop policy if exists "settings are private" on public.settings;
create policy "settings are private" on public.settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
