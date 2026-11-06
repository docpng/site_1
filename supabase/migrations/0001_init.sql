-- =============================================================================
-- site_1 initial schema
-- Run this in the Supabase SQL editor (or with `supabase db push`).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Anonymous',
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'user_name',
      split_part(new.email, '@', 1),
      'Anonymous'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by every admin policy.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- Site settings (single row, edited from /admin/settings)
-- ---------------------------------------------------------------------------
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  site_name text not null default 'My Site',
  tagline text not null default 'Projects, products and notes from the workshop.',
  hero_title text not null default 'Things I build, and how I build them.',
  hero_subtitle text not null default 'A home for my projects, products and a running log of what I make.',
  about_markdown text not null default 'Write something about yourself in **Admin → Site settings**.',
  footer_text text not null default '',
  social_links jsonb not null default '[]'::jsonb, -- [{ "label": "GitHub", "url": "https://..." }]
  currency text not null default 'usd',
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1);

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  body text not null default '',
  cover_url text,
  tags text[] not null default '{}',
  repo_url text,
  live_url text,
  featured boolean not null default false,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Blog / forum posts
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  cover_url text,
  tags text[] not null default '{}',
  project_id uuid references public.projects (id) on delete set null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

-- ---------------------------------------------------------------------------
-- Products (paid digital, physical, or free downloads)
-- ---------------------------------------------------------------------------
create type public.product_kind as enum ('digital', 'physical', 'free');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  description text not null default '',
  kind public.product_kind not null default 'digital',
  price_cents int not null default 0 check (price_cents >= 0),
  images text[] not null default '{}',
  file_path text,         -- object path in the private "downloads" bucket
  file_name text,         -- name shown to the buyer when downloading
  stock int,              -- null = unlimited (physical goods only)
  project_id uuid references public.projects (id) on delete set null,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint free_is_free check (kind <> 'free' or price_cents = 0),
  constraint paid_has_price check (kind = 'free' or price_cents >= 50)
);

-- ---------------------------------------------------------------------------
-- Orders (written only by the Stripe webhook using the service role key)
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  email text,
  stripe_session_id text not null unique,
  status text not null default 'paid', -- paid | shipped | refunded | cancelled
  amount_total int not null,
  currency text not null,
  shipping jsonb,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  title text not null,
  kind public.product_kind not null,
  unit_price_cents int not null,
  quantity int not null check (quantity > 0)
);
create index order_items_order_idx on public.order_items (order_id);

-- Has this user bought this product? (internal; not callable by clients)
create or replace function public.user_has_purchased(p_product_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.product_id = p_product_id
      and o.user_id = p_user_id
      and o.status in ('paid', 'shipped')
  );
$$;
revoke execute on function public.user_has_purchased(uuid, uuid) from public, anon, authenticated;

-- Has the *current* user bought this product? (callable from the app)
create or replace function public.has_purchased(p_product_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.user_has_purchased(p_product_id, auth.uid());
$$;

-- Atomically decrement stock for physical goods (called by the webhook).
create or replace function public.decrement_stock(p_product_id uuid, p_qty int)
returns void
language sql
security definer set search_path = public
as $$
  update public.products
     set stock = greatest(stock - p_qty, 0)
   where id = p_product_id and stock is not null;
$$;
revoke execute on function public.decrement_stock(uuid, int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text not null default '' check (char_length(title) <= 120),
  body text not null default '' check (char_length(body) <= 5000),
  verified boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

-- The "verified purchase" flag is computed by the database, never trusted from the client.
create or replace function public.set_review_verified()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.verified := public.user_has_purchased(new.product_id, new.user_id);
  return new;
end;
$$;

create trigger reviews_set_verified
  before insert or update on public.reviews
  for each row execute function public.set_review_verified();

-- updated_at bookkeeping
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
create trigger posts_touch before update on public.posts for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.site_settings for each row execute function public.touch_updated_at();

-- =============================================================================
-- Row level security
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.projects enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

-- Profiles: public names, users edit their own name/avatar only.
create policy "profiles are public" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "admins manage profiles" on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- Settings
create policy "settings are public" on public.site_settings for select using (true);
create policy "admins edit settings" on public.site_settings for update
  using (public.is_admin()) with check (public.is_admin());

-- Projects / posts / products: published rows are public, admins see and edit everything.
create policy "published projects are public" on public.projects for select using (published or public.is_admin());
create policy "admins manage projects" on public.projects for all using (public.is_admin()) with check (public.is_admin());

create policy "published posts are public" on public.posts for select using (published or public.is_admin());
create policy "admins manage posts" on public.posts for all using (public.is_admin()) with check (public.is_admin());

create policy "published products are public" on public.products for select using (published or public.is_admin());
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- Comments: visible unless hidden; signed-in users post as themselves.
create policy "visible comments are public" on public.comments for select
  using (not hidden or public.is_admin() or auth.uid() = user_id);
create policy "users add comments" on public.comments for insert to authenticated
  with check (
    auth.uid() = user_id
    and hidden = false
    and exists (select 1 from public.posts p where p.id = post_id and p.published)
  );
create policy "users delete own comments" on public.comments for delete using (auth.uid() = user_id);
create policy "admins manage comments" on public.comments for all using (public.is_admin()) with check (public.is_admin());

-- Reviews: same idea; one review per user per product.
create policy "visible reviews are public" on public.reviews for select
  using (not hidden or public.is_admin() or auth.uid() = user_id);
create policy "users add reviews" on public.reviews for insert to authenticated
  with check (
    auth.uid() = user_id
    and hidden = false
    and exists (select 1 from public.products p where p.id = product_id and p.published)
  );
create policy "users edit own reviews" on public.reviews for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id and hidden = false);
create policy "users delete own reviews" on public.reviews for delete using (auth.uid() = user_id);
create policy "admins manage reviews" on public.reviews for all using (public.is_admin()) with check (public.is_admin());

-- Orders: buyers read their own; only the service role (webhook) writes.
create policy "users read own orders" on public.orders for select using (auth.uid() = user_id or public.is_admin());
create policy "admins update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "users read own order items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);

-- =============================================================================
-- Storage
--   media     : public images (covers, product photos, images in posts)
--   downloads : private files; served through /api/download with signed URLs
-- =============================================================================
insert into storage.buckets (id, name, public) values ('media', 'media', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('downloads', 'downloads', false)
  on conflict (id) do nothing;

create policy "media is public" on storage.objects for select using (bucket_id = 'media');
create policy "admins upload media" on storage.objects for insert to authenticated
  with check (bucket_id in ('media', 'downloads') and public.is_admin());
create policy "admins update media" on storage.objects for update to authenticated
  using (bucket_id in ('media', 'downloads') and public.is_admin());
create policy "admins delete media" on storage.objects for delete to authenticated
  using (bucket_id in ('media', 'downloads') and public.is_admin());
create policy "admins read downloads" on storage.objects for select to authenticated
  using (bucket_id = 'downloads' and public.is_admin());

-- =============================================================================
-- After you sign in for the first time, make yourself the admin:
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'you@example.com');
-- =============================================================================
