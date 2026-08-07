export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Camify",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://camify.fun",
  description:
    "Free random video chat with strangers. Instant match, skip anytime — a modern Omegle alternative.",
  tagline: "Talk to strangers. Instantly.",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
