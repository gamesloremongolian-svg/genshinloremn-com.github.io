# Games Lore MN — Premium Lore backend setup

This repository now contains the database schema and the authenticated Premium Lore Edge Function.
**QPay payment collection is not enabled yet.** Do not accept or announce real payments until the merchant API integration and payment verification have been tested.

## 1. Apply the database migration

1. Open the Supabase project used by `auth.html`.
2. Go to **SQL Editor → New query**.
3. Copy and run the complete file `supabase/migrations/202611140001_premium_membership.sql`.
4. Confirm that these tables exist:
   - `gmn_memberships`
   - `gmn_payment_orders`
   - `gmn_premium_lore_index`
   - `gmn_premium_lore_content`

The migration deliberately creates no browser-side write policies for memberships or payment orders. Only trusted server-side code should grant paid access.

## 2. Deploy the Edge Function

Deploy `supabase/functions/get-premium-lore/index.ts` as an Edge Function named:

`get-premium-lore`

Using Supabase CLI from a local project folder:

```bash
supabase functions deploy get-premium-lore
```

The Supabase Edge Function runtime provides `SUPABASE_URL` and `SUPABASE_ANON_KEY`. If deploying through the Dashboard, confirm those environment variables are available to the function.

## 3. How Premium content is stored

- Public preview: `gmn_premium_lore_index` (slug, game, title, teaser, cover, published).
- Private article body: `gmn_premium_lore_content` (slug, body_markdown).
- Never put the full Premium article body in HTML, JavaScript, JSON, or any public GitHub Pages file.
- Add article rows using Supabase Dashboard → Table Editor or a trusted admin process.
- Set `published = true` only after both index and content rows are ready.

Example preview row:

```sql
insert into public.gmn_premium_lore_index
  (slug, game, title, teaser, published)
values
  ('genshin-ancient-civilization', 'Genshin Impact',
   'Эртний соёл иргэншлийн нууц', 'Товч танилцуулга...', true);
```

Then insert the full Markdown body into `gmn_premium_lore_content` for the same slug. Do not put that body in this repository.

## 4. Granting a test membership (admin-only)

Only use the SQL Editor while signed in as a trusted project administrator. Replace the UUID with the actual Auth user ID from Supabase → Authentication → Users.

```sql
insert into public.gmn_memberships
  (user_id, status, starts_at, expires_at)
values
  ('REPLACE-WITH-AUTH-USER-UUID', 'active', now(), now() + interval '30 days')
on conflict (user_id) do update set
  status = 'active',
  starts_at = now(),
  expires_at = greatest(
    coalesce(public.gmn_memberships.expires_at, now()),
    now()
  ) + interval '30 days',
  updated_at = now();
```

This is a manual test grant only. Do not use it as the production payment process.

## 5. Test the protected endpoint

After deploying and applying the migration, call the function with a logged-in user's access token:

```http
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/get-premium-lore
Authorization: Bearer USER_ACCESS_TOKEN
Content-Type: application/json

{"slug":"genshin-ancient-civilization"}
```

Expected results:
- `401`: no valid login session.
- `403`: login is valid, but no active 30-day membership.
- `404`: the published article or its body is missing.
- `200`: the active member receives the full article body.

## 6. QPay integration — pending merchant details

Before writing the QPay invoice and callback functions, obtain the official merchant API documentation and test credentials for this merchant account. The production implementation must:
1. Create an order server-side for the fixed price and 30-day period.
2. Store the QPay invoice ID and internal order ID.
3. Display the QR/invoice returned by QPay.
4. Verify payment status server-to-server using the official QPay API.
5. Make payment processing idempotent so a repeated callback cannot grant duplicate membership.
6. Extend an existing active membership from its current expiry date; otherwise start from the confirmed payment time.
7. Never accept a client-submitted “paid” flag or receipt screenshot as proof of payment.

Keep QPay username, password, invoice credentials, and signing secrets in Supabase Edge Function secrets only. Never commit them to GitHub or send them in chat.
