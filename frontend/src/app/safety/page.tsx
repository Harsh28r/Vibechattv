import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SeoArticle } from "@/components/SeoArticle";
import { breadcrumbJsonLd } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Safety — Stay Safe on Random Video Chat",
  description: `Safety guide for ${siteConfig.name}: 18+ only, skip and report tools, and practical tips for safer stranger video chat.`,
  alternates: { canonical: "/safety" },
  openGraph: {
    title: `Safety — ${siteConfig.name}`,
    description: "How to stay safer while chatting with strangers on video.",
    url: absoluteUrl("/safety"),
  },
};

export default function SafetyPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Safety", path: "/safety" },
        ])}
      />
      <SeoArticle
        eyebrow="Safety"
        title="Stay safer on random video chat"
        lead={`${siteConfig.name} is for adults (18+) who want face-to-face stranger conversations. Random chat is fun — treat every partner as a stranger and use the tools we give you.`}
        cta="Open chat carefully"
        relatedHref="/safety"
        sections={[
          {
            heading: "Hard rules",
            body: [
              "18+ only — minors are not allowed",
              "No harassment, threats, or illegal content",
              "No sharing of others' intimate images",
              "Report abuse — do not engage",
            ],
          },
          {
            heading: "Protect yourself",
            body: [
              "Do not share phone numbers, socials, addresses, or payment details",
              "Assume the other person can screenshot or record",
              "Use headphones in public spaces",
              "Skip immediately if something feels wrong — that is a feature, not rudeness",
            ],
          },
          {
            heading: "Reporting",
            body: "During a live match you can open report, pick a reason, and submit. After reporting, skip to leave the session. Repeat offenders can be restricted. Reports work best with a clear reason.",
          },
          {
            heading: "Technical note",
            body: "Video is intended to travel peer-to-peer via WebRTC after signaling. That reduces server-side access to your media stream, but it does not make the other person trustworthy. Safety is mostly behavior, not encryption theater.",
          },
          {
            heading: "Need help?",
            body: `If you believe you are in danger, contact local emergency services. For product abuse on ${siteConfig.name}, use in-app report first. Policy details also live in Terms and Privacy.`,
          },
        ]}
      />
    </>
  );
}
