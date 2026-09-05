-- FounderFloor Reboot — the app's tables. RLS on everything.
--
-- Identity: the floor server (server/index.mjs) stays the authority for
-- accounts. It mints a Supabase-compatible JWT for a signed-in account
-- (sub = the floor account id, e.g. "acct_<uuid>") using the project's
-- JWT secret, so `auth.jwt() ->> 'sub'` below IS the floor account id and
-- no user table is duplicated. profiles.id therefore stores the floor id
-- as text, not a uuid. See docs/reboot-auth.md for the bridge.

create extension if not exists pgcrypto;

create or replace function public.me() returns text
language sql stable as $$ select coalesce(auth.jwt() ->> 'sub', '') $$;

-- profiles: one row per floor account that has opened the app
create table if not exists public.profiles (
  id text primary key,                       -- floor account id
  name text not null default '',
  tier text not null default 'free' check (tier in ('free','pro','founder')),
  founding boolean not null default false,
  push_token text,
  timezone text not null default 'Europe/Nicosia',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- stands: the app's stand record — the floor keeps the public part
create table if not exists public.stands (
  owner_id text primary key references public.profiles(id) on delete cascade,
  name text not null default '',
  one_liner text not null default '',
  pitch text not null default '',
  segment text,
  currency text not null default 'EUR' check (currency in ('EUR','USD','GBP')),
  mrr integer not null default 0 check (mrr >= 0),
  burn integer not null default 0 check (burn >= 0),
  cash integer not null default 0 check (cash >= 0),
  founder_salary integer not null default 0 check (founder_salary >= 0),
  entity text not null default 'none',
  residence text not null default 'other',
  weekly_goal text,
  weekly_goal_progress real not null default 0 check (weekly_goal_progress between 0 and 1),
  target_90 text,
  formed_on date,
  faq jsonb not null default '[]'::jsonb,
  public_pricing text,
  sprite_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_notes (
  owner_id text not null references public.profiles(id) on delete cascade,
  coach text not null check (coach in ('strategy','sales','investor','finance')),
  notes text not null default '',               -- append-only facts, <= ~1,500 tokens
  tokens integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (owner_id, coach)
);

create table if not exists public.coach_messages (
  id bigint generated always as identity primary key,
  owner_id text not null references public.profiles(id) on delete cascade,
  coach text not null,
  role text not null check (role in ('you','coach')),
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists coach_messages_owner_coach on public.coach_messages(owner_id, coach, created_at desc);

create table if not exists public.build_ticks (
  owner_id text not null references public.profiles(id) on delete cascade,
  item_id text not null,                        -- packages/shared build-path ids
  ticked_at timestamptz not null default now(),
  primary key (owner_id, item_id)
);

create table if not exists public.weekly_reviews (
  id bigint generated always as identity primary key,
  owner_id text not null references public.profiles(id) on delete cascade,
  week text not null,                           -- ISO week, e.g. 2026-W36
  promised jsonb not null default '[]'::jsonb,
  shipped jsonb not null default '[]'::jsonb,
  slipped jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (owner_id, week)
);

create table if not exists public.pitch_scores (
  id bigint generated always as identity primary key,
  owner_id text not null references public.profiles(id) on delete cascade,
  problem smallint not null, why_now smallint not null, traction smallint not null, market smallint not null, ask smallint not null,
  total real not null,
  model text not null,                          -- haiku for Free/Pro, sonnet for Founder+
  created_at timestamptz not null default now()
);

create table if not exists public.deadlines (
  id bigint generated always as identity primary key,
  owner_id text not null references public.profiles(id) on delete cascade,
  rule_id text not null,                        -- packages/shared deadlines rule id
  due date not null,
  source text not null,
  filed_at timestamptz,
  reminded_21 boolean not null default false,
  reminded_3 boolean not null default false,
  unique (owner_id, rule_id, due)
);

create table if not exists public.inbox_items (
  id bigint generated always as identity primary key,
  owner_id text not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('message','handoff','nudge')),
  from_id text,                                 -- floor id of the sender, null for system
  from_name text not null default '',
  body text not null,
  meta jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists inbox_owner_time on public.inbox_items(owner_id, created_at desc);

create table if not exists public.receptionist_sessions (
  id uuid primary key default gen_random_uuid(),
  stand_owner_id text not null references public.profiles(id) on delete cascade,
  visitor_id text,                              -- floor id, may be a guest
  transcript jsonb not null default '[]'::jsonb,
  collected_email text,
  note text,
  handed_off boolean not null default false,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.rsvps (
  owner_id text not null references public.profiles(id) on delete cascade,
  slot timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, slot)
);

create table if not exists public.usage_counters (
  owner_id text not null references public.profiles(id) on delete cascade,
  day date not null,
  coach_turns integer not null default 0,
  handoffs_month integer not null default 0,    -- rolled by the Edge Function on month change
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  primary key (owner_id, day)
);

-- ─── RLS ───────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.stands enable row level security;
alter table public.coach_notes enable row level security;
alter table public.coach_messages enable row level security;
alter table public.build_ticks enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.pitch_scores enable row level security;
alter table public.deadlines enable row level security;
alter table public.inbox_items enable row level security;
alter table public.receptionist_sessions enable row level security;
alter table public.rsvps enable row level security;
alter table public.usage_counters enable row level security;

-- you read and write your own rows; the service role (Edge Functions) does the rest
create policy "own profile" on public.profiles for all using (id = public.me()) with check (id = public.me());
create policy "own stand" on public.stands for all using (owner_id = public.me()) with check (owner_id = public.me());
create policy "own notes read" on public.coach_notes for select using (owner_id = public.me());
create policy "own messages read" on public.coach_messages for select using (owner_id = public.me());
create policy "own ticks" on public.build_ticks for all using (owner_id = public.me()) with check (owner_id = public.me());
create policy "own reviews" on public.weekly_reviews for all using (owner_id = public.me()) with check (owner_id = public.me());
create policy "own scores read" on public.pitch_scores for select using (owner_id = public.me());
create policy "own deadlines" on public.deadlines for all using (owner_id = public.me()) with check (owner_id = public.me());
create policy "own inbox read" on public.inbox_items for select using (owner_id = public.me());
create policy "own inbox mark read" on public.inbox_items for update using (owner_id = public.me()) with check (owner_id = public.me());
create policy "own sessions read" on public.receptionist_sessions for select using (stand_owner_id = public.me());
create policy "own rsvps" on public.rsvps for all using (owner_id = public.me()) with check (owner_id = public.me());
create policy "own usage read" on public.usage_counters for select using (owner_id = public.me());

-- the public stand card the receptionist answers from: pitch, FAQ, pricing only
create or replace view public.stand_cards as
  select owner_id, name, one_liner, pitch, segment, faq, public_pricing from public.stands;
grant select on public.stand_cards to anon, authenticated;

-- realtime for the inbox
alter publication supabase_realtime add table public.inbox_items;
