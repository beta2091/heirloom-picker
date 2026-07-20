import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setEstateId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Heart, Loader2 } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-2xl font-semibold mb-1">
              {mode === "signup" ? "Create your estate" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === "signup"
                ? "Set up a private, fair draft for your family's belongings."
                : "Sign in to manage your family's estate draft."}
            </p>
          </div>

          <div className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tyler" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estateName">Family / estate name</Label>
                  <Input id="estateName" value={estateName} onChange={(e) => setEstateName(e.target.value)} placeholder="e.g. The Dickman Family" />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} />
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button onClick={submit} disabled={loading || !email || password.length < (mode === "signup" ? 8 : 1)} className="w-full">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "signup" ? "Create estate" : "Sign in"}
            </Button>

            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => { setError(""); setMode(mode === "signup" ? "login" : "signup"); }}
            >
              {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Create one"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
