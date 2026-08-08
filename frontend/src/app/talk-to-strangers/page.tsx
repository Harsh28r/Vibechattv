import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SeoArticle } from "@/components/SeoArticle";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

const faqs = [
  {
    question: "How do I talk to strangers online safely?",
    answer:
      "Stay 18+, keep personal details private, use skip/report freely, and never move the chat off-platform until you trust someone — which you usually should not.",
  },
  {
    question: `Can I talk to strangers on ${siteConfig.name} without signup?`,
    answer: "Yes. Confirm age, allow camera and mic, then start searching.",
  },
];

export const metadata: Metadata = {
  title: "Talk to Strangers Online — Free Video Chat",
  description: `Talk to strangers online with ${siteConfig.name}. Free random video chat, instant match, and skip anytime. No account required.`,
  alternates: { canonical: "/talk-to-strangers" },
  openGraph: {
    title: `Talk to Strangers — ${siteConfig.name}`,
    description: `Meet new people face-to-face on ${siteConfig.name}.`,
    url: absoluteUrl("/talk-to-strangers"),
  },
};

export default function TalkToStrangersPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Talk to strangers", path: "/talk-to-strangers" },
        ])}
      />
      <SeoArticle
        eyebrow="Talk to strangers"
        title="Talk to strangers online — live, free, face-to-face"
        lead={`${siteConfig.name} connects you with another adult in seconds. No profiles to polish. No endless swiping. Just a live camera call and a skip button.`}
        relatedHref="/talk-to-strangers"
        sections={[
          {
            heading: "Why talk to strangers on video?",
            body: "Text forums and comment sections are slow. Live video forces presence: accents, expressions, humor. Random matching is the fastest way to meet someone outside your bubble without joining a social network.",
          },
          {
            heading: "What to expect on Camify",
            body: [
              "18+ age gate before camera access",
              "Compulsory cam + mic so both sides show up for real",
              "Queue-based matching with optional preferences",
              "Text chat beside the video for quick hellos",
              "Skip when the conversation is done",
            ],
          },
          {
            heading: "Conversation starters that work",
            body: "Ask where they are chatting from (city-level only), what music is playing, or what they are working on today. Keep it light. If energy is off, skip — that is the product, not a failure.",
          },
          {
            heading: "Ground rules",
            body: "Be respectful. No harassment, no illegal content, no minors. Report abuse. Your face is on camera — assume recordings are possible on the other side and act accordingly.",
          },
          ...faqs.map((f) => ({ heading: f.question, body: f.answer })),
        ]}
      />
    </>
  );
}
