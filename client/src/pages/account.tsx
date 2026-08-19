import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setEstateId } from "@/lib/tenant";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { Loader2, ShieldCheck } from "lucide-react";

type Mode = "login" | "signup" | "forgot";

function modeFromPath(path: string): Mode {
  if (path === "/login") return "login";
  return "signup";
}

function cleanError(e: any): string {
  const msg = String(e?.message || "");
  return msg.replace(/^\d+:\s*/, "").replace(/^\{.*"error":"([^"]+)".*\}$/, "$1") || "Something went wrong";
}

export default function Account() {
  const [path, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>(() => modeFromPath(path));

  useEffect(() => {
    const next = modeFromPath(path);
    setMode((current) => (current === "forgot" ? current : next));
  }, [path]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [estateName, setEstateName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (mode === "forgot") {
        const res = await apiRequest("POST", "/api/auth/forgot-password", { email });
        const data = await res.json();
        setInfo(
          data?.emailEnabled === false
            ? "Password reset by email isn't turned on yet. Please contact your administrator to regain access."
            : "If an account exists for that email, we've sent a reset link. Check your inbox.",
        );
        return;
      }
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
      setError(cleanError(e));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setError("");
    setInfo("");
    setMode(m);
    if (m === "login") setLocation("/login");
    else if (m === "signup") setLocation("/account");
  };

  const title = mode === "signup" ? "Create your estate" : mode === "forgot" ? "Reset your password" : "Sign in";
  const subtitle =
    mode === "signup"
      ? "Set up a private, fair draft for your family's belongings."
      : mode === "forgot"
        ? "Enter your email and we'll send you a link to set a new password."
        : "Sign in to manage your family's estate draft.";

  const canSubmit =
    mode === "forgot"
      ? !!email
      : !!email && password.length >= (mode === "signup" ? 8 : 1);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent"
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-12 sm:px-6">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="rounded-md" aria-label="Evenkeep home">
            <Logo />
          </Link>
        </div>

        <div className="w-full rounded-2xl border border-card-border bg-card p-8 shadow-lg">
          <div className="mb-7 text-center">
            <h1 className="font-serif text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{subtitle}</p>
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
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()} placeholder="you@example.com" className="min-h-12 text-base" />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "login" && (
                    <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => switchMode("forgot")}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} className="min-h-12 text-base" />
              </div>
            )}

            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            {info && <p className="text-sm text-accent text-center">{info}</p>}

            <Button onClick={submit} disabled={loading || !canSubmit} size="lg" className="min-h-12 w-full px-8 text-base shadow-md">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "signup" ? "Create estate" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </Button>

            {mode === "forgot" ? (
              <button type="button" className="w-full text-base text-muted-foreground hover:text-foreground" onClick={() => switchMode("login")}>
                Back to sign in
              </button>
            ) : (
              <button
                type="button"
                className="w-full text-base text-muted-foreground hover:text-foreground"
                onClick={() => switchMode(mode === "signup" ? "login" : "signup")}
              >
                {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Create one"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent/12 px-4 py-1.5 text-sm font-medium text-accent">
          <ShieldCheck className="h-4 w-4" />
          Private and secure by design
        </div>
      </div>
      <SiteFooter tagline="Your family's draft stays on your estate — private by design." />
    </div>
  );
}
