import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingPhoto } from "@/components/marketing-photo";
import { SiteFooter } from "@/components/site-footer";
import { SeoHead } from "@/components/seo-head";
import { LegalNote } from "@/components/legal-note";
import { SEO } from "@shared/seo";
import {
  DEMO_DRAFT_ORDER,
  DEMO_FLAG,
  DEMO_ITEMS,
  DEMO_PEOPLE,
  DEMO_PRIVATE_RANK,
  demoItem,
  demoPerson,
} from "@/lib/demo-estate";
import { ArrowRight, Camera, HandHeart, Lock, Scale, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "catalog", label: "Catalog", icon: Camera },
  { id: "ranking", label: "Private ranking", icon: Star },
  { id: "draft", label: "Fair draft", icon: Scale },
  { id: "results", label: "Results", icon: HandHeart },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export default function DemoPage() {
  const [step, setStep] = useState<StepId>("catalog");
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SeoHead page={SEO.demo} />
      <MarketingHeader />

      <div
        className="border-b border-primary/15 bg-primary/[0.07]"
        data-testid="demo-sample-banner"
        role="status"
      >
        <p className="mx-auto max-w-6xl px-5 py-3 text-center text-sm leading-relaxed text-foreground sm:px-8">
          {DEMO_FLAG}
        </p>
      </div>

      <main>
        <section className="mx-auto max-w-6xl px-5 pb-8 pt-12 sm:px-8 sm:pt-16">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Sample estate
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            A fictional kitchen table, so you can see the draft.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Riley, Jordan, and Sam are made-up names. The photographs are still-lifes, not a real family's things. You can walk the four steps without creating an account — and nothing you click is saved.
          </p>
        </section>

        <nav
          className="sticky top-[65px] z-40 border-y border-border bg-background/90 backdrop-blur-md"
          aria-label="Sample walkthrough"
        >
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 py-3 sm:px-8">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = s.id === step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                  data-testid={`demo-step-${s.id}`}
                  aria-current={active ? "step" : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span className="tabular-nums text-xs opacity-70">{i + 1}</span>
                  {s.label}
                </button>
              );
            })}
          </div>
        </nav>

        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          {step === "catalog" && <CatalogStep />}
          {step === "ranking" && <RankingStep />}
          {step === "draft" && <DraftStep />}
          {step === "results" && <ResultsStep />}

          <div className="mt-10 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              className="min-h-12 px-6 text-base"
              disabled={stepIndex === 0}
              onClick={() => setStep(STEPS[stepIndex - 1].id)}
            >
              Previous
            </Button>
            {stepIndex < STEPS.length - 1 ? (
              <Button
                className="min-h-12 px-6 text-base shadow-md"
                onClick={() => setStep(STEPS[stepIndex + 1].id)}
                data-testid="demo-next"
              >
                Next: {STEPS[stepIndex + 1].label}
              </Button>
            ) : (
              <Link href="/account">
                <Button
                  className="min-h-12 w-full gap-2 px-8 text-base shadow-md sm:w-auto"
                  data-testid="demo-create-estate"
                >
                  Create your estate
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
            <h2 className="font-serif text-3xl font-bold tracking-tight">
              Ready to catalog your own?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Create an estate, add a first item, and invite the family when it feels right. Free until you run the live draft — then $99 once.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/account">
                <Button size="lg" className="min-h-12 gap-2 px-8 text-base shadow-md">
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

function CatalogStep() {
  return (
    <div>
      <h2 className="font-serif text-3xl font-bold tracking-tight">The catalog</h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        An organizer photographed four belongings and added a short note. In a real estate you can add as many as you need, with spoken memories if you want them.
      </p>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {DEMO_ITEMS.map((item) => (
          <li
            key={item.id}
            className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm"
            data-testid={`demo-item-${item.id}`}
          >
            <MarketingPhoto
              src={item.photo}
              alt={item.alt}
              width={item.width}
              height={item.height}
              imgClassName="aspect-[4/3] w-full object-cover"
            />
            <div className="p-5">
              <h3 className="font-serif text-lg font-semibold">{item.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RankingStep() {
  return (
    <div>
      <div className="flex items-start gap-3">
        <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight">Riley's private list</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Only Riley sees this order. Jordan and Sam have their own lists, which this page does not show — the same way a real estate never shares ratings before the draft.
          </p>
        </div>
      </div>
      <ol className="mt-8 space-y-3">
        {DEMO_PRIVATE_RANK.map((id, i) => {
          const item = demoItem(id);
          return (
            <li
              key={item.id}
              className="flex items-center gap-4 rounded-2xl border border-card-border bg-card p-3 shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center font-serif text-lg font-bold text-muted-foreground/50">
                {i + 1}
              </span>
              <MarketingPhoto
                src={item.photo}
                alt=""
                width={item.width}
                height={item.height}
                imgClassName="h-16 w-16 rounded-lg object-cover"
              />
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">Wanted quietly — not announced to the room.</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function DraftStep() {
  return (
    <div>
      <h2 className="font-serif text-3xl font-bold tracking-tight">A fair order, then turns</h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        Evenkeep drew an impartial order for this sample. In a live estate this is the lottery and the draft — the moment families pay the one-time $99 to run and export.
      </p>
      <ol className="mt-8 grid gap-4 sm:grid-cols-3">
        {DEMO_DRAFT_ORDER.map((id, i) => {
          const person = demoPerson(id);
          return (
            <li
              key={person.id}
              className="rounded-2xl border border-card-border bg-card p-6 text-center shadow-sm"
            >
              <p className="font-serif text-4xl font-bold text-muted-foreground/35">{i + 1}</p>
              <p className="mt-2 font-serif text-xl font-semibold" style={{ color: person.color }}>
                {person.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">picks on their turn</p>
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-sm text-muted-foreground">
        Sample only — this order is written into the page. It is not drawn from, and cannot write to, a live estate.
      </p>
    </div>
  );
}

function ResultsStep() {
  return (
    <div>
      <h2 className="font-serif text-3xl font-bold tracking-tight">Who kept what</h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        After the turns, the sample family has a written list. A real organizer can export this so no one is left reconstructing the afternoon from memory.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {DEMO_PEOPLE.map((person) => {
          const kept = DEMO_ITEMS.filter((item) => item.keptBy === person.id);
          return (
            <div
              key={person.id}
              className="rounded-2xl border border-card-border bg-card p-6 shadow-sm"
              data-testid={`demo-result-${person.id}`}
            >
              <h3 className="font-serif text-xl font-semibold" style={{ color: person.color }}>
                {person.name}
              </h3>
              <ul className="mt-4 space-y-3">
                {kept.map((item) => (
                  <li key={item.id} className="text-sm leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="block text-xs">Round {item.pickRound}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
