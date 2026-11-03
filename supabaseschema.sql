-- supabase/schema.sql  (run in the Supabase SQL editor)
create table if not exists public.saved_simulations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  author      text default 'anonymous',
  payload     jsonb not null,           -- { params, pid }
  created_at  timestamptz not null default now()
);
alter table public.saved_simulations enable row level security;
create policy "public read"   on public.saved_simulations for select using (true);
create policy "public insert" on public.saved_simulations for insert with check (true);

create table if not exists public.pid_scores (
  id uuid primary key default gen_random_uuid(),
  player text not null, iae double precision not null, scenario text,
  created_at timestamptz not null default now()
);
alter table public.pid_scores enable row level security;
create policy "public read scores"   on public.pid_scores for select using (true);
create policy "public insert scores" on public.pid_scores for insert with check (true);
