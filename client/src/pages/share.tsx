import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { Heart, Star, Loader2, Image as ImageIcon, Check, Trophy, Volume2, Plus, Users, MessageSquare, Trash2, User, Unplug } from "lucide-react";
import { getInitials } from "@/lib/utils-initials";
import { HelpTooltip } from "@/components/help-tooltip";
import type { WishlistItem, FamilyMember, FamilySuggestion } from "@shared/schema";

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

interface ShareData {
  sibling: SiblingResponse;
  items: ItemResponse[];
  wishlist: WishlistItem[];
  allSiblings: SiblingResponse[];
  familyMembers: FamilyMember[];
  suggestions: FamilySuggestion[];
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [visitorName, setVisitorName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [familyMemberId, setFamilyMemberId] = useState<string | null>(null);
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
  const [suggestingItemId, setSuggestingItemId] = useState<string | null>(null);
  const [suggestionNote, setSuggestionNote] = useState("");
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      const stored = localStorage.getItem(`family_member_${token}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setVisitorName(parsed.name);
          setFamilyMemberId(parsed.id);
        } catch {}
      }
    }
  }, [token]);

  const { data, isLoading, error } = useQuery<ShareData>({
    queryKey: ["/api/share", token],
    enabled: !!token,
  });

  const registerMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", `/api/share/${token}/family-members`, { name });
      return response.json();
    },
    onSuccess: (member: FamilyMember) => {
      setVisitorName(member.name);
      setFamilyMemberId(member.id);
      localStorage.setItem(`family_member_${token}`, JSON.stringify({ id: member.id, name: member.name }));
      queryClient.invalidateQueries({ queryKey: ["/api/share", token] });
      toast({ title: `Welcome, ${member.name}!` });
    },
    onError: () => {
      toast({ title: "Something went wrong", variant: "destructive" });
    },
  });

  const suggestMutation = useMutation({
    mutationFn: async ({ itemId, note }: { itemId: string; note: string }) => {
      const response = await apiRequest("POST", `/api/share/${token}/suggestions`, {
        familyMemberId,
        itemId,
        note,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/share", token] });
      setSuggestDialogOpen(false);
      setSuggestingItemId(null);
      setSuggestionNote("");
      toast({ title: "Suggestion added!" });
    },
    onError: () => {
      toast({ title: "Failed to add suggestion", variant: "destructive" });
    },
  });

  const removeSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      await apiRequest("DELETE", `/api/share/${token}/suggestions/${suggestionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/share", token] });
      toast({ title: "Suggestion removed" });
    },
  });

  const handleRegister = () => {
    if (nameInput.trim().length > 0) {
      registerMutation.mutate(nameInput.trim());
    }
  };

  const openSuggestDialog = (itemId: string) => {
    setSuggestingItemId(itemId);
    setSuggestionNote("");
    setSuggestDialogOpen(true);
  };

