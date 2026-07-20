import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent"
        />
        <div className="relative w-full max-w-md text-center">
          <div className="flex justify-center">
            <Link href="/" className="rounded-md" aria-label="Evenkeep home">
              <Logo />
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-card-border bg-card p-8 shadow-lg">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Compass className="h-6 w-6" />
            </span>
            <h1 className="mt-6 font-serif text-3xl font-bold tracking-tight">
              This page wandered off
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              We couldn't find the page you were looking for. It may have moved,
              or the link may be incomplete. Let's get you back home.
            </p>
            <div className="mt-7 flex justify-center">
              <Link href="/">
                <Button
                  size="lg"
                  className="min-h-12 gap-2 px-8 text-base shadow-md"
                  data-testid="button-home"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
