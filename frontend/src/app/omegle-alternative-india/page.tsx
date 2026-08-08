import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SeoArticle } from "@/components/SeoArticle";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

const faqs = [
  {
    question: "Is there an Omegle alternative popular in India?",
    answer: `${siteConfig.name} works in Indian browsers with free random video chat, optional India country preference, and no signup.`,
  },
  {
    question: "Can I prefer chatting with people in India?",
    answer:
      "Yes. Set your country and looking-for country preferences before you start. If no preferred partner is free, you can still match with any available person.",
  },
];

export const metadata: Metadata = {
  title: "Omegle Alternative India — Free Stranger Chat",
  description: `Best Omegle alternative for India: free random video chat on ${siteConfig.name}. Talk to strangers online, optional India filter, no signup.`,
  alternates: { canonical: "/omegle-alternative-india" },
  openGraph: {
    title: `Omegle Alternative India — ${siteConfig.name}`,
    description: `Random video chat for users in India and worldwide on ${siteConfig.name}.`,
    url: absoluteUrl("/omegle-alternative-india"),
  },
};

export default function OmegleAlternativeIndiaPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Omegle alternative India", path: "/omegle-alternative-india" },
        ])}
      />
      <SeoArticle
        eyebrow="Omegle alternative India"
        title="Omegle alternative for India — free stranger video chat"
        lead={`Looking for Omegle-style chat from India? ${siteConfig.name} runs in your browser: cam + mic on, instant match, skip anytime. Prefer India in filters or go worldwide.`}
        relatedHref="/omegle-alternative-india"
        sections={[
          {
            heading: "Why India searches for Omegle alternatives",
            body: "After Omegle closed, Indian users kept searching for free stranger video chat that works without a heavy app. Mobile Chrome usage is huge, so a WebRTC web app fits better than desktop-only clients.",
          },
          {
            heading: "Using Camify from India",
            body: [
              "Open camify.fun on mobile or desktop Chrome",
              "Confirm 18+ and allow camera + microphone",
              "Optionally set country to India / looking for India",
              "Start live and skip until you find a good conversation",
            ],
          },
          {
            heading: "Language and culture tips",
            body: "English and Hindi both show up often in stranger chat. Lead with a simple hello, ask if audio is clear, and skip politely if interests do not match. Keep it respectful — that is how the pool stays usable for everyone.",
          },
          {
            heading: "Network reality check",
            body: "College Wi-Fi and some mobile carriers use strict NAT. If video stays black after a match, skip and try again. Server-side TURN (when enabled) improves success rates across Indian ISPs.",
          },
          ...faqs.map((f) => ({ heading: f.question, body: f.answer })),
        ]}
      />
    </>
  );
}
