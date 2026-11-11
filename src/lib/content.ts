/**
 * Every piece of editable site text and imagery, grouped the way it appears in
 * Admin → Site settings. Values are stored in `site_settings.content` (jsonb);
 * anything left blank falls back to the default here.
 *
 * To make a new piece of text editable: add a field below, then read it with
 * `text(settings, "your_key")` where it's displayed.
 */

export type ContentField = {
  key: string;
  label: string;
  default: string;
  type?: "text" | "textarea" | "image" | "toggle";
  help?: string;
};

export type ContentSection = { id: string; title: string; description?: string; fields: ContentField[] };

export const CONTENT_SECTIONS = [
  {
    id: "branding",
    title: "Logo & branding",
    description: "Shown in the header, browser tab and footer.",
    fields: [
      { key: "logo_url", label: "Logo", default: "", type: "image", help: "A square or wide image. Transparent PNG or SVG works best." },
      { key: "show_site_name", label: "Show the site name next to the logo", default: "true", type: "toggle" },
      { key: "favicon_url", label: "Browser tab icon (favicon)", default: "", type: "image", help: "A small square image, e.g. 64×64 PNG." },
    ],
  },
  {
    id: "nav",
    title: "Menu",
    fields: [
      { key: "nav_projects", label: "Projects link", default: "Projects" },
      { key: "nav_blog", label: "Blog link", default: "Blog" },
      { key: "nav_shop", label: "Shop link", default: "Shop" },
      { key: "nav_about", label: "About link", default: "About" },
      { key: "nav_signin", label: "Sign-in button", default: "Sign in" },
    ],
  },
  {
    id: "home",
    title: "Homepage",
    description: "The headline, intro and tagline are in General above.",
    fields: [
      { key: "hero_image_url", label: "Hero image", default: "", type: "image", help: "Shown beside the headline on wide screens." },
      { key: "home_cta_primary", label: "Main button", default: "Explore projects" },
      { key: "home_cta_primary_href", label: "Main button link", default: "/projects", help: "A page on this site (e.g. /blog) or a full URL." },
      { key: "home_cta_secondary", label: "Second button", default: "Visit the shop" },
      { key: "home_cta_secondary_href", label: "Second button link", default: "/shop" },
      { key: "home_featured_post_label", label: "Featured post label", default: "Featured post" },
      { key: "home_read_more", label: "Featured post button", default: "Read the post →" },
      { key: "home_projects_title", label: "Projects carousel heading", default: "Projects" },
      { key: "home_blog_title", label: "Recent posts heading", default: "Latest from the blog" },
      { key: "home_shop_title", label: "Products carousel heading", default: "Featured products" },
      {
        key: "home_autoscroll",
        label: "Carousels advance on their own",
        default: "false",
        type: "toggle",
        help: "Pauses while a visitor hovers or interacts, and never runs for people who turn off animations.",
      },
      { key: "home_view_all", label: "“View all” link", default: "View all →" },
    ],
  },
  {
    id: "projects",
    title: "Projects page",
    fields: [
      { key: "projects_banner_url", label: "Banner image", default: "", type: "image" },
      { key: "projects_title", label: "Heading", default: "Projects" },
      { key: "projects_intro", label: "Intro", default: "Everything I've built or am building.", type: "textarea" },
      { key: "projects_empty", label: "Message when there are no projects", default: "No projects yet. Check back soon." },
      { key: "project_visit", label: "“Visit project” button", default: "Visit project ↗" },
      { key: "project_source", label: "“Source code” button", default: "Source code ↗" },
      { key: "project_products_title", label: "Related products heading", default: "Get it" },
      { key: "project_log_title", label: "Related posts heading", default: "Build log" },
    ],
  },
  {
    id: "blog",
    title: "Blog",
    fields: [
      { key: "blog_banner_url", label: "Banner image", default: "", type: "image" },
      { key: "blog_title", label: "Heading", default: "Blog" },
      { key: "blog_intro", label: "Intro", default: "Build logs, write-ups and notes. Sign in to join the discussion.", type: "textarea" },
      { key: "blog_empty", label: "Message when there are no posts", default: "No posts yet." },
      { key: "blog_all_tags", label: "“All” tag filter", default: "All" },
      { key: "blog_back", label: "Back link on posts", default: "← All posts" },
      { key: "comments_title", label: "Comments heading", default: "Comments" },
      { key: "comments_signin", label: "Prompt for signed-out visitors", default: "Sign in to leave a comment." },
      { key: "comments_placeholder", label: "Comment box placeholder", default: "Join the discussion…" },
    ],
  },
  {
    id: "shop",
    title: "Shop",
    fields: [
      { key: "shop_banner_url", label: "Banner image", default: "", type: "image" },
      { key: "shop_title", label: "Heading", default: "Shop" },
      { key: "shop_intro", label: "Intro", default: "Things I make: digital downloads, physical goods, and free files.", type: "textarea" },
      { key: "shop_empty", label: "Message when nothing is listed", default: "Nothing here yet." },
      { key: "shop_filter_all", label: "Filter: everything", default: "Everything" },
      { key: "shop_filter_digital", label: "Filter: digital", default: "Digital" },
      { key: "shop_filter_physical", label: "Filter: physical", default: "Physical" },
      { key: "shop_filter_free", label: "Filter: free", default: "Free downloads" },
      { key: "shop_back", label: "Back link on products", default: "← Back to shop" },
      { key: "add_to_cart", label: "“Add to cart” button", default: "Add to cart" },
      { key: "free_download", label: "Free download button", default: "Download" },
      { key: "owned_download", label: "Download button for buyers", default: "Download your copy" },
      { key: "sold_out", label: "Sold-out message", default: "Sold out" },
      { key: "reviews_title", label: "Reviews heading", default: "Reviews" },
      { key: "reviews_empty", label: "Message when there are no reviews", default: "No reviews yet. Be the first!" },
      { key: "reviews_signin", label: "Prompt for signed-out visitors", default: "Sign in to leave a review." },
    ],
  },
  {
    id: "cart",
    title: "Cart & checkout",
    fields: [
      { key: "cart_title", label: "Cart heading", default: "Your cart" },
      { key: "cart_empty", label: "Empty cart message", default: "Your cart is empty." },
      { key: "cart_note", label: "Note under the subtotal", default: "Final prices, taxes and shipping are confirmed at checkout." },
      { key: "checkout_button", label: "Checkout button", default: "Checkout" },
      { key: "success_title", label: "Thank-you heading", default: "Thank you for your order!" },
      {
        key: "success_body",
        label: "Thank-you message",
        default:
          "A receipt is on its way to your inbox. Digital downloads appear in your account as soon as the payment is confirmed (usually within a few seconds).",
        type: "textarea",
      },
    ],
  },
  {
    id: "about",
    title: "About page",
    description: "The About page text itself is edited in General above.",
    fields: [
      { key: "about_banner_url", label: "Banner image", default: "", type: "image" },
      { key: "about_title", label: "Heading", default: "About" },
    ],
  },
  {
    id: "login",
    title: "Sign-in page",
    fields: [
      { key: "login_title", label: "Heading", default: "Sign in" },
      { key: "login_intro", label: "Intro", default: "Sign in to comment, leave reviews and access your purchases.", type: "textarea" },
    ],
  },
] as const satisfies readonly ContentSection[];

type Sections = typeof CONTENT_SECTIONS;
export type ContentKey = Sections[number]["fields"][number]["key"];
export type SiteContent = Partial<Record<ContentKey, string>>;

export const CONTENT_FIELDS: readonly ContentField[] = CONTENT_SECTIONS.flatMap((s) => s.fields as readonly ContentField[]);

const DEFAULTS = Object.fromEntries(CONTENT_FIELDS.map((f) => [f.key, f.default])) as Record<ContentKey, string>;

/** The saved value for a piece of site text, or its default when blank. */
export function text(settings: { content?: SiteContent | null }, key: ContentKey): string {
  const value = settings.content?.[key];
  return typeof value === "string" && value.trim() !== "" ? value : DEFAULTS[key];
}

export function flag(settings: { content?: SiteContent | null }, key: ContentKey): boolean {
  return text(settings, key) !== "false";
}
