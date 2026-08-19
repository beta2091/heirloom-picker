import { Link } from "wouter";
import { Logo } from "@/components/logo";

interface SiteFooterProps {
  tagline?: string;
}

export function SiteFooter({
  tagline = "Made with care for families during difficult times.",
}: SiteFooterProps) {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-10 text-center sm:px-8">
        <Link href="/" className="rounded-md" aria-label="Evenkeep home">
          <Logo iconClassName="h-7 w-7" className="[&_span]:text-lg" />
        </Link>
        <p className="max-w-md text-base text-muted-foreground">{tagline}</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link href="/how-it-works" className="hover:text-foreground" data-testid="link-how-it-works">
            How it works
          </Link>
          <Link href="/for-families" className="hover:text-foreground" data-testid="link-for-families">
            For families
          </Link>
          <Link href="/for-professionals" className="hover:text-foreground" data-testid="link-for-professionals">
            For professionals
          </Link>
          <Link href="/demo" className="hover:text-foreground" data-testid="link-demo">
            Sample estate
          </Link>
          <Link href="/privacy" className="hover:text-foreground" data-testid="link-privacy">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground" data-testid="link-terms">
            Terms
          </Link>
          <Link href="/legal" className="hover:text-foreground" data-testid="link-legal">
            Not a will
          </Link>
        </nav>
        <p className="max-w-lg text-xs leading-relaxed text-muted-foreground/80">
          Evenkeep is a family coordination tool. It is not a will, not legal advice, and not a substitute for an attorney.
        </p>
      </div>
    </footer>
  );
}
