import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { IconCamera } from "@/components/Icons";
import { seoLinks } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

type Section = {
  heading: string;
  body: string | string[];
};

export function SeoArticle({
  eyebrow,
  title,
  lead,
  cta = `Try ${siteConfig.name} free`,
  sections,
  relatedHref,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  cta?: string;
  sections: Section[];
  relatedHref?: string;
}) {
  const related = seoLinks.filter((l) => l.href !== relatedHref).slice(0, 4);

  return (
    <main className="relative min-h-dvh overflow-hidden hero-atmosphere text-white">
      <div className="pointer-events-none absolute inset-0 hero-noise" aria-hidden />
      <SiteNav />
      <article className="relative z-10 mx-auto max-w-3xl px-5 pb-16 pt-28 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-[var(--muted)]">{lead}</p>
        <Link href="/chat" className="btn-primary mt-8">
          <IconCamera size={18} />
          {cta}
        </Link>

        <div className="mt-14 space-y-10">
          {sections.map((section) => (
            <section key={section.heading} className="border-t border-white/10 pt-8">
              <h2 className="text-xl font-semibold sm:text-2xl">{section.heading}</h2>
              {Array.isArray(section.body) ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-[var(--muted)]">
                  {section.body.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 leading-relaxed text-[var(--muted)]">{section.body}</p>
              )}
            </section>
          ))}
        </div>

        <section className="mt-14 border-t border-white/10 pt-8">
          <h2 className="text-xl font-semibold">Explore more</h2>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[var(--muted)]">
            {related.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
