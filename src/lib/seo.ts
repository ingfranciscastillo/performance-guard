/**
 * Canonical origin for the public marketing pages (canonical tags, JSON-LD,
 * robots.txt/sitemap.xml). No custom domain exists yet post-rebrand — update
 * this the day one does, and public/robots.txt + public/sitemap.xml's
 * hardcoded URLs alongside it (those can't import this constant, they're
 * static files served as-is).
 */
export const SITE_URL = "https://performance-guard.vercel.app";

/** Meta tags that keep a private, per-user page out of search results — the actual access control is the _authenticated redirect, this is defense in depth. */
export const NOINDEX_META = [{ name: "robots", content: "noindex, nofollow" }];
