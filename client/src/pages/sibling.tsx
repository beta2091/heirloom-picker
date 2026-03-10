import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Star, GripVertical, Loader2, Image as ImageIcon,
  Share2, Lock, Volume2, ChevronRight, CheckCircle2, Circle,
  Send, Unlock, X, ZoomIn
} from "lucide-react";
import { getInitials } from "@/lib/utils-initials";
import type { ItemRating } from "@shared/schema";

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
  wishlistSubmitted: boolean;
}

function Lightbox({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 transition-colors" onClick={onClose} aria-label="Close">
        <X className="w-6 h-6" />
      </button>
      <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={name} className="rounded-lg object-contain max-h-[80vh] w-full shadow-2xl" />
        <p className="text-white font-medium text-lg drop-shadow">{name}</p>
      </div>
    </div>
  );
}

function ItemImage({ item, size = "lg" }: { item: ItemResponse; size?: "sm" | "lg" }) {
  const [open, setOpen] = useState(false);
  if (!item.hasImage) {
    return (
      <div className={`${size === "lg" ? "w-full h-full" : "w-12 h-12"} bg-muted flex items-center justify-center`}>
        <ImageIcon className={size === "lg" ? "w-10 h-10 text-muted-foreground" : "w-5 h-5 text-muted-foreground"} />
      </div>
    );
  }
  const src = `/api/items/${item.id}/image`;
  return (
    <>
      <div className={`relative ${size === "lg" ? "w-full h-full" : "w-12 h-12"} cursor-zoom-in group`} onClick={() => setOpen(true)} title="Click to enlarge">
        <img src={src} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        </div>
      </div>
      {open && <Lightbox src={src} name={item.name} onClose={() => setOpen(false)} />}
    </>
  );
}

const TIER_LABELS: Record<number, string> = {
  5: "★★★★★  Must Have",
  4: "★★★★  Really Want",
  3: "★★★  Want",
  2: "★★  Maybe",
  1: "★  Probably Not",
};

