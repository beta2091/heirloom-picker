import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Package, Gavel, AlertTriangle, Lock, User, RefreshCw } from "lucide-react";

function OwnerPasswordGate({ children }: { children: (password: string) => React.ReactNode }) {
  const [password, setPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/owner/verify", { password });
      const data = await res.json();
      if (data.verified) {
        setStoredPassword(password);
        setVerified(true);
      }
    } catch {
      setError("Invalid password");
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return <>{children(storedPassword)}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent"
        />
        <div className="relative w-full max-w-md">
          <div className="flex justify-center">
            <Link href="/" className="rounded-md" aria-label="Evenkeep home">
              <Logo />
            </Link>
          </div>
          <div className="mt-8 rounded-2xl border border-card-border bg-card p-8 shadow-lg">
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-6 w-6" />
              </span>
              <h1
                className="mt-6 font-serif text-2xl font-bold tracking-tight"
                data-testid="text-owner-login-title"
              >
                Owner Access
              </h1>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                Enter the master password to continue.
              </p>
            </div>
            <div className="mt-7 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="owner-password">Master Password</Label>
                <Input
                  id="owner-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  placeholder="Enter master password"
                  className="min-h-12"
                  data-testid="input-owner-password"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" data-testid="text-owner-error">{error}</p>
              )}
              <Button
                onClick={handleVerify}
                disabled={!password || loading}
                size="lg"
                className="min-h-12 w-full text-base shadow-md"
                data-testid="button-owner-unlock"
              >
                {loading ? "Verifying..." : "Unlock"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface OwnerStatus {
  admin: { hasPin: boolean; name: string | null };
  siblings: Array<{ id: string; name: string; color: string | null; hasPin: boolean }>;
  items: { total: number; picked: number; unpicked: number };
  draft: { isActive: boolean; isComplete: boolean; currentRound: number };
}

function OwnerDashboard({ password }: { password: string }) {
  const { toast } = useToast();

  const { data: status, isLoading, isError } = useQuery<OwnerStatus>({
    queryKey: ["/api/owner/status", password],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/owner/status", { password });
      return res.json();
    },
    retry: false,
  });

  const resetAdminMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/owner/reset-admin", { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/status"] });
      toast({
        title: "Admin Reset",
        description: "The admin PIN has been cleared. The next person to visit the admin page can set up a new PIN.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset admin",
        variant: "destructive",
      });
    },
  });

  const [confirmReset, setConfirmReset] = useState(false);

  const draftStatusText = status?.draft.isComplete
    ? "Complete"
    : status?.draft.isActive
      ? `Active (Round ${status.draft.currentRound})`
      : "Not Started";

  const draftStatusVariant = status?.draft.isComplete
    ? "default"
    : status?.draft.isActive
      ? "secondary"
      : "outline";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="rounded-md" aria-label="Evenkeep home">
            <Logo />
          </Link>
          <Badge variant="secondary" className="gap-1.5">
            <Shield className="h-3 w-3" /> Owner
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl" data-testid="text-owner-title">Owner Dashboard</h1>
            <p className="mt-1 text-base leading-relaxed text-muted-foreground">App management and admin support</p>
          </div>
        </div>

        {/* Always show the reset card first so it's accessible even if status fails */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-destructive/30 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <CardTitle className="font-serif text-lg font-semibold">Admin Reset</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-base leading-relaxed text-muted-foreground">
                Clears the admin PIN so the next person to visit the admin page can set up a new PIN and take over.
              </p>
              {!confirmReset ? (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmReset(true)}
                  data-testid="button-owner-reset-admin"
                >
                  Reset Admin PIN
                </Button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      resetAdminMutation.mutate();
                      setConfirmReset(false);
                    }}
                    disabled={resetAdminMutation.isPending}
                    data-testid="button-owner-confirm-reset"
                  >
                    {resetAdminMutation.isPending ? "Resetting..." : "Yes, Reset Admin"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmReset(false)}
                    data-testid="button-owner-cancel-reset"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <Card className="rounded-2xl border-card-border shadow-sm">
              <CardContent className="py-6 text-center text-base leading-relaxed text-muted-foreground">
                Could not load status — database may be in an inconsistent state. Use the reset above to fix it.
              </CardContent>
            </Card>
          )}

          {status && (
            <>
              <Card className="rounded-2xl border-card-border shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </span>
                  <CardTitle className="font-serif text-lg font-semibold">Admin Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground">Admin</span>
                      <span className="text-sm font-medium" data-testid="text-owner-admin-name">
                        {status.admin.name || "Not set up"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground">PIN Status</span>
                      <Badge variant={status.admin.hasPin ? "default" : "outline"} data-testid="badge-admin-pin-status">
                        {status.admin.hasPin ? (
                          <><Lock className="w-3 h-3 mr-1" /> PIN Set</>
                        ) : (
                          "No PIN"
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-card-border shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </span>
                  <CardTitle className="font-serif text-lg font-semibold">Family Members</CardTitle>
                </CardHeader>
                <CardContent>
                  {status.siblings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No siblings added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {status.siblings.map((s) => (
                        <div key={s.id} className="flex items-center justify-between flex-wrap gap-2" data-testid={`row-sibling-${s.id}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color || "#94a3b8" }} />
                            <span className="text-sm">{s.name}</span>
                          </div>
                          {s.hasPin && (
                            <Badge variant="outline" className="text-xs">
                              <Lock className="w-3 h-3 mr-1" /> PIN
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-card-border shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/12 text-accent">
                    <Package className="h-5 w-5" />
                  </span>
                  <CardTitle className="font-serif text-lg font-semibold">Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-xl border border-card-border bg-secondary/30 py-4">
                      <p className="font-serif text-3xl font-bold" data-testid="text-total-items">{status.items.total}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="rounded-xl border border-card-border bg-secondary/30 py-4">
                      <p className="font-serif text-3xl font-bold" data-testid="text-picked-items">{status.items.picked}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Picked</p>
                    </div>
                    <div className="rounded-xl border border-card-border bg-secondary/30 py-4">
                      <p className="font-serif text-3xl font-bold" data-testid="text-unpicked-items">{status.items.unpicked}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Unpicked</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-card-border shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/12 text-accent">
                    <Gavel className="h-5 w-5" />
                  </span>
                  <CardTitle className="font-serif text-lg font-semibold">Draft</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={draftStatusVariant as "default" | "secondary" | "outline"} data-testid="badge-draft-status">
                      {draftStatusText}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function OwnerPage() {
  return (
    <OwnerPasswordGate>
      {(password) => <OwnerDashboard password={password} />}
    </OwnerPasswordGate>
  );
}
