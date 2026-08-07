import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { IconCamera } from "@/components/Icons";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Random Video Chat Free",
  description: `Start free random video chat on ${siteConfig.name}. Talk to strangers online with instant matching and one-tap skip.`,
  alternates: { canonical: "/random-video-chat" },
  openGraph: {
    title: `Random Video Chat — ${siteConfig.name}`,
    description: siteConfig.description,
    url: absoluteUrl("/random-video-chat"),
  },
};

export default function RandomVideoChatPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden hero-atmosphere text-white">
      <div className="pointer-events-none absolute inset-0 hero-noise" aria-hidden />
      <SiteNav />
      <article className="relative z-10 mx-auto max-w-3xl px-5 pb-20 pt-28 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Random video chat
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight sm:text-5xl">
          Free random video chat in your browser
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-[var(--muted)]">
          Hit start, allow camera and mic, and {siteConfig.name} pairs you with another person
          in the queue. Text rides alongside video. Skip whenever the conversation ends.
        </p>
        <Link href="/chat" className="btn-primary mt-8">
          <IconCamera size={18} />
          Open random chat
        </Link>

        <section className="mt-14 border-t border-white/10 pt-8">
          <h2 className="text-xl font-semibold">How it works</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-[var(--muted)]">
            <li>Open the chat room and confirm you&apos;re 18+.</li>
            <li>Allow camera + mic — both compulsory. No mute / cam-off.</li>
            <li>We match you over a secure signaling channel; media stays peer-to-peer.</li>
            <li>Skip to find someone new anytime.</li>
          </ol>
        </section>
      </article>
    </main>
  );
}
