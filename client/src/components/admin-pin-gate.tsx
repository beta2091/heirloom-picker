import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { Lock, Loader2, Shield, KeyRound, Copy, Check, Upload, ImagePlus, Trash2 } from "lucide-react";

interface AdminPinGateProps {
  children: React.ReactNode | ((verifiedPin: string) => React.ReactNode);
  title?: string;
  description?: string;
  redirectTo?: string;
}

/**
 * Centered single-card shell on the warm hero-wash, with the Evenkeep logo
 * lockup above the card. Purely presentational.
 */
function GateShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent"
      />
      <div className={`relative mx-auto flex min-h-screen w-full ${wide ? "max-w-lg" : "max-w-md"} flex-col items-center justify-center px-5 py-12 sm:px-6`}>
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="w-full rounded-2xl border border-card-border bg-card p-8 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AdminPinGate({ children, title = "Admin Access", description = "Enter the admin PIN to continue.", redirectTo }: AdminPinGateProps) {
  const [, setLocation] = useLocation();
  const [pinInput, setPinInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedPin, setVerifiedPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [adminName, setAdminName] = useState("");
  const [setupFamilyName, setSetupFamilyName] = useState("");
  const [setupContactName, setSetupContactName] = useState("");
  const [setupHeroPhoto, setSetupHeroPhoto] = useState<string | null>(null);
  const [setupHeroPreview, setSetupHeroPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryNewPin, setRecoveryNewPin] = useState("");
  const [recoveryConfirmPin, setRecoveryConfirmPin] = useState("");
  const [recoveryName, setRecoveryName] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const { data: adminStatus, isLoading } = useQuery<{ hasAdminPin: boolean; adminName: string | null }>({
    queryKey: ["/api/admin/status"],
  });

  // A logged-in organizer IS the admin — no PIN, no recovery code. Recovery is
  // handled by the standard account "forgot password" flow instead.
  const { data: authMe, isLoading: authLoading } = useQuery<{ organizer: { id: string; email: string; name: string | null } } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  const isOrganizer = !!authMe?.organizer;

  const verifyPin = async () => {
    if (pinInput.length !== 4) return;
    setVerifying(true);
    setPinError(false);
    try {
      const response = await apiRequest("POST", "/api/admin/verify-pin", { pin: pinInput });
      const data = await response.json();
      if (data.verified) {
        setIsVerified(true);
        setVerifiedPin(pinInput);
        // Stash for use by admin-only API calls from child components
        sessionStorage.setItem("admin-pin", pinInput);
      } else {
        setPinError(true);
      }
    } catch {
      setPinError(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setSetupError("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSetupError("Photo must be under 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSetupHeroPhoto(dataUrl);
      setSetupHeroPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const setupPin = async () => {
    setSetupError("");
    if (!adminName.trim()) {
      setSetupError("Please enter your full name");
      return;
    }
    if (!setupContactName.trim()) {
      setSetupError("Please enter your contact first name");
      return;
    }
    if (!setupFamilyName.trim()) {
      setSetupError("Please enter your family name");
      return;
    }
    if (newPin.length !== 4) {
      setSetupError("PIN must be 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      setSetupError("PINs don't match");
      return;
    }
    setSettingUp(true);
    try {
      const body: Record<string, any> = { 
        pin: newPin, 
        adminName: adminName.trim(),
        familyName: setupFamilyName.trim(),
        contactName: setupContactName.trim(),
      };
      if (setupHeroPhoto) {
        body.heroPhoto = setupHeroPhoto;
      }
      const response = await apiRequest("POST", "/api/admin/set-pin", body);
      const data = await response.json();
      if (data.success) {
        setRecoveryCode(data.recoveryCode);
        setVerifiedPin(newPin);
        sessionStorage.setItem("admin-pin", newPin);
        queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/family-settings"] });
      }
    } catch {
      setSetupError("Failed to set PIN");
    } finally {
      setSettingUp(false);
    }
  };

  const handleRecovery = async () => {
    setRecoveryError("");
    if (!recoveryInput.trim()) {
      setRecoveryError("Please enter the recovery code");
      return;
    }
    if (recoveryNewPin.length !== 4) {
      setRecoveryError("PIN must be 4 digits");
      return;
    }
    if (recoveryNewPin !== recoveryConfirmPin) {
      setRecoveryError("PINs don't match");
      return;
    }
    setRecovering(true);
    try {
      const response = await apiRequest("POST", "/api/admin/recover", {
        recoveryCode: recoveryInput.trim(),
        newPin: recoveryNewPin,
        adminName: recoveryName.trim() || undefined,
      });
      const data = await response.json();
      if (data.success) {
        setRecoveryCode(data.recoveryCode);
        setVerifiedPin(recoveryNewPin);
        sessionStorage.setItem("admin-pin", recoveryNewPin);
        setShowRecovery(false);
        queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] });
      }
    } catch {
      setRecoveryError("Invalid recovery code. Please try again.");
    } finally {
      setRecovering(false);
    }
  };

  const copyRecoveryCode = () => {
    if (recoveryCode) {
      navigator.clipboard.writeText(recoveryCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const dismissRecoveryCode = () => {
    setRecoveryCode(null);
    setIsVerified(true);
  };

  const renderChildren = () => {
    if (typeof children === "function") return children(verifiedPin);
    return children;
  };

  // On mount, if a PIN was verified in another page this session, auto-verify
  // here instead of forcing a re-prompt or redirect. This is what makes
  // "Go to Draft" work after unlocking admin.
  useEffect(() => {
    if (isVerified) return;
    const stashed = sessionStorage.getItem("admin-pin");
    if (!stashed || stashed.length !== 4) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await apiRequest("POST", "/api/admin/verify-pin", { pin: stashed });
        const data = await response.json();
        if (!cancelled && data.verified) {
          setIsVerified(true);
          setVerifiedPin(stashed);
        }
      } catch {
        // fall through to normal gate UI
      }
    })();
    return () => { cancelled = true; };
  }, [isVerified]);

  useEffect(() => {
    // A logged-in organizer is always allowed — never bounce them.
    if (!isLoading && !authLoading && !isOrganizer && redirectTo && !isVerified) {
      // Give the auto-verify effect above a tick to resolve before redirecting.
      // Only bounce after we've confirmed there's no usable session PIN.
      const stashed = sessionStorage.getItem("admin-pin");
      if (stashed && stashed.length === 4) return;
      setLocation(redirectTo);
    }
  }, [isLoading, authLoading, isOrganizer, redirectTo, isVerified, setLocation]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Logged-in organizer: straight through, no PIN and no setup wizard.
  if (isOrganizer) return <>{renderChildren()}</>;

  if (redirectTo && !isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recoveryCode) {
    return (
      <GateShell>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/12 text-accent">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight" data-testid="text-recovery-title">Save your recovery code</h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Write this code down and keep it safe. You'll need it if you ever forget your admin PIN.
          </p>
        </div>
        <div className="mb-4 rounded-xl border border-card-border bg-secondary/50 p-5">
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-3xl font-bold tracking-wider" data-testid="text-recovery-code">
              {recoveryCode}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={copyRecoveryCode}
              data-testid="button-copy-recovery"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <p className="mb-5 text-center text-sm text-muted-foreground">
          This code can only be used once. A new code will be generated each time you reset your PIN.
        </p>
        <Button
          onClick={dismissRecoveryCode}
          size="lg"
          className="min-h-12 w-full px-8 text-base shadow-md"
          data-testid="button-continue-after-recovery"
        >
          I've saved it — continue
        </Button>
      </GateShell>
    );
  }

  if (!adminStatus?.hasAdminPin) {
    if (isVerified) return <>{renderChildren()}</>;

    return (
      <GateShell wide>
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Welcome</p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight" data-testid="text-setup-title">Set up Evenkeep</h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Let's get your family's draft set up. A few gentle details and you're ready.
          </p>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="admin-name">Your full name</Label>
            <Input
              id="admin-name"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="e.g. Tyler Dickman"
              className="min-h-12 text-base"
              data-testid="input-admin-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-contact-name">Contact first name</Label>
            <Input
              id="setup-contact-name"
              value={setupContactName}
              onChange={(e) => setSetupContactName(e.target.value)}
              placeholder="e.g. Tyler"
              className="min-h-12 text-base"
              data-testid="input-setup-contact-name"
            />
            <p className="text-sm text-muted-foreground">
              What your family calls you — shown in "contact Tyler" messages
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-family-name">Family name</Label>
            <Input
              id="setup-family-name"
              value={setupFamilyName}
              onChange={(e) => setSetupFamilyName(e.target.value)}
              placeholder="e.g. Dickman"
              className="min-h-12 text-base"
              data-testid="input-setup-family-name"
            />
            <p className="text-sm text-muted-foreground">
              Your last name or family identifier — shown on the landing page
            </p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImagePlus className="w-4 h-4" /> Hero photo <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <div
              className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : setupHeroPreview
                    ? "border-card-border"
                    : "border-muted-foreground/20 hover:border-primary/50 hover:bg-secondary/40"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {setupHeroPreview ? (
                <div className="group relative p-2">
                  <div className="h-40 w-full overflow-hidden rounded-lg bg-secondary">
                    <img src={setupHeroPreview} alt="Preview" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                     <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) processFile(file);
                          };
                          input.click();
                        }}
                        data-testid="button-setup-hero-upload"
                      >
                        <Upload className="w-4 h-4" /> Replace
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => { setSetupHeroPhoto(null); setSetupHeroPreview(null); }}
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="cursor-pointer px-6 py-10 text-center" onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) processFile(file);
                    };
                    input.click();
                  }}>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="mb-1 text-base font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG or GIF (max. 10MB)</p>
                </div>
              )}
              {dragActive && setupHeroPreview && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-primary bg-primary/20 font-medium text-primary backdrop-blur-sm">
                  Drop to replace image
                </div>
              )}
            </div>
            <p className="pt-1 text-sm text-muted-foreground">
              A family photo to personalize the landing page. You can change this later in settings.
            </p>
          </div>
          <div className="space-y-3 border-t border-card-border pt-5">
            <p className="text-base font-semibold">Admin PIN</p>
            <p className="text-sm text-muted-foreground">
              Create a 4-digit PIN to protect the admin panel. Only you should know this.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="PIN"
                maxLength={4}
                inputMode="numeric"
                autoComplete="off"
                className="min-h-14 text-center text-2xl tracking-widest"
                data-testid="input-new-admin-pin"
              />
              <Input
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Confirm"
                maxLength={4}
                inputMode="numeric"
                autoComplete="off"
                className="min-h-14 text-center text-2xl tracking-widest"
                data-testid="input-confirm-admin-pin"
              />
            </div>
          </div>
          {setupError && (
            <p className="text-sm text-destructive text-center" data-testid="text-setup-error">{setupError}</p>
          )}
          <Button
            onClick={setupPin}
            disabled={newPin.length !== 4 || confirmPin.length !== 4 || !adminName.trim() || !setupContactName.trim() || !setupFamilyName.trim() || settingUp}
            size="lg"
            className="min-h-12 w-full px-8 text-base shadow-md"
            data-testid="button-create-admin-pin"
          >
            {settingUp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Set up Evenkeep
          </Button>
        </div>
      </GateShell>
    );
  }

  if (showRecovery) {
    return (
      <GateShell>
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight" data-testid="text-recovery-flow-title">Reset admin PIN</h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Enter your recovery code and set a new PIN.
          </p>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Recovery code</Label>
            <Input
              value={recoveryInput}
              onChange={(e) => setRecoveryInput(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              className="min-h-12 text-center font-mono text-lg tracking-wider"
              autoComplete="off"
              data-testid="input-recovery-code"
            />
          </div>
          <div className="space-y-2">
            <Label>New admin name (optional)</Label>
            <Input
              value={recoveryName}
              onChange={(e) => setRecoveryName(e.target.value)}
              placeholder="Leave blank to keep current"
              className="min-h-12 text-base"
              data-testid="input-recovery-name"
            />
          </div>
          <div className="space-y-2">
            <Label>New PIN</Label>
            <Input
              value={recoveryNewPin}
              onChange={(e) => setRecoveryNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Enter 4-digit PIN"
              maxLength={4}
              inputMode="numeric"
              autoComplete="off"
              className="min-h-14 text-center text-2xl tracking-widest"
              data-testid="input-recovery-new-pin"
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm new PIN</Label>
            <Input
              value={recoveryConfirmPin}
              onChange={(e) => setRecoveryConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Confirm PIN"
              maxLength={4}
              inputMode="numeric"
              autoComplete="off"
              className="min-h-14 text-center text-2xl tracking-widest"
              data-testid="input-recovery-confirm-pin"
            />
          </div>
          {recoveryError && (
            <p className="text-sm text-destructive text-center" data-testid="text-recovery-error">{recoveryError}</p>
          )}
          <Button
            onClick={handleRecovery}
            disabled={!recoveryInput.trim() || recoveryNewPin.length !== 4 || recoveryConfirmPin.length !== 4 || recovering}
            size="lg"
            className="min-h-12 w-full px-8 text-base shadow-md"
            data-testid="button-submit-recovery"
          >
            {recovering && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Reset PIN
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowRecovery(false)}
            className="min-h-12 w-full text-base"
            data-testid="button-back-to-pin"
          >
            Back to PIN entry
          </Button>
        </div>
      </GateShell>
    );
  }

  if (isVerified) return <>{renderChildren()}</>;

  return (
    <GateShell>
      <div className="mb-7 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-3xl font-bold tracking-tight" data-testid="text-pin-title">{title}</h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
        {adminStatus?.adminName && (
          <p className="mt-3 text-base" data-testid="text-admin-name">
            Admin: <span className="font-medium text-foreground">{adminStatus.adminName}</span>
          </p>
        )}
      </div>
      <div className="space-y-5">
        <Input
          value={pinInput}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
            setPinInput(value);
            setPinError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && verifyPin()}
          placeholder="Enter 4-digit PIN"
          maxLength={4}
          inputMode="numeric"
          autoComplete="off"
          className={`min-h-14 text-center text-2xl tracking-widest ${pinError ? "border-destructive" : ""}`}
          data-testid="input-admin-pin"
        />
        {pinError && (
          <p className="text-sm text-destructive text-center" data-testid="text-pin-error">Incorrect PIN. Please try again.</p>
        )}
        <Button
          onClick={verifyPin}
          disabled={pinInput.length !== 4 || verifying}
          size="lg"
          className="min-h-12 w-full px-8 text-base shadow-md"
          data-testid="button-verify-admin-pin"
        >
          {verifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Unlock
        </Button>
        <Button
          variant="ghost"
          onClick={() => setShowRecovery(true)}
          className="min-h-12 w-full text-base text-muted-foreground"
          data-testid="button-forgot-pin"
        >
          Forgot PIN? Use recovery code
        </Button>
      </div>
    </GateShell>
  );
}
