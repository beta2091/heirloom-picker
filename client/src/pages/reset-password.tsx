import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setEstateId } from "@/lib/tenant";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", { token, password });
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
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-12 sm:px-6">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="w-full rounded-2xl border border-card-border bg-card p-8 shadow-lg">
          <div className="mb-7 text-center">
            <h1 className="font-serif text-3xl font-bold tracking-tight">Choose a new password</h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">Set a new password for your Evenkeep account.</p>
          </div>

          {!token ? (
            <p className="text-sm text-destructive text-center">This reset link is missing its token. Please use the link from your email, or request a new one.</p>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="min-h-12 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Re-enter password" className="min-h-12 text-base" />
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button onClick={submit} disabled={loading} size="lg" className="min-h-12 w-full px-8 text-base shadow-md">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Set new password
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
