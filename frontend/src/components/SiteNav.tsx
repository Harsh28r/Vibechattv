import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function SiteNav({ dark = false }: { dark?: boolean }) {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/"
          className={`font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight ${
            dark ? "text-white" : "text-[var(--ink)]"
          }`}
        >
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link
            href="/omegle-alternative"
            className={dark ? "text-white/70 hover:text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"}
          >
            Alternative
          </Link>
          <Link
            href="/chat"
            className={`rounded-md px-4 py-2 transition ${
              dark
                ? "bg-white text-[var(--ink)] hover:bg-white/90"
                : "bg-[var(--ink)] text-white hover:bg-[var(--ink)]/90"
            }`}
          >
            Start chat
          </Link>
        </nav>
      </div>
    </header>
  );
}
