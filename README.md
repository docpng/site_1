# site_1

A personal hub for projects, products and a build-log blog.

- **Projects**: showcase pages with links, tags, related products and a build log.
- **Blog / forum**: Markdown posts with tag filters and threaded comments from signed-in visitors.
- **Shop**: paid digital downloads, physical goods (with shipping address collection) and free downloads, a cart, Stripe Checkout, and star reviews with a "verified purchase" badge.
- **Admin editor** at `/admin`: upload a logo, favicon, hero image and page banners; edit the wording on every section (headings, intros, buttons, menu labels); and manage projects, posts and products with a Markdown editor (live preview, drag-and-drop image upload), upload downloadable files, moderate comments and reviews, and track orders.
- White-and-blue theme. Change the `--color-brand-*` values in `src/app/globals.css` to re-tint it.

**Stack:** Next.js 16 (React 19, App Router) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Stripe Checkout · deployed to **Cloudflare Workers** with [OpenNext](https://opennext.js.org/cloudflare).

---

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run each file in [`supabase/migrations/`](supabase/migrations) in order (`0001_init.sql`, then `0002_site_content.sql`). This creates the tables, row-level security policies and two storage buckets (`media` public, `downloads` private).
3. **Authentication → URL Configuration**
   - Site URL: your production URL (e.g. `https://site-1.<you>.workers.dev`)
   - Redirect URLs: add `http://localhost:3000/auth/callback`, `http://localhost:8787/auth/callback` and `https://<your-domain>/auth/callback`
4. **Authentication → Providers**: email sign-in links work out of the box. To use the Google / GitHub buttons, enable those providers and paste in their OAuth client IDs.
5. From **Project Settings → API**, copy the project URL, the anon (publishable) key and the service role key.

## 2. Set up Stripe

1. From the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys), copy your secret key (start in test mode).
2. Add a webhook endpoint at **Developers → Webhooks**:
   - URL: `https://<your-domain>/api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   - Copy the signing secret (`whsec_…`).
3. For local testing, use the Stripe CLI and put the secret it prints in `.env.local`:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

## 3. Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000, sign in once, then make yourself the admin in the Supabase SQL editor:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

Refresh the page and an **Admin** link appears in the header.

To test the actual Workers runtime locally, copy `.env.local` to `.dev.vars` and run `npm run preview` (serves on http://localhost:8787).

## 4. Deploy to Cloudflare Workers

**From your machine:**

```bash
npx wrangler login
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npm run deploy   # uses NEXT_PUBLIC_* from .env.local at build time
```

**Or from GitHub with Workers Builds:** in the Cloudflare dashboard, go to Workers & Pages → Create → Import a repository, and pick this repo.
- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx opennextjs-cloudflare deploy`
- Build variables: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Secrets (runtime): `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

The Worker name is `site-1` (set in `wrangler.jsonc`). After the first deploy, update the Supabase redirect URL, the Stripe webhook URL and `NEXT_PUBLIC_SITE_URL` to the real domain.

## Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | build | Absolute URL used for Stripe return links |
| `NEXT_PUBLIC_SUPABASE_URL` | build | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | build | Supabase anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | Webhook order writes and signed download links |
| `STRIPE_SECRET_KEY` | secret | Creating Checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | secret | Verifying webhook signatures |

## How it fits together

- `src/app/`: pages. `admin/` is the editor; `actions/` holds the Server Actions (all admin actions call `requireAdmin()`).
- `src/lib/content.ts`: every editable piece of site text and imagery, with defaults. Add a field there to make new text editable.
- `src/lib/data.ts`: read queries. `src/lib/auth.ts`: current user and admin guards.
- `src/proxy.ts`: refreshes the Supabase session cookie on each request.
- `src/app/api/stripe/webhook/route.ts`: records orders after payment (idempotent, decrements stock).
- `src/app/api/download/[id]/route.ts`: issues 60-second signed links. Free files go to anyone; paid files only to buyers.
- Prices always come from the database at checkout, never from the browser. The "verified purchase" badge on reviews is computed by a database trigger.

## Known gaps / next steps

- **Shipping rates and tax** aren't configured. Add `shipping_options` in `src/app/actions/checkout.ts`, or enable Stripe Tax.
- **Emails:** buyers get Stripe's receipt. There are no custom order emails yet.
- **File size:** Supabase's free plan limits uploads to 50 MB per file.
- **Spam:** comments require sign-in and can be hidden in **Admin → Moderation**, but there's no automatic spam filter.
