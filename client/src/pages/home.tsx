import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ClipboardList, Star, RefreshCw, Trophy, ArrowRight, Info, Loader2, User } from "lucide-react";
import { getInitials } from "@/lib/utils-initials";


interface FamilySettings {
  familyName: string | null;
  contactName: string | null;
  hasHeroPhoto: boolean;
}

interface SiblingResponse {
  id: string;
  name: string;
  shareToken: string;
  color: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: settings, isLoading } = useQuery<FamilySettings>({
    queryKey: ["/api/family-settings"],
  });
  const { data: siblings = [] } = useQuery<SiblingResponse[]>({
    queryKey: ["/api/siblings"],
  });

  const familyName = settings?.familyName || null;
  const contactName = settings?.contactName || "the admin";
  const heroPhotoSrc = settings?.hasHeroPhoto ? "/api/family-settings/hero-photo" : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-semibold">Estate Draft</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/admin">
              <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-admin">
                Manage
              </span>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">A fair way to share memories</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Divide what matters, with{" "}
              <span className="text-primary">love and fairness</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {familyName
                ? `A private app for the ${familyName} family to thoughtfully share beloved belongings — so every memory lands with someone who cherishes it.`
                : "A private app to thoughtfully share beloved belongings with your family — so every memory lands with someone who cherishes it."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {siblings.length > 0 ? (
                <>
                  <Button size="lg" className="gap-2" data-testid="button-get-started" onClick={() => document.getElementById("family")?.scrollIntoView({ behavior: "smooth" })}>
                    Tap Your Name Below <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Link href="/admin">
                    <Button size="lg" variant="outline" className="gap-2">Manage</Button>
                  </Link>
                </>
              ) : (
                <Link href="/admin">
                  <Button size="lg" className="gap-2" data-testid="button-get-started">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>

            <div className="mt-12 relative mx-auto max-w-4xl">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl blur-md" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-primary/20 bg-card">
                {heroPhotoSrc ? (
                  <img
                    src={heroPhotoSrc}
                    alt="Our family"
                    className="w-full h-auto object-cover max-h-[600px]"
                    data-testid="img-family-hero"
                  />
                ) : (
                  <div className="w-full py-32 flex flex-col items-center justify-center bg-muted/50 text-muted-foreground">
                    <Heart className="w-16 h-16 mb-4 opacity-50" />
                    <p>A fair way to share memories</p>
                  </div>
                )}
              </div>
              {heroPhotoSrc && (
                <p className="mt-4 text-sm text-muted-foreground font-serif italic text-center">
                  Keeping what matters most — together
                </p>
              )}
            </div>
          </div>
        </section>

        {siblings.length > 0 && (
          <section className="py-12 px-4 bg-muted/30" id="family">
            <div className="container mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-2xl font-semibold mb-2">Welcome, family</h2>
              <p className="text-muted-foreground mb-8">Tap your name to get started</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {siblings.map((sibling) => (
                  <button
                    key={sibling.id}
                    onClick={() => {
                      sessionStorage.clear();
                      sessionStorage.setItem(`share-token-${sibling.id}`, sibling.shareToken);
                      sessionStorage.setItem(`via-link-${sibling.id}`, "true");
                      setLocation(`/sibling/${sibling.id}`);
                    }}
                    className="flex flex-col items-center gap-3 p-5 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: sibling.color }}
                    >
                      {getInitials(sibling.name)}
                    </div>
                    <span className="font-medium text-sm">{sibling.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="font-serif text-3xl font-semibold text-center mb-12" data-testid="text-how-it-works">How It Works</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="h-full" data-testid="step-1">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                    <ClipboardList className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-base">1. Admin adds all items</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>
                    {contactName !== "the admin" ? `${contactName} photographs` : "Your admin photographs"} and uploads each belonging to the app
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="h-full" data-testid="step-2">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-base">2. Everyone rates and ranks</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>
                    Each family member uses their private link to rate items and lock in their priority rankings
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="h-full" data-testid="step-3">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                    <RefreshCw className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-base">3. Draft order is set</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>
                    A lottery determines who picks first, second, and so on — fair and random
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="h-full" data-testid="step-4">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-base">4. The draft happens</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>
                    In pick order, each family member selects one item at a time until everything is distributed
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Made with care for families during difficult times</p>
        </div>
      </footer>
    </div>
  );
}
