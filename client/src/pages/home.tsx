import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingPhoto } from "@/components/marketing-photo";
import { SiteFooter } from "@/components/site-footer";
import { SeoHead } from "@/components/seo-head";
import { LegalNote } from "@/components/legal-note";
import { SEO } from "@shared/seo";
import {
  Camera,
  Star,
  Scale,
  HandHeart,
  ArrowRight,
  ShieldCheck,
  CircleDollarSign,
  Heart,
  Gift,
} from "lucide-react";

const audiences = [
  "After a parent dies",
  "When downsizing or moving a parent",
  "Parents planning ahead, so the kids don't have to guess",
];

const steps = [
  {
    icon: Camera,
    title: "Photograph what's there",
    body:
      "One person adds each item: a photo, plus a note or voice memory if it has a story.",
  },
  {
    icon: Star,
    title: "Everyone ranks in private",
    body:
      "Each sibling gets their own link and marks what they love. No one sees anyone else's list.",
  },
  {
    icon: HandHeart,
    title: "Take turns choosing",
    body:
      "Evenkeep draws a fair order, and you pick one item at a time until everything has a home, with a list of who kept what.",
  },
];

const assurances = [
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Each person ranks what they love. A recipe box. A watch. Those wishes stay theirs until the draft.",
  },
  {
    icon: Scale,
    title: "Nobody has to be the judge",
    body: "An impartial turn order. One item at a time. The outcome does not depend on who spoke loudest or lives closest.",
  },
  {
    icon: CircleDollarSign,
    title: "Money is the wrong scoreboard",
    body: "What it is worth in dollars is not what it is worth to the person. The draft does not score by price.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SeoHead page={SEO.home} />
      <MarketingHeader />

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent"
          />
          <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-10 sm:px-8 sm:pb-20 sm:pt-20 lg:pb-28 lg:pt-24">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-xs">
                  <Heart className="h-4 w-4 text-primary" />
                  For families settling an estate
                </span>
                <h1 className="mt-5 font-serif text-[1.9rem] font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-[3.15rem] xl:text-6xl">
                  A fair, simple way to divide a parent&apos;s belongings.
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
                  Everyone privately ranks what matters to them, then you take turns choosing in a random order. For families settling an estate, or parents planning ahead.
                </p>
                <div className="mt-6 grid grid-cols-1 items-center gap-3 sm:grid-cols-[auto_auto] sm:justify-start">
                  <Link href="/account" className="sm:col-start-1">
                    <Button
                      size="lg"
                      className="min-h-12 w-full gap-2 px-6 text-base shadow-md sm:w-auto"
                      data-testid="button-get-started"
                    >
                      Start your family&apos;s list (free to set up)
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <p
                    className="text-sm leading-relaxed text-muted-foreground sm:col-span-2 sm:row-start-2"
                    data-testid="text-price-note"
                  >
                    No download. Everyone joins from a private link.{" "}
                    <span className="font-medium text-foreground">$99 one-time</span> when you&apos;re ready to choose.
                  </p>
                  <Link href="/demo" className="sm:col-start-2 sm:row-start-1">
                    <Button
                      size="lg"
                      variant="outline"
                      className="min-h-12 w-full px-8 text-base sm:w-auto"
                      data-testid="button-see-sample-hero"
                    >
                      See a sample
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div
                  aria-hidden="true"
                  className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-2xl"
                />
                <figure className="relative overflow-hidden rounded-2xl border border-card-border bg-card shadow-xl">
                  <MarketingPhoto
                    src="/marketing/hero-keepsakes"
                    alt="Letters tied with a ribbon, a pocket watch, a gold ring, and an open jewelry box resting on a wooden table in warm light."
                    width={933}
                    height={1400}
                    eager
                    testId="img-hero-keepsakes"
                    imgClassName="aspect-[16/11] w-full object-cover object-[center_42%] sm:aspect-[4/5] sm:max-h-[28rem] lg:max-h-none"
                  />
                  <figcaption className="border-t border-card-border px-6 py-4 text-center">
                    <p className="font-serif text-base italic leading-relaxed text-muted-foreground sm:text-lg">
                      Four siblings. One jewelry box. A fair turn for each piece.
                    </p>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card/40" aria-labelledby="who-its-for">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="who-its-for"
                className="font-serif text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Who it&apos;s for
              </h2>
            </div>
            <ul className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-3">
              {audiences.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-card-border bg-card px-6 py-6 text-center font-serif text-lg font-semibold leading-snug shadow-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                How it works
              </p>
              <h2
                className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl"
                data-testid="text-how-it-works"
              >
                Three unhurried steps
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Photograph what&apos;s there, rank in private, then choose one item at a time.{" "}
                <Link
                  href="/how-it-works"
                  className="whitespace-nowrap text-foreground underline underline-offset-4"
                >
                  Read the full walkthrough
                </Link>
                .
              </p>
            </div>

            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.title}
                    className="group relative flex h-full flex-col rounded-2xl border border-card-border bg-card p-6 shadow-sm hover-elevate"
                    data-testid={`step-${i + 1}`}
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="font-serif text-3xl font-bold text-muted-foreground/35">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-semibold leading-snug">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section aria-label="Belongings on the table">
          <figure className="relative">
            <MarketingPhoto
              src="/marketing/table-catalog"
              alt="A teapot, folded quilt, eyeglasses, handwritten card, and a small leather book arranged on a wooden table."
              width={1536}
              height={1024}
              testId="img-table-catalog"
              imgClassName="h-56 w-full object-cover object-center sm:h-72 lg:h-[26rem]"
            />
            <figcaption className="border-y border-border bg-card/70 px-5 py-4 text-center sm:px-8">
              <p className="mx-auto max-w-2xl font-serif text-base italic leading-relaxed text-muted-foreground sm:text-lg">
                The table before anyone chooses — each piece photographed, then
                given a fair turn.
              </p>
            </figcaption>
          </figure>
        </section>

        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                The belongings
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                Quiet objects, carefully recorded.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                A photograph, and a note when a piece has a story. That is enough
                to begin.
              </p>
            </div>
            <ul className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">
              <li>
                <figure className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
                  <MarketingPhoto
                    src="/marketing/locket"
                    alt="A gold floral locket and a dried flower beside a cup of tea on folded linen."
                    width={1400}
                    height={933}
                    testId="img-gallery-locket"
                    imgClassName="aspect-[4/3] w-full object-cover"
                  />
                  <figcaption className="px-5 py-4 font-serif text-sm italic leading-relaxed text-muted-foreground sm:text-base">
                    Some pieces are small. They still need a careful home.
                  </figcaption>
                </figure>
              </li>
              <li>
                <figure className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
                  <MarketingPhoto
                    src="/marketing/photographing"
                    alt="A phone lying next to a wooden chair, used to photograph the chair for a family catalog."
                    width={1400}
                    height={933}
                    testId="img-gallery-photographing"
                    imgClassName="aspect-[4/3] w-full object-cover"
                  />
                  <figcaption className="px-5 py-4 font-serif text-sm italic leading-relaxed text-muted-foreground sm:text-base">
                    Someone gathers the items — a photo, then a note if there's a memory to keep.
                  </figcaption>
                </figure>
              </li>
            </ul>
          </div>
        </section>

        <section className="border-t border-border bg-card/40" data-testid="section-guides">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                Guides for a hard week
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                Practical pages, written for the search you actually make.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                These are long guides, not ads. They cover the methods families already hear about — and when a private draft is the kinder option.
              </p>
            </div>
            <ul className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-3">
              <li className="flex h-full flex-col rounded-2xl border border-card-border bg-card p-7 shadow-sm">
                <h3 className="font-serif text-lg font-semibold">
                  <Link
                    href="/guides/divide-parents-belongings-fairly"
                    className="text-foreground underline underline-offset-4"
                  >
                    How to divide a parent&apos;s belongings fairly
                  </Link>
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  Stickers, points, selling, and a snake draft — written for siblings sharing a leftover list.
                </p>
              </li>
              <li className="flex h-full flex-col rounded-2xl border border-card-border bg-card p-7 shadow-sm">
                <h3 className="font-serif text-lg font-semibold">
                  <Link
                    href="/guides/siblings-fighting-over-things"
                    className="text-foreground underline underline-offset-4"
                  >
                    When siblings start fighting over things
                  </Link>
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  What to pause, what not to do in the hallway, and how a private ranking can lower the temperature.
                </p>
              </li>
              <li className="flex h-full flex-col rounded-2xl border border-card-border bg-card p-7 shadow-sm">
                <h3 className="font-serif text-lg font-semibold">
                  <Link
                    href="/guides/executor-personal-property"
                    className="text-foreground underline underline-offset-4"
                  >
                    A calmer way for executors to divide personal property
                  </Link>
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  Stay the clerk of the draft, not the judge of the quilt. For the person holding the keys.
                </p>
              </li>
            </ul>
          </div>
        </section>

        <section className="border-t border-border" data-testid="section-pricing">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                Simple pricing
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                One family. One estate. $99, one-time.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Set up the catalog and invite everyone for free. $99 one-time when you&apos;re ready to choose.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-xl overflow-hidden rounded-2xl border border-card-border bg-card p-8 text-center shadow-md sm:p-10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Gift className="h-6 w-6" />
              </div>
              <p className="mt-5 font-serif text-5xl font-bold tracking-tight" data-testid="text-price">
                $99
              </p>
              <p className="mt-2 text-base font-medium text-foreground">one-time, per estate</p>
              <ul className="mx-auto mt-6 max-w-sm space-y-3 text-left text-base leading-relaxed text-muted-foreground">
                <li>Photograph items and add spoken memories — free</li>
                <li>Invite the family with private links — free</li>
                <li>$99 one-time when you&apos;re ready to choose, including the export of who kept what</li>
              </ul>
              <div className="mt-8">
                <Link href="/account">
                  <Button
                    size="lg"
                    className="min-h-12 gap-2 px-8 text-base shadow-md"
                    data-testid="button-pricing-cta"
                  >
                    Start your family&apos;s list
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                Built to soften a hard moment
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                The hard part is not the stuff.
                <span className="mt-1 block">It is coming apart over it.</span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Evenkeep keeps each list private and moves one item at a time, so nobody has to be the judge. We cannot promise a family will stay close.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {assurances.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex h-full flex-col items-center rounded-2xl border border-card-border bg-card p-7 text-center shadow-sm"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/12 text-accent">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 font-serif text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-2xl border border-card-border bg-gradient-to-br from-primary/[0.08] to-accent/[0.06] p-8 text-center shadow-md sm:p-12">
              <h3 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
                Start when you are ready.
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Add a first item today, invite the family whenever it feels right, and pay only when you run the draft.
              </p>
              <div className="mt-7 flex justify-center">
                <Link href="/account">
                  <Button
                    size="lg"
                    className="min-h-12 gap-2 px-8 text-base shadow-md"
                    data-testid="button-get-started-footer"
                  >
                    Start your family&apos;s list
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <LegalNote className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground" />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