function TierDivider({ stars }: { stars: number }) {
  return (
    <div className="flex items-center gap-3 py-1 px-1 select-none">
      <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase whitespace-nowrap">
        {TIER_LABELS[stars] ?? `${stars} Stars`}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function SiblingPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [pinInput, setPinInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedPin, setVerifiedPin] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const lastInitializedCount = useRef(0);
  // Local optimistic order — mirrors server ratings but updates instantly on drag
  const [localRatings, setLocalRatings] = useState<ItemRating[]>([]);

  const { data: sibling, isLoading: siblingLoading } = useQuery<SiblingResponse>({ queryKey: ["/api/siblings", id] });
  useEffect(() => { if (sibling && !sibling.hasPin) setIsVerified(true); }, [sibling]);
  useEffect(() => { if (sibling?.wishlistSubmitted) setCurrentStep(3); }, [sibling]);

  const verifyPin = async () => {
    if (!id || pinInput.length !== 4) return;
    setVerifying(true); setPinError(false);
    try {
      const res = await apiRequest("POST", `/api/siblings/${id}/verify-pin`, { pin: pinInput });
      const data = await res.json();
      if (data.verified) { setVerifiedPin(pinInput); setIsVerified(true); } else setPinError(true);
    } catch { setPinError(true); } finally { setVerifying(false); }
  };

  const { data: items = [], isLoading: itemsLoading } = useQuery<ItemResponse[]>({ queryKey: ["/api/items"] });
  const { data: ratings = [], isLoading: ratingsLoading } = useQuery<ItemRating[]>({
    queryKey: ["/api/ratings", id, verifiedPin],
    queryFn: async () => {
      const url = verifiedPin ? `/api/ratings/${id}?pin=${verifiedPin}` : `/api/ratings/${id}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch ratings");
      return res.json();
    },
    enabled: !!id && isVerified,
  });

  // Keep localRatings in sync with server data (but not while dragging)
  useEffect(() => {
    if (ratings.length > 0) setLocalRatings(ratings);
  }, [ratings]);

  const availableItems = items.filter(item => !item.pickedBySiblingId);
  const ratingMap = new Map(ratings.map(r => [r.itemId, r]));

  const rateMutation = useMutation({
    mutationFn: async (data: { itemId: string; rating: number }) => apiRequest("PUT", `/api/ratings/${id}/rate`, { ...data, pin: verifiedPin }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/ratings", id, verifiedPin] }),
  });
  const unrateMutation = useMutation({
    mutationFn: async (itemId: string) => apiRequest("DELETE", `/api/ratings/${id}/rate/${itemId}`, { pin: verifiedPin }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/ratings", id, verifiedPin] }),
  });
  const reorderMutation = useMutation({
    mutationFn: async (data: { id: string; rankWithinTier: number }[]) => apiRequest("PUT", `/api/ratings/${id}/reorder-tier`, { items: data, pin: verifiedPin }),
    onError: () => {
      // On failure, roll back local state to server truth
      setLocalRatings(ratings);
    },
    onSettled: () => {
      // Always re-sync from server after mutation completes
      queryClient.invalidateQueries({ queryKey: ["/api/ratings", id, verifiedPin] });
    },
  });
  const submitWishlistMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/siblings/${id}/submit-wishlist`, { pin: verifiedPin }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/siblings", id] }); toast({ title: "Rankings submitted!", description: "Your picks are locked in." }); },
  });
  const unlockWishlistMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/siblings/${id}/unlock-wishlist`, { pin: verifiedPin }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/siblings", id] }); setCurrentStep(1); toast({ title: "Rankings unlocked", description: "You can make changes now." }); },
  });

  useEffect(() => {
    if (currentStep === 2 && ratings.length > 0 && !sibling?.wishlistSubmitted && ratings.length !== lastInitializedCount.current) {
      lastInitializedCount.current = ratings.length;
      const sorted = [...ratings].sort((a, b) => b.rating !== a.rating ? b.rating - a.rating : a.rankWithinTier - b.rankWithinTier);
      // Also update local state immediately so the list renders in the right order
      setLocalRatings(sorted.map((r, idx) => ({ ...r, rankWithinTier: idx })));
      reorderMutation.mutate(sorted.map((r, idx) => ({ id: r.id, rankWithinTier: idx })));
    }
  }, [currentStep, ratings.length]);

  const copyShareLink = () => {
    if (!sibling || !id) return;
    navigator.clipboard.writeText(`${window.location.origin}/viewer/${id}`);
    toast({ title: "Share link copied to clipboard" });
  };

  const getFullRankedList = useCallback(() =>
    [...localRatings].sort((a, b) => a.rankWithinTier - b.rankWithinTier)
      .map((r, idx) => { const item = items.find(i => i.id === r.itemId); return item ? { ...item, ratingId: r.id, rating: r.rating, rank: idx + 1 } : null; })
      .filter(Boolean) as (ItemResponse & { ratingId: string; rating: number; rank: number })[], [localRatings, items]);

  const handleRate = (itemId: string, star: number) => {
    if (sibling?.wishlistSubmitted) return;
    const existing = ratingMap.get(itemId);
    if (existing && existing.rating === star) unrateMutation.mutate(itemId);
    else rateMutation.mutate({ itemId, rating: star });
  };

  const handleDragStart = (ratingId: string) => { if (!sibling?.wishlistSubmitted) setDraggedItem(ratingId); };
  const handleDragOver = (e: React.DragEvent, ratingId: string) => { e.preventDefault(); if (draggedItem && draggedItem !== ratingId) setDragOverId(ratingId); };
  const handleDragEnd = () => {
    if (!draggedItem || !dragOverId || draggedItem === dragOverId) { setDraggedItem(null); setDragOverId(null); return; }
    const all = getFullRankedList();
    const from = all.findIndex(i => i.ratingId === draggedItem);
    const to = all.findIndex(i => i.ratingId === dragOverId);
    if (from === -1 || to === -1) { setDraggedItem(null); setDragOverId(null); return; }
    const reordered = [...all];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const newOrder = reordered.map((item, idx) => ({ id: item.ratingId, rankWithinTier: idx }));
    // Optimistic update: apply new order to local state immediately (no waiting for server)
    setLocalRatings(prev =>
      prev.map(r => {
        const found = newOrder.find(o => o.id === r.id);
        return found ? { ...r, rankWithinTier: found.rankWithinTier } : r;
      })
    );
    setDraggedItem(null); setDragOverId(null);
    // Fire API call in background
    reorderMutation.mutate(newOrder);
  };

  const isLoading = siblingLoading || itemsLoading || ratingsLoading;
  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (!sibling) return <div className="min-h-screen bg-background flex items-center justify-center"><Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">Family member not found</p><Link href="/"><Button variant="ghost" className="mt-4">Go back</Button></Link></CardContent></Card></div>;

  if (sibling.hasPin && !isVerified) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto" style={{ backgroundColor: sibling.color }}>{getInitials(sibling.name)}</div>
          <div><h1 className="font-serif text-2xl font-semibold">{sibling.name}'s Rankings</h1><p className="text-muted-foreground mt-2">Enter your 4-digit PIN to access your rankings</p></div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin-input" className="flex items-center gap-2 justify-center"><Lock className="w-4 h-4" /> Private PIN</Label>
              <Input id="pin-input" type="password" value={pinInput} onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(false); }} placeholder="Enter 4-digit PIN" maxLength={4} className="text-center text-2xl tracking-widest" onKeyDown={(e) => { if (e.key === 'Enter' && pinInput.length === 4) verifyPin(); }} data-testid="input-pin" />
              {pinError && <p className="text-destructive text-sm">Incorrect PIN. Please try again.</p>}
            </div>
            <Button onClick={verifyPin} disabled={pinInput.length !== 4 || verifying} className="w-full" data-testid="button-verify-pin">{verifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Enter</Button>
          </div>
          <div className="pt-4 border-t"><Link href="/"><Button variant="ghost" size="sm" data-testid="button-back-home"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Button></Link></div>
        </CardContent>
      </Card>
    </div>
  );

  const isSubmitted = sibling.wishlistSubmitted;
  const steps = [
    { num: 1, label: "Rate Items", done: currentStep > 1 },
    { num: 2, label: "Sort Rankings", done: currentStep > 2 },
    { num: 3, label: "Review & Submit", done: isSubmitted },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/"><Button variant="ghost" size="icon" data-testid="button-back"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: sibling.color }}>{getInitials(sibling.name)}</div>
            <div><span className="font-serif text-xl font-semibold">{sibling.name}</span><p className="text-sm text-muted-foreground">Item Rankings</p></div>
          </div>
          <Button variant="outline" size="sm" onClick={copyShareLink} className="gap-2" data-testid="button-share"><Share2 className="w-4 h-4" />Share</Button>
        </div>
      </header>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-8" data-testid="step-progress">
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-center gap-2 flex-1">
              <button onClick={() => { if (step.num <= 2 && isSubmitted) return; setCurrentStep(step.num); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full ${currentStep === step.num ? "bg-primary text-primary-foreground" : step.done ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}
                disabled={step.num <= 2 && isSubmitted} data-testid={`step-button-${step.num}`}>
                {step.done && currentStep !== step.num ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <Circle className="w-5 h-5 shrink-0" />}
                <span className="text-sm font-medium truncate">{step.label}</span>
              </button>
              {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
        {currentStep === 1 && <Step1RateItems items={availableItems} ratingMap={ratingMap} ratedCount={ratings.length} totalItems={availableItems.length} onRate={handleRate} isSubmitted={isSubmitted} onNext={() => setCurrentStep(2)} />}
        {currentStep === 2 && <Step2SortAll rankedList={getFullRankedList()} draggedItem={draggedItem} dragOverId={dragOverId} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} isSubmitted={isSubmitted} isInitializing={reorderMutation.isPending && ratings.length !== lastInitializedCount.current} onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />}
        {currentStep === 3 && <Step3ReviewSubmit rankedList={getFullRankedList()} isSubmitted={isSubmitted} onSubmit={() => submitWishlistMutation.mutate()} onUnlock={() => unlockWishlistMutation.mutate()} submitting={submitWishlistMutation.isPending} unlocking={unlockWishlistMutation.isPending} onBack={() => setCurrentStep(2)} />}
      </div>
    </div>
  );
}

function Step1RateItems({ items, ratingMap, ratedCount, totalItems, onRate, isSubmitted, onNext }: { items: ItemResponse[]; ratingMap: Map<string, ItemRating>; ratedCount: number; totalItems: number; onRate: (itemId: string, rating: number) => void; isSubmitted: boolean; onNext: () => void; }) {
  const progressPct = totalItems > 0 ? (ratedCount / totalItems) * 100 : 0;
  return (
    <div>
      <div className="mb-6"><h2 className="font-serif text-2xl font-semibold">Rate the Items</h2><p className="text-muted-foreground text-sm mt-1">Give each item 1–5 stars. Click the same star again to clear it. Skip items you don't want — they won't appear in your rankings.</p></div>
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2"><span className="text-muted-foreground">{ratedCount} of {totalItems} rated</span><span className="font-medium">{Math.round(progressPct)}%</span></div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} /></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => {
          const currentRating = ratingMap.get(item.id)?.rating ?? 0;
          return (
            <Card key={item.id} className={`overflow-hidden ${currentRating > 0 ? "ring-2 ring-primary/30" : ""}`} data-testid={`rate-item-${item.id}`}>
              <div className="aspect-square bg-muted relative overflow-hidden">
                <ItemImage item={item} size="lg" />
                {currentRating > 0 && <div className="absolute top-2 right-2 pointer-events-none"><Badge className="bg-primary text-primary-foreground">{currentRating}<Star className="w-3 h-3 ml-0.5 fill-current" /></Badge></div>}
                {item.hasAudio && <Badge className="absolute top-2 left-2 gap-1 pointer-events-none" variant="secondary"><Volume2 className="w-3 h-3" /></Badge>}
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm truncate mb-2">{item.name}</h3>
                {item.description && <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{item.description}</p>}
                <div className="flex gap-0.5 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => onRate(item.id, star)} disabled={isSubmitted} className="p-1 hover:scale-125 transition-transform disabled:opacity-50" title={star === currentRating ? "Click to clear" : `Rate ${star} stars`} data-testid={`star-${item.id}-${star}`}>
                      <Star className={`w-5 h-5 ${star <= currentRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"} ${star === currentRating ? "ring-1 ring-amber-500 rounded-full" : ""}`} />
                    </button>
                  ))}
                </div>
                {item.hasAudio && <audio controls className="w-full h-6 mt-2" src={`/api/items/${item.id}/audio`} data-testid={`audio-${item.id}`}>Your browser does not support audio playback.</audio>}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end"><Button onClick={onNext} size="lg" className="gap-2" data-testid="button-next-step-2">Next: Sort Rankings<ChevronRight className="w-5 h-5" /></Button></div>
    </div>
  );
}

