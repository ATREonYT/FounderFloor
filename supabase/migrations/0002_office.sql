-- The Office and the drawer: what the MCP server and the app both read and write.
create table if not exists public.documents (
  id text primary key,                          -- app-generated: doc<base36>
  owner_id text not null references public.profiles(id) on delete cascade,
  kind text not null,                           -- packages/shared DocKind
  title text not null,
  body text not null,
  source text not null default 'rehearsal' check (source in ('rehearsal','live','agent','founder')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists documents_owner_time on public.documents(owner_id, created_at desc);

create table if not exists public.kpi_log (
  owner_id text not null references public.profiles(id) on delete cascade,
  week text not null,                           -- ISO week, 2026-W36
  revenue integer not null default 0,
  customers integer not null default 0,
  cash integer not null default 0,
  hours_on_customers integer not null default 0,
  shipped text,
  note text,
  updated_at timestamptz not null default now(),
  primary key (owner_id, week)
);

create table if not exists public.interviews (
  id text primary key,
  owner_id text not null references public.profiles(id) on delete cascade,
  who text not null,
  said text not null,
  pays_today text,
  created_at timestamptz not null default now()
);
create index if not exists interviews_owner_time on public.interviews(owner_id, created_at desc);

alter table public.documents enable row level security;
alter table public.kpi_log enable row level security;
alter table public.interviews enable row level security;
create policy "own documents" on public.documents for all using (owner_id = public.me()) with check (owner_id = public.me());
create policy "own kpi" on public.kpi_log for all using (owner_id = public.me()) with check (owner_id = public.me());
create policy "own interviews" on public.interviews for all using (owner_id = public.me()) with check (owner_id = public.me());
