import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/logo";
import { MarketingHeader } from "@/components/marketing-header";
import { SiteFooter } from "@/components/site-footer";
import { SeoHead } from "@/components/seo-head";
import { SEO } from "@shared/seo";
import {
  Camera,
  Star,
  Scale,
  HandHeart,
  ArrowRight,
  ShieldCheck,
  Users,
  Heart,
  Gift,
} from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Someone gathers the items",
    body:
      "A family organizer photographs each belonging — adding a note or a short spoken memory whenever a piece has a story worth keeping.",
  },
  {
    icon: Star,
    title: "Everyone quietly says what matters",
    body:
      "From their own phone, each person rates and ranks what they'd love to keep. It's completely private — no one sees anyone else's list.",
  },
  {
    icon: Scale,
    title: "A fair order is drawn",
    body:
      "Evenkeep sets an even, impartial turn order, so no one is left out and no one has to be the one who decides.",
  },
  {
    icon: HandHeart,
    title: "You take turns, one at a time",
    body:
      "In that fair order, everyone chooses a single item on their turn until every piece has found the person who'll cherish it.",
  },
];

const assurances = [
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Each person's ratings stay theirs alone. Nothing is shared until the draft brings everyone together.",
  },
  {
    icon: Scale,
    title: "Fair for everyone",
    body: "An impartial turn order means the outcome doesn't depend on who spoke loudest or lives closest.",
  },
  {
    icon: Users,
    title: "Made for every relative",
    body: "Large, gentle screens that work from a texted link — whether you're twelve or ninety, on a phone at the kitchen table.",
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
          <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:pb-28 lg:pt-24">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-xs">
                  <Heart className="h-4 w-4 text-primary" />
                  A kinder way to divide what's left behind
                </span>
                <h1 className="mt-6 font-serif text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                  Divide what matters,
                  <span className="block text-primary">with fairness and care.</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
                  A calm, private place for your family to share a loved one's belongings — so every keepsake lands with someone who'll treasure it, and the family stays whole.
                </p>
                <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                  <Link href="/account">
                    <Button
                      size="lg"
                      className="min-h-12 w-full gap-2 px-8 text-base shadow-md sm:w-auto"
                      data-testid="button-get-started"
                    >
                      Create your estate
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/demo">
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
                <p className="mt-5 text-sm text-muted-foreground" data-testid="text-price-note">
                  Free to set up and invite. <span className="font-medium text-foreground">$99 once</span> when you're ready to run the live draft and export.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  A family member? Check your messages for your private link.
                </p>
              </div>

              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div
                  aria-hidden="true"
                  className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-2xl"
                />
                <div className="relative overflow-hidden rounded-2xl border border-card-border bg-card shadow-xl">
                  <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-5 bg-gradient-to-br from-secondary/60 to-card px-8 text-center">
                    <LogoIcon className="h-20 w-20" />
                    <p className="max-w-xs font-serif text-lg italic text-muted-foreground">
                      Every object holds a memory. Let's keep them all in good hands.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                How it works
              </p>
              <h2
                className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl"
                data-testid="text-how-it-works"
              >
                Four unhurried steps
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                No pressure and no rush. Everyone moves at their own pace, and the fair part is handled for you.{" "}
                <Link href="/how-it-works" className="text-foreground underline underline-offset-4">
                  Read the full walkthrough
                </Link>
                .
              </p>
            </div>

            <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

        <section className="border-t border-border" data-testid="section-pricing">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                Simple pricing
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                One family. One estate. Ninety-nine dollars, once.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Set up the catalog and invite everyone when you're ready. You only pay when it's time to run the live draft and take the results with you.
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
                <li>Pay when you run the live draft and export who kept what</li>
              </ul>
              <div className="mt-8">
                <Link href="/account">
                  <Button
                    size="lg"
                    className="min-h-12 gap-2 px-8 text-base shadow-md"
                    data-testid="button-pricing-cta"
                  >
                    Start for free
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
              <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                Built to soften a hard moment
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Dividing belongings can strain even close families. Evenkeep takes the pressure off the people and lets fairness do the deciding.
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
                Keep the memories, not the conflict.
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Start when you're ready. Add a first item today, invite the family whenever it feels right, and pay only when you run the draft.
              </p>
              <div className="mt-7 flex justify-center">
                <Link href="/account">
                  <Button
                    size="lg"
                    className="min-h-12 gap-2 px-8 text-base shadow-md"
                    data-testid="button-get-started-footer"
                  >
                    Create your estate
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
