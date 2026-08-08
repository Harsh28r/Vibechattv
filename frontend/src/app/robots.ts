import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const host = siteConfig.url.replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/chat"],
    },
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
