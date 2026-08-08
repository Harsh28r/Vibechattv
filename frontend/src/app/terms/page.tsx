import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SeoArticle } from "@/components/SeoArticle";
import { breadcrumbJsonLd } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of service for ${siteConfig.name}: 18+ random video chat rules, acceptable use, and liability limits.`,
  alternates: { canonical: "/terms" },
  openGraph: {
    title: `Terms of Service — ${siteConfig.name}`,
    description: `Rules for using ${siteConfig.name}.`,
    url: absoluteUrl("/terms"),
  },
};

export default function TermsPage() {
  const updated = "August 8, 2026";

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Terms", path: "/terms" },
        ])}
      />
      <SeoArticle
        eyebrow="Terms"
        title="Terms of service"
        lead={`Last updated ${updated}. By using ${siteConfig.name}, you agree to these terms. If you do not agree, do not use the service.`}
        showCta={false}
        relatedHref="/terms"
        sections={[
          {
            heading: "The service",
            body: `${siteConfig.name} provides random and invite-based video chat features in the browser. Features may change, break, or be limited without notice — this is a live product, not a guaranteed utility.`,
          },
          {
            heading: "Eligibility",
            body: "You must be at least 18 years old. By entering chat you represent that you meet that age requirement. Accounts or sessions for minors will be removed when discovered.",
          },
          {
            heading: "Acceptable use",
            body: [
              "No illegal content or activity",
              "No harassment, hate, or threats",
              "No spam, bots, or queue abuse",
              "No attempts to hack, scrape, or disrupt the service",
              "No recording or sharing others without lawful basis and consent where required",
            ],
          },
          {
            heading: "Camera and microphone",
            body: "Core matching requires camera and microphone access. You are responsible for what you show and say on stream.",
          },
          {
            heading: "Reports and enforcement",
            body: "We may warn, rate-limit, ban, or otherwise restrict users who violate these terms or create safety risk. We are not obligated to take any particular action on every report, but we may.",
          },
          {
            heading: "Intellectual property",
            body: `The ${siteConfig.name} name, logo, and site design are ours or used with permission. You keep rights to your own content, but grant us a limited license to operate features that display or transmit it as part of the service.`,
          },
          {
            heading: "Disclaimers",
            body: "The service is provided “as is.” We do not guarantee matches, video quality, uptime, or the behavior of other users. Stranger chat involves risk — use Safety guidance.",
          },
          {
            heading: "Limitation of liability",
            body: `To the maximum extent allowed by law, ${siteConfig.name} and its operators are not liable for indirect, incidental, or consequential damages, or for losses arising from other users' conduct, outages, or failed connections.`,
          },
          {
            heading: "Changes",
            body: "We may update these terms. Continued use after changes means you accept them. The date above will be revised when material changes ship.",
          },
        ]}
      />
    </>
  );
}
