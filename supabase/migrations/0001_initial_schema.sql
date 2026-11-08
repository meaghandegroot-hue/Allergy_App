-- Allergy App — initial database schema (Phase 2)
--
-- Assumptions (from ROADMAP.md open questions — easy to change later):
--   * Allergen accommodation is per restaurant (a dishes table can be added later).
--   * Only restaurants with an active paid listing are shown to users (is_listed).
--   * Partial matches are hidden in the app, so no extra data is needed for warnings.
--
-- Security model (Row Level Security):
--   * Anyone can read the allergen list and listed restaurants.
--   * Signed-in users manage only their own family profiles and reports.
--   * Restaurant owners edit only their own restaurant, and can never mark
--     themselves as listed — that is set by payment/admin (Phase 3).

-- ───────────────────────── Allergens ─────────────────────────
create table public.allergens (
  id          text primary key,              -- e.g. 'celery', 'alpha-gal'
  name        text not null,
  grp         text not null,                 -- 'Nuts & seeds', 'Fruit', ...
  priority    boolean not null default false, -- Health Canada priority allergen
  sort_order  int not null default 0
);

alter table public.allergens enable row level security;

create policy "Allergens are readable by everyone"
  on public.allergens for select
  using (true);

-- ───────────────────────── Restaurants ─────────────────────────
create table public.restaurants (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid references auth.users (id) on delete set null,
  name           text not null,
  cuisine        text not null default '',
  address        text not null default '',
  city           text not null default 'Vernon',
  latitude       double precision,
  longitude      double precision,
  cross_contact  text not null default '',
  call_ahead     boolean not null default false,
  notes          text not null default '',
  is_listed      boolean not null default false, -- paid listing active; set by admin/payment only
  is_sample      boolean not null default false, -- fictional test data
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index restaurants_listed_idx on public.restaurants (is_listed, city);

alter table public.restaurants enable row level security;

create policy "Listed restaurants are readable by everyone"
  on public.restaurants for select
  using (is_listed or owner_id = auth.uid());

create policy "Owners can create their restaurant (unlisted)"
  on public.restaurants for insert
  to authenticated
  with check (owner_id = auth.uid() and is_listed = false and is_sample = false);

create policy "Owners can update their restaurant"
  on public.restaurants for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Owners may edit their details but not the listing/payment flags.
revoke update on public.restaurants from authenticated, anon;
grant update (name, cuisine, address, city, latitude, longitude,
              cross_contact, call_ahead, notes)
  on public.restaurants to authenticated;

-- Keep updated_at current so users see when info was last changed.
create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger restaurants_touch_updated_at
  before update on public.restaurants
  for each row execute function public.touch_updated_at();

-- ───────────────── Which allergens each restaurant accommodates ─────────────────
create table public.restaurant_allergens (
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  allergen_id    text not null references public.allergens (id) on delete cascade,
  primary key (restaurant_id, allergen_id)
);

create index restaurant_allergens_allergen_idx on public.restaurant_allergens (allergen_id);

alter table public.restaurant_allergens enable row level security;

create policy "Accommodations of visible restaurants are readable"
  on public.restaurant_allergens for select
  using (exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and (r.is_listed or r.owner_id = auth.uid())
  ));

create policy "Owners manage their restaurant's accommodations"
  on public.restaurant_allergens for all
  to authenticated
  using (exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  ));

-- Changing accommodations counts as updating the restaurant's info.
create function public.touch_restaurant_from_allergens() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.restaurants set updated_at = now()
  where id = coalesce(new.restaurant_id, old.restaurant_id);
  return null;
end;
$$;

create trigger restaurant_allergens_touch
  after insert or update or delete on public.restaurant_allergens
  for each row execute function public.touch_restaurant_from_allergens();

-- ───────────────────────── Family allergy profiles ─────────────────────────
-- One account can hold several people (e.g. a parent and their kids).
create table public.diner_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name              text not null,
  allergen_ids      text[] not null default '{}',
  custom_allergens  text[] not null default '{}', -- "my allergen isn't listed"
  is_dining         boolean not null default true, -- ticked under "Who's eating?"
  created_at        timestamptz not null default now()
);

create index diner_profiles_user_idx on public.diner_profiles (user_id);

alter table public.diner_profiles enable row level security;

create policy "Users manage their own profiles"
  on public.diner_profiles for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ───────────────────────── Reports ─────────────────────────
create table public.reports (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  user_id        uuid default auth.uid() references auth.users (id) on delete set null,
  reason         text not null,
  details        text not null default '',
  status         text not null default 'new' check (status in ('new', 'reviewing', 'resolved')),
  created_at     timestamptz not null default now()
);

create index reports_restaurant_idx on public.reports (restaurant_id, created_at desc);

alter table public.reports enable row level security;

create policy "Signed-in users can send reports"
  on public.reports for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can see their own reports"
  on public.reports for select
  to authenticated
  using (user_id = auth.uid());

create policy "Owners can see reports about their restaurant"
  on public.reports for select
  to authenticated
  using (exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  ));

-- ─────────── Allergens users added themselves (to decide what to add next) ───────────
-- Readable only with the service role (Supabase dashboard), not by app users.
create view public.custom_allergen_counts
with (security_invoker = true) as
  select lower(trim(a)) as allergen, count(*) as people
  from public.diner_profiles, unnest(custom_allergens) as a
  group by 1
  order by 2 desc;

revoke all on public.custom_allergen_counts from anon, authenticated;
