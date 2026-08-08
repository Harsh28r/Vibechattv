import Image from "next/image";
import Link from "next/link";
import { OnlineCount } from "@/components/OnlineCount";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import {
  IconBolt,
  IconCamera,
  IconShield,
  IconSkip,
  IconUsers,
} from "@/components/Icons";
import { exploreLinks } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const features = [
  {
    icon: IconBolt,
    title: "Instant match",
    body: "Hit go. Land face-to-face in seconds — no signup theater.",
  },
  {
    icon: IconCamera,
    title: "Cam + mic locked",
    body: "Real faces and real voice. No cam-off, no mute theater.",
  },
  {
    icon: IconSkip,
    title: "Skip hard",
    body: "Vibe dead? Next stranger. One tap. Zero drama.",
  },
  {
    icon: IconShield,
    title: "Peer video",
    body: "WebRTC P2P streams. We signal the match — not the footage.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden hero-atmosphere text-white">
      <div className="pointer-events-none absolute inset-0 hero-noise" aria-hidden />
      <SiteNav />

      <section className="relative z-10 mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
        <div>
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-2)]">
            <span className="pulse-dot size-1.5 rounded-full bg-[var(--accent-2)]" />
            Live stranger signal
          </div>

          <p className="animate-fade-up mt-5 font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
            {siteConfig.name}
          </p>

          <h1 className="animate-fade-up-delay mt-5 max-w-[14ch] font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-white sm:text-4xl">
            {siteConfig.tagline}
          </h1>

          <p className="animate-fade-up-delay-2 mt-4 max-w-[38ch] text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            Random video chat built for people who want face time — not fake profiles.
            Camera + mic on. Match fast. Skip free.
          </p>

          <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap items-center gap-4">
            <Link href="/chat" className="btn-primary text-base">
              <IconCamera size={20} />
              Start live
            </Link>
            <OnlineCount />
          </div>

          <p className="mt-5 flex items-center gap-2 text-xs text-[var(--muted)]">
            <IconUsers size={14} />
            18+ · Cam + mic compulsory · No account needed
          </p>
        </div>

        <div className="animate-float relative mx-auto aspect-square w-full max-w-md lg:max-w-none">
          <div className="absolute inset-[8%] rounded-[2rem] border border-white/10 bg-[var(--steel)]/80" />
          <div className="absolute inset-[14%] overflow-hidden rounded-[1.6rem] bg-black/50">
            <div
              className="absolute inset-0 opacity-80"
              style={{
                background:
                  "radial-gradient(circle at 40% 35%, rgba(46,196,182,0.35), transparent 45%), radial-gradient(circle at 70% 70%, rgba(255,90,43,0.4), transparent 40%), linear-gradient(160deg,#0b1220,#1a2740)",
              }}
            />
            <div className="scan-line" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-shutter relative">
                <div className="spin-ring absolute -inset-6 rounded-full border border-dashed border-white/20" />
                <Image
                  src="/camify-icon.png"
                  alt="Camify live random video chat interface — camera-forward stranger matching"
                  width={180}
                  height={180}
                  className="relative rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
                  priority
                />
              </div>
            </div>
            <p className="absolute bottom-6 left-6 right-6 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight">
              Face forward.
              <br />
              <span className="text-[var(--accent)]">No filters.</span>
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 bg-black/25 px-5 py-16 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            Built different
          </h2>
          <p className="mt-3 max-w-xl text-[var(--muted)]">
            A creative stranger platform — sharp UI, cam + mic locked, zero fluff.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }) => (
              <li key={title} className="border-t border-white/15 pt-5">
                <Icon size={26} className="text-[var(--accent)]" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl">
            Explore Camify
          </h2>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            Guides for Omegle-style chat, regional search, and safer stranger video calls.
          </p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {exploreLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex rounded-md border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/[0.06] hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
