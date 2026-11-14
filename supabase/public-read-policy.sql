-- Games Lore MN: prepare Wiki article fields and enable public reading for published articles.
-- Run this entire file in Supabase Dashboard > SQL Editor > New query.
-- Existing admin write policies are not changed.

alter table public.wiki_articles
  add column if not exists published_at date,
  add column if not exists image_url text,
  add column if not exists sources text[] not null default '{}';

alter table public.wiki_articles enable row level security;

drop policy if exists "Public can read published wiki articles" on public.wiki_articles;

create policy "Public can read published wiki articles"
on public.wiki_articles
for select
to anon, authenticated
using (published_at is not null);
-- Explicit table privileges are required in addition to the RLS policy.
grant select on public.wiki_articles to anon, authenticated;
