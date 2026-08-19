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
  Lock,
} from "lucide-react";

const stages = [
  {
    id: "catalog",
    num: "01",
    icon: Camera,
    title: "Catalog what is left",
    kicker: "Someone gathers the items",
    body: [
      "One person — often a sibling, an executor, or a parent planning while they still can — photographs each belonging. A name is enough to start. A short note or a spoken memory can sit beside the photo when a piece has a story worth keeping.",
      "There is no rush and no public gallery. The catalog lives inside one private estate. Relatives do not need accounts. They will receive a link when you are ready.",
    ],
    photo: {
      src: "/marketing/photographing",
      alt: "A phone lying next to a wooden chair, used to photograph the chair for a family catalog.",
      width: 1400,
      height: 933,
      caption: "A photograph, then a note if there is a memory to keep.",
    },
  },
  {
    id: "ranking",
    num: "02",
    icon: Star,
    title: "Everyone ranks in private",
    kicker: "No one sees anyone else's list",
    body: [
      "Each person opens their own link on a phone or a laptop. They look through the catalog and quietly mark what they would love to keep — a rating, a personal order, nothing performed for the room.",
      "Siblings do not compare lists. Parents do not have to mediate. The person who lives farthest away has the same voice as the person standing in the kitchen.",
    ],
    photo: {
      src: "/marketing/locket",
      alt: "A gold floral locket and a dried flower beside a cup of tea on folded linen.",
      width: 1400,
      height: 933,
      caption: "Some pieces are small. They still need a careful home.",
    },
  },
  {
    id: "draft",
    num: "03",
    icon: Scale,
    title: "A fair order is drawn",
    kicker: "Lottery, then turns",
    body: [
      "When the family is ready, Evenkeep draws an even, impartial turn order. No one has to volunteer to be the decider. No one is rewarded for speaking first or living closest.",
      "Then you take turns, one item at a time, in that order. Each person chooses a single belonging on their turn until the catalog is finished. The live draft and the export are what the one-time $99 unlocks.",
    ],
    photo: {
      src: "/marketing/table-catalog",
      alt: "A teapot, folded quilt, eyeglasses, handwritten card, and a small leather book arranged on a wooden table.",
      width: 1536,
      height: 1024,
      caption: "The table before anyone chooses — then a fair turn for each piece.",
    },
  },
  {
    id: "results",
    num: "04",
    icon: HandHeart,
    title: "Results you can take with you",
    kicker: "Who kept what, written down",
    body: [
      "When the draft is done, each person can see what they are taking home. The organizer can export the list so the family is not relying on memory a month later.",
      "That is the whole product. It does not transfer legal title. It does not replace a will. It gives a tired family a calmer way to share the things that hold memories.",
    ],
    photo: {
      src: "/marketing/hero-keepsakes",
      alt: "Letters tied with a ribbon, a pocket watch, a gold ring, and an open jewelry box resting on a wooden table in warm light.",
      width: 933,
      height: 1400,
      caption: "Every object holds a memory. Let's keep them all in good hands.",
    },
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SeoHead page={SEO.howItWorks} />
      <MarketingHeader />

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent"
          />
          <div className="relative mx-auto max-w-3xl px-5 pb-14 pt-14 text-center sm:px-8 sm:pb-16 sm:pt-20">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              How it works
            </p>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl">
              Four unhurried steps, from the kitchen table to a finished list.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Catalog the belongings. Let everyone say what matters in private.
              Draw a fair order. Take turns until every piece has a home.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link href="/account">
                <Button size="lg" className="min-h-12 w-full gap-2 px-8 text-base shadow-md sm:w-auto">
                  Create your estate
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-12 w-full px-8 text-base sm:w-auto"
                  data-testid="button-see-sample"
                >
                  See a sample estate
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Free to set up and invite. <span className="font-medium text-foreground">$99 once</span> when you run the live draft.
            </p>
          </div>
        </section>

        <div className="space-y-0">
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            const reverse = i % 2 === 1;
            return (
              <section
                key={stage.id}
                id={stage.id}
                className={i % 2 === 0 ? "border-t border-border bg-card/40" : "border-t border-border"}
                data-testid={`walkthrough-${stage.id}`}
              >
                <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16">
                  <div className={reverse ? "lg:order-2" : undefined}>
                    <div className="mb-5 flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="font-serif text-3xl font-bold text-muted-foreground/35">
                        {stage.num}
                      </span>
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                      {stage.kicker}
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight">
                      {stage.title}
                    </h2>
                    {stage.body.map((para) => (
                      <p key={para} className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                        {para}
                      </p>
                    ))}
                  </div>
                  <figure className={reverse ? "lg:order-1" : undefined}>
                    <div className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-md">
                      <MarketingPhoto
                        src={stage.photo.src}
                        alt={stage.photo.alt}
                        width={stage.photo.width}
                        height={stage.photo.height}
                        imgClassName="aspect-[4/3] w-full object-cover"
                      />
                    </div>
                    <figcaption className="mt-3 font-serif text-sm italic leading-relaxed text-muted-foreground sm:text-base">
                      {stage.photo.caption}
                    </figcaption>
                  </figure>
                </div>
              </section>
            );
          })}
        </div>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-20">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/12 text-accent">
              <Lock className="h-6 w-6" />
            </span>
            <h2 className="mt-5 font-serif text-3xl font-bold tracking-tight">
              Private by design. Simple on purpose.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Ratings stay with the person who made them until the draft. Elderly relatives get a large, gentle screen from a texted link — not a store app and not a login to remember.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link href="/account">
                <Button size="lg" className="min-h-12 w-full gap-2 px-8 text-base shadow-md sm:w-auto">
                  Create your estate
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/for-families">
                <Button size="lg" variant="outline" className="min-h-12 w-full px-8 text-base sm:w-auto">
                  For families
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
