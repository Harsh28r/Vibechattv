import { siteConfig } from "./site";

export const seoLinks = [
  { href: "/random-video-chat", label: "Random video chat" },
  { href: "/talk-to-strangers", label: "Talk to strangers" },
  { href: "/video-chat-with-strangers", label: "Video chat with strangers" },
  { href: "/free-video-chat-no-signup", label: "Free video chat (no signup)" },
  { href: "/omegle-alternative", label: "Omegle alternative" },
  { href: "/omegle-alternative-india", label: "Omegle alternative India" },
] as const;

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: new URL(item.path, siteConfig.url).toString(),
    })),
  };
}
