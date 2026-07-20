import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setEstateId } from "@/lib/tenant";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { Loader2, ShieldCheck } from "lucide-react";

export default function Account() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [estateName, setEstateName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const path = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body =
        mode === "signup"
          ? { email, password, name: name.trim() || undefined, estateName: estateName.trim() || undefined }
          : { email, password };
      const res = await apiRequest("POST", path, body);
      const data = await res.json();
      if (data?.estate?.id) setEstateId(data.estate.id);
      queryClient.invalidateQueries();
      setLocation("/admin");
    } catch (e: any) {
      const msg = String(e?.message || "");
      setError(msg.replace(/^\d+:\s*/, "").replace(/^\{.*"error":"([^"]+)".*\}$/, "$1") || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Soft warm hero-wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent"
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-12 sm:px-6">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="w-full rounded-2xl border border-card-border bg-card p-8 shadow-lg">
          <div className="mb-7 text-center">
            <h1 className="font-serif text-3xl font-bold tracking-tight">
              {mode === "signup" ? "Create your estate" : "Welcome back"}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {mode === "signup"
                ? "Set up a private, fair draft for your family's belongings."
                : "Sign in to manage your family's estate draft."}
            </p>
          </div>

          <div className="space-y-5">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tyler" className="min-h-12 text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estateName">Family / estate name</Label>
                  <Input id="estateName" value={estateName} onChange={(e) => setEstateName(e.target.value)} placeholder="e.g. The Dickman Family" className="min-h-12 text-base" />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="min-h-12 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} className="min-h-12 text-base" />
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button
              onClick={submit}
              disabled={loading || !email || password.length < (mode === "signup" ? 8 : 1)}
              size="lg"
              className="min-h-12 w-full px-8 text-base shadow-md"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "signup" ? "Create estate" : "Sign in"}
            </Button>

            <button
              type="button"
              className="w-full text-base text-muted-foreground hover:text-foreground"
              onClick={() => { setError(""); setMode(mode === "signup" ? "login" : "signup"); }}
            >
              {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Create one"}
            </button>
          </div>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent/12 px-4 py-1.5 text-sm font-medium text-accent">
          <ShieldCheck className="h-4 w-4" />
          Private and secure by design
        </div>
      </div>
    </div>
  );
}
