import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SeoArticle } from "@/components/SeoArticle";
import { breadcrumbJsonLd } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${siteConfig.name}: what we collect for matching, signaling, and safety — and what peer video means for your stream.`,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `Privacy Policy — ${siteConfig.name}`,
    description: `How ${siteConfig.name} handles data for random video chat.`,
    url: absoluteUrl("/privacy"),
  },
};

export default function PrivacyPage() {
  const updated = "August 8, 2026";

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Privacy", path: "/privacy" },
        ])}
      />
      <SeoArticle
        eyebrow="Privacy"
        title="Privacy policy"
        lead={`Last updated ${updated}. This explains what ${siteConfig.name} processes to run free random video chat. It is written in plain language on purpose.`}
        showCta={false}
        relatedHref="/privacy"
        sections={[
          {
            heading: "Who we are",
            body: `${siteConfig.name} (${siteConfig.url}) provides browser-based stranger video chat. Contact for privacy questions should go through the channels listed on the site when available.`,
          },
          {
            heading: "What we collect",
            body: [
              "Technical data: IP-derived coarse location (country), browser/user-agent, socket IDs, connection timestamps",
              "Match preferences you choose (gender, country, interests)",
              "Optional account data if you use login providers (email/name from that provider)",
              "Report contents you submit about other users",
              "Basic product analytics needed to keep the service online (queue size, errors)",
            ],
          },
          {
            heading: "What we do not want",
            body: "We do not ask for your government ID to start chatting as a guest. We do not sell your personal information as a product feature. Peer video/audio is designed to flow between browsers via WebRTC after signaling — the matching server is not meant to be a recording studio for your call.",
          },
          {
            heading: "How we use data",
            body: [
              "Pair you with other users and keep the queue fair",
              "Enforce 18+ and abuse policies (including bans after reports)",
              "Improve reliability (ICE/TURN, disconnect handling)",
              "Secure the service against spam and fraud",
            ],
          },
          {
            heading: "Cookies and local storage",
            body: "We may store preference settings locally in your browser (for example match prefs) and session cookies if you authenticate. Clearing site data removes local prefs.",
          },
          {
            heading: "Sharing",
            body: "We use infrastructure providers (hosting, database, optional TURN) that process data to run the app. We may disclose information if required by law or to prevent serious harm. We do not run a marketplace of selling chat transcripts.",
          },
          {
            heading: "Retention",
            body: "Operational logs and reports are kept as long as needed for safety and reliability, then deleted or aggregated. Account fields follow the life of the account if you create one.",
          },
          {
            heading: "Your choices",
            body: "You can stop using the service anytime. You can avoid optional login. You can skip and leave matches. If you have an account and want deletion, request it through supported contact channels.",
          },
          {
            heading: "Children",
            body: `${siteConfig.name} is not for anyone under 18. We do not knowingly collect data from minors.`,
          },
          {
            heading: "Changes",
            body: "We may update this policy. The date at the top will change when we do. Continued use after updates means you accept the revised policy.",
          },
        ]}
      />
    </>
  );
}
