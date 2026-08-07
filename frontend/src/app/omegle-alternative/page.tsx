import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { IconCamera } from "@/components/Icons";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Best Omegle Alternative 2026",
  description: `${siteConfig.name} is a free Omegle alternative for random video chat with strangers. Instant match, text chat, and skip — no download.`,
  alternates: { canonical: "/omegle-alternative" },
  openGraph: {
    title: `Best Omegle Alternative — ${siteConfig.name}`,
    description: `Chat with strangers on ${siteConfig.name}, a modern Omegle alternative.`,
    url: absoluteUrl("/omegle-alternative"),
  },
};

const content = [
  [
    `Is ${siteConfig.name} like Omegle?`,
    "Yes — random stranger video chat with skip. Built on WebRTC + Socket.IO matching.",
  ],
  [
    "Is camera required?",
    "Yes. Camera is compulsory so the platform stays face-to-face and honest.",
  ],
  ["Do I need an account?", "No. Open chat, allow camera, start searching."],
  ["Is it free?", "Yes. Core random chat is free."],
];

export default function OmegleAlternativePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden hero-atmosphere text-white">
      <div className="pointer-events-none absolute inset-0 hero-noise" aria-hidden />
      <SiteNav />
      <article className="relative z-10 mx-auto max-w-3xl px-5 pb-20 pt-28 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-2)]">
          Omegle alternative
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight sm:text-5xl">
          Looking for an Omegle alternative?
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-[var(--muted)]">
          {siteConfig.name} is free random video chat: match with a stranger, talk face-to-face,
          skip when you want. Camera on. No app install.
        </p>
        <Link href="/chat" className="btn-primary mt-8">
          <IconCamera size={18} />
          Try {siteConfig.name} free
        </Link>

        <div className="mt-14 space-y-8">
          {content.map(([q, a]) => (
            <section key={q} className="border-t border-white/10 pt-6">
              <h2 className="text-xl font-semibold">{q}</h2>
              <p className="mt-2 leading-relaxed text-[var(--muted)]">{a}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
