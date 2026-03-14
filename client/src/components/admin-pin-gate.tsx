import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, Shield, KeyRound, Copy, Check, Upload, ImagePlus, Trash2 } from "lucide-react";

interface AdminPinGateProps {
  children: React.ReactNode | ((verifiedPin: string) => React.ReactNode);
  title?: string;
  description?: string;
  redirectTo?: string;
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

  useEffect(() => {
    if (!isLoading && redirectTo && !isVerified) {
      setLocation(redirectTo);
    }
  }, [isLoading, redirectTo, isVerified, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (redirectTo && !isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recoveryCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 px-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-accent-foreground" />
              </div>
              <h2 className="font-serif text-2xl font-semibold mb-2" data-testid="text-recovery-title">Save Your Recovery Code</h2>
              <p className="text-muted-foreground text-sm">
                Write this code down and keep it safe. You'll need it if you ever forget your admin PIN.
              </p>
            </div>
            <div className="bg-muted rounded-md p-4 mb-4">
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
            <p className="text-sm text-muted-foreground text-center mb-4">
              This code can only be used once. A new code will be generated each time you reset your PIN.
            </p>
            <Button 
              onClick={dismissRecoveryCode}
              className="w-full"
              data-testid="button-continue-after-recovery"
            >
              I've Saved It - Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!adminStatus?.hasAdminPin) {
    if (isVerified) return <>{renderChildren()}</>;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-6 px-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-serif text-2xl font-semibold mb-2" data-testid="text-setup-title">Set Up Estate Draft</h2>
              <p className="text-muted-foreground text-sm">
                Welcome! Let's get your family's draft set up. Fill in the details below.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Your Full Name</Label>
                <Input
                  id="admin-name"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Tyler Dickman"
                  data-testid="input-admin-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-contact-name">Contact First Name</Label>
                <Input
                  id="setup-contact-name"
                  value={setupContactName}
                  onChange={(e) => setSetupContactName(e.target.value)}
                  placeholder="e.g. Tyler"
                  data-testid="input-setup-contact-name"
                />
                <p className="text-xs text-muted-foreground">
                  What your family calls you — shown in "contact Tyler" messages
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-family-name">Family Name</Label>
                <Input
                  id="setup-family-name"
                  value={setupFamilyName}
                  onChange={(e) => setSetupFamilyName(e.target.value)}
                  placeholder="e.g. Dickman"
                  data-testid="input-setup-family-name"
                />
                <p className="text-xs text-muted-foreground">
                  Your last name or family identifier — shown on the landing page
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImagePlus className="w-4 h-4" /> Hero Photo <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div 
                  className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
                    dragActive 
                      ? "border-primary bg-primary/5" 
                      : setupHeroPreview 
                        ? "border-muted" 
                        : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {setupHeroPreview ? (
                    <div className="relative group p-2">
                      <div className="w-full h-40 rounded-lg overflow-hidden bg-muted">
                        <img src={setupHeroPreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <div className="text-center py-10 px-6 cursor-pointer" onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) processFile(file);
                        };
                        input.click();
                      }}>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG or GIF (max. 10MB)</p>
                    </div>
                  )}
                  {dragActive && setupHeroPreview && (
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-primary z-10 text-primary font-medium">
                      Drop to replace image
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  A family photo to personalize the landing page. You can change this later in settings.
                </p>
              </div>
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Admin PIN</p>
                <p className="text-xs text-muted-foreground">
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
                    className="text-center text-xl tracking-widest"
                    data-testid="input-new-admin-pin"
                  />
                  <Input
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Confirm"
                    maxLength={4}
                    inputMode="numeric"
                    autoComplete="off"
                    className="text-center text-xl tracking-widest"
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
                className="w-full"
                data-testid="button-create-admin-pin"
              >
                {settingUp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Set Up Estate Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 px-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-serif text-2xl font-semibold mb-2" data-testid="text-recovery-flow-title">Reset Admin PIN</h2>
              <p className="text-muted-foreground text-sm">
                Enter your recovery code and set a new PIN.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Recovery Code</Label>
                <Input
                  value={recoveryInput}
                  onChange={(e) => setRecoveryInput(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  className="text-center text-lg font-mono tracking-wider"
                  autoComplete="off"
                  data-testid="input-recovery-code"
                />
              </div>
              <div className="space-y-2">
                <Label>New Admin Name (optional)</Label>
                <Input
                  value={recoveryName}
                  onChange={(e) => setRecoveryName(e.target.value)}
                  placeholder="Leave blank to keep current"
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
                  className="text-center text-2xl tracking-widest"
                  data-testid="input-recovery-new-pin"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New PIN</Label>
                <Input
                  value={recoveryConfirmPin}
                  onChange={(e) => setRecoveryConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Confirm PIN"
                  maxLength={4}
                  inputMode="numeric"
                  autoComplete="off"
                  className="text-center text-2xl tracking-widest"
                  data-testid="input-recovery-confirm-pin"
                />
              </div>
              {recoveryError && (
                <p className="text-sm text-destructive text-center" data-testid="text-recovery-error">{recoveryError}</p>
              )}
              <Button
                onClick={handleRecovery}
                disabled={!recoveryInput.trim() || recoveryNewPin.length !== 4 || recoveryConfirmPin.length !== 4 || recovering}
                className="w-full"
                data-testid="button-submit-recovery"
              >
                {recovering && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reset PIN
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowRecovery(false)}
                className="w-full"
                data-testid="button-back-to-pin"
              >
                Back to PIN Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isVerified) return <>{renderChildren()}</>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-serif text-2xl font-semibold mb-2" data-testid="text-pin-title">{title}</h2>
            <p className="text-muted-foreground text-sm">{description}</p>
            {adminStatus?.adminName && (
              <p className="text-sm mt-2" data-testid="text-admin-name">
                Admin: <span className="font-medium">{adminStatus.adminName}</span>
              </p>
            )}
          </div>
          <div className="space-y-4">
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
              className={`text-center text-2xl tracking-widest ${pinError ? "border-destructive" : ""}`}
              data-testid="input-admin-pin"
            />
            {pinError && (
              <p className="text-sm text-destructive text-center" data-testid="text-pin-error">Incorrect PIN. Please try again.</p>
            )}
            <Button
              onClick={verifyPin}
              disabled={pinInput.length !== 4 || verifying}
              className="w-full"
              data-testid="button-verify-admin-pin"
            >
              {verifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Unlock
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowRecovery(true)}
              className="w-full text-muted-foreground"
              data-testid="button-forgot-pin"
            >
              Forgot PIN? Use Recovery Code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
