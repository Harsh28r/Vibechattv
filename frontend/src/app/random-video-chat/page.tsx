import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SeoArticle } from "@/components/SeoArticle";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

const faqs = [
  {
    question: "What is random video chat?",
    answer:
      "Random video chat pairs you with another online stranger for a live camera conversation. You can skip to the next person anytime.",
  },
  {
    question: `Is ${siteConfig.name} random video chat free?`,
    answer: "Yes. Open the chat room in your browser and start matching without paying or signing up.",
  },
  {
    question: "Do I need to download an app?",
    answer: "No. Random video chat runs in a modern browser with camera and microphone permission.",
  },
];

export const metadata: Metadata = {
  title: "Free Random Video Chat — Talk Instantly",
  description: `Start free random video chat on ${siteConfig.name}. Talk to strangers online with instant matching, text chat, and one-tap skip. No download.`,
  alternates: { canonical: "/random-video-chat" },
  openGraph: {
    title: `Random Video Chat — ${siteConfig.name}`,
    description: siteConfig.description,
    url: absoluteUrl("/random-video-chat"),
  },
};

export default function RandomVideoChatPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Random video chat", path: "/random-video-chat" },
        ])}
      />
      <SeoArticle
        eyebrow="Random video chat"
        title="Free random video chat in your browser"
        lead={`Hit start, allow camera and mic, and ${siteConfig.name} pairs you with another person in the queue. Text rides alongside video. Skip whenever the conversation ends.`}
        cta="Open random chat"
        relatedHref="/random-video-chat"
        sections={[
          {
            heading: "What you get",
            body: [
              "Instant stranger matching over a live queue",
              "Peer-to-peer WebRTC video when the network allows",
              "Compulsory camera + mic for real conversations",
              "One-tap skip to the next free person",
              "Optional gender / country preferences",
            ],
          },
          {
            heading: "How random video chat works on Camify",
            body: "Open the live chat room, confirm you are 18+, and enable camera plus microphone. You join a matching queue. When another free user is available, both sides receive a match event and exchange WebRTC offers, answers, and ICE candidates. After the peer connection is up, you see and hear each other until someone skips or disconnects.",
          },
          {
            heading: "Tips for better matches",
            body: "Use good lighting, look at the camera, and say hello in text if audio is noisy. Set preferences if you care about gender or country — if nobody preferred is free, Camify can still connect you with any available person so wait time stays short.",
          },
          {
            heading: "Who it is for",
            body: "Adults who want quick, account-free stranger conversations — language practice, curiosity, or just killing time face-to-face. It is not a dating profile network and not a place for minors.",
          },
          ...faqs.map((f) => ({ heading: f.question, body: f.answer })),
        ]}
      />
    </>
  );
}
