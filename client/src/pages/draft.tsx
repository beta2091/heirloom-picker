import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { Heart, ArrowLeft, Trophy, Play, Pause, RotateCcw, Check, Loader2, Image as ImageIcon, ChevronRight, Volume2 } from "lucide-react";
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
}

export default function Draft() {
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
    // Default to keepOrder=true (picks-only reset) from this page — preserves
    // lottery order so mock runs are cheap. For a full reset (clearing the
    // lottery), use the Reset button on /draft-master.
    mutationFn: async () => {
      return apiRequest("POST", "/api/draft/reset", { adminPin, keepOrder: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/draft"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/siblings"] });
      toast({ title: "Picks cleared — lottery order preserved" });
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
      toast({ title: "Pick confirmed!" });
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
  const pickedItems = items.filter(item => item.pickedBySiblingId);

  const getCurrentPicker = (): SiblingResponse | null => {
    if (!draftState?.isActive || !allAssigned || sortedSiblings.length === 0) return null;
    // Snake draft: rounds alternate direction.
    const n = sortedSiblings.length;
    const round = Math.floor(draftState.currentPickIndex / n);
    const pos = draftState.currentPickIndex % n;
    const index = round % 2 === 0 ? pos : n - 1 - pos;
    return sortedSiblings[index];
  };

  const currentPicker = getCurrentPicker();

  const getPicksByRound = (round: number) => {
    return items.filter(item => item.pickRound === round);
  };

  const maxRound = Math.max(...items.map(item => item.pickRound || 0), 0);

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
    <AdminPinGate title="Draft Board" description="Enter the admin PIN to access the draft board." redirectTo="/">
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/" className="rounded-md" aria-label="Evenkeep home">
              <Logo />
            </Link>
            {draftState?.isActive && currentPicker && (
              <span className="hidden text-sm font-semibold uppercase tracking-[0.14em] text-primary sm:inline">
                Round {draftState.currentRound}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!draftState?.isActive && !draftState?.isComplete && (
              <Button
                onClick={() => startDraftMutation.mutate()}
                disabled={startDraftMutation.isPending || siblings.length === 0 || availableItems.length === 0}
                className="min-h-12 gap-2 px-6 text-base shadow-md"
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
                className="min-h-12 gap-2"
                data-testid="button-pause-draft"
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}
            {(draftState?.isActive || draftState?.isComplete || pickedItems.length > 0) && (
              <Button
                variant="outline"
                onClick={() => resetDraftMutation.mutate()}
                disabled={resetDraftMutation.isPending}
                className="min-h-12 gap-2"
                data-testid="button-reset-draft"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-8 sm:py-12">
        {siblings.length === 0 || items.length === 0 ? (
          <Card className="mx-auto max-w-xl rounded-2xl border-card-border p-6 shadow-sm">
            <CardContent className="py-14 text-center">
              <span className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Heart className="h-6 w-6" />
              </span>
              <h2 className="font-serif text-2xl font-bold tracking-tight">Set up your draft</h2>
              <p className="mx-auto mt-3 mb-7 max-w-md text-base leading-relaxed text-muted-foreground">
                {siblings.length === 0 && items.length === 0
                  ? "Add family members and items before starting the draft."
                  : siblings.length === 0
                    ? "Add family members to participate in the draft."
                    : "Add items to be picked in the draft."
                }
              </p>
              <Link href="/admin">
                <Button className="min-h-12 gap-2 px-8 text-base shadow-md" data-testid="button-setup">
                  Go to Setup <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {draftState?.isActive && currentPicker && (
                <Card className="mb-6 rounded-2xl border-primary/30 bg-primary/[0.06] p-6 shadow-md">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-sm"
                        style={{ backgroundColor: currentPicker.color }}
                      >
                        {getInitials(currentPicker.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Now Picking</p>
                        <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">{currentPicker.name}</h2>
                        <p className="text-base text-muted-foreground">
                          Round {draftState.currentRound}, Pick #{draftState.currentPickIndex + 1}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {draftState?.isComplete && (
                <Card className="mb-6 rounded-2xl border-accent/30 bg-accent/[0.08] p-6 shadow-md">
                  <CardContent className="p-0 text-center">
                    <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/12 text-accent">
                      <Trophy className="h-6 w-6" />
                    </span>
                    <h2 className="font-serif text-2xl font-bold tracking-tight">Draft complete</h2>
                    <p className="mx-auto mt-2 mb-5 max-w-md text-base leading-relaxed text-muted-foreground">
                      Every piece has found its person. See below for the final results.
                    </p>
                    <Link href="/results">
                      <Button className="min-h-12 px-8 text-base shadow-md" data-testid="link-to-results">
                        View Results by Person
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              <div className="mb-6">
                <h2 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold tracking-tight sm:text-3xl">
                  {draftState?.isActive ? "Available Items" : "All Items"}
                  <HelpTooltip text={draftState?.isActive ? "Click an item to pick it for the current player. Items disappear from here once picked." : "Press Start Draft to begin. The pick order will be randomly shuffled. Each person takes turns choosing one item per round."} side="right" />
                </h2>
                {availableItems.length === 0 && !draftState?.isComplete ? (
                  <Card className="rounded-2xl border-card-border p-6 shadow-sm">
                    <CardContent className="py-10 text-center">
                      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/12 text-accent">
                        <Check className="h-6 w-6" />
                      </span>
                      <p className="text-base text-muted-foreground">All items have found a home.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {availableItems.map((item) => (
                      <Card
                        key={item.id}
                        className={`rounded-2xl border-card-border p-3 shadow-sm ${draftState?.isActive ? "cursor-pointer hover-elevate" : ""}`}
                        onClick={() => handleItemClick(item)}
                        data-testid={`item-${item.id}`}
                      >
                        <div className="aspect-square bg-muted relative rounded-xl overflow-hidden">
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
                        <CardContent className="p-0 pt-3">
                          <h3 className="font-serif text-base font-semibold leading-snug truncate">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {item.description}
                            </p>
                          )}
                          {item.hasAudio && (
                            <audio
                              controls
                              className="w-full h-6 mt-2"
                              src={`/api/items/${item.id}/audio`}
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`audio-available-${item.id}`}
                            >
                              Your browser does not support audio playback.
                            </audio>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {pickedItems.length > 0 && (
                <div>
                  <h2 className="mb-4 font-serif text-2xl font-bold tracking-tight sm:text-3xl">Picked Items</h2>
                  <div className="space-y-6">
                    {Array.from({ length: maxRound }, (_, i) => i + 1).map((round) => {
                      const roundPicks = getPicksByRound(round);
                      if (roundPicks.length === 0) return null;
                      return (
                        <div key={round}>
                          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                            Round {round}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {roundPicks.map((item) => {
                              const pickedBy = getSiblingById(item.pickedBySiblingId!);
                              return (
                                <Card key={item.id} className="rounded-2xl border-card-border p-3 shadow-sm" data-testid={`picked-${item.id}`}>
                                  <div className="aspect-square bg-muted relative rounded-xl overflow-hidden">
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
                                    {pickedBy && (
                                      <Badge
                                        className="absolute top-2 left-2"
                                        style={{ backgroundColor: pickedBy.color }}
                                      >
                                        {pickedBy.name}
                                      </Badge>
                                    )}
                                    {item.hasAudio && (
                                      <Badge className="absolute top-2 right-2 gap-1" variant="secondary">
                                        <Volume2 className="w-3 h-3" /> Audio
                                      </Badge>
                                    )}
                                  </div>
                                  <CardContent className="p-0 pt-3">
                                    <h3 className="font-serif text-base font-semibold leading-snug truncate">{item.name}</h3>
                                    {item.hasAudio && (
                                      <audio
                                        controls
                                        className="w-full h-6 mt-2"
                                        src={`/api/items/${item.id}/audio`}
                                        data-testid={`audio-picked-${item.id}`}
                                      >
                                        Your browser does not support audio playback.
                                      </audio>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Card className="sticky top-24 rounded-2xl border-card-border p-6 shadow-sm">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="font-serif text-lg font-semibold">Draft Order</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-3">
                    {sortedSiblings.map((sibling, index) => {
                      const isCurrentPicker = draftState?.isActive && currentPicker?.id === sibling.id;
                      const siblingPicks = items.filter(item => item.pickedBySiblingId === sibling.id);
                      return (
                        <div
                          key={sibling.id}
                          className={`flex items-center gap-3 rounded-xl p-3 ${
                            isCurrentPicker ? "border border-primary/30 bg-primary/[0.06] shadow-sm" : "bg-muted/40"
                          }`}
                          data-testid={`draft-order-${sibling.id}`}
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                            style={{ backgroundColor: sibling.color }}
                          >
                            {sibling.draftOrder > 0 ? sibling.draftOrder : getInitials(sibling.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{sibling.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {siblingPicks.length} item{siblingPicks.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          {isCurrentPicker && (
                            <Badge variant="default">Picking</Badge>
                          )}
                        </div>
                      );
                    })}
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
            <DialogTitle className="font-serif">Confirm Pick</DialogTitle>
            <DialogDescription>
              {currentPicker?.name} is picking this item
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="aspect-video bg-muted rounded-xl overflow-hidden">
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
              <div>
                <h3 className="font-serif text-lg font-semibold">{selectedItem.name}</h3>
                {selectedItem.description && (
                  <p className="text-base leading-relaxed text-muted-foreground mt-1">{selectedItem.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPickDialogOpen(false)}
                  className="min-h-12 flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => makePickMutation.mutate(selectedItem.id)}
                  disabled={makePickMutation.isPending}
                  className="min-h-12 flex-1 text-base shadow-md"
                  data-testid="button-confirm-pick"
                >
                  {makePickMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm Pick
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </AdminPinGate>
  );
}
