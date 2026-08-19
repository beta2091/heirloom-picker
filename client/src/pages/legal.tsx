import type { ReactNode } from "react";
import { Link } from "wouter";
import { MarketingHeader } from "@/components/marketing-header";
import { SiteFooter } from "@/components/site-footer";
import { SeoHead } from "@/components/seo-head";
import { SEO, type SeoPage } from "@shared/seo";

function LegalShell({
  title,
  updated,
  seo,
  children,
}: {
  title: string;
  updated: string;
  seo: SeoPage;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SeoHead page={seo} />
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Evenkeep</p>
        <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated {updated}</p>
        <div className="mt-10 space-y-8 text-base leading-relaxed text-muted-foreground [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:mt-3">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="August 19, 2026" seo={SEO.privacy}>
      <section>
        <h2>What Evenkeep is for</h2>
        <p>
          Evenkeep helps a family photograph belongings, privately say what matters, and take turns in a fair draft.
          We treat that as a private family matter, not a public feed.
        </p>
      </section>
      <section>
        <h2>What we collect</h2>
        <p>
          When you create an estate, we store the organizer’s name, email, and password (hashed), plus the estate name.
          As you use the product we store the items you add (names, notes, photos, optional audio memories), the people
          you invite, their private ratings, draft order, and who kept what.
        </p>
        <p>
          If you pay to activate an estate, Stripe processes the payment. We store the activation status and a checkout
          reference so we know the estate is unlocked. We do not store your full card number.
        </p>
        <p>
          If you send invites or reset a password, we use your email address only to deliver that message. Server logs
          may include a truncated IP address for rate limiting and abuse prevention.
        </p>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          We use this information to run your family’s draft, send the invites you ask us to send, keep estates
          separate from one another, and process activation. We do not sell family data, and we do not use your
          photos or memories for advertising.
        </p>
      </section>
      <section>
        <h2>Who can see it</h2>
        <p>
          Each person’s ratings stay private until the draft. Family members see items and, after the draft, the
          results for their estate. An organizer can manage people, items, and exports for the estate they own.
          We do not publish an unfinished estate on the public website.
        </p>
      </section>
      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep an estate while the organizer’s account is active so the family can finish the draft and download
          results. If you want an estate removed, email us from the organizer account and we will delete it.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          Questions about privacy:{" "}
          <a href="mailto:hello@evenkeep.app" className="text-foreground underline underline-offset-4">
            hello@evenkeep.app
          </a>
          .
        </p>
      </section>
    </LegalShell>
  );
}

export function TermsPage() {
  return (
    <LegalShell title="Terms of Use" updated="August 19, 2026" seo={SEO.terms}>
      <section>
        <h2>The service</h2>
        <p>
          Evenkeep is a web tool for families who want a calmer, fairer way to divide belongings. You may set up an
          estate, add items, and invite relatives at no charge. Running the live draft and exporting results requires
          a one-time activation of <strong className="text-foreground">$99 USD</strong> for that estate.
        </p>
      </section>
      <section>
        <h2>Your account</h2>
        <p>
          You are responsible for the email and password you use, and for the people you invite. Do not use Evenkeep
          to store anyone else’s information without a good-faith family reason. Keep private links private.
        </p>
      </section>
      <section>
        <h2>What Evenkeep is not</h2>
        <p>
          Evenkeep is not a will, trust, probate filing, or legal advice. A completed draft does not transfer legal
          title, settle an estate, or replace an attorney, executor, or court. See{" "}
          <Link href="/legal" className="text-foreground underline underline-offset-4">
            Not a will
          </Link>
          .
        </p>
      </section>
      <section>
        <h2>Payments</h2>
        <p>
          Activation is charged once per estate through Stripe. Setup and invites stay free. If billing is not
          configured on a given deployment, drafts are not blocked. Refunds are considered case by case — write to us
          if something went wrong.
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>
          Do not probe other families’ estates, attempt to break in, or use the service to harass anyone. We may
          suspend an account that puts other families at risk.
        </p>
      </section>
      <section>
        <h2>Disclaimer</h2>
        <p>
          Evenkeep is provided as-is. Life is messy and software can fail. We are not liable for family disagreements,
          lost sentimental items, or decisions made after a draft. If a court finds part of these terms unenforceable,
          the rest still apply. These terms are governed by the laws of the United States, without regard to conflict
          of law rules.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          <a href="mailto:hello@evenkeep.app" className="text-foreground underline underline-offset-4">
            hello@evenkeep.app
          </a>
        </p>
      </section>
    </LegalShell>
  );
}

export function NotAWillPage() {
  return (
    <LegalShell title="Not a will — not legal advice" updated="August 19, 2026" seo={SEO.legal}>
      <section>
        <h2>A gentle, important boundary</h2>
        <p>
          Evenkeep is a private place for a family to photograph belongings, say what they hope to keep, and take
          turns in a fair order. That is a kindness. It is not the law.
        </p>
      </section>
      <section>
        <h2>What this tool does not do</h2>
        <p>
          Evenkeep is not a last will and testament. It does not create, change, or replace a will, trust, or
          beneficiary designation. It is not legal, tax, or financial advice. Completing a draft does not transfer
          ownership, satisfy probate, or decide who the executor is.
        </p>
      </section>
      <section>
        <h2>When you still need an attorney</h2>
        <p>
          If there is a will, a dispute, real property, significant value, or anyone who cannot speak for themselves,
          please talk with an estate attorney. Use Evenkeep alongside that advice — not instead of it — when the
          family simply needs a calmer way to share the things that hold memories.
        </p>
      </section>
      <section>
        <h2>Who this is for</h2>
        <p>
          Families who already have the legal right, or the shared agreement, to divide personal belongings and want
          help doing it fairly. If you are unsure whether you should be dividing things at all, pause and get counsel
          first.
        </p>
      </section>
    </LegalShell>
  );
}
