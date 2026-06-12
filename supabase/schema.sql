-- Run this in Supabase: Project -> SQL Editor -> New query -> paste -> Run
create table if not exists cities (
  slug text primary key,
  data jsonb not null
);

alter table cities enable row level security;

-- Allow anyone (anon key) to read city data — needed for the public website
create policy "Public read access" on cities
  for select using (true);
