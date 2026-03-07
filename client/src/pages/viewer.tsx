import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Heart, Loader2, Image as ImageIcon, Volume2, Users, MessageSquare, Trash2, User, Flag } from "lucide-react";
import { getInitials } from "@/lib/utils-initials";
import type { FamilyMember, FamilySuggestion } from "@shared/schema";

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

interface ViewerData {
  sibling: SiblingResponse;
  items: ItemResponse[];
  familyMembers: FamilyMember[];
  suggestions: FamilySuggestion[];
}

export default function ViewerPage() {
  const { siblingId } = useParams<{ siblingId: string }>();
  const { toast } = useToast();
  const [visitorName, setVisitorName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [familyMemberId, setFamilyMemberId] = useState<string | null>(null);
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
  const [suggestingItemId, setSuggestingItemId] = useState<string | null>(null);
  const [suggestionNote, setSuggestionNote] = useState("");

  useEffect(() => {
    if (siblingId) {
      const stored = localStorage.getItem(`viewer_member_${siblingId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setVisitorName(parsed.name);
          setFamilyMemberId(parsed.id);
        } catch {}
      }
    }
  }, [siblingId]);

  const { data, isLoading, error } = useQuery<ViewerData>({
    queryKey: ["/api/viewer", siblingId],
    enabled: !!siblingId,
  });

  const registerMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", `/api/viewer/${siblingId}/family-members`, { name });
      return response.json();
    },
    onSuccess: (member: FamilyMember) => {
      setVisitorName(member.name);
      setFamilyMemberId(member.id);
      localStorage.setItem(`viewer_member_${siblingId}`, JSON.stringify({ id: member.id, name: member.name }));
      queryClient.invalidateQueries({ queryKey: ["/api/viewer", siblingId] });
      toast({ title: `Welcome, ${member.name}!` });
    },
    onError: () => {
      toast({ title: "Something went wrong", variant: "destructive" });
    },
  });

  const suggestMutation = useMutation({
    mutationFn: async ({ itemId, note }: { itemId: string; note: string }) => {
      const response = await apiRequest("POST", `/api/viewer/${siblingId}/suggestions`, {
        familyMemberId,
        itemId,
        note,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/viewer", siblingId] });
      setSuggestDialogOpen(false);
      setSuggestingItemId(null);
      setSuggestionNote("");
      toast({ title: "Suggestion sent!" });
    },
    onError: () => {
      toast({ title: "Failed to add suggestion", variant: "destructive" });
    },
  });

  const removeSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      await apiRequest("DELETE", `/api/viewer/${siblingId}/suggestions/${suggestionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/viewer", siblingId] });
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-serif text-xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This link may be invalid or expired.
            </p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { sibling, items, familyMembers, suggestions } = data;

  const availableItems = items.filter(item => !item.pickedBySiblingId);
  const suggestingItem = suggestingItemId ? items.find(i => i.id === suggestingItemId) : null;
  const isRegistered = !!familyMemberId && !!visitorName;

  const getSuggestionsForItem = (itemId: string) => {
    return suggestions.filter(s => s.itemId === itemId);
  };

  const getFamilyMemberById = (id: string) => {
    return familyMembers.find(m => m.id === id);
  };

  const mySuggestions = suggestions.filter(s => s.familyMemberId === familyMemberId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-semibold">Estate Draft</span>
            </div>
            {isRegistered && (
              <Badge variant="secondary" className="gap-1">
                <User className="w-3 h-3" />
                {visitorName}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-8" style={{ borderColor: sibling.color, borderWidth: 2 }}>
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0"
                style={{ backgroundColor: sibling.color }}
              >
                {getInitials(sibling.name)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suggesting items for</p>
                <h1 className="font-serif text-2xl font-semibold" data-testid="text-sibling-name">{sibling.name}</h1>
                <p className="text-muted-foreground text-sm">
                  Browse items and suggest which ones {sibling.name} should pick
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isRegistered && (
          <Card className="mb-8">
            <CardContent className="py-6">
              <div className="text-center mb-4">
                <Users className="w-10 h-10 mx-auto text-primary mb-2" />
                <h2 className="font-serif text-lg font-semibold">Enter Your Name</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Tell us who you are so {sibling.name} knows who suggested each item
                </p>
              </div>
              <div className="flex gap-2 max-w-sm mx-auto">
                <Input
                  placeholder="Your name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  data-testid="input-viewer-name"
                />
                <Button
                  onClick={handleRegister}
                  disabled={nameInput.trim().length === 0 || registerMutation.isPending}
                  data-testid="button-register-viewer"
                >
                  {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isRegistered && mySuggestions.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Flag className="w-5 h-5 text-primary" />
                Your Suggestions ({mySuggestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mySuggestions.map((suggestion) => {
                  const item = items.find(i => i.id === suggestion.itemId);
                  if (!item) return null;
                  return (
                    <div key={suggestion.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50" data-testid={`my-suggestion-${suggestion.id}`}>
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                        {item.hasImage ? (
                          <img
                            src={`/api/items/${item.id}/image`}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{suggestion.note}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeSuggestionMutation.mutate(suggestion.id)}
                        data-testid={`button-remove-my-suggestion-${suggestion.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <section>
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-semibold flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              Available Items
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {isRegistered
                ? `Click the ❤️ on any item to suggest it for ${sibling.name}`
                : "Enter your name above to suggest items"}
            </p>
          </div>

          {availableItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No items available right now</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableItems.map((item) => {
                const itemSuggestions = getSuggestionsForItem(item.id);
                const alreadySuggested = itemSuggestions.some(s => s.familyMemberId === familyMemberId);
                return (
                  <Card key={item.id} className="overflow-hidden" data-testid={`viewer-item-${item.id}`}>
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
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm truncate">{item.name}</h3>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {item.description}
                            </p>
                          )}
                          {itemSuggestions.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {itemSuggestions.map((s) => {
                                const member = getFamilyMemberById(s.familyMemberId);
                                return (
                                  <p key={s.id} className="text-xs text-muted-foreground">
                                    <span className="font-medium">{member?.name ?? "Someone"}</span>: "{s.note}"
                                  </p>
                                );
                              })}
                            </div>
                          )}
                          {item.hasAudio && (
                            <audio
                              controls
                              className="w-full h-6 mt-2"
                              src={`/api/items/${item.id}/audio`}
                              data-testid={`audio-viewer-${item.id}`}
                            >
                              Your browser does not support audio playback.
                            </audio>
                          )}
                        </div>
                        {isRegistered && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 -mr-2 -mt-1"
                            onClick={() => alreadySuggested ? null : openSuggestDialog(item.id)}
                            disabled={alreadySuggested}
                            data-testid={`button-suggest-${item.id}`}
                          >
                            <Heart className={`w-5 h-5 ${alreadySuggested ? "fill-red-500 text-red-500" : "text-red-400 hover:text-red-500"}`} />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Dialog open={suggestDialogOpen} onOpenChange={setSuggestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Suggest This Item</DialogTitle>
            <DialogDescription>
              Tell {sibling.name} why you think they should pick{" "}
              <span className="font-medium">{suggestingItem?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {suggestingItem?.hasImage && (
              <div className="w-full h-48 rounded-lg overflow-hidden bg-muted">
                <img
                  src={`/api/items/${suggestingItem.id}/image`}
                  alt={suggestingItem.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <Textarea
              placeholder={`Why should ${sibling.name} pick this item?`}
              value={suggestionNote}
              onChange={(e) => setSuggestionNote(e.target.value)}
              className="min-h-[100px]"
              data-testid="input-suggestion-note"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSuggestDialogOpen(false)} data-testid="button-cancel-suggestion">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitSuggestion}
                disabled={suggestionNote.trim().length === 0 || suggestMutation.isPending}
                data-testid="button-submit-suggestion"
              >
                {suggestMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Heart className="w-4 h-4 mr-2" />
                )}
                Send Suggestion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="border-t py-8 px-4 mt-12">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Made with care for families during difficult times</p>
        </div>
      </footer>
    </div>
  );
}
