# site_1

A personal hub for projects, products and a build-log blog.

- **Homepage**: hero, a featured blog post, and carousels of featured projects and products (mark items as Featured in the editor).
- **Projects**: showcase pages with links, tags, related products and a build log.
- **Blog / forum**: Markdown posts with tag filters and threaded comments from signed-in visitors.
- **Shop**: paid digital downloads, physical goods (with shipping address collection) and free downloads, a cart, Stripe Checkout, and star reviews with a "verified purchase" badge.
- **Admin editor** at `/admin`: upload a logo, favicon, hero image and page banners; edit the wording on every section (headings, intros, buttons, menu labels); and manage projects, posts and products with a Markdown editor (live preview, drag-and-drop image upload), upload downloadable files, moderate comments and reviews, and track orders.
- White-and-blue theme. Change the `--color-brand-*` values in `src/app/globals.css` to re-tint it.

**Stack:** Next.js 16 (React 19, App Router) · Tailwind CSS 4 · **Cloudflare Workers** (via [OpenNext](https://opennext.js.org/cloudflare)) with **D1** (database) and **R2** (file storage) · Google & GitHub sign-in · Stripe Checkout.

Everything except payments runs on your Cloudflare account. There's no separate database or auth service to manage.

---

## 1. Create the Cloudflare resources (once)

```bash
npm install
npx wrangler login
npx wrangler d1 create site-1-db
```

Copy the `database_id` it prints into `wrangler.jsonc` (replace `REPLACE_WITH_YOUR_D1_DATABASE_ID`), commit it (it isn't secret), then:

```bash
npx wrangler r2 bucket create site-1-files
npx wrangler d1 migrations apply site-1-db --remote
```

## 2. Sign-in (Google and GitHub)

Create an OAuth app with each provider and use these **callback / redirect URLs**:

| Provider | Where | Redirect URL |
| --- | --- | --- |
| Google | Cloud Console → APIs & Services → Credentials → OAuth client (Web application) | `https://3darmaments.com/auth/callback/google` |
| GitHub | Settings → Developer settings → OAuth Apps | `https://3darmaments.com/auth/callback/github` |

For local development, also add `http://localhost:3000/auth/callback/google` (Google allows several redirect URIs; GitHub needs a separate dev OAuth app).
On Google's consent screen the only authorized domain needed is `3darmaments.com`.

A provider's button appears on `/login` only once its client ID and secret are set.

**Admins:** anyone who signs in with a verified email listed in `ADMIN_EMAILS` (in `wrangler.jsonc`, currently `admin@3darmaments.com`) is an admin. Add more emails separated by commas.

## 3. Stripe

1. Copy your secret key from the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys) (start in test mode).
2. Add a webhook endpoint at **Developers → Webhooks**:
   - URL: `https://3darmaments.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   - Copy the signing secret (`whsec_…`).

## 4. Secrets and settings

Set these on the Worker (Cloudflare dashboard → **site-1 → Settings → Variables and Secrets**, or with `npx wrangler secret put NAME`):

| Name | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub sign-in |
| `STRIPE_SECRET_KEY` | Creating Checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | Verifying Stripe webhooks |

And one **build** variable (Settings → Build → Variables and secrets, since it's baked in at build time):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://3darmaments.com` (used for Stripe's return links) |

## 5. Deploy

**From GitHub with Workers Builds** (recommended): Cloudflare dashboard → Workers & Pages → site-1 → Settings → Build.
- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx opennextjs-cloudflare deploy`

Every push to `main` then deploys. **Or from your machine:** `npm run deploy`.

When the schema changes (a new file in `migrations/`), apply it with `npm run db:migrate`.
To do this automatically on every deploy, set the Workers Builds deploy command to
`npx wrangler d1 migrations apply site-1-db --remote && npx opennextjs-cloudflare deploy`.
Already-applied migrations are skipped, so this is safe to run each time.

## Local development

```bash
cp .dev.vars.example .dev.vars          # fill in what you want to test
npm run db:migrate:local
npm run dev                              # http://localhost:3000, with a local D1 + R2
npm run preview                          # the real Workers runtime, http://localhost:8787
```

To make yourself admin locally without sign-in set up, insert a user with your email, e.g.
`npx wrangler d1 execute site-1-db --local --command "INSERT INTO users (id, email, display_name) VALUES ('me', 'admin@3darmaments.com', 'Me')"`.

## How it fits together

- `src/app/`: pages. `admin/` is the editor; `actions/` holds the Server Actions. Every admin action and route calls `requireAdmin()` or checks `is_admin`.
- `src/lib/db.ts`: D1/R2 access. `src/lib/data.ts`: read queries. `src/lib/auth.ts`: sessions, current user, admin checks.
- `src/lib/oauth.ts`, `src/app/auth/`: Google/GitHub sign-in (state + PKCE). Sessions are random tokens in an `HttpOnly` cookie; only their SHA-256 hash is stored.
- `src/lib/content.ts`: every editable piece of site text and imagery, with defaults.
- `migrations/`: the D1 schema.
- Files: images live under `media/` in R2 and are served publicly from `/files/media/...`. Product files live under `downloads/` and are only served by `/api/download/[id]`: free files to anyone, paid files to buyers and admins.
- `src/app/api/stripe/webhook/route.ts`: records orders after payment as a single D1 transaction. Repeated deliveries are ignored, and stock is decremented.
- Prices always come from the database at checkout, never from the browser. The "verified purchase" badge is decided on the server.

## Known gaps / next steps

- **Shipping rates and tax** aren't configured. Add `shipping_options` in `src/app/actions/checkout.ts`, or enable Stripe Tax.
- **Emails:** buyers get Stripe's receipt. There are no custom order emails.
- **Upload size:** Workers accept uploads up to 100 MB on the Free/Pro plans, so files are capped at 95 MB.
- **Spam:** comments require sign-in and can be hidden in **Admin → Moderation**, but there's no automatic spam filter.
