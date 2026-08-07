import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function SiteNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/camify-icon.png"
            alt=""
            width={36}
            height={36}
            className="rounded-lg"
            priority
          />
          <span className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-white">
            {siteConfig.name}
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-semibold sm:gap-5">
          <Link
            href="/omegle-alternative"
            className="hidden text-[var(--muted)] hover:text-white sm:inline"
          >
            Alternative
          </Link>
          <Link href="/chat" className="btn-primary !px-4 !py-2.5 text-sm">
            Go live
          </Link>
        </nav>
      </div>
    </header>
  );
}
