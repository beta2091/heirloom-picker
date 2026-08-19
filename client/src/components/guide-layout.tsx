import type { ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingPhoto } from "@/components/marketing-photo";
import { SiteFooter } from "@/components/site-footer";
import { SeoHead } from "@/components/seo-head";
import { LegalNote } from "@/components/legal-note";
import type { GuideFaq } from "@shared/guides";
import type { SeoPage } from "@shared/seo";
import { ArrowRight } from "lucide-react";

export type GuideRelated = {
  href: string;
  label: string;
  blurb: string;
};

type GuidePhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
};

export function GuidePage({
  page,
  kicker,
  headline,
  lede,
  photo,
  faqs,
  related,
  children,
}: {
  page: SeoPage;
  kicker: string;
  headline: string;
  lede: string;
  photo: GuidePhoto;
  faqs: readonly GuideFaq[];
  related: GuideRelated[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SeoHead page={page} />
      <MarketingHeader />

      <main>
        <article>
          <header className="relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent"
            />
            <div className="relative mx-auto max-w-3xl px-5 pb-10 pt-14 sm:px-8 sm:pb-12 sm:pt-20">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                {kicker}
              </p>
              <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl">
                {headline}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{lede}</p>
            </div>
          </header>

          <figure className="mx-auto max-w-3xl px-5 sm:px-8">
            <div className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-md">
              <MarketingPhoto
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                eager
                imgClassName="aspect-[16/10] w-full object-cover"
              />
            </div>
            <figcaption className="mt-3 font-serif text-sm italic leading-relaxed text-muted-foreground sm:text-base">
              {photo.caption}
            </figcaption>
          </figure>

          <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16 [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:first:mt-0 [&_h3]:mt-8 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:mt-2 [&_p]:mt-4 [&_p]:text-lg [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5">
            {children}
          </div>
        </article>

        <section className="border-t border-border bg-card/40" aria-labelledby="guide-faq-heading">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
            <h2 id="guide-faq-heading" className="font-serif text-3xl font-bold tracking-tight">
              Questions families actually ask
            </h2>
            <dl className="mt-10 space-y-8">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <dt className="font-serif text-xl font-semibold">{faq.question}</dt>
                  <dd className="mt-2 text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-border" aria-labelledby="guide-related-heading">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
            <h2 id="guide-related-heading" className="font-serif text-3xl font-bold tracking-tight">
              Related guides
            </h2>
            <ul className="mt-8 space-y-5">
              {related.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="font-serif text-lg font-semibold text-foreground underline underline-offset-4">
                    {item.label}
                  </Link>
                  <p className="mt-1 text-base leading-relaxed text-muted-foreground">{item.blurb}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-20">
            <h2 className="font-serif text-3xl font-bold tracking-tight">
              When you want a hosted version of that draft
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Evenkeep is a private snake draft: photograph the items, let people rank in private, then take turns — one item each time — in a fair order. Free to set up and invite.{" "}
              <span className="font-medium text-foreground">$99 once</span> to run the live draft and export.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link href="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-12 w-full px-8 text-base sm:w-auto"
                  data-testid="button-guide-sample"
                >
                  See a sample
                </Button>
              </Link>
              <Link href="/account">
                <Button size="lg" className="min-h-12 w-full gap-2 px-8 text-base shadow-md sm:w-auto">
                  Create your estate
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <LegalNote className="mx-auto mt-8 max-w-lg text-sm leading-relaxed text-muted-foreground" />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
