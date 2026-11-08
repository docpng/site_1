import type { SiteContent } from "./content";

export type ProductKind = "digital" | "physical" | "free";

export type SocialLink = { label: string; url: string };

export type SiteSettings = {
  site_name: string;
  tagline: string;
  hero_title: string;
  hero_subtitle: string;
  about_markdown: string;
  footer_text: string;
  social_links: SocialLink[];
  currency: string;
  content: SiteContent;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  cover_url: string | null;
  tags: string[];
  repo_url: string | null;
  live_url: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_url: string | null;
  tags: string[];
  project_id: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  kind: ProductKind;
  price_cents: number;
  images: string[];
  file_key: string | null;
  file_name: string | null;
  stock: number | null;
  project_id: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Author = Pick<Profile, "display_name" | "avatar_url">;

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  hidden: boolean;
  created_at: string;
  author: Author | null;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  hidden: boolean;
  created_at: string;
  author: Author | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  title: string;
  kind: ProductKind;
  unit_price_cents: number;
  quantity: number;
};

export type Order = {
  id: string;
  user_id: string | null;
  email: string | null;
  stripe_session_id: string;
  status: "paid" | "shipped" | "refunded" | "cancelled";
  amount_total: number;
  currency: string;
  shipping: unknown;
  created_at: string;
  order_items: OrderItem[];
};
