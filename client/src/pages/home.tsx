import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ClipboardList, Star, MessageSquare, RefreshCw, Trophy, ArrowRight, Share2, Info, Loader2 } from "lucide-react";
import familyPhotoDefault from "@assets/4AA660CD-2DE6-4553-9D2D-CDF5C75C943F_1_105_c_1772759281527.jpeg";

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
  const heroPhotoSrc = settings?.hasHeroPhoto ? "/api/family-settings/hero-photo" : familyPhotoDefault;

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

            <div className="mt-12 relative mx-auto max-w-3xl">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl blur-sm" />
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-primary/10">
                <img
                  src={heroPhotoSrc}
                  alt="Our family"
                  className="w-full h-auto object-cover"
                  data-testid="img-family-hero"
                />
              </div>
              <p className="mt-4 text-sm text-muted-foreground italic">
                Keeping what matters most — together
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-card/50">
          <div className="container mx-auto max-w-2xl">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold mb-1" data-testid="text-personal-link-title">Have a personal link?</h3>
                    <p className="text-muted-foreground text-sm">
                      Each family member received their own private link by text or email.
                      Use that link to access your wishlist. If you can't find it, contact {contactName}.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="font-serif text-3xl font-semibold text-center mb-12" data-testid="text-how-it-works">How It Works</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
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
                  <CardTitle className="font-serif text-base">2. Siblings build their wishlist</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>
                    Each sibling uses their private link to browse items and mark the ones they want most
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="h-full" data-testid="step-3">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-base">3. Kids give feedback</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>
                    Siblings share a viewer link with their children, who can suggest items and leave notes
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="h-full" data-testid="step-4">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                    <RefreshCw className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-base">4. Review and reorder</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>
                    Siblings adjust their wishlist priority based on their kids' suggestions
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="h-full" data-testid="step-5">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-base">5. The draft happens</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>
                    In pick order, each sibling selects one item at a time until everything is distributed
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8 text-accent-foreground" />
                </div>
                <CardTitle className="font-serif text-2xl" data-testid="text-kids-section-title">For Your Kids & Grandkids</CardTitle>
                <CardDescription className="text-base max-w-xl mx-auto">
                  Once you've added items to your wishlist, share a special viewer link with your children.
                  They can browse everything and tell you which items mean the most to them — helping you
                  make the best picks for your family.
                </CardDescription>
              </CardHeader>
            </Card>
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
