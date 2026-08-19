import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingPhoto } from "@/components/marketing-photo";
import { SiteFooter } from "@/components/site-footer";
import { SeoHead } from "@/components/seo-head";
import { LegalNote } from "@/components/legal-note";
import { SEO } from "@shared/seo";
import {
  ArrowRight,
  Briefcase,
  HeartHandshake,
  Link2,
  Scale,
} from "lucide-react";

const audiences = [
  {
    icon: Scale,
    title: "Estate attorneys",
    body: "When the legal work is underway and the personal property is still sitting in the house, families often need a calmer process than a conference-room list.",
  },
  {
    icon: HeartHandshake,
    title: "Funeral homes & hospice",
    body: "You already sit with families in a hard week. A single private link is something you can hand over without becoming the person who divides the china.",
  },
  {
    icon: Briefcase,
    title: "Senior living",
    body: "A downsizing or a move can surface the same question. Evenkeep stays out of care plans and stays with the belongings.",
  },
];

const points = [
  {
    title: "$99 per family you refer",
    body: "One estate. One payment, once, when they run the live draft. Setup, photos, and invites stay free so you are not asking a grieving household to buy software on day one.",
  },
  {
    title: "No software training",
    body: "You do not install anything. You do not teach a dashboard. The organizer creates an estate; each relative gets a private link that opens in a browser.",
  },
  {
    title: "Private links for elderly relatives",
    body: "Large type, a phone or a tablet, no app store. A son or daughter can text the link. The person in the recliner does not need a password.",
  },
];

export default function ForProfessionalsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SeoHead page={SEO.forProfessionals} />
      <MarketingHeader />

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent"
          />
          <div className="relative mx-auto max-w-3xl px-5 pb-14 pt-14 text-center sm:px-8 sm:pb-16 sm:pt-20">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              For professionals
            </p>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl">
              Point a family toward a fair draft. Stay in your own work.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Estate attorneys, funeral homes, senior living, and hospice already meet the households who need this. Evenkeep is the quiet tool you can send them — $99 once per family, no software for you to learn or teach.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link href="/account">
                <Button
                  size="lg"
                  className="min-h-12 w-full gap-2 px-8 text-base shadow-md sm:w-auto"
                  data-testid="button-refer-family"
                >
                  Refer a family
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="min-h-12 w-full px-8 text-base sm:w-auto">
                  See how it works
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                Who this is for
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                People who already hold the door for a family, and should not also hold the inventory.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {audiences.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex h-full flex-col rounded-2xl border border-card-border bg-card p-7 shadow-sm"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
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

        <section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                What you are offering
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight">
                A private link. Not a new practice tool.
              </h2>
              <ul className="mt-8 space-y-6">
                {points.map((point) => (
                  <li key={point.title}>
                    <h3 className="font-serif text-lg font-semibold">{point.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-muted-foreground">{point.body}</p>
                  </li>
                ))}
              </ul>
            </div>
            <figure>
              <div className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-md">
                <MarketingPhoto
                  src="/marketing/photographing"
                  alt="A phone lying next to a wooden chair, used to photograph the chair for a family catalog."
                  width={1400}
                  height={933}
                  imgClassName="aspect-[4/3] w-full object-cover"
                />
              </div>
              <figcaption className="mt-3 font-serif text-sm italic leading-relaxed text-muted-foreground sm:text-base">
                The family photographs the house. You stay with the work you already do.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="flex items-start gap-4">
              <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                <Link2 className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-serif text-3xl font-bold tracking-tight">
                  How a referral works
                </h2>
                <ol className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  <li>
                    <span className="font-medium text-foreground">1. Create an estate</span> — or send the family to Evenkeep and let the organizer do it. There is no partner portal and no training call.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">2. They invite relatives</span> with private links. Elderly family members open a page, not an app.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">3. They pay $99</span> only when it is time to run the live draft and export who kept what.
                  </li>
                </ol>
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  We do not list partner firms here. If Evenkeep is a fit for a household you serve, that is enough.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-20">
            <h2 className="font-serif text-3xl font-bold tracking-tight">
              Refer a family when the moment comes.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Open an estate in a few minutes. Send the organizer the link. You do not owe us a logo or a case study.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/account">
                <Button
                  size="lg"
                  className="min-h-12 gap-2 px-8 text-base shadow-md"
                  data-testid="button-refer-family-footer"
                >
                  Refer a family
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
