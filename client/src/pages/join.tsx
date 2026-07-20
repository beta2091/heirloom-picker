import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Loader2, ArrowLeft, Unplug } from "lucide-react";
import { Link } from "wouter";

interface JoinResponse {
  siblingId: string;
  name: string;
  shareToken: string;
}

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<JoinResponse>({
    queryKey: ["/api/join", token],
    queryFn: async () => {
      const res = await fetch(`/api/join/${token}`);
      if (!res.ok) throw new Error("Link not found");
      return res.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (data) {
      // Clear ALL previous sibling sessions so each link starts fresh.
      // This prevents seeing another sibling's cached data if someone
      // previously opened a different link in the same browser.
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith("share-token-") || key.startsWith("via-link-"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));

      // Clear React Query cache for sibling/ratings data from any previous session
      queryClient.removeQueries({ queryKey: ["/api/siblings"] });
      queryClient.removeQueries({ queryKey: ["/api/ratings"] });
      queryClient.removeQueries({ queryKey: ["/api/items"] });

      // Set fresh session for this sibling
      sessionStorage.setItem(`share-token-${data.siblingId}`, data.shareToken);
      sessionStorage.setItem(`via-link-${data.siblingId}`, "true");
      setLocation(`/sibling/${data.siblingId}`, { replace: true });
    }
  }, [data, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 sm:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent"
          />
          <div className="relative w-full max-w-md text-center">
            <div className="flex justify-center">
              <Logo />
            </div>
            <div className="mt-8 rounded-2xl border border-card-border bg-card p-8 shadow-lg">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Opening your private page…
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
                <Unplug className="h-6 w-6" />
              </span>
              <h2 className="mt-6 font-serif text-3xl font-bold tracking-tight">
                This link isn't valid
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                It may have expired or been entered incorrectly. Ask the person
                who sent it to share a new link with you.
              </p>
              <div className="mt-7 flex justify-center">
                <Link href="/">
                  <Button
                    size="lg"
                    variant="outline"
                    className="min-h-12 gap-2 px-8 text-base"
                  >
                    <ArrowLeft className="h-4 w-4" /> Go home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
