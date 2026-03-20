-- Highlights table
CREATE TABLE IF NOT EXISTS public.highlights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  link_id     uuid not null references public.links(id) on delete cascade,
  text        text not null check (char_length(text) between 1 and 2000),
  color       text not null default 'yellow'
                check (color in ('yellow', 'green', 'blue', 'pink')),
  created_at  timestamptz not null default now()
);

alter table public.highlights enable row level security;

create policy "Users manage own highlights" on public.highlights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists highlights_link_id_idx on public.highlights(link_id);
create index if not exists highlights_user_id_idx on public.highlights(user_id);

-- Reading time (estimated minutes to read)
ALTER TABLE links ADD COLUMN IF NOT EXISTS reading_time_minutes integer;

-- Link health check (is the URL still alive?)
ALTER TABLE links ADD COLUMN IF NOT EXISTS is_dead boolean NOT NULL DEFAULT false;

-- Archive status ("Never see again")
ALTER TABLE links DROP CONSTRAINT IF EXISTS links_status_check;
ALTER TABLE links ADD CONSTRAINT links_status_check
  CHECK (status IN ('unread', 'reading', 'digested', 'snoozed', 'archived'));
