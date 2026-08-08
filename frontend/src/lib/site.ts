function normalizeSiteUrl(raw?: string) {
  const fallback = "https://camify.fun";
  try {
    const u = new URL(raw || fallback);
    // Apex canonical — www redirects in next.config
    if (u.hostname === "www.camify.fun") u.hostname = "camify.fun";
    u.hash = "";
    u.search = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Camify",
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  description:
    "Free random video chat with strangers. Instant match, skip anytime — a modern Omegle alternative. No signup, cam + mic on.",
  tagline: "Real faces. Instant strangers.",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
