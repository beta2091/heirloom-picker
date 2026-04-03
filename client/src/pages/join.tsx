import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, AlertCircle } from "lucide-react";
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
      // Store share token in sessionStorage so it survives client-side routing
      sessionStorage.setItem(`share-token-${data.siblingId}`, data.shareToken);
      sessionStorage.setItem(`via-link-${data.siblingId}`, "true");
      setLocation(`/sibling/${data.siblingId}`, { replace: true });
    }
  }, [data, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading your draft...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="font-serif text-xl font-semibold">This link isn't valid</h2>
            <p className="text-muted-foreground text-sm">
              It may have expired or been entered incorrectly. Ask the person who sent it to share a new link.
            </p>
            <Link href="/">
              <Button variant="outline" className="gap-2 mt-4">
                <Heart className="w-4 h-4" /> Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
