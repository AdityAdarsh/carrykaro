-- CarryKaro — Initial Schema
-- Idempotent: safe to re-run if types/tables already exist

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enum types (skip if already exist) ──────────────────────────────────────
do $$ begin
  create type user_role as enum ('sender', 'traveller');
exception when duplicate_object then null; end $$;

do $$ begin
  create type kyc_status as enum ('not_started', 'pending', 'verified', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type item_type as enum ('documents', 'electronics', 'clothing', 'food', 'gifts', 'medicine', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status as enum ('open', 'matched', 'in_transit', 'delivered', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type travel_mode as enum ('flight', 'train', 'bus', 'car', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type trip_status as enum ('open', 'matched', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type match_status as enum ('requested', 'accepted', 'in_transit', 'delivered', 'completed', 'declined');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('created', 'captured', 'in_escrow', 'released', 'refunded', 'failed');
exception when duplicate_object then null; end $$;

-- ─── Tables ───────────────────────────────────────────────────────────────────
create table if not exists users (
  id                uuid primary key references auth.users(id) on delete cascade,
  phone             text,
  email             text,
  name              text not null,
  city              text,
  role              user_role not null,
  kyc_status        kyc_status not null default 'not_started',
  kyc_provider_ref  text,
  created_at        timestamptz not null default now()
);

create table if not exists requests (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references users(id) on delete cascade,
  from_city        text not null,
  to_city          text not null,
  needed_by_date   date not null,
  item_type        item_type not null,
  weight_kg        numeric(5,2) not null,
  description      text not null,
  price_range_min  integer not null,
  price_range_max  integer not null,
  photo_urls       text[] default '{}',
  status           request_status not null default 'open',
  created_at       timestamptz not null default now()
);

create table if not exists trips (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references users(id) on delete cascade,
  from_city          text not null,
  to_city            text not null,
  travel_date        date not null,
  travel_mode        travel_mode not null,
  capacity_kg        numeric(5,2) not null,
  earning_range_min  integer not null,
  earning_range_max  integer not null,
  status             trip_status not null default 'open',
  created_at         timestamptz not null default now()
);

create table if not exists matches (
  id                  uuid primary key default uuid_generate_v4(),
  request_id          uuid not null references requests(id) on delete cascade,
  trip_id             uuid not null references trips(id) on delete cascade,
  initiated_by        uuid not null references users(id),
  status              match_status not null default 'requested',
  sender_confirmed    boolean default false,
  traveller_confirmed boolean default false,
  created_at          timestamptz not null default now()
);

create table if not exists messages (
  id         uuid primary key default uuid_generate_v4(),
  match_id   uuid not null references matches(id) on delete cascade,
  sender_id  uuid not null references users(id),
  content    text not null,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id                 uuid primary key default uuid_generate_v4(),
  match_id           uuid not null references matches(id),
  razorpay_order_id  text not null,
  amount             integer not null,
  platform_fee       integer not null,
  status             payment_status not null default 'created',
  payout_id          text,
  created_at         timestamptz not null default now()
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table users    enable row level security;
alter table requests enable row level security;
alter table trips    enable row level security;
alter table matches  enable row level security;
alter table messages enable row level security;
alter table payments enable row level security;

-- users
drop policy if exists "Users can read own profile"   on users;
drop policy if exists "Users can insert own profile" on users;
drop policy if exists "Users can update own profile" on users;
create policy "Users can read own profile"   on users for select using (auth.uid() = id);
create policy "Users can insert own profile" on users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

-- requests
drop policy if exists "Authenticated users can read open requests" on requests;
drop policy if exists "Users can insert own requests"              on requests;
drop policy if exists "Users can update own requests"              on requests;
create policy "Authenticated users can read open requests"
  on requests for select using (auth.role() = 'authenticated');
create policy "Users can insert own requests"
  on requests for insert with check (auth.uid() = user_id);
create policy "Users can update own requests"
  on requests for update using (auth.uid() = user_id);

-- trips
drop policy if exists "Authenticated users can read open trips" on trips;
drop policy if exists "Users can insert own trips"              on trips;
drop policy if exists "Users can update own trips"              on trips;
create policy "Authenticated users can read open trips"
  on trips for select using (auth.role() = 'authenticated');
create policy "Users can insert own trips"
  on trips for insert with check (auth.uid() = user_id);
create policy "Users can update own trips"
  on trips for update using (auth.uid() = user_id);

-- matches
drop policy if exists "Parties can read their matches"          on matches;
drop policy if exists "Authenticated users can create matches"  on matches;
drop policy if exists "Parties can update their matches"        on matches;
create policy "Parties can read their matches"
  on matches for select using (
    auth.uid() = initiated_by
    or auth.uid() = (select user_id from requests where id = request_id)
    or auth.uid() = (select user_id from trips    where id = trip_id)
  );
create policy "Authenticated users can create matches"
  on matches for insert with check (auth.role() = 'authenticated');
create policy "Parties can update their matches"
  on matches for update using (
    auth.uid() = (select user_id from requests where id = request_id)
    or auth.uid() = (select user_id from trips where id = trip_id)
  );

-- messages
drop policy if exists "Match participants can read messages"   on messages;
drop policy if exists "Match participants can insert messages" on messages;
create policy "Match participants can read messages"
  on messages for select using (
    auth.uid() = sender_id
    or auth.uid() in (
      select r.user_id from matches m join requests r on r.id = m.request_id where m.id = match_id
      union
      select t.user_id from matches m join trips    t on t.id = m.trip_id    where m.id = match_id
    )
  );
create policy "Match participants can insert messages"
  on messages for insert with check (
    auth.uid() = sender_id
    and auth.uid() in (
      select r.user_id from matches m join requests r on r.id = m.request_id where m.id = match_id
      union
      select t.user_id from matches m join trips    t on t.id = m.trip_id    where m.id = match_id
    )
  );

-- payments
drop policy if exists "Parties can read their payments" on payments;
create policy "Parties can read their payments"
  on payments for select using (
    auth.uid() in (
      select r.user_id from matches m join requests r on r.id = m.request_id where m.id = match_id
      union
      select t.user_id from matches m join trips    t on t.id = m.trip_id    where m.id = match_id
    )
  );

-- ─── Realtime ─────────────────────────────────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table messages;
exception when others then null; end $$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_requests_cities on requests (from_city, to_city, status);
create index if not exists idx_trips_cities    on trips    (from_city, to_city, status);
create index if not exists idx_matches_request on matches  (request_id);
create index if not exists idx_matches_trip    on matches  (trip_id);
create index if not exists idx_messages_match  on messages (match_id, created_at);

-- ─── Storage bucket ───────────────────────────────────────────────────────────
-- Dashboard > Storage > New bucket > name: item-photos, Public: on
-- Or uncomment the line below:
-- insert into storage.buckets (id, name, public) values ('item-photos', 'item-photos', true) on conflict (id) do nothing;
