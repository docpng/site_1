-- Editable site text and images (logo, favicon, hero and page banners, headings,
-- button labels...). Keys are defined in src/lib/content.ts; missing keys fall
-- back to the defaults there.
alter table public.site_settings
  add column if not exists content jsonb not null default '{}'::jsonb;
