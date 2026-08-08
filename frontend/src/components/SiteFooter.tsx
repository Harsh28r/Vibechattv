import Image from "next/image";
import Link from "next/link";
import { seoLinks } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 px-5 py-10 text-sm text-[var(--muted)] sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-[1.2fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <Image
              src="/camify-icon.png"
              alt={`${siteConfig.name} random video chat logo`}
              width={22}
              height={22}
              className="rounded"
            />
            <span className="font-semibold">{siteConfig.name}</span>
          </Link>
          <p className="mt-3 max-w-md leading-relaxed">
            Free random video chat with strangers. 18+ only. Camera + mic on. Peer-to-peer WebRTC.
          </p>
          <p className="mt-3 text-xs">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
        <nav aria-label="SEO pages" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {seoLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
          <Link href="/chat" className="hover:text-white">
            Start live chat
          </Link>
        </nav>
      </div>
    </footer>
  );
}
