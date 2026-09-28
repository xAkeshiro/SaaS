import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

const siteUrl = resolveSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["/", "/pricing", "/manifesto", "/teams"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
