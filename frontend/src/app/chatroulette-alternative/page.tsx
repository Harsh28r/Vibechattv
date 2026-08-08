import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SeoArticle } from "@/components/SeoArticle";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

const faqs = [
  {
    question: "Is Camify like Chatroulette?",
    answer:
      "Yes in spirit: random webcam partners and a next/skip control. Camify is a modern WebRTC version with compulsory camera and mic.",
  },
  {
    question: "Is Chatroulette still the best option?",
    answer: `Many people now look for fresher Chatroulette alternatives. ${siteConfig.name} focuses on fast browser matching without signup for core chat.`,
  },
];

export const metadata: Metadata = {
  title: "Chatroulette Alternative — Free Webcam Chat",
  description: `${siteConfig.name} is a free Chatroulette alternative: random webcam chat with strangers, instant match, and skip — no download.`,
  alternates: { canonical: "/chatroulette-alternative" },
  openGraph: {
    title: `Chatroulette Alternative — ${siteConfig.name}`,
    description: `Random webcam stranger chat on ${siteConfig.name}.`,
    url: absoluteUrl("/chatroulette-alternative"),
  },
};

export default function ChatrouletteAlternativePage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Chatroulette alternative", path: "/chatroulette-alternative" },
        ])}
      />
      <SeoArticle
        eyebrow="Chatroulette alternative"
        title="A modern Chatroulette alternative for 2026"
        lead={`Chatroulette invented the random webcam moment. ${siteConfig.name} keeps that energy: meet a stranger on camera, talk, skip — rebuilt with WebRTC, mobile browsers, and no signup for core chat.`}
        relatedHref="/chatroulette-alternative"
        sections={[
          {
            heading: "What Chatroulette got right",
            body: "Zero friction. The thrill was never a profile — it was the next face. Alternatives that bury that under apps, coins, or endless onboarding lose the plot.",
          },
          {
            heading: "How Camify maps to that idea",
            body: [
              "Random pairing from a live queue",
              "Face + voice required (cam and mic locked on)",
              "One-tap skip to the next free person",
              "Optional filters without trapping you forever if prefs are empty",
              "Text chat for when audio is messy",
            ],
          },
          {
            heading: "Chatroulette vs Camify",
            body: "Classic Chatroulette is the cultural reference. Camify is an actively maintained web product aimed at adults who still want stranger video chat after older platforms aged out or went offline. Expect modern browser permissions, HTTPS, and peer-to-peer media when the network allows.",
          },
          {
            heading: "Start in under a minute",
            body: "Open live chat, confirm 18+, allow camera and microphone, then search. If a preferred match is not free, you can still connect with any available person so you are not stuck staring at a spinner.",
          },
          ...faqs.map((f) => ({ heading: f.question, body: f.answer })),
        ]}
      />
    </>
  );
}
