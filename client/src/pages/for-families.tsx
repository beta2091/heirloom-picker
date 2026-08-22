import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingPhoto } from "@/components/marketing-photo";
import { SiteFooter } from "@/components/site-footer";
import { SeoHead } from "@/components/seo-head";
import { LegalNote } from "@/components/legal-note";
import { SEO } from "@shared/seo";
import { ArrowRight, Heart, Scale, ShieldCheck, Users } from "lucide-react";

const helps = [
  {
    icon: ShieldCheck,
    title: "You do not have to play judge",
    body: "Private rankings mean no one performs their grief in front of the others. You are not asked to decide who 'deserves' the quilt.",
  },
  {
    icon: Scale,
    title: "Fairness is not a family vote",
    body: "An impartial turn order keeps the outcome from depending on who spoke loudest, who lives closest, or who arrived first.",
  },
  {
    icon: Users,
    title: "Built for every relative",
    body: "A texted link. Large type. No app store. The person who is ninety and the person who is twelve can both take a turn.",
  },
];

export default function ForFamiliesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SeoHead page={SEO.forFamilies} />
      <MarketingHeader />

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent"
          />
          <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-xs">
                  <Heart className="h-4 w-4 text-primary" />
                  For the sibling holding the house this week
                </span>
                <h1 className="mt-6 font-serif text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">
                  Divide a parent's belongings fairly,{" "}
                  <span className="text-primary">without anyone having to judge.</span>
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
                  You are already tired. The china, the chair, the box of letters — each one can open a conversation the family is not ready to have in the hallway. What those things are worth in dollars is not what they are worth to a sister or a brother. Evenkeep gives everyone a private place to say what they hope to keep, then a fair way to take turns. No one has to play judge.
                </p>
                <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                  <Link href="/account">
                    <Button
                      size="lg"
                      className="min-h-12 w-full gap-2 px-8 text-base shadow-md sm:w-auto"
                      data-testid="button-families-cta"
                    >
                      Create your estate
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button size="lg" variant="outline" className="min-h-12 w-full px-8 text-base sm:w-auto">
                      See a sample first
                    </Button>
                  </Link>
                </div>
                <p className="mt-5 text-sm text-muted-foreground">
                  Free to photograph and invite. <span className="font-medium text-foreground">$99 once</span> when you run the draft and take the list with you.
                </p>
              </div>

              <figure className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div
                  aria-hidden="true"
                  className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-2xl"
                />
                <div className="relative overflow-hidden rounded-2xl border border-card-border bg-card shadow-xl">
                  <MarketingPhoto
                    src="/marketing/hero-keepsakes"
                    alt="Letters tied with a ribbon, a pocket watch, a gold ring, and an open jewelry box resting on a wooden table in warm light."
                    width={933}
                    height={1400}
                    eager
                    imgClassName="aspect-[16/11] w-full object-cover object-[center_42%] sm:aspect-[4/5] sm:max-h-[28rem] lg:max-h-none"
                  />
                  <figcaption className="border-t border-card-border px-6 py-4 text-center font-serif text-base italic leading-relaxed text-muted-foreground">
                    The things on the table are not the fight. The silence around them is.
                  </figcaption>
                </div>
              </figure>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
            <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              If you are the one who stayed
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Maybe you are the executor. Maybe you are the eldest, or the one who lives in town. People keep asking what should happen to the silver, and you do not want to be the person who chose.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Evenkeep is for that week. You photograph what is there. You send each relative a private link. They take their time. When everyone is ready, a fair draft does the part that used to happen in a tense living room.
            </p>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                What this changes
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                The process does not have to be the fight.
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {helps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex h-full flex-col rounded-2xl border border-card-border bg-card p-7 shadow-sm"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/12 text-accent">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 font-serif text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section aria-label="Belongings on the table">
          <figure>
            <MarketingPhoto
              src="/marketing/table-catalog"
              alt="A teapot, folded quilt, eyeglasses, handwritten card, and a small leather book arranged on a wooden table."
              width={1536}
              height={1024}
              imgClassName="h-56 w-full object-cover object-center sm:h-72 lg:h-[22rem]"
            />
            <figcaption className="border-y border-border bg-card/70 px-5 py-4 text-center sm:px-8">
              <p className="mx-auto max-w-2xl font-serif text-base italic leading-relaxed text-muted-foreground sm:text-lg">
                You do not have to sort this in one afternoon. The catalog waits.
              </p>
            </figcaption>
          </figure>
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-20">
            <h2 className="font-serif text-3xl font-bold tracking-tight">
              Start when you can. Pay when you draft.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Add a first item today. Invite the family whenever it feels right. The live draft and the export are $99, once, for that estate.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/account">
                <Button size="lg" className="min-h-12 gap-2 px-8 text-base shadow-md">
                  Create your estate
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Want the longer walkthrough?{" "}
              <Link href="/how-it-works" className="text-foreground underline underline-offset-4">
                See how it works
              </Link>
              . For the methods families already try, start with{" "}
              <Link href="/guides/divide-parents-belongings-fairly" className="text-foreground underline underline-offset-4">
                how to divide a parent&apos;s belongings fairly
              </Link>
              . If the hallway conversations have already gone sharp, read{" "}
              <Link href="/guides/siblings-fighting-over-things" className="text-foreground underline underline-offset-4">
                when siblings start fighting over things
              </Link>
              . Executors can skip ahead to{" "}
              <Link href="/guides/executor-personal-property" className="text-foreground underline underline-offset-4">
                dividing personal property without becoming the judge
              </Link>
              .
            </p>
            <LegalNote className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground" />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
