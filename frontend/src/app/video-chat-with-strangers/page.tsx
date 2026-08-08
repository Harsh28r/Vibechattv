import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SeoArticle } from "@/components/SeoArticle";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

const faqs = [
  {
    question: "Is video chat with strangers free on Camify?",
    answer: "Yes. Core stranger video chat is free in the browser.",
  },
  {
    question: "Does video chat with strangers need a webcam?",
    answer: "Yes. Camera and microphone are both required to enter the match queue.",
  },
];

export const metadata: Metadata = {
  title: "Video Chat with Strangers Free Online",
  description: `Video chat with strangers free on ${siteConfig.name}. Instant WebRTC matching, text chat, and skip — a modern way to meet new people online.`,
  alternates: { canonical: "/video-chat-with-strangers" },
  openGraph: {
    title: `Video Chat with Strangers — ${siteConfig.name}`,
    description: siteConfig.description,
    url: absoluteUrl("/video-chat-with-strangers"),
  },
};

export default function VideoChatWithStrangersPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Video chat with strangers", path: "/video-chat-with-strangers" },
        ])}
      />
      <SeoArticle
        eyebrow="Video chat with strangers"
        title="Free video chat with strangers — no app needed"
        lead={`Open ${siteConfig.name}, allow your camera, and get paired with another person looking for a live conversation. Built for adults who want speed over profiles.`}
        relatedHref="/video-chat-with-strangers"
        sections={[
          {
            heading: "Browser video chat, not another social app",
            body: "You do not need to install anything or build a profile. Video chat with strangers on Camify is a single-purpose loop: match, talk, skip. That keeps the product fast and the barrier low.",
          },
          {
            heading: "Under the hood",
            body: "A Socket.IO signaling layer finds a partner and exchanges WebRTC offers. Media is intended to stay peer-to-peer. On hard NATs, a TURN relay (when configured on the server) improves connection success so you see video instead of a black pane.",
          },
          {
            heading: "Filters without endless waiting",
            body: "Set who you are and who you want to meet. Preferred matches come first. If nobody matching those prefs is free, you can still connect with any available person so the queue keeps moving.",
          },
          {
            heading: "Mobile and desktop",
            body: "Use a current Chrome, Edge, Safari, or Firefox build with camera permission. Mobile browsers work; headphones help with echo. Keep the tab visible while connecting — background tabs can pause media.",
          },
          ...faqs.map((f) => ({ heading: f.question, body: f.answer })),
        ]}
      />
    </>
  );
}
