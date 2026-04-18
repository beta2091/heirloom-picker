import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Heart, Plus, Camera, Users, Trash2, ArrowLeft, ExternalLink, Image as ImageIcon, Loader2, Upload, Pencil, Mic, Volume2, X, Lock, Settings, Share, Shield, KeyRound, UserCog, Home, ImagePlus, User, CheckCircle2, Circle, Link2, RefreshCcw } from "lucide-react";
import { getInitials } from "@/lib/utils-initials";
import { HelpTooltip } from "@/components/help-tooltip";
import { AdminPinGate } from "@/components/admin-pin-gate";
interface ItemResponse {
  id: string;
  name: string;
  description: string | null;
  hasImage: boolean;
  hasAudio: boolean;
  pickedBySiblingId: string | null;
  pickRound: number | null;
}

interface SiblingResponse {
  id: string;
  name: string;
  draftOrder: number;
  shareToken: string;
  color: string;
  hasPin: boolean;
}

const SIBLING_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

function AdminDashboard({ verifiedPin }: { verifiedPin: string }) {
  const { data: dashboard, isLoading } = useQuery<{
    siblings: Array<{ id: string, name: string, color: string, wishlistSubmitted: boolean, draftOrder: number }>,
    draft: { isActive: boolean, isComplete: boolean, currentRound: number, currentPickIndex: number }
  }>({
    queryKey: ["/api/admin/dashboard"],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/admin/dashboard", { pin: verifiedPin });
      return res.json();
    }
  });

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (!dashboard) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Family Readiness
            </CardTitle>
            <CardDescription>Who has locked in their lists?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.siblings.length === 0 ? (
              <p className="text-muted-foreground text-sm">No family members added yet.</p>
            ) : (
              dashboard.siblings.map(s => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: s.color }}>
                      {getInitials(s.name)}
                    </div>
                    <span className="font-medium">{s.name}</span>
                  </div>
                  {s.wishlistSubmitted ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Ready</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground bg-muted/50"><Circle className="w-3 h-3 mr-1" /> Waiting</Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Share className="w-5 h-5 text-primary" /> Master Draft
            </CardTitle>
            <CardDescription>Run the draft live for everyone to see</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 text-center">
            {dashboard.draft.isComplete ? (
              <div className="mb-6">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-lg">Draft is Complete!</h3>
                <p className="text-sm text-muted-foreground mt-1">All items have been distributed.</p>
              </div>
            ) : dashboard.draft.isActive ? (
              <div className="mb-6">
                <div className="relative inline-flex mb-4">
                  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                  <Badge className="bg-green-500 hover:bg-green-600 px-3 py-1 text-sm relative z-10">Draft in Progress</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Round {dashboard.draft.currentRound}, Pick {dashboard.draft.currentPickIndex + 1}</p>
              </div>
            ) : (
              <div className="mb-6">
                <Badge variant="secondary" className="px-3 py-1 text-sm mb-4">Not Started</Badge>
                <p className="text-sm text-muted-foreground">Waiting on everyone to finish their wishlists.</p>
              </div>
            )}
            <div className="space-y-2">
              <Link href="/lottery">
                <Button size="lg" variant="outline" className="w-full gap-2">
                  Draft Lottery (pick order) <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/draft-master">
                <Button size="lg" className="w-full gap-2">
                  Open Master Draft View <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FamilySettings({ verifiedPin }: { verifiedPin: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [familyNameVal, setFamilyNameVal] = useState("");
  const [contactNameVal, setContactNameVal] = useState("");
  const [heroPhotoPreview, setHeroPhotoPreview] = useState<string | null>(null);
  const [heroPhotoData, setHeroPhotoData] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const heroPhotoRef = useRef<HTMLInputElement>(null);

  const { data: adminStatus } = useQuery<{ hasAdminPin: boolean; adminName: string | null; familyName: string | null; contactName: string | null; hasHeroPhoto: boolean }>({
    queryKey: ["/api/admin/status"],
  });

  useEffect(() => {
    if (adminStatus && !initialized) {
      setFamilyNameVal(adminStatus.familyName || "");
      setContactNameVal(adminStatus.contactName || "");
      setInitialized(true);
    }
  }, [adminStatus, initialized]);

  const handleHeroPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast({ title: "Photo must be under 10MB", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = () => { const dataUrl = reader.result as string; setHeroPhotoPreview(dataUrl); setHeroPhotoData(dataUrl); };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, any> = { pin: verifiedPin, familyName: familyNameVal.trim(), contactName: contactNameVal.trim() };
      if (heroPhotoData !== null) body.heroPhoto = heroPhotoData;
      await apiRequest("POST", "/api/admin/family-settings", body);
      toast({ title: "Family settings saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/family-settings"] });
      setHeroPhotoData(null);
    } catch { toast({ title: "Failed to save settings", variant: "destructive" }); } finally { setSaving(false); }
  };

  const handleRemovePhoto = async () => {
    setSaving(true);
    try {
      await apiRequest("POST", "/api/admin/family-settings", { pin: verifiedPin, heroPhoto: "" });
      toast({ title: "Hero photo removed" });
      setHeroPhotoPreview(null); setHeroPhotoData(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/family-settings"] });
    } catch { toast({ title: "Failed to remove photo", variant: "destructive" }); } finally { setSaving(false); }
  };

  return (
    <section className="mt-8 pt-8 border-t">
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-semibold flex items-center gap-2"><Home className="w-6 h-6 text-primary" /> Family Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Customize how the app appears to your family</p>
      </div>
      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="family-name" className="flex items-center gap-2"><Users className="w-4 h-4" /> Family Name</Label>
            <Input id="family-name" value={familyNameVal} onChange={(e) => setFamilyNameVal(e.target.value)} placeholder='e.g. "Dickman" or "Smith"' data-testid="input-family-name" />
            <p className="text-xs text-muted-foreground">Used on the landing page and throughout the app</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-name" className="flex items-center gap-2"><User className="w-4 h-4" /> Contact Name</Label>
            <Input id="contact-name" value={contactNameVal} onChange={(e) => setContactNameVal(e.target.value)} placeholder='e.g. "Tyler"' data-testid="input-contact-name" />
            <p className="text-xs text-muted-foreground">Shown in "contact [name]" messages for help</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><ImagePlus className="w-4 h-4" /> Hero Photo</Label>
          <div className="flex items-start gap-4">
            {(heroPhotoPreview || adminStatus?.hasHeroPhoto) && (
              <div className="w-32 h-24 rounded-lg overflow-hidden border shrink-0">
                <img src={heroPhotoPreview || "/api/family-settings/hero-photo"} alt="Hero preview" className="w-full h-full object-cover" data-testid="img-hero-preview" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => heroPhotoRef.current?.click()} data-testid="button-upload-hero">
                <Upload className="w-4 h-4" />{adminStatus?.hasHeroPhoto || heroPhotoPreview ? "Replace Photo" : "Upload Photo"}
              </Button>
              {(adminStatus?.hasHeroPhoto || heroPhotoPreview) && (
                <Button variant="ghost" size="sm" className="text-destructive gap-2" onClick={handleRemovePhoto} disabled={saving} data-testid="button-remove-hero">
                  <Trash2 className="w-4 h-4" /> Remove
                </Button>
              )}
              <p className="text-xs text-muted-foreground">Replaces the default photo on the landing page</p>
            </div>
          </div>
          <input ref={heroPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleHeroPhotoSelect} />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2" data-testid="button-save-family-settings">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Family Settings
        </Button>
      </div>
    </section>
  );
}

function AdminSettings({ verifiedPin }: { verifiedPin: string }) {
  const { toast } = useToast();
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [changeNameOpen, setChangeNameOpen] = useState(false);
  const [resetAdminOpen, setResetAdminOpen] = useState(false);
  const [newPinVal, setNewPinVal] = useState("");
  const [confirmPinVal, setConfirmPinVal] = useState("");
  const [newNameVal, setNewNameVal] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: adminStatus } = useQuery<{ hasAdminPin: boolean; adminName: string | null }>({ queryKey: ["/api/admin/status"] });

  const handleChangePin = async () => {
    if (newPinVal.length !== 4 || newPinVal !== confirmPinVal) return;
    setSaving(true);
    try {
      const response = await apiRequest("POST", "/api/admin/set-pin", { pin: newPinVal, currentPin: verifiedPin });
      const data = await response.json();
      if (data.success) { toast({ title: "PIN updated. New recovery code: " + data.recoveryCode, description: "Save your new recovery code!" }); setChangePinOpen(false); setNewPinVal(""); setConfirmPinVal(""); }
    } catch { toast({ title: "Failed to update PIN", variant: "destructive" }); } finally { setSaving(false); }
  };

  const handleChangeName = async () => {
    if (!newNameVal.trim()) return;
    setSaving(true);
    try {
      const response = await apiRequest("POST", "/api/admin/update-name", { adminName: newNameVal.trim(), pin: verifiedPin });
      const data = await response.json();
      if (data.success) { queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] }); toast({ title: "Admin name updated" }); setChangeNameOpen(false); setNewNameVal(""); }
    } catch { toast({ title: "Failed to update name", variant: "destructive" }); } finally { setSaving(false); }
  };

  const handleResetAdmin = async () => {
    setSaving(true);
    try {
      const response = await apiRequest("POST", "/api/admin/reset", { pin: verifiedPin });
      const data = await response.json();
      if (data.success) { queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] }); toast({ title: "Admin access has been reset." }); setResetAdminOpen(false); window.location.reload(); }
    } catch { toast({ title: "Failed to reset admin", variant: "destructive" }); } finally { setSaving(false); }
  };

  return (
    <section className="mt-8 pt-8 border-t">
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-semibold flex items-center gap-2"><UserCog className="w-6 h-6 text-primary" /> Admin Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage admin access and security settings</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-start gap-3"><div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0"><Shield className="w-5 h-5 text-primary" /></div><div className="flex-1 min-w-0"><h3 className="font-medium">Current Admin</h3><p className="text-sm text-muted-foreground truncate" data-testid="text-current-admin">{adminStatus?.adminName || "Not set"}</p><Button variant="ghost" size="sm" className="mt-2 gap-1" onClick={() => { setNewNameVal(adminStatus?.adminName || ""); setChangeNameOpen(true); }} data-testid="button-change-admin-name"><Pencil className="w-3 h-3" /> Change Name</Button></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-start gap-3"><div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0"><Lock className="w-5 h-5 text-primary" /></div><div className="flex-1 min-w-0"><h3 className="font-medium">Admin PIN</h3><p className="text-sm text-muted-foreground">Change your admin PIN</p><Button variant="ghost" size="sm" className="mt-2 gap-1" onClick={() => setChangePinOpen(true)} data-testid="button-change-admin-pin"><KeyRound className="w-3 h-3" /> Change PIN</Button></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-start gap-3"><div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center shrink-0"><Settings className="w-5 h-5 text-destructive" /></div><div className="flex-1 min-w-0"><h3 className="font-medium">Transfer Admin</h3><p className="text-sm text-muted-foreground">Reset admin so someone else can set up</p><Button variant="ghost" size="sm" className="mt-2 gap-1 text-destructive" onClick={() => setResetAdminOpen(true)} data-testid="button-reset-admin"><Settings className="w-3 h-3" /> Reset Admin</Button></div></div></CardContent></Card>
      </div>

      <Dialog open={changeNameOpen} onOpenChange={setChangeNameOpen}>
        <DialogContent><DialogHeader><DialogTitle className="font-serif">Change Admin Name</DialogTitle><DialogDescription>Update who is shown as the admin.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4"><div className="space-y-2"><Label>New Name</Label><Input value={newNameVal} onChange={(e) => setNewNameVal(e.target.value)} placeholder="Enter new admin name" data-testid="input-new-admin-name" /></div>
            <Button onClick={handleChangeName} disabled={!newNameVal.trim() || saving} className="w-full" data-testid="button-save-admin-name">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={changePinOpen} onOpenChange={setChangePinOpen}>
        <DialogContent><DialogHeader><DialogTitle className="font-serif">Change Admin PIN</DialogTitle><DialogDescription>Set a new 4-digit admin PIN. A new recovery code will be generated.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>New PIN</Label><Input value={newPinVal} onChange={(e) => setNewPinVal(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Enter 4-digit PIN" maxLength={4} inputMode="numeric" autoComplete="off" className="text-center text-2xl tracking-widest" data-testid="input-change-pin" /></div>
            <div className="space-y-2"><Label>Confirm New PIN</Label><Input value={confirmPinVal} onChange={(e) => setConfirmPinVal(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Confirm PIN" maxLength={4} inputMode="numeric" autoComplete="off" className="text-center text-2xl tracking-widest" data-testid="input-change-pin-confirm" /></div>
            {newPinVal.length === 4 && confirmPinVal.length === 4 && newPinVal !== confirmPinVal && <p className="text-sm text-destructive text-center">PINs don't match</p>}
            <Button onClick={handleChangePin} disabled={newPinVal.length !== 4 || newPinVal !== confirmPinVal || saving} className="w-full" data-testid="button-save-new-pin">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Update PIN</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resetAdminOpen} onOpenChange={setResetAdminOpen}>
        <DialogContent><DialogHeader><DialogTitle className="font-serif">Reset Admin Access</DialogTitle><DialogDescription>This will remove the current admin PIN and name, allowing anyone to set up a new admin. Are you sure?</DialogDescription></DialogHeader>
          <div className="flex gap-2 pt-4"><Button variant="outline" onClick={() => setResetAdminOpen(false)} className="flex-1">Cancel</Button><Button variant="destructive" onClick={handleResetAdmin} disabled={saving} className="flex-1" data-testid="button-confirm-reset-admin">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Reset Admin</Button></div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const [siblingDialogOpen, setSiblingDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [newSiblingName, setNewSiblingName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<Array<{ file: File; name: string; preview: string }>>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ processed: 0, uploaded: 0, total: 0, phase: "" as "" | "processing" | "uploading" | "done" });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemResponse | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemDescription, setEditItemDescription] = useState("");
  const [editItemImage, setEditItemImage] = useState<string | null>(null);
  const [newItemAudio, setNewItemAudio] = useState<string | null>(null);
  const [editItemAudio, setEditItemAudio] = useState<string | null>(null);
  const [editSiblingDialogOpen, setEditSiblingDialogOpen] = useState(false);
  const [editingSibling, setEditingSibling] = useState<SiblingResponse | null>(null);
  const [editSiblingName, setEditSiblingName] = useState("");
  const [editSiblingColor, setEditSiblingColor] = useState("");
  const [editSiblingPin, setEditSiblingPin] = useState("");
  const [clearSiblingPin, setClearSiblingPin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const editAudioInputRef = useRef<HTMLInputElement>(null);

  const adminPin = sessionStorage.getItem("admin-pin") || "";
  const { data: siblings = [], isLoading: siblingsLoading } = useQuery<SiblingResponse[]>({
    queryKey: ["/api/admin/siblings", adminPin],
    queryFn: async () => {
      const res = await fetch("/api/admin/siblings", { headers: { "x-admin-pin": adminPin } });
      if (!res.ok) throw new Error("Failed to fetch siblings");
      return res.json();
    },
    enabled: !!adminPin,
  });
  const { data: items = [], isLoading: itemsLoading } = useQuery<ItemResponse[]>({ queryKey: ["/api/items"] });

  const invalidateSiblings = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/siblings"] });
    queryClient.invalidateQueries({ queryKey: ["/api/siblings"] });
  };

  const addSiblingMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => apiRequest("POST", "/api/siblings", { ...data, adminPin }),
    onSuccess: () => { invalidateSiblings(); setSiblingDialogOpen(false); setNewSiblingName(""); toast({ title: "Family member added" }); },
    onError: () => toast({ title: "Failed to add family member", variant: "destructive" }),
  });

  const deleteSiblingMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/siblings/${id}`, { adminPin }),
    onSuccess: () => { invalidateSiblings(); toast({ title: "Family member removed" }); },
  });

  const rotateTokenMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/siblings/${id}/rotate-token`, { adminPin });
      return res.json();
    },
    onSuccess: (updated: SiblingResponse) => {
      invalidateSiblings();
      navigator.clipboard.writeText(`${window.location.origin}/join/${updated.shareToken}`);
      toast({ title: "New link generated & copied", description: `Old link for ${updated.name} no longer works` });
    },
    onError: () => toast({ title: "Failed to rotate link", variant: "destructive" }),
  });

  const updateSiblingMutation = useMutation({
    mutationFn: async (data: { id: string; name?: string; color?: string; pin?: string | null }) => apiRequest("PUT", `/api/siblings/${data.id}`, { name: data.name, color: data.color, pin: data.pin, adminPin }),
    onSuccess: () => { invalidateSiblings(); setEditSiblingDialogOpen(false); setEditingSibling(null); toast({ title: "Family member updated" }); },
    onError: () => toast({ title: "Failed to update family member", variant: "destructive" }),
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; imageUrl?: string; audioUrl?: string }) => apiRequest("POST", "/api/items", { ...data, adminPin }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/items"] }); setItemDialogOpen(false); setNewItemName(""); setNewItemDescription(""); setNewItemImage(null); setNewItemAudio(null); toast({ title: "Item added" }); },
    onError: () => toast({ title: "Failed to add item", variant: "destructive" }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/items/${id}`, { adminPin }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/items"] }); toast({ title: "Item removed" }); },
    onError: (error) => { console.error("Delete failed:", error); toast({ title: "Failed to remove item", variant: "destructive" }); },
  });

  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [wipeAllDialogOpen, setWipeAllDialogOpen] = useState(false);

  const deleteAllItemsMutation = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", "/api/items", { adminPin }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/items"] }); setDeleteAllDialogOpen(false); toast({ title: "All items deleted" }); },
    onError: () => toast({ title: "Failed to delete items", variant: "destructive" }),
  });

  const wipeAllMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/admin/wipe-all", { adminPin }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      invalidateSiblings();
      setWipeAllDialogOpen(false);
      toast({ title: "Everything cleared", description: "Fresh start. Add family and items to begin." });
    },
    onError: () => toast({ title: "Failed to clear data", variant: "destructive" }),
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description?: string | null; imageUrl?: string | null; audioUrl?: string | null }) => apiRequest("PUT", `/api/items/${data.id}`, { name: data.name, description: data.description, imageUrl: data.imageUrl, audioUrl: data.audioUrl, adminPin }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/items"] }); setEditDialogOpen(false); setEditingItem(null); toast({ title: "Item updated" }); },
    onError: () => toast({ title: "Failed to update item", variant: "destructive" }),
  });

  const compressImage = (file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) { const ratio = Math.min(maxWidth / width, maxHeight / height); width = Math.round(width * ratio); height = Math.round(height * ratio); }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
      img.src = url;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { try { setNewItemImage(await compressImage(file)); } catch { toast({ title: "Failed to process image", variant: "destructive" }); } }
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { try { setEditItemImage(await compressImage(file)); } catch { toast({ title: "Failed to process image", variant: "destructive" }); } }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        if (audio.duration > 180) { toast({ title: "Audio too long", description: "Please select an audio file 3 minutes or less.", variant: "destructive" }); URL.revokeObjectURL(audio.src); return; }
        URL.revokeObjectURL(audio.src);
        const reader = new FileReader();
        reader.onloadend = () => setNewItemAudio(reader.result as string);
        reader.readAsDataURL(file);
      };
    }
  };

  const handleEditAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        if (audio.duration > 180) { toast({ title: "Audio too long", description: "Please select an audio file 3 minutes or less.", variant: "destructive" }); URL.revokeObjectURL(audio.src); return; }
        URL.revokeObjectURL(audio.src);
        const reader = new FileReader();
        reader.onloadend = () => setEditItemAudio(reader.result as string);
        reader.readAsDataURL(file);
      };
    }
  };

  const openEditDialog = (item: ItemResponse) => {
    setEditingItem(item); setEditItemName(item.name); setEditItemDescription(item.description || "");
    setEditItemImage(item.hasImage ? `/api/items/${item.id}/image` : null);
    setEditItemAudio(item.hasAudio ? `/api/items/${item.id}/audio` : null);
    setEditDialogOpen(true);
  };

  const handleUpdateItem = () => {
    if (!editingItem || !editItemName.trim()) return;
    const updates: { id: string; name: string; description?: string | null; imageUrl?: string | null; audioUrl?: string | null } = { id: editingItem.id, name: editItemName.trim(), description: editItemDescription.trim() || null };
    if (editItemImage?.startsWith("data:")) updates.imageUrl = editItemImage;
    else if (editItemImage === null) updates.imageUrl = null;
    if (editItemAudio?.startsWith("data:")) updates.audioUrl = editItemAudio;
    else if (editItemAudio === null) updates.audioUrl = null;
    updateItemMutation.mutate(updates);
  };

  const handleAddSibling = () => {
    if (!newSiblingName.trim()) return;
    addSiblingMutation.mutate({ name: newSiblingName.trim(), color: SIBLING_COLORS[siblings.length % SIBLING_COLORS.length] });
  };

  const openEditSiblingDialog = (sibling: SiblingResponse) => {
    setEditingSibling(sibling); setEditSiblingName(sibling.name); setEditSiblingColor(sibling.color); setEditSiblingPin(""); setClearSiblingPin(false); setEditSiblingDialogOpen(true);
  };

  const handleUpdateSibling = () => {
    if (!editingSibling || !editSiblingName.trim()) return;
    const updates: { id: string; name: string; color: string; pin?: string | null } = { id: editingSibling.id, name: editSiblingName.trim(), color: editSiblingColor };
    if (clearSiblingPin) updates.pin = null;
    else if (editSiblingPin.trim().length === 4) updates.pin = editSiblingPin.trim();
    updateSiblingMutation.mutate(updates);
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    addItemMutation.mutate({ name: newItemName.trim(), description: newItemDescription.trim() || undefined, imageUrl: newItemImage || undefined, audioUrl: newItemAudio || undefined });
  };

  const formatFileName = (fileName: string) => {
    return fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  };

  const handleBulkFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
    if (files.length > 20) {
      setBulkUploadDialogOpen(true); setBulkUploading(true); setBulkProgress({ processed: 0, uploaded: 0, total: files.length, phase: "processing" });
      let successCount = 0;
      const pendingUploads: Array<{ name: string; preview: string }> = [];
      let processedCount = 0;
      for (let i = 0; i < files.length; i += 5) {
        const results = await Promise.allSettled(files.slice(i, i + 5).map(async (file) => ({ name: formatFileName(file.name), preview: await compressImage(file) })));
        for (const result of results) { processedCount++; if (result.status === "fulfilled") pendingUploads.push(result.value); }
        setBulkProgress(prev => ({ ...prev, processed: processedCount }));
      }
      const uploadTotal = pendingUploads.length;
      const processingFailures = files.length - uploadTotal;
      setBulkProgress(prev => ({ ...prev, total: uploadTotal, uploaded: 0, phase: "uploading" }));
      for (let i = 0; i < uploadTotal; i += 5) {
        const results = await Promise.allSettled(pendingUploads.slice(i, i + 5).map(({ name, preview }) => apiRequest("POST", "/api/items", { name, imageUrl: preview, adminPin })));
        for (const result of results) { if (result.status === "fulfilled") successCount++; }
        setBulkProgress(prev => ({ ...prev, uploaded: Math.min(i + 5, uploadTotal) }));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setBulkUploading(false); setBulkUploadDialogOpen(false); setBulkFiles([]); setBulkProgress({ processed: 0, uploaded: 0, total: 0, phase: "" });
      const totalFailures = files.length - successCount;
      let description: string | undefined;
      if (totalFailures > 0) {
        const parts: string[] = [];
        if (processingFailures > 0) parts.push(`${processingFailures} couldn't be processed`);
        const uploadFailures = uploadTotal - successCount;
        if (uploadFailures > 0) parts.push(`${uploadFailures} failed to upload`);
        description = parts.join(", ");
      }
      toast({ title: `${successCount} items added`, description });
    } else {
      const processedFiles: Array<{ file: File; name: string; preview: string }> = [];
      for (const file of files) {
        try { processedFiles.push({ file, name: formatFileName(file.name), preview: await compressImage(file) }); }
        catch { console.error(`Failed to process ${file.name}`); }
      }
      setBulkFiles(processedFiles); setBulkUploadDialogOpen(true);
    }
  };

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) return;
    setBulkUploading(true); setBulkProgress({ processed: bulkFiles.length, uploaded: 0, total: bulkFiles.length, phase: "uploading" });
    let successCount = 0;
    for (let i = 0; i < bulkFiles.length; i += 5) {
      const results = await Promise.allSettled(bulkFiles.slice(i, i + 5).map(({ name, preview }) => apiRequest("POST", "/api/items", { name, imageUrl: preview, adminPin })));
      for (const result of results) { if (result.status === "fulfilled") successCount++; }
      setBulkProgress(prev => ({ ...prev, uploaded: Math.min(i + 5, bulkFiles.length) }));
    }
    queryClient.invalidateQueries({ queryKey: ["/api/items"] });
    setBulkUploading(false); setBulkUploadDialogOpen(false); setBulkFiles([]); setBulkProgress({ processed: 0, uploaded: 0, total: 0, phase: "" });
    toast({ title: `${successCount} items added`, description: successCount < bulkFiles.length ? `${bulkFiles.length - successCount} items failed to upload` : undefined });
  };

  const updateBulkFileName = (index: number, newName: string) => setBulkFiles(files => files.map((f, i) => i === index ? { ...f, name: newName } : f));
  const removeBulkFile = (index: number) => setBulkFiles(files => files.filter((_, i) => i !== index));

  return (
    <AdminPinGate title="Admin Access" description="Enter the admin PIN to manage the estate.">
    {(verifiedPin: string) => (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/"><Button variant="ghost" size="icon" data-testid="button-back-home"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center"><Heart className="w-5 h-5 text-primary-foreground" /></div>
            <span className="font-serif text-xl font-semibold">Manage Estate</span>
          </div>
          <Link href="/draft"><Button data-testid="link-to-draft">Go to Draft</Button></Link>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs defaultValue="dashboard" className="space-y-8">
          <div className="flex justify-center border-b pb-1 mb-8 overflow-x-auto">
            <TabsList className="bg-background border h-auto p-1 max-w-full inline-flex">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-4 py-2">Dashboard</TabsTrigger>
              <TabsTrigger value="family" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-4 py-2">Family Members</TabsTrigger>
              <TabsTrigger value="estate" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-4 py-2">Estate Items</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-4 py-2">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="mt-0 outline-none">
            <AdminDashboard verifiedPin={verifiedPin} />
          </TabsContent>

          <TabsContent value="family" className="mt-0 outline-none space-y-8 animate-in fade-in duration-300">
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-semibold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Family Members</h2>
                  <HelpTooltip text="Add each sibling who will participate in the draft. They'll take turns picking items. You can set a PIN for privacy and a color for each person." side="right" />
                </div>
                <p className="text-muted-foreground text-sm mt-1">Add family members who will participate in the draft</p>
              </div>
              <Dialog open={siblingDialogOpen} onOpenChange={setSiblingDialogOpen}>
                <DialogTrigger asChild><Button size="sm" className="gap-2" data-testid="button-add-sibling"><Plus className="w-4 h-4" /> Add</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-serif">Add Family Member</DialogTitle><DialogDescription>Add a sibling or family member who will participate in the draft.</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label htmlFor="sibling-name">Name</Label><Input id="sibling-name" value={newSiblingName} onChange={(e) => setNewSiblingName(e.target.value)} placeholder="Enter name" data-testid="input-sibling-name" /></div>
                    <p className="text-sm text-muted-foreground">Draft order will be randomly assigned when the draft starts</p>
                    <Button onClick={handleAddSibling} disabled={!newSiblingName.trim() || addSiblingMutation.isPending} className="w-full" data-testid="button-confirm-add-sibling">
                      {addSiblingMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Family Member
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {siblingsLoading ? (
                <Card><CardContent className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></CardContent></Card>
              ) : siblings.length === 0 ? (
                <Card><CardContent className="py-12 text-center"><Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No family members added yet</p><p className="text-sm text-muted-foreground mt-1">Add siblings to get started</p></CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {siblings.map((sibling) => (
                    <Card key={sibling.id} data-testid={`card-sibling-${sibling.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ backgroundColor: sibling.color }}>{getInitials(sibling.name)}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{sibling.name}</h3>
                            <p className="text-sm text-muted-foreground">{sibling.draftOrder > 0 ? `Pick #${sibling.draftOrder}` : "Draft order assigned at start"}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {sibling.hasPin && <Badge variant="secondary" className="gap-1"><Lock className="w-3 h-3" /> PIN</Badge>}
                            <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join/${sibling.shareToken}`); toast({ title: "Link copied!", description: `Share link for ${sibling.name}` }); }} title="Copy share link" data-testid={`button-copy-link-${sibling.id}`}><Link2 className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Rotate ${sibling.name}'s link? The old link will stop working immediately. The new link will be copied to your clipboard.`)) rotateTokenMutation.mutate(sibling.id); }} disabled={rotateTokenMutation.isPending} title="Rotate share link (invalidates old link)" data-testid={`button-rotate-link-${sibling.id}`}><RefreshCcw className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditSiblingDialog(sibling)} title="Edit settings" data-testid={`button-edit-sibling-${sibling.id}`}><Settings className="w-4 h-4" /></Button>
                            <Link href={`/sibling/${sibling.id}`}><Button variant="ghost" size="icon" title="View wishlist" data-testid={`button-view-wishlist-${sibling.id}`}><ExternalLink className="w-4 h-4" /></Button></Link>
                            <Button variant="ghost" size="icon" onClick={() => deleteSiblingMutation.mutate(sibling.id)} disabled={deleteSiblingMutation.isPending} data-testid={`button-delete-sibling-${sibling.id}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="estate" className="mt-0 outline-none space-y-8 animate-in fade-in duration-300">
            <section className="pt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-semibold flex items-center gap-2"><Camera className="w-6 h-6 text-primary" /> Items</h2>
                  <HelpTooltip text="Add items that will be available in the draft. You can add photos, descriptions, and audio stories. Use Bulk Upload to add many photos at once." side="right" />
                </div>
                <p className="text-muted-foreground text-sm mt-1">Add photos and descriptions of belongings</p>
              </div>
              <div className="flex gap-2">
                <input type="file" accept="image/*" multiple ref={bulkFileInputRef} onChange={handleBulkFileSelect} className="hidden" data-testid="input-bulk-upload" />
                <Button size="sm" variant="outline" className="gap-2" onClick={() => bulkFileInputRef.current?.click()} data-testid="button-bulk-upload"><Upload className="w-4 h-4" /> Bulk Upload</Button>
                {items.length > 0 && (
                  <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
                    <DialogTrigger asChild><Button size="sm" variant="outline" className="gap-2 text-destructive" data-testid="button-delete-all-items"><Trash2 className="w-4 h-4" /> Delete All</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle className="font-serif">Delete All Items</DialogTitle><DialogDescription>This will permanently delete all {items.length} items and their photos, audio recordings, and wishlist entries. This cannot be undone.</DialogDescription></DialogHeader>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setDeleteAllDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deleteAllItemsMutation.mutate()} disabled={deleteAllItemsMutation.isPending} data-testid="button-confirm-delete-all">{deleteAllItemsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Delete All Items</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                  <DialogTrigger asChild><Button size="sm" className="gap-2" data-testid="button-add-item"><Plus className="w-4 h-4" /> Add</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="font-serif">Add Item</DialogTitle><DialogDescription>Add a photo and description of an item to be included in the draft.</DialogDescription></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2"><Label htmlFor="item-name">Item Name</Label><Input id="item-name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g., Grandmother's China Set" data-testid="input-item-name" /></div>
                      <div className="space-y-2"><Label htmlFor="item-description">Description (optional)</Label><Textarea id="item-description" value={newItemDescription} onChange={(e) => setNewItemDescription(e.target.value)} placeholder="Add any details about the item..." rows={3} data-testid="input-item-description" /></div>
                      <div className="space-y-2">
                        <Label>Photo (optional)</Label>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" data-testid="input-item-image" />
                        {newItemImage ? (
                          <div className="relative"><img src={newItemImage} alt="Preview" className="w-full h-48 object-cover rounded-md" /><Button variant="secondary" size="sm" className="absolute bottom-2 right-2" onClick={() => setNewItemImage(null)}>Remove</Button></div>
                        ) : (
                          <Button variant="outline" className="w-full h-32 flex flex-col gap-2" onClick={() => fileInputRef.current?.click()} data-testid="button-upload-image"><ImageIcon className="w-8 h-8 text-muted-foreground" /><span className="text-muted-foreground">Click to upload photo</span></Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Audio Story (optional, 3 min max)</Label>
                        <input type="file" accept="audio/*" ref={audioInputRef} onChange={handleAudioUpload} className="hidden" data-testid="input-item-audio" />
                        {newItemAudio ? (
                          <div className="flex items-center gap-3 p-3 bg-muted rounded-md"><Volume2 className="w-5 h-5 text-primary shrink-0" /><audio controls className="flex-1 h-8" src={newItemAudio} data-testid="audio-preview">Your browser does not support audio playback.</audio><Button variant="ghost" size="icon" onClick={() => setNewItemAudio(null)} data-testid="button-remove-audio"><X className="w-4 h-4" /></Button></div>
                        ) : (
                          <Button variant="outline" className="w-full h-16 flex gap-2" onClick={() => audioInputRef.current?.click()} data-testid="button-upload-audio"><Mic className="w-5 h-5 text-muted-foreground" /><span className="text-muted-foreground">Upload audio recording</span></Button>
                        )}
                        <p className="text-xs text-muted-foreground">Add a voice recording explaining the item's history or significance</p>
                      </div>
                      <Button onClick={handleAddItem} disabled={!newItemName.trim() || addItemMutation.isPending} className="w-full" data-testid="button-confirm-add-item">{addItemMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Item</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={bulkUploadDialogOpen} onOpenChange={(open) => { if (!bulkUploading) { setBulkUploadDialogOpen(open); if (!open) setBulkFiles([]); } }}>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader><DialogTitle className="font-serif">Bulk Upload Photos</DialogTitle><DialogDescription>{bulkProgress.phase ? `Uploading ${bulkProgress.total} photos...` : "Review and edit item names before uploading."}</DialogDescription></DialogHeader>
                    {bulkProgress.phase ? (
                      <div className="py-8 space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm gap-4"><span className="text-muted-foreground">{bulkProgress.phase === "processing" ? "Processing photos..." : "Uploading items..."}</span><span className="font-medium">{bulkProgress.phase === "processing" ? `${bulkProgress.processed} / ${bulkProgress.total}` : `${bulkProgress.uploaded} / ${bulkProgress.total}`}</span></div>
                          <div className="w-full bg-muted rounded-full h-3 overflow-hidden"><div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${Math.round(bulkProgress.phase === "processing" ? (bulkProgress.processed / Math.max(bulkProgress.total, 1)) * 50 : 50 + (bulkProgress.uploaded / Math.max(bulkProgress.total, 1)) * 50)}%` }} data-testid="bulk-progress-bar" /></div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">{bulkProgress.phase === "processing" ? "Compressing photos..." : "Saving items..."}</span></div>
                        <p className="text-xs text-center text-muted-foreground">Please keep this window open until the upload completes.</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 overflow-y-auto space-y-3 py-4">
                          {bulkFiles.map((file, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 border rounded-md">
                              <img src={file.preview} alt={file.name} className="w-16 h-16 object-cover rounded shrink-0" />
                              <Input value={file.name} onChange={(e) => updateBulkFileName(index, e.target.value)} className="flex-1" data-testid={`input-bulk-name-${index}`} />
                              <Button variant="ghost" size="icon" onClick={() => removeBulkFile(index)} data-testid={`button-remove-bulk-${index}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t gap-4 flex-wrap">
                          <p className="text-sm text-muted-foreground">{bulkFiles.length} item{bulkFiles.length !== 1 ? 's' : ''} ready to upload</p>
                          <div className="flex gap-2"><Button variant="outline" onClick={() => setBulkUploadDialogOpen(false)}>Cancel</Button><Button onClick={handleBulkUpload} disabled={bulkFiles.length === 0 || bulkUploading} data-testid="button-confirm-bulk-upload">{bulkUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Upload All</Button></div>
                        </div>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </div>

              {itemsLoading ? (
                <Card><CardContent className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></CardContent></Card>
              ) : items.length === 0 ? (
                <Card><CardContent className="py-12 text-center"><Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No items added yet</p><p className="text-sm text-muted-foreground mt-1">Take photos and add items</p></CardContent></Card>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {items.map((item) => (
                    <Card key={item.id} className="overflow-hidden" data-testid={`card-item-${item.id}`}>
                      <div className="aspect-square bg-muted relative">
                        {item.hasImage ? <img src={`/api/items/${item.id}/image`} alt={item.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-muted-foreground" /></div>}
                        {item.pickedBySiblingId && <Badge className="absolute top-2 left-2" variant="secondary">Picked</Badge>}
                        {item.hasAudio && <Badge className="absolute top-2 right-2 gap-1" variant="secondary"><Volume2 className="w-3 h-3" /> Audio</Badge>}
                      </div>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {item.name && !/^(IMG_\d|DSC_?\d|DCIM|P\d{7,}|Screenshot_\d|pic_\d)/i.test(item.name.trim()) && item.name.trim().length > 0 ? (
                              <><h3 className="font-medium text-sm truncate" data-testid={`text-item-name-${item.id}`}>{item.name}</h3>{item.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>}</>
                            ) : (
                              <button onClick={() => openEditDialog(item)} className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium mt-0.5" data-testid={`warning-no-name-${item.id}`}><Pencil className="w-3 h-3" />No name — click to add</button>
                            )}
                            {item.hasAudio && <audio controls className="w-full h-6 mt-2" src={`/api/items/${item.id}/audio`} data-testid={`audio-item-${item.id}`}>Your browser does not support audio playback.</audio>}
                          </div>
                          <div className="flex shrink-0 -mr-2 -mt-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} data-testid={`button-edit-item-${item.id}`}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteItemMutation.mutate(item.id)} disabled={deleteItemMutation.isPending} data-testid={`button-delete-item-${item.id}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="settings" className="mt-0 outline-none space-y-8 animate-in fade-in duration-300">
            <FamilySettings verifiedPin={verifiedPin} />
            <AdminSettings verifiedPin={verifiedPin} />

            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="font-serif text-xl text-destructive flex items-center gap-2"><Trash2 className="w-5 h-5" /> Danger Zone</CardTitle>
                <CardDescription>Permanently delete all family members, items, ratings, and draft state. Your admin PIN and family info stay. Use this to start over fresh.</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={wipeAllDialogOpen} onOpenChange={setWipeAllDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="gap-2" data-testid="button-wipe-all">
                      <Trash2 className="w-4 h-4" /> Clear all data & start fresh
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-serif">Clear all data?</DialogTitle>
                      <DialogDescription>
                        This deletes all family members, items, photos, ratings, and draft picks. Your admin PIN, family name, and hero photo stay. This cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 justify-end pt-4">
                      <Button variant="outline" onClick={() => setWipeAllDialogOpen(false)}>Cancel</Button>
                      <Button variant="destructive" onClick={() => wipeAllMutation.mutate()} disabled={wipeAllMutation.isPending} className="gap-2" data-testid="button-confirm-wipe-all">
                        {wipeAllMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Yes, clear everything
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Edit Item</DialogTitle><DialogDescription>Update the item's name, description, or photo.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="edit-item-name">Item Name</Label><Input id="edit-item-name" value={editItemName} onChange={(e) => setEditItemName(e.target.value)} placeholder="e.g., Grandmother's China Set" data-testid="input-edit-item-name" /></div>
            <div className="space-y-2"><Label htmlFor="edit-item-description">Description (optional)</Label><Textarea id="edit-item-description" value={editItemDescription} onChange={(e) => setEditItemDescription(e.target.value)} placeholder="Add any details about the item..." rows={3} data-testid="input-edit-item-description" /></div>
            <div className="space-y-2">
              <Label>Photo</Label>
              <input type="file" accept="image/*" ref={editFileInputRef} onChange={handleEditImageUpload} className="hidden" data-testid="input-edit-item-image" />
              {editItemImage ? (
                <div className="relative"><img src={editItemImage} alt="Preview" className="w-full h-48 object-cover rounded-md" /><div className="absolute bottom-2 right-2 flex gap-2"><Button variant="secondary" size="sm" onClick={() => editFileInputRef.current?.click()}>Change</Button><Button variant="secondary" size="sm" onClick={() => setEditItemImage(null)}>Remove</Button></div></div>
              ) : (
                <Button variant="outline" className="w-full h-32 flex flex-col gap-2" onClick={() => editFileInputRef.current?.click()} data-testid="button-edit-upload-image"><ImageIcon className="w-8 h-8 text-muted-foreground" /><span className="text-muted-foreground">Click to upload photo</span></Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Audio Story (3 min max)</Label>
              <input type="file" accept="audio/*" ref={editAudioInputRef} onChange={handleEditAudioUpload} className="hidden" data-testid="input-edit-item-audio" />
              {editItemAudio ? (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-md"><Volume2 className="w-5 h-5 text-primary shrink-0" /><audio controls className="flex-1 h-8" src={editItemAudio} data-testid="edit-audio-preview">Your browser does not support audio playback.</audio><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => editAudioInputRef.current?.click()} title="Change audio"><Mic className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => setEditItemAudio(null)} title="Remove audio" data-testid="button-edit-remove-audio"><X className="w-4 h-4" /></Button></div></div>
              ) : (
                <Button variant="outline" className="w-full h-16 flex gap-2" onClick={() => editAudioInputRef.current?.click()} data-testid="button-edit-upload-audio"><Mic className="w-5 h-5 text-muted-foreground" /><span className="text-muted-foreground">Upload audio recording</span></Button>
              )}
              <p className="text-xs text-muted-foreground">Add a voice recording explaining the item's history or significance</p>
            </div>
            <Button onClick={handleUpdateItem} disabled={!editItemName.trim() || updateItemMutation.isPending} className="w-full" data-testid="button-confirm-edit-item">{updateItemMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editSiblingDialogOpen} onOpenChange={setEditSiblingDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Edit Family Member</DialogTitle><DialogDescription>Update name, color, and privacy settings</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="edit-sibling-name">Name</Label><Input id="edit-sibling-name" value={editSiblingName} onChange={(e) => setEditSiblingName(e.target.value)} placeholder="Enter name" data-testid="input-edit-sibling-name" /></div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {SIBLING_COLORS.map((color) => (<button key={color} type="button" className={`w-10 h-10 rounded-full transition-all ${editSiblingColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`} style={{ backgroundColor: color }} onClick={() => setEditSiblingColor(color)} data-testid={`button-color-${color.replace('#', '')}`} />))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sibling-pin"><div className="flex items-center gap-2"><Lock className="w-4 h-4" /> Privacy PIN (4 digits)</div></Label>
              <Card className="bg-muted/30"><CardContent className="py-3 px-4"><p className="text-sm text-muted-foreground">Setting a PIN keeps this person's wishlist private. Without a PIN, anyone with the link can see what items they want. With a PIN, only they can view and manage their picks.</p></CardContent></Card>
              <Input id="edit-sibling-pin" value={editSiblingPin} onChange={(e) => { const value = e.target.value.replace(/\D/g, '').slice(0, 4); setEditSiblingPin(value); }} placeholder="Enter 4-digit PIN" maxLength={4} inputMode="numeric" autoComplete="off" data-testid="input-edit-sibling-pin" />
              {editingSibling?.hasPin && (<div className="flex items-center gap-2 pt-2"><input type="checkbox" id="clear-pin" checked={clearSiblingPin} onChange={(e) => setClearSiblingPin(e.target.checked)} className="w-4 h-4" data-testid="checkbox-clear-pin" /><Label htmlFor="clear-pin" className="text-sm text-destructive cursor-pointer">Remove PIN protection</Label></div>)}
            </div>
            <Button onClick={handleUpdateSibling} disabled={!editSiblingName.trim() || updateSiblingMutation.isPending} className="w-full" data-testid="button-confirm-edit-sibling">{updateSiblingMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    )}
    </AdminPinGate>
  );
}
