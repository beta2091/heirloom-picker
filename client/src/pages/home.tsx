import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ClipboardList, Star, RefreshCw, Trophy, ArrowRight, Loader2 } from "lucide-react";


interface FamilySettings {
  familyName: string | null;
  contactName: string | null;
  hasHeroPhoto: boolean;
}

export default function Home() {
  const { data: settings, isLoading } = useQuery<FamilySettings>({
    queryKey: ["/api/family-settings"],
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
              <Link href="/admin">
                <Button size="lg" className="gap-2" data-testid="button-get-started">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Family members: check your text messages for your private link.
            </p>

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
