-- ============================================================
-- Digested – Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- -------------------------------------------------------
-- Extensions
-- -------------------------------------------------------
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------
-- profiles
-- -------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -------------------------------------------------------
-- folders
-- -------------------------------------------------------
create table if not exists public.folders (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#7F77DD',
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.folders enable row level security;

create policy "Users can view own folders"
  on public.folders for select
  using (auth.uid() = user_id);

create policy "Users can create own folders"
  on public.folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own folders"
  on public.folders for update
  using (auth.uid() = user_id);

create policy "Users can delete own folders"
  on public.folders for delete
  using (auth.uid() = user_id);

create index if not exists folders_user_id_idx on public.folders(user_id);

-- Trigger: auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger folders_set_updated_at
  before update on public.folders
  for each row execute procedure public.set_updated_at();

-- -------------------------------------------------------
-- links
-- -------------------------------------------------------
create table if not exists public.links (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  folder_id       uuid references public.folders(id) on delete set null,
  url             text not null,
  title           text,
  description     text,
  image_url       text,
  status          text not null default 'unread'
                    check (status in ('unread', 'reading', 'digested', 'snoozed')),
  digested_at     timestamptz,
  snoozed_until   timestamptz,
  position        integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.links enable row level security;

create policy "Users can view own links"
  on public.links for select
  using (auth.uid() = user_id);

create policy "Users can create own links"
  on public.links for insert
  with check (auth.uid() = user_id);

create policy "Users can update own links"
  on public.links for update
  using (auth.uid() = user_id);

create policy "Users can delete own links"
  on public.links for delete
  using (auth.uid() = user_id);

create index if not exists links_user_id_idx       on public.links(user_id);
create index if not exists links_status_idx         on public.links(status);
create index if not exists links_folder_id_idx      on public.links(folder_id);
create index if not exists links_digested_at_idx    on public.links(digested_at);
create index if not exists links_snoozed_until_idx  on public.links(snoozed_until);

create trigger links_set_updated_at
  before update on public.links
  for each row execute procedure public.set_updated_at();

-- -------------------------------------------------------
-- link_tags
-- -------------------------------------------------------
create table if not exists public.link_tags (
  id         uuid primary key default uuid_generate_v4(),
  link_id    uuid not null references public.links(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (link_id, name)
);

alter table public.link_tags enable row level security;

create policy "Users can view own link tags"
  on public.link_tags for select
  using (auth.uid() = user_id);

create policy "Users can create own link tags"
  on public.link_tags for insert
  with check (auth.uid() = user_id);

create policy "Users can update own link tags"
  on public.link_tags for update
  using (auth.uid() = user_id);

create policy "Users can delete own link tags"
  on public.link_tags for delete
  using (auth.uid() = user_id);

create index if not exists link_tags_link_id_idx on public.link_tags(link_id);
create index if not exists link_tags_user_id_idx on public.link_tags(user_id);
