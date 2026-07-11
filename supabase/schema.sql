create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team text not null default 'RTA',
  points integer not null default 0,
  played integer not null default 0,
  won integer not null default 0,
  lost integer not null default 0,
  sets_for integer not null default 0,
  sets_against integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.players(id) on delete cascade,
  away_id uuid not null references public.players(id) on delete cascade,
  court text not null default 'Kort 1',
  match_date timestamptz not null,
  status text not null default 'scheduled' check (status in ('played', 'scheduled')),
  score text,
  created_at timestamptz not null default now()
);

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  tournament_date timestamptz not null,
  entries integer not null default 0,
  status text not null default 'Yakında' check (status in ('Kayıt açık', 'Yakında', 'Tamamlandı')),
  created_at timestamptz not null default now()
);

alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.tournaments enable row level security;

create policy "Public players are readable"
  on public.players for select
  using (true);

create policy "Public matches are readable"
  on public.matches for select
  using (true);

create policy "Public tournaments are readable"
  on public.tournaments for select
  using (true);

-- Skor yazma işlemini yayına almadan önce admin authentication ile kısıtlayın.
-- Geliştirme için geçici olarak açılabilir, üretimde bu haliyle bırakmayın.
-- create policy "Authenticated users can update matches"
--   on public.matches for update
--   to authenticated
--   using (true)
--   with check (true);
