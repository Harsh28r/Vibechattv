import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SeoArticle } from "@/components/SeoArticle";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

const faqs = [
  {
    question: `Is ${siteConfig.name} a good Omegle alternative?`,
    answer:
      "Yes. It offers free random stranger video chat with instant matching, text chat, and one-tap skip — no download required.",
  },
  {
    question: "Do I need an account?",
    answer: "No. Open chat, confirm you are 18+, allow camera and mic, then start searching.",
  },
  {
    question: "Is camera and mic required?",
    answer:
      "Yes. Both are compulsory so conversations stay face-to-face with real voice — no cam-off or mute theater.",
  },
  {
    question: "Is it free?",
    answer: "Yes. Core random video chat is free in the browser.",
  },
  {
    question: "How does video privacy work?",
    answer:
      "Matching uses a signaling server. Once connected, video and audio travel peer-to-peer over WebRTC when the network allows.",
  },
  {
    question: "Is it safe for adults only?",
    answer:
      `${siteConfig.name} is 18+ only. You can skip anytime and report abusive partners. Never share personal contact info with strangers.`,
  },
];

export const metadata: Metadata = {
  title: "Omegle Alternative 2026: Free Stranger Video Chat",
  description: `${siteConfig.name} is a free Omegle alternative for random video chat with strangers. Instant match, text chat, skip anytime — no signup or download.`,
  alternates: { canonical: "/omegle-alternative" },
  openGraph: {
    title: `Best Omegle Alternative — ${siteConfig.name}`,
    description: `Chat with strangers on ${siteConfig.name}, a modern Omegle alternative.`,
    url: absoluteUrl("/omegle-alternative"),
  },
};

export default function OmegleAlternativePage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Omegle alternative", path: "/omegle-alternative" },
        ])}
      />
      <SeoArticle
        eyebrow="Omegle alternative"
        title="Looking for an Omegle alternative in 2026?"
        lead={`${siteConfig.name} is free random video chat built for people who still want stranger conversations after Omegle shut down: match fast, talk face-to-face, skip when the vibe is dead. Camera on. No app install.`}
        relatedHref="/omegle-alternative"
        sections={[
          {
            heading: "Why people search for Omegle alternatives",
            body: "Omegle made random chat mainstream, then disappeared. Searchers still want the same loop: open a tab, meet someone new, skip without drama. Most clones either force downloads, hide behind paywalls for basic matching, or flood you with bots. A solid alternative keeps the browser experience, keeps matching free, and keeps video peer-to-peer.",
          },
          {
            heading: `How ${siteConfig.name} compares`,
            body: [
              "Browser-first — no install, works on desktop and mobile browsers that support WebRTC.",
              "Free core chat — start searching without creating an account.",
              "Cam + mic compulsory — real faces and real voice, not black screens.",
              "Instant match + skip — queue-based stranger pairing with one-tap next.",
              "Text beside video — say hi without killing the call.",
            ],
          },
          {
            heading: "How it works",
            body: "Confirm you are 18+, allow camera and microphone, then join the match queue. When two free people are available, the server pairs them and exchanges WebRTC signals. After that, media flows between peers. Prefer a gender or country filter if you want — if nobody matching those prefs is free, you can still connect with any available person so you are not stuck waiting forever.",
          },
          {
            heading: "Safety basics for stranger chat",
            body: `${siteConfig.name} is adults-only. Treat every partner as a stranger: do not share phone numbers, socials, or location. Use skip and report when someone breaks rules. If a connection fails (common on strict networks without TURN), skip and rematch rather than sitting on a black screen.`,
          },
          {
            heading: "Omegle vs Camify at a glance",
            body: [
              "Omegle: classic brand, discontinued.",
              `${siteConfig.name}: live Omegle-style stranger video chat in 2026.`,
              "Both concepts: random + skip. Camify adds modern WebRTC, compulsory A/V, and preference-aware matching.",
            ],
          },
          ...faqs.map((f) => ({ heading: f.question, body: f.answer })),
        ]}
      />
    </>
  );
}
