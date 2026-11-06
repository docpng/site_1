import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page reads live data from Supabase, so no incremental cache is configured.
// See https://opennext.js.org/cloudflare/caching if you later add static pages.
export default defineCloudflareConfig({});