function Step2SortAll({ rankedList, draggedItem, dragOverId, onDragStart, onDragOver, onDragEnd, isSubmitted, isInitializing, onNext, onBack }: { rankedList: (ItemResponse & { ratingId: string; rating: number; rank: number })[]; draggedItem: string | null; dragOverId: string | null; onDragStart: (id: string) => void; onDragOver: (e: React.DragEvent, id: string) => void; onDragEnd: () => void; isSubmitted: boolean; isInitializing: boolean; onNext: () => void; onBack: () => void; }) {
  if (isInitializing) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (rankedList.length === 0) return (
    <div>
      <div className="mb-6"><h2 className="font-serif text-2xl font-semibold">Sort Your Rankings</h2></div>
      <Card><CardContent className="py-12 text-center"><Star className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">No items rated yet. Go back and rate some items first.</p></CardContent></Card>
      <div className="mt-8"><Button variant="outline" onClick={onBack} size="lg"><ArrowLeft className="w-5 h-5 mr-2" />Back</Button></div>
    </div>
  );

  type RenderNode = { type: "divider"; stars: number; key: string } | { type: "item"; item: typeof rankedList[number] };
  const renderNodes: RenderNode[] = [];
  let lastTier: number | null = null;
  for (const item of rankedList) {
    if (item.rating !== lastTier) { renderNodes.push({ type: "divider", stars: item.rating, key: `divider-${item.rating}-${item.ratingId}` }); lastTier = item.rating; }
    renderNodes.push({ type: "item", item });
  }

  return (
    <div>
      <div className="mb-6"><h2 className="font-serif text-2xl font-semibold">Sort Your Rankings</h2><p className="text-muted-foreground text-sm mt-1">Drag items into your personal priority order — across tiers if you want. Your #1 pick is what you want most.</p></div>
      <div className="space-y-1">
        {renderNodes.map((node) => {
          if (node.type === "divider") return <TierDivider key={node.key} stars={node.stars} />;
          const { item } = node;
          return (
            <Card key={item.ratingId} className={`transition-all duration-150 ${draggedItem === item.ratingId ? "opacity-50 scale-95" : ""} ${dragOverId === item.ratingId ? "border-primary border-2" : ""}`} draggable={!isSubmitted} onDragStart={() => onDragStart(item.ratingId)} onDragOver={(e) => onDragOver(e, item.ratingId)} onDragEnd={onDragEnd} data-testid={`sort-item-${item.id}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {!isSubmitted && <GripVertical className="w-5 h-5 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />}
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><span className="font-semibold text-primary text-sm">{item.rank}</span></div>
                  <div className="w-12 h-12 rounded-md overflow-hidden shrink-0"><ItemImage item={item} size="sm" /></div>
                  <div className="flex-1 min-w-0"><h3 className="font-medium truncate">{item.name}</h3>{item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}</div>
                  <div className="flex gap-0.5 shrink-0">{Array.from({ length: item.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg" data-testid="button-back-step-1"><ArrowLeft className="w-5 h-5 mr-2" />Back</Button>
        <Button onClick={onNext} size="lg" className="gap-2" data-testid="button-next-step-3">Next: Review & Submit<ChevronRight className="w-5 h-5" /></Button>
      </div>
    </div>
  );
}

function Step3ReviewSubmit({ rankedList, isSubmitted, onSubmit, onUnlock, submitting, unlocking, onBack }: { rankedList: (ItemResponse & { ratingId: string; rating: number; rank: number })[]; isSubmitted: boolean; onSubmit: () => void; onUnlock: () => void; submitting: boolean; unlocking: boolean; onBack: () => void; }) {
  return (
    <div>
      <div className="mb-6"><h2 className="font-serif text-2xl font-semibold">{isSubmitted ? "Rankings Submitted" : "Review Your Rankings"}</h2><p className="text-muted-foreground text-sm mt-1">{isSubmitted ? "Your rankings are locked in. You can unlock them to make changes." : "This is your final priority order. Go back to adjust if anything looks off."}</p></div>
      {isSubmitted && (
        <Card className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="py-4"><div className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0" /><div><p className="font-medium text-green-800 dark:text-green-300">Rankings locked in</p><p className="text-sm text-green-600 dark:text-green-400">Your picks are set for the draft.</p></div></div></CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {rankedList.map((item) => (
          <Card key={item.ratingId} data-testid={`review-item-${item.id}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><span className="font-semibold text-primary text-sm">{item.rank}</span></div>
                <div className="w-12 h-12 rounded-md overflow-hidden shrink-0"><ItemImage item={item} size="sm" /></div>
                <div className="flex-1 min-w-0"><h3 className="font-medium truncate">{item.name}</h3></div>
                <div className="flex gap-0.5 shrink-0">{Array.from({ length: item.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 flex justify-between">
        {!isSubmitted && <Button variant="outline" onClick={onBack} size="lg" data-testid="button-back-step-2"><ArrowLeft className="w-5 h-5 mr-2" />Back</Button>}
        {isSubmitted
          ? <Button variant="outline" onClick={onUnlock} disabled={unlocking} size="lg" className="gap-2 ml-auto" data-testid="button-unlock">{unlocking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}Unlock Rankings</Button>
          : <Button onClick={onSubmit} disabled={submitting} size="lg" className="gap-2" data-testid="button-submit-rankings">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}Submit Rankings</Button>
        }
      </div>
    </div>
  );
}