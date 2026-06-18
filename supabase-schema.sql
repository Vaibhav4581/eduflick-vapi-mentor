-- ═══════════════════════════════════════════════════════════════════
-- EduFlick Voice AI — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  track_id    text,
  created_at  timestamptz default now()
);

-- ── Tracks ───────────────────────────────────────────────────────────────────
create table if not exists tracks (
  id          text primary key,
  title       text not null,
  description text,
  created_at  timestamptz default now()
);

-- ── Modules ──────────────────────────────────────────────────────────────────
create table if not exists modules (
  id          uuid primary key default gen_random_uuid(),
  track_id    text references tracks(id),
  title       text not null,
  position    int not null default 0,
  created_at  timestamptz default now()
);

-- ── Lessons ──────────────────────────────────────────────────────────────────
create table if not exists lessons (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid references modules(id),
  title       text not null,
  content     text,
  position    int not null default 0,
  created_at  timestamptz default now()
);

-- ── Lesson progress ───────────────────────────────────────────────────────────
create table if not exists lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid references profiles(id) on delete cascade,
  lesson_id    uuid references lessons(id),
  completed_at timestamptz,
  updated_at   timestamptz default now(),
  unique(student_id, lesson_id)
);

-- ── Call logs (written by Vapi webhook) ───────────────────────────────────────
create table if not exists call_logs (
  id               uuid primary key default gen_random_uuid(),
  call_id          text unique,           -- Vapi's call ID
  student_id       uuid references profiles(id),
  surface          text default 'in_app_mentor', -- 'in_app_mentor' | 'outbound_lead_gen'
  duration_seconds int,
  transcript       text,
  summary          text,
  recording_url    text,
  ended_reason     text,
  created_at       timestamptz default now()
);

-- ── Sample data for demo ──────────────────────────────────────────────────────

insert into tracks (id, title, description) values
  ('ai-ml', 'AI & Machine Learning', 'From Python basics to deploying neural networks'),
  ('web-dev', 'Full Stack Web Development', 'HTML to Next.js, databases, and deployment'),
  ('data-science', 'Data Science', 'Statistics, pandas, visualisation, and ML pipelines')
on conflict do nothing;

insert into modules (id, track_id, title, position) values
  ('00000000-0000-0000-0000-000000000001', 'ai-ml', 'Module 1 — Python Foundations', 1),
  ('00000000-0000-0000-0000-000000000002', 'ai-ml', 'Module 2 — ML Concepts', 2),
  ('00000000-0000-0000-0000-000000000003', 'ai-ml', 'Module 3 — Deep Learning Foundations', 3)
on conflict do nothing;

insert into lessons (id, module_id, title, position) values
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000003', 'Introduction to Neural Networks', 1),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000003', 'Activation Functions', 2),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000003', 'Backpropagation', 3)
on conflict do nothing;

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table lesson_progress enable row level security;
alter table call_logs enable row level security;

-- Students can only read their own profile
create policy "Students read own profile"
  on profiles for select
  using (auth.uid() = id);

-- Students can only read their own progress
create policy "Students read own progress"
  on lesson_progress for select
  using (auth.uid() = student_id);

-- Service role can write call logs (webhook uses service role key)
create policy "Service role writes call logs"
  on call_logs for insert
  with check (true);
