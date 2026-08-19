import { Link } from "wouter";

export function LegalNote({ className }: { className?: string }) {
  return (
    <p className={className} data-testid="text-legal-note">
      Evenkeep is not a will and not legal advice.{" "}
      <Link href="/legal" className="text-foreground underline underline-offset-4">
        Read the boundary
      </Link>
      .
    </p>
  );
}
