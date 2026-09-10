/**
 * Canonical origin for the public marketing pages (canonical tags, JSON-LD,
 * robots.txt/sitemap.xml). No custom domain exists yet post-rebrand — update
 * this if one is added, and public/robots.txt + public/sitemap.xml's
 * hardcoded URLs alongside it (those can't import this constant, they're
 * static files served as-is).
 */
export const SITE_URL = "https://vitalgate.vercel.app";

/** Meta tags that keep a private, per-user page out of search results — the actual access control is the _authenticated redirect, this is defense in depth. */
export const NOINDEX_META = [{ name: "robots", content: "noindex, nofollow" }];

/**
 * Shared social-preview image for every public page. It's SVG, not the PNG
 * Open Graph nominally expects — this environment has no image rasterizer
 * (no ImageMagick/sharp) to produce one. Slack and Discord unfurl it fine;
 * Twitter/Facebook generally don't render SVG previews and fall back to no
 * image, which is why og:title/og:description (real text, not just this)
 * still carry each page's share card on those platforms.
 */
export const OG_IMAGE_META = [
	{ property: "og:image", content: `${SITE_URL}/og-image.svg` },
	{ property: "og:image:type", content: "image/svg+xml" },
	{ property: "og:image:width", content: "1200" },
	{ property: "og:image:height", content: "630" },
	{ name: "twitter:image", content: `${SITE_URL}/og-image.svg` },
];
