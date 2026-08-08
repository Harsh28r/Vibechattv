import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SeoArticle } from "@/components/SeoArticle";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

const faqs = [
  {
    question: `Is ${siteConfig.name} a free OmeTV alternative?`,
    answer:
      "Yes. You can start random stranger video chat in the browser without paying for core matching.",
  },
  {
    question: "Do I need the OmeTV app?",
    answer: `No. ${siteConfig.name} is web-first — open the site, allow camera and mic, and match.`,
  },
];

export const metadata: Metadata = {
  title: "OmeTV Alternative — Free Browser Video Chat",
  description: `${siteConfig.name} is a free OmeTV alternative for random video chat with strangers. No app install, instant match, skip anytime.`,
  alternates: { canonical: "/ome-tv-alternative" },
  openGraph: {
    title: `OmeTV Alternative — ${siteConfig.name}`,
    description: `Try ${siteConfig.name} if you want OmeTV-style stranger chat in the browser.`,
    url: absoluteUrl("/ome-tv-alternative"),
  },
};

export default function OmeTvAlternativePage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "OmeTV alternative", path: "/ome-tv-alternative" },
        ])}
      />
      <SeoArticle
        eyebrow="OmeTV alternative"
        title="Looking for an OmeTV alternative?"
        lead={`${siteConfig.name} gives you the same stranger-video loop people want from OmeTV: cam on, match fast, skip when you are done — but it runs in your browser with no account wall for core chat.`}
        relatedHref="/ome-tv-alternative"
        sections={[
          {
            heading: "OmeTV vs Camify",
            body: [
              "OmeTV: popular mobile-friendly stranger chat brand with app distribution.",
              `${siteConfig.name}: browser WebRTC chat, compulsory cam + mic, free matching, optional prefs.`,
              "Both: random adults, skip culture, face-to-face conversations.",
            ],
          },
          {
            heading: "Why switch to a browser alternative",
            body: "App stores, installs, and account friction slow people down. If you just want a quick stranger call, a web tab is faster. Camify is built around that: age gate → permissions → queue → talk.",
          },
          {
            heading: "What you get on Camify",
            body: [
              "Free random video chat in Chrome / Edge / Safari / Firefox",
              "Text chat beside video",
              "Gender and country preferences when you want them",
              "Invite rooms if you want a friend instead of a stranger",
              "Report + skip tools for bad sessions",
            ],
          },
          {
            heading: "Who this is for",
            body: "Adults who liked OmeTV-style random chat but want a lightweight web option — especially on desktop, or when they do not want another app on their phone.",
          },
          ...faqs.map((f) => ({ heading: f.question, body: f.answer })),
        ]}
      />
    </>
  );
}
