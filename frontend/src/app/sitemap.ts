import type { MetadataRoute } from "next";
import { legalLinks, seoLinks } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...seoLinks.map((link) => ({
      url: `${base}${link.href}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: link.href.includes("omegle") || link.href.includes("ome-tv") ? 0.9 : 0.85,
    })),
    ...legalLinks.map((link) => ({
      url: `${base}${link.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