  const handleSubmitSuggestion = () => {
    if (suggestingItemId && suggestionNote.trim().length > 0) {
      suggestMutation.mutate({ itemId: suggestingItemId, note: suggestionNote.trim() });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 sm:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent"
          />
          <div className="relative w-full max-w-md text-center">
            <div className="flex justify-center">
              <Link href="/" className="rounded-md" aria-label="Evenkeep home">
                <Logo />
              </Link>
            </div>
            <div className="mt-8 rounded-2xl border border-card-border bg-card p-8 shadow-lg">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Unplug className="h-6 w-6" />
              </span>
              <h2 className="mt-6 font-serif text-3xl font-bold tracking-tight">Link not found</h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                This share link may be invalid or expired. Ask the person who sent
                it to share a new link with you.
              </p>
              <div className="mt-7 flex justify-center">
                <Link href="/">
                  <Button size="lg" className="min-h-12 px-8 text-base shadow-md">Go home</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { sibling, items, wishlist, allSiblings, familyMembers, suggestions } = data;

  const getSiblingById = (siblingId: string) => {
    return allSiblings.find(s => s.id === siblingId);
  };

  const wishlistItemsWithDetails = wishlist
    .sort((a, b) => a.priority - b.priority)
    .map(w => {
      const item = items.find(i => i.id === w.itemId);
      return item ? { ...item, priority: w.priority } : null;
    })
    .filter((item): item is ItemResponse & { priority: number } => item !== null);

  const pickedItems = items.filter(item => item.pickedBySiblingId === sibling.id);
  const availableItems = items.filter(item => !item.pickedBySiblingId);

  const suggestingItem = suggestingItemId ? items.find(i => i.id === suggestingItemId) : null;

  const getSuggestionsForItem = (itemId: string) => {
    return suggestions.filter(s => s.itemId === itemId);
  };

  const getFamilyMemberById = (id: string) => {
    return familyMembers.find(m => m.id === id);
  };

  const selectedMemberSuggestions = selectedFamilyMemberId
    ? suggestions.filter(s => s.familyMemberId === selectedFamilyMemberId)
    : [];

  const selectedMember = selectedFamilyMemberId
    ? getFamilyMemberById(selectedFamilyMemberId)
    : null;

  const isRegistered = !!familyMemberId && !!visitorName;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="rounded-md" aria-label="Evenkeep home">
            <Logo />
          </Link>
          {isRegistered && (
            <Badge variant="secondary" className="gap-1.5">
              <User className="h-3 w-3" />
              {visitorName}
            </Badge>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <Card className="mb-8 rounded-2xl shadow-sm" style={{ borderColor: sibling.color, borderWidth: 2 }}>
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0"
                style={{ backgroundColor: sibling.color }}
              >
                {getInitials(sibling.name)}
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Shared page for</p>
                <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight sm:text-4xl">{sibling.name}</h1>
                <p className="mt-1 text-base text-muted-foreground">
                  {sibling.draftOrder > 0 ? `Draft Position #${sibling.draftOrder}` : "Family Member"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isRegistered && (
          <Card className="mb-8 rounded-2xl border-card-border shadow-sm">
            <CardContent className="py-8">
              <div className="mb-5 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </span>
                <h2 className="mt-5 font-serif text-2xl font-bold tracking-tight">Welcome</h2>
                <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-muted-foreground">
                  Enter your name to suggest items for {sibling.name}'s wishlist.
                  You can browse freely without entering your name.
                </p>
              </div>
              <div className="mx-auto flex max-w-sm gap-2">
                <Input
                  placeholder="Your name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  className="min-h-12"
                  data-testid="input-visitor-name"
                />
                <Button
                  onClick={handleRegister}
                  disabled={nameInput.trim().length === 0 || registerMutation.isPending}
                  className="min-h-12 px-6 text-base shadow-md"
                  data-testid="button-register-visitor"
                >
                  {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-8 rounded-2xl border border-card-border bg-secondary/30 p-4 text-center">
          <p className="text-base leading-relaxed text-muted-foreground">
            {isRegistered
              ? `You're signed in as ${visitorName}. Suggest items you think ${sibling.name} should pick!`
              : `Browse ${sibling.name}'s items. Enter your name above to suggest items for their wishlist.`}
          </p>
        </div>

        {familyMembers.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </span>
              Family Members
              <HelpTooltip text="People who have visited this page and entered their name. Click on someone to see what items they've suggested." side="right" />
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {familyMembers.map((member) => {
                const memberSuggestionCount = suggestions.filter(s => s.familyMemberId === member.id).length;
                return (
                  <Card
                    key={member.id}
                    className={`cursor-pointer rounded-2xl border-card-border shadow-sm hover-elevate ${selectedFamilyMemberId === member.id ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedFamilyMemberId(
                      selectedFamilyMemberId === member.id ? null : member.id
                    )}
                    data-testid={`card-family-member-${member.id}`}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <span className="font-bold text-primary text-sm">{getInitials(member.name)}</span>
                      </div>
                      <p className="font-medium text-sm truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {memberSuggestionCount} suggestion{memberSuggestionCount !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedMember && (
              <Card className="mt-4 rounded-2xl border-card-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-wrap items-center gap-2 font-serif text-lg font-semibold">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    {selectedMember.name}'s Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedMemberSuggestions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No suggestions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedMemberSuggestions.map((suggestion) => {
                        const item = items.find(i => i.id === suggestion.itemId);
                        if (!item) return null;
                        return (
                          <div key={suggestion.id} className="flex items-center gap-3" data-testid={`suggestion-${suggestion.id}`}>
                            <div className="w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                              {item.hasImage ? (
                                <img
                                  src={`/api/items/${item.id}/image`}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{suggestion.note}</p>
                            </div>
                            {familyMemberId === suggestion.familyMemberId && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSuggestionMutation.mutate(suggestion.id);
                                }}
                                data-testid={`button-remove-suggestion-${suggestion.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {pickedItems.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                <Trophy className="h-5 w-5" />
              </span>
              Items Won
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pickedItems.map((item) => (
                <Card key={item.id} className="overflow-hidden rounded-2xl border-card-border shadow-sm" data-testid={`won-item-${item.id}`}>
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
                    <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground">
                      <Check className="w-3 h-3 mr-1" />
                      Round {item.pickRound}
                    </Badge>
                    {item.hasAudio && (
                      <Badge className="absolute top-2 right-2 gap-1" variant="secondary">
                        <Volume2 className="w-3 h-3" /> Audio
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                    {item.hasAudio && (
                      <audio 
                        controls 
                        className="w-full h-6 mt-2" 
                        src={`/api/items/${item.id}/audio`}
                        data-testid={`audio-won-${item.id}`}
                      >
                        Your browser does not support audio playback.
                      </audio>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {wishlistItemsWithDetails.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Star className="h-5 w-5" />
              </span>
              {sibling.name}'s Wishlist
            </h2>
            <div className="space-y-3">
              {wishlistItemsWithDetails.map((item, index) => {
                const isPicked = item.pickedBySiblingId !== null;
                const pickedBy = isPicked ? getSiblingById(item.pickedBySiblingId!) : null;
                return (
                  <Card
                    key={item.id}
                    className={`rounded-2xl border-card-border shadow-sm ${isPicked ? "opacity-60" : ""}`}
                    data-testid={`wishlist-item-${item.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                          {item.hasImage ? (
                            <img 
                              src={`/api/items/${item.id}/image`} 
                              alt={item.name} 
                              className={`w-full h-full object-cover ${isPicked ? "grayscale" : ""}`}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {item.description}
                            </p>
                          )}
                          {item.hasAudio && (
                            <div className="flex items-center gap-2 mt-1">
                              <Volume2 className="w-3 h-3 text-primary shrink-0" />
                              <audio 
                                controls 
                                className="flex-1 h-6" 
                                src={`/api/items/${item.id}/audio`}
                                data-testid={`audio-wishlist-${item.id}`}
                              >
                                Your browser does not support audio playback.
                              </audio>
                            </div>
                          )}
                        </div>
                        {isPicked && pickedBy && (
                          <Badge 
                            variant="secondary"
                            style={{ backgroundColor: pickedBy.color, color: "white" }}
                          >
                            Picked by {pickedBy.name}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {availableItems.length > 0 && (
          <section>
            <h2 className="mb-4 flex items-center gap-3 font-serif text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Heart className="h-5 w-5" />
              </span>
              All Available Items
              <HelpTooltip text={isRegistered ? "Browse all items and click 'Suggest' to recommend items you think they should pick. You'll need to explain why!" : "Enter your name above to suggest items. You can browse freely without signing in."} side="right" />
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableItems.map((item) => {
                const itemSuggestions = getSuggestionsForItem(item.id);
                const alreadySuggested = itemSuggestions.some(s => s.familyMemberId === familyMemberId);
                return (
                  <Card key={item.id} className="overflow-hidden rounded-2xl border-card-border shadow-sm" data-testid={`available-item-${item.id}`}>
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
                      {itemSuggestions.length > 0 && (
                        <Badge className="absolute top-2 left-2 gap-1" variant="secondary">
                          <MessageSquare className="w-3 h-3" /> {itemSuggestions.length}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                      {item.hasAudio && (
                        <audio 
                          controls 
                          className="w-full h-6 mt-2" 
                          src={`/api/items/${item.id}/audio`}
                          data-testid={`audio-available-${item.id}`}
                        >
                          Your browser does not support audio playback.
                        </audio>
                      )}
                      {itemSuggestions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {itemSuggestions.map((s) => {
                            const member = getFamilyMemberById(s.familyMemberId);
                            return (
                              <div key={s.id} className="text-xs text-muted-foreground flex items-start gap-1">
                                <span className="font-medium shrink-0">{member?.name}:</span>
                                <span className="line-clamp-1">{s.note}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {isRegistered && !alreadySuggested && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2 gap-1"
                          onClick={() => openSuggestDialog(item.id)}
                          data-testid={`button-suggest-${item.id}`}
                        >
                          <Plus className="w-3 h-3" /> Suggest
                        </Button>
                      )}
                      {alreadySuggested && (
                        <Badge variant="secondary" className="w-full mt-2 justify-center">
                          <Check className="w-3 h-3 mr-1" /> Suggested
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <Dialog open={suggestDialogOpen} onOpenChange={setSuggestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Suggest Item</DialogTitle>
              <DialogDescription>
                Tell {sibling.name} why you think they should pick{" "}
                <span className="font-medium">{suggestingItem?.name}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {suggestingItem?.hasImage && (
                <div className="w-full h-40 rounded-md overflow-hidden bg-muted">
                  <img
                    src={`/api/items/${suggestingItem.id}/image`}
                    alt={suggestingItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Why should {sibling.name} pick this item?</Label>
                <Textarea
                  placeholder="e.g., Mom always loved this piece, it would look great in your living room..."
                  value={suggestionNote}
                  onChange={(e) => setSuggestionNote(e.target.value)}
                  className="resize-none"
                  rows={3}
                  data-testid="input-suggestion-note"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSuggestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitSuggestion}
                  disabled={suggestionNote.trim().length === 0 || suggestMutation.isPending}
                  data-testid="button-submit-suggestion"
                >
                  {suggestMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Suggestion
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <footer className="mt-12 border-t border-border bg-card/40">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-5 py-10 text-center sm:px-8">
          <Logo iconClassName="h-7 w-7" className="[&_span]:text-lg" />
          <p className="max-w-md text-base text-muted-foreground">
            Made with care for families during difficult times.
          </p>
        </div>
      </footer>
    </div>
  );
}
