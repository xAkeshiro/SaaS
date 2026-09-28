/**
 * The site's public origin, for metadata, robots and the sitemap.
 * An explicit NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain (or the deployment URL) is used;
 * locally it falls back to localhost.
 */
export function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
