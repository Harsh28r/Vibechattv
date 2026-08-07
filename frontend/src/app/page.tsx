import Link from "next/link";
import { OnlineCount } from "@/components/OnlineCount";
import { SiteNav } from "@/components/SiteNav";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden hero-atmosphere">
      <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden />
      <SiteNav />

      <section className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col justify-center px-5 pb-16 pt-28 sm:px-8 lg:flex-row lg:items-center lg:gap-10 lg:pt-20">
        <div className="max-w-xl lg:max-w-lg">
          <p className="animate-fade-up font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight text-[var(--ink)] sm:text-6xl md:text-7xl">
            {siteConfig.name}
          </p>
          <h1 className="animate-fade-up-delay mt-4 max-w-[18ch] text-2xl font-semibold leading-snug text-[var(--ink)] sm:text-3xl">
            {siteConfig.tagline}
          </h1>
          <p className="animate-fade-up-delay-2 mt-4 max-w-[36ch] text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            Free random video chat. Match in seconds, skip anytime — no signup required.
          </p>

          <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-7 py-3.5 text-base font-semibold text-white shadow-[0_12px_30px_-12px_rgba(255,90,43,0.8)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Start chatting
            </Link>
            <OnlineCount />
          </div>
        </div>

        <div className="animate-float relative mt-14 aspect-[4/5] w-full max-w-md self-center overflow-hidden rounded-[2rem] lg:mt-0 lg:max-w-lg">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(145deg, #0c1522 0%, #163447 45%, #1fa7a0 100%)",
            }}
          />
          <div className="absolute inset-0 opacity-40 mix-blend-screen"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 70% 70%, rgba(255,90,43,0.45), transparent 45%)",
            }}
          />
          <div className="absolute inset-6 grid grid-rows-2 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm" />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm" />
              <div className="rounded-2xl border border-white/10 bg-[var(--accent)]/80" />
            </div>
          </div>
          <p className="absolute bottom-8 left-8 right-8 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
            Face to face.<br />World wide.
          </p>
        </div>
      </section>

      <section className="relative z-10 border-t border-[var(--line)] bg-white/40 px-5 py-16 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Why people open {siteConfig.name}
          </h2>
          <p className="mt-3 max-w-xl text-[var(--muted)]">
            Instant matching over WebRTC. Text while you talk. Skip when the vibe dies.
          </p>
          <ul className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              ["Instant match", "Join the queue and connect as soon as someone else is free."],
              ["Private by default", "Peer-to-peer video. We signal — we don’t sit in the middle of your stream."],
              ["Skip freely", "Next stranger is one tap away. No awkward exit required."],
            ].map(([title, body]) => (
              <li key={title}>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] px-5 py-8 text-sm text-[var(--muted)] sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} {siteConfig.name}. 18+ only.</span>
          <div className="flex gap-4">
            <Link href="/random-video-chat">Random video chat</Link>
            <Link href="/omegle-alternative">Omegle alternative</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
