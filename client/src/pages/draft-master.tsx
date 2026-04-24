import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Heart, ArrowLeft, Trophy, Play, Pause, RotateCcw, Check, Loader2, Image as ImageIcon, ChevronRight, Volume2, Shield } from "lucide-react";
import { getInitials } from "@/lib/utils-initials";
import { HelpTooltip } from "@/components/help-tooltip";
import { AdminPinGate } from "@/components/admin-pin-gate";
import type { DraftState } from "@shared/schema";

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
  optedOut: boolean;
}

export default function DraftMaster() {
  const { toast } = useToast();
  const [pickDialogOpen, setPickDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemResponse | null>(null);

  const { data: siblings = [], isLoading: siblingsLoading } = useQuery<SiblingResponse[]>({
    queryKey: ["/api/siblings"],
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<ItemResponse[]>({
    queryKey: ["/api/items"],
  });

  const { data: draftState, isLoading: draftLoading } = useQuery<DraftState>({
    queryKey: ["/api/draft"],
    refetchInterval: 2000, 
  });

  const adminPin = sessionStorage.getItem("admin-pin") || "";

  const startDraftMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/draft/start", { adminPin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/draft"] });
      queryClient.invalidateQueries({ queryKey: ["/api/siblings"] });
      toast({ title: "Draft started!" });
    },
    onError: (err: any) => toast({ title: "Couldn't start draft", description: err?.message || "Check draft order and try again.", variant: "destructive" }),
  });

  const pauseDraftMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/draft/pause", { adminPin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/draft"] });
      toast({ title: "Draft paused" });
    },
  });

  const resetDraftMutation = useMutation({
    mutationFn: async (keepOrder: boolean) => {
      return apiRequest("POST", "/api/draft/reset", { adminPin, keepOrder });
    },
    onSuccess: (_data, keepOrder) => {
      queryClient.invalidateQueries({ queryKey: ["/api/draft"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/siblings"] });
      setResetDialogOpen(false);
      toast({ title: keepOrder ? "Picks cleared — lottery order preserved" : "Draft fully reset — re-run the lottery to set pick order" });
    },
  });

  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const optOutMutation = useMutation({
    mutationFn: async (siblingId: string) => apiRequest("POST", `/api/siblings/${siblingId}/opt-out`, { adminPin }),
    onSuccess: (_data, siblingId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/siblings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/draft"] });
      const who = siblings.find(s => s.id === siblingId);
      toast({ title: `${who?.name || "Sibling"} opted out`, description: "Their remaining turns will be skipped." });
    },
    onError: () => toast({ title: "Couldn't opt out", variant: "destructive" }),
  });

  const autoPickMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/draft/autopick", { adminPin });
      return res.json();
    },
    onSuccess: (data: { state: DraftState; pickedItem: { id: string; name: string }; pickerName: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/draft"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: `Auto-picked for ${data.pickerName}`, description: data.pickedItem.name });
    },
    onError: async (err: any) => {
      const msg = err?.message || "Auto-pick failed";
      toast({ title: "Auto-pick failed", description: msg, variant: "destructive" });
    },
  });

  const makePickMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("POST", "/api/draft/pick", { itemId, adminPin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/draft"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setPickDialogOpen(false);
      setSelectedItem(null);
      toast({ title: "Pick confirmed" });
    },
    onError: () => {
      toast({ title: "Failed to make pick", variant: "destructive" });
    },
  });

  const isLoading = siblingsLoading || itemsLoading || draftLoading;

  const allAssigned = siblings.length > 0 && siblings.every(s => s.draftOrder > 0);
  const sortedSiblings = allAssigned
    ? [...siblings].sort((a, b) => a.draftOrder - b.draftOrder)
    : [...siblings];
  const availableItems = items.filter(item => !item.pickedBySiblingId);
  const pickedItems = [...items].filter(item => item.pickedBySiblingId).sort((a, b) => {
    // Sort by pickRound descending, so latest picks are at the top
    if (a.pickRound !== b.pickRound) {
       return (b.pickRound || 0) - (a.pickRound || 0);
    }
    return 0; // fallback
  });

  const getCurrentPicker = (): SiblingResponse | null => {
    if (!draftState?.isActive || !allAssigned || sortedSiblings.length === 0) return null;
    // Snake draft: rounds alternate direction. Round 0 goes 0..N-1, round 1 goes N-1..0, etc.
    const n = sortedSiblings.length;
    const round = Math.floor(draftState.currentPickIndex / n);
    const pos = draftState.currentPickIndex % n;
    const index = round % 2 === 0 ? pos : n - 1 - pos;
    return sortedSiblings[index];
  };

  const currentPicker = getCurrentPicker();

  const handleItemClick = (item: ItemResponse) => {
    if (!draftState?.isActive || item.pickedBySiblingId) return;
    setSelectedItem(item);
    setPickDialogOpen(true);
  };

  const getSiblingById = (siblingId: string) => {
    return siblings.find(s => s.id === siblingId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AdminPinGate title="Master Draft View" description="Enter the admin PIN to access the master draft dashboard." redirectTo="/admin">
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary/5 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-serif text-xl font-semibold">Master Overview</span>
              {draftState?.isActive && currentPicker && (
                <p className="text-sm text-muted-foreground">
                  Round {draftState.currentRound}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!draftState?.isActive && !draftState?.isComplete && (
              <Button
                onClick={() => startDraftMutation.mutate()}
                disabled={startDraftMutation.isPending || siblings.length === 0 || availableItems.length === 0}
                className="gap-2"
                data-testid="button-start-draft"
              >
                <Play className="w-4 h-4" />
                Start Draft
              </Button>
            )}
            {draftState?.isActive && (
              <Button
                variant="secondary"
                onClick={() => pauseDraftMutation.mutate()}
                disabled={pauseDraftMutation.isPending}
                className="gap-2"
                data-testid="button-pause-draft"
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}
            {(draftState?.isActive || draftState?.isComplete || pickedItems.length > 0) && (
              <Button
                variant="outline"
                onClick={() => setResetDialogOpen(true)}
                disabled={resetDraftMutation.isPending}
                className="gap-2"
                data-testid="button-reset-draft"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {siblings.length === 0 || items.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
              <h2 className="font-serif text-2xl font-semibold mb-2">Set Up Your Draft</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Go to the Admin panel to add family members and items before starting the draft.
              </p>
              <Link href="/admin">
                <Button className="gap-2" data-testid="button-setup">
                  Go to Setup <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3">
              {draftState?.isActive && currentPicker && (
                <Card className="mb-6 border-2 shadow-md animate-in fade-in slide-in-from-top-4" style={{ borderColor: currentPicker.color }}>
                  <CardContent className="py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div
                          className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl shrink-0 shadow-lg"
                          style={{ backgroundColor: currentPicker.color }}
                        >
                          {getInitials(currentPicker.name)}
                        </div>
                        <div>
                          <Badge variant="outline" className="mb-2 text-xs font-semibold tracking-wider uppercase bg-background shadow-sm">On The Clock</Badge>
                          <h2 className="font-serif text-4xl font-bold tracking-tight">{currentPicker.name}</h2>
                          <p className="text-lg text-muted-foreground mt-1">
                            Round {draftState.currentRound}, Pick #{draftState.currentPickIndex + 1}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 max-w-xs">
                        <Button
                          size="lg"
                          variant="default"
                          onClick={() => autoPickMutation.mutate()}
                          disabled={autoPickMutation.isPending}
                          className="gap-2"
                          data-testid="button-autopick"
                          title={`Pick ${currentPicker.name}'s highest-ranked available item automatically`}
                        >
                          {autoPickMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          Auto-pick for {currentPicker.name}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(`Mark ${currentPicker.name} as done? Their future turns will be skipped and remaining picks go to donation.`)) {
                              optOutMutation.mutate(currentPicker.id);
                            }
                          }}
                          disabled={optOutMutation.isPending}
                          data-testid="button-admin-opt-out"
                        >
                          {optOutMutation.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                          Mark {currentPicker.name} done (opt out)
                        </Button>
                        <div className="bg-primary/5 p-3 rounded-xl text-sm border shadow-sm">
                          <p className="font-medium text-primary mb-1 flex items-center gap-1"><Shield className="w-4 h-4"/> Admin Override</p>
                          <p className="text-muted-foreground">Auto-pick uses their wishlist. Or click any item below to log a manual pick.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {draftState?.isComplete && (
                <Card className="mb-6 bg-accent/20 border-accent">
                  <CardContent className="py-6 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-accent-foreground" />
                    <h2 className="font-serif text-2xl font-semibold mb-2">Draft Complete!</h2>
                    <p className="text-muted-foreground mb-4">
                      All items have been distributed. 
                    </p>
                    <Link href="/results">
                      <Button data-testid="link-to-results">
                        Open Results
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              <div className="mb-6">
                <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center gap-2">
                  {draftState?.isActive ? "Available Estate Items" : "Estate Items"}
                  <HelpTooltip text={draftState?.isActive ? "Click any item to assign it to the active player." : "Press Start Draft to begin."} side="right" />
                </h2>
                {availableItems.length === 0 && !draftState?.isComplete ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Check className="w-12 h-12 mx-auto text-accent-foreground mb-4" />
                      <p className="text-muted-foreground">All items have been picked!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {availableItems.map((item) => (
                      <Card
                        key={item.id}
                        className={`overflow-hidden transition-all duration-200 ${draftState?.isActive ? "cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-primary/50" : "opacity-80"}`}
                        onClick={() => handleItemClick(item)}
                        data-testid={`master-item-${item.id}`}
                      >
                        <div className="aspect-square bg-muted relative">
                          {item.hasImage ? (
                            <img
                              src={`/api/items/${item.id}/image`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                          {item.hasAudio && (
                            <Badge className="absolute top-2 right-2 gap-1" variant="secondary">
                              <Volume2 className="w-3 h-3" /> Audio
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-medium text-sm truncate">{item.name}</h3>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {item.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <Card className="sticky top-24 shadow-sm border-t-4 border-t-primary/20">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle className="font-serif text-lg">Live Draft Feed</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[600px] overflow-y-auto p-4 space-y-4">
                    {pickedItems.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No picks have been made yet.
                      </div>
                    ) : (
                      pickedItems.slice(0, 20).map((item) => {
                        const pickedBy = getSiblingById(item.pickedBySiblingId!);
                        if (!pickedBy) return null;
                        return (
                          <div key={item.id} className="flex gap-3 text-sm animate-in fade-in slide-in-from-left-2">
                             <div
                              className="w-8 h-8 rounded-full flex justify-center items-center text-white shrink-0 shadow-sm text-xs font-bold"
                              style={{ backgroundColor: pickedBy.color }}
                            >
                              {getInitials(pickedBy.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold">{pickedBy.name}</p>
                              <p className="truncate text-muted-foreground">
                                picked <b>{item.name}</b>
                              </p>
                              <p className="text-xs text-muted-foreground opacity-70">Round {item.pickRound}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {pickedItems.length > 20 && (
                      <p className="text-center text-xs text-muted-foreground pt-2 border-t">
                        Showing last 20 picks
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <Dialog open={pickDialogOpen} onOpenChange={setPickDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif flexItems-center gap-2 text-primary">
              <Shield className="w-5 h-5"/> Admin Override
            </DialogTitle>
            <DialogDescription>
              You are assigning this item to <b>{currentPicker?.name}</b> on their behalf.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="aspect-video bg-muted rounded-md overflow-hidden">
                {selectedItem.hasImage ? (
                  <img
                    src={`/api/items/${selectedItem.id}/image`}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <h3 className="font-bold text-xl">{selectedItem.name}</h3>
                {selectedItem.description && (
                  <p className="text-muted-foreground mt-2">{selectedItem.description}</p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPickDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => makePickMutation.mutate(selectedItem.id)}
                  disabled={makePickMutation.isPending}
                  className="flex-1 shadow-sm"
                  style={{ backgroundColor: currentPicker?.color }}
                >
                  {makePickMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Assign to {currentPicker?.name}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Reset the draft</DialogTitle>
            <DialogDescription>Pick what to clear. Rankings submitted by each sibling are never affected by reset.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => resetDraftMutation.mutate(true)}>
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Reset picks only</h3>
                    <p className="text-sm text-muted-foreground mt-1">Clears all picks and returns items to the pool. <b>Keeps the lottery pick order</b>, so you can start the draft again right away. Use this for mock runs.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-destructive/50 transition-colors" onClick={() => resetDraftMutation.mutate(false)}>
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Full reset</h3>
                    <p className="text-sm text-muted-foreground mt-1">Clears picks AND the lottery pick order. You'll need to re-run the lottery before starting the next draft.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button variant="ghost" onClick={() => setResetDialogOpen(false)} className="w-full">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AdminPinGate>
  );
}
