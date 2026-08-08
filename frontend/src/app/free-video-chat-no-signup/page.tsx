import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SeoArticle } from "@/components/SeoArticle";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

const faqs = [
  {
    question: "Is Camify free video chat with no signup?",
    answer: "Yes. No email, no password, no OAuth required for core random chat.",
  },
  {
    question: "What do I need instead of an account?",
    answer: "A modern browser, camera, microphone, and confirmation that you are 18+.",
  },
];

export const metadata: Metadata = {
  title: "Free Video Chat No Signup — Start Instantly",
  description: `Free video chat with no signup on ${siteConfig.name}. Jump into random stranger chat in your browser — no account, no download, skip anytime.`,
  alternates: { canonical: "/free-video-chat-no-signup" },
  openGraph: {
    title: `Free Video Chat No Signup — ${siteConfig.name}`,
    description: `Start free stranger video chat without creating an account.`,
    url: absoluteUrl("/free-video-chat-no-signup"),
  },
};

export default function FreeVideoChatNoSignupPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Free video chat no signup", path: "/free-video-chat-no-signup" },
        ])}
      />
      <SeoArticle
        eyebrow="No signup"
        title="Free video chat with no signup"
        lead={`Tired of apps that demand an email before you can say hello? ${siteConfig.name} lets adults start free random video chat without creating an account.`}
        cta="Start without signup"
        relatedHref="/free-video-chat-no-signup"
        sections={[
          {
            heading: "Why no-signup matters",
            body: "Account walls kill impulse chat. If you just want a five-minute stranger conversation, forcing registration feels like busywork. Camify keeps the loop short: age confirm → permissions → match.",
          },
          {
            heading: "What you still agree to",
            body: "No signup does not mean no rules. You must be 18+, use your own camera and mic, and follow basic conduct. Abuse can still be reported. Guests who violate policy can be blocked.",
          },
          {
            heading: "Steps",
            body: [
              "Go to the live chat page",
              "Confirm you are 18+",
              "Allow camera and microphone",
              "Optionally set match preferences",
              "Search — skip whenever you want",
            ],
          },
          {
            heading: "Privacy angle",
            body: "Because there is no profile, there is less permanent identity sitting on the site. Still treat every call as public-facing: strangers can screenshot, and networks can fail open. Share nothing you would not say to a random person on the street.",
          },
          ...faqs.map((f) => ({ heading: f.question, body: f.answer })),
        ]}
      />
    </>
  );
}
