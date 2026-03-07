import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Shield className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
          <CardTitle className="font-serif text-xl" data-testid="text-owner-login-title">Owner Access</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the master password to continue
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="owner-password">Master Password</Label>
              <Input
                id="owner-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="Enter master password"
                data-testid="input-owner-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" data-testid="text-owner-error">{error}</p>
            )}
            <Button
              onClick={handleVerify}
              disabled={!password || loading}
              className="w-full"
              data-testid="button-owner-unlock"
            >
              {loading ? "Verifying..." : "Unlock"}
            </Button>
          </div>
        </CardContent>
      </Card>
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

  const { data: status, isLoading } = useQuery<OwnerStatus>({
    queryKey: ["/api/owner/status", password],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/owner/status", { password });
      return res.json();
    },
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status) return null;

  const draftStatusText = status.draft.isComplete
    ? "Complete"
    : status.draft.isActive
      ? `Active (Round ${status.draft.currentRound})`
      : "Not Started";

  const draftStatusVariant = status.draft.isComplete
    ? "default"
    : status.draft.isActive
      ? "secondary"
      : "outline";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-7 h-7 text-muted-foreground" />
          <div>
            <h1 className="font-serif text-2xl font-semibold" data-testid="text-owner-title">Owner Dashboard</h1>
            <p className="text-sm text-muted-foreground">App management and admin support</p>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Admin Status</CardTitle>
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

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Family Members</CardTitle>
            </CardHeader>
            <CardContent>
              {status.siblings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No siblings added yet</p>
              ) : (
                <div className="space-y-2">
                  {status.siblings.map((s) => (
                    <div key={s.id} className="flex items-center justify-between flex-wrap gap-2" data-testid={`row-sibling-${s.id}`}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: s.color || "#94a3b8" }}
                        />
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

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Package className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold" data-testid="text-total-items">{status.items.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold" data-testid="text-picked-items">{status.items.picked}</p>
                  <p className="text-xs text-muted-foreground">Picked</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold" data-testid="text-unpicked-items">{status.items.unpicked}</p>
                  <p className="text-xs text-muted-foreground">Unpicked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Gavel className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Draft</CardTitle>
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

          <Card className="border-destructive/30">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-base">Admin Reset</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                If the admin is locked out and lost their recovery code, you can reset the admin PIN here. The next person to visit the admin page will set up a new PIN and become the admin.
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
        </div>
      </div>
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
