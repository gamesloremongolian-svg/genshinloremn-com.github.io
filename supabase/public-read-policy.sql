-- Games Lore MN: allow anonymous visitors to read only published Wiki articles.
-- Run this in Supabase Dashboard > SQL Editor > New query.
-- Admin write permissions remain governed by the existing wiki_admins policies.

alter table public.wiki_articles enable row level security;

drop policy if exists "Public can read published wiki articles" on public.wiki_articles;

create policy "Public can read published wiki articles"
on public.wiki_articles
for select
to anon, authenticated
using (published_at is not null);
