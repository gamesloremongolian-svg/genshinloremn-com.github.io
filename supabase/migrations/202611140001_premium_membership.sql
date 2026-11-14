-- Games Lore MN Premium membership foundation
-- Run in Supabase SQL Editor. This migration does NOT enable QPay payments.
-- Premium article bodies must be stored ONLY in premium_lore_content, never in GitHub Pages files.

create table if not exists public.gmn_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'expired' check (status in ('active','expired','cancelled')),
  starts_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint gmn_membership_dates_check check (
    expires_at is null or starts_at is null or expires_at > starts_at
  )
);

create table if not exists public.gmn_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'qpay' check (provider in ('qpay')),
  invoice_id text unique,
  amount_mnt integer not null check (amount_mnt > 0),
  status text not null default 'pending' check (status in ('pending','paid','failed','expired','cancelled')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  membership_days integer not null default 30 check (membership_days = 30)
);

create table if not exists public.gmn_premium_lore_index (
  slug text primary key,
  game text not null,
  title text not null,
  teaser text not null default '',
  cover_image text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gmn_premium_lore_content (
  slug text primary key references public.gmn_premium_lore_index(slug) on delete cascade,
  body_markdown text not null,
  updated_at timestamptz not null default now()
);

create or replace function public.gmn_has_active_premium(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.gmn_memberships m
    where m.user_id = check_user_id
      and m.status = 'active'
      and m.starts_at <= now()
      and m.expires_at > now()
  );
$$;

revoke all on function public.gmn_has_active_premium(uuid) from public, anon;
grant execute on function public.gmn_has_active_premium(uuid) to authenticated;

alter table public.gmn_memberships enable row level security;
alter table public.gmn_payment_orders enable row level security;
alter table public.gmn_premium_lore_index enable row level security;
alter table public.gmn_premium_lore_content enable row level security;

drop policy if exists "Users can read their own membership" on public.gmn_memberships;
create policy "Users can read their own membership"
on public.gmn_memberships for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read their own payment orders" on public.gmn_payment_orders;
create policy "Users can read their own payment orders"
on public.gmn_payment_orders for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Published premium lore previews are public" on public.gmn_premium_lore_index;
create policy "Published premium lore previews are public"
on public.gmn_premium_lore_index for select to anon, authenticated
using (published = true);

drop policy if exists "Active members can read published premium lore bodies" on public.gmn_premium_lore_content;
create policy "Active members can read published premium lore bodies"
on public.gmn_premium_lore_content for select to authenticated
using (
  exists (
    select 1 from public.gmn_premium_lore_index i
    where i.slug = gmn_premium_lore_content.slug
      and i.published = true
  )
  and public.gmn_has_active_premium(auth.uid())
);

-- No client-side INSERT/UPDATE/DELETE policies are intentionally provided.
-- Trusted server/service-role operations will create orders and grant membership.
