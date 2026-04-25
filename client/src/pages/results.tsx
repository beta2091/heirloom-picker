import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trophy, Loader2, Image as ImageIcon, Volume2, Heart, Download, Image as Img, Undo2 } from "lucide-react";
import { getInitials } from "@/lib/utils-initials";
import JSZip from "jszip";

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

export default function Results() {
  const { toast } = useToast();
  const [zipBusy, setZipBusy] = useState<string | null>(null);
  const [assignDraft, setAssignDraft] = useState<Record<string, string>>({});
  const adminPin = typeof window !== "undefined" ? sessionStorage.getItem("admin-pin") || "" : "";

  const { data: siblings = [], isLoading: siblingsLoading } = useQuery<SiblingResponse[]>({
    queryKey: ["/api/siblings"],
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<ItemResponse[]>({
    queryKey: ["/api/items"],
  });

  const assignMutation = useMutation({
    mutationFn: async ({ itemId, siblingId }: { itemId: string; siblingId: string }) =>
      apiRequest("POST", `/api/items/${itemId}/assign`, { adminPin, siblingId }),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      const who = siblings.find(s => s.id === vars.siblingId);
      toast({ title: "Item assigned", description: who ? `Added to ${who.name}'s picks` : undefined });
    },
    onError: (err: any) => toast({ title: "Couldn't assign", description: err?.message || "Admin PIN required.", variant: "destructive" }),
  });

  const unassignMutation = useMutation({
    mutationFn: async (itemId: string) =>
      apiRequest("POST", `/api/items/${itemId}/unassign`, { adminPin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Item moved back to donation pool" });
    },
    onError: (err: any) => toast({ title: "Couldn't unassign", description: err?.message || "Admin PIN required.", variant: "destructive" }),
  });

  const isLoading = siblingsLoading || itemsLoading;
  const pickedItems = items.filter(item => item.pickedBySiblingId);
  const unpickedItems = items.filter(item => !item.pickedBySiblingId);

  const csvEscape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const downloadCsv = (filename: string, rows: (string | number | null | undefined)[][]) => {
    const csv = rows.map(r => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    const rows: (string | number | null | undefined)[][] = [["Sibling", "Round", "Item", "Description"]];
    siblings.forEach(sib => {
      const picks = pickedItems
        .filter(i => i.pickedBySiblingId === sib.id)
        .sort((a, b) => (a.pickRound || 0) - (b.pickRound || 0));
      picks.forEach(p => rows.push([sib.name, p.pickRound ?? "", p.name, p.description ?? ""]));
    });
    unpickedItems.forEach(i => rows.push(["(unpicked / donation)", "", i.name, i.description ?? ""]));
    downloadCsv(`heirloom-draft-results-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleDownloadSibling = (sibling: SiblingResponse) => {
    const picks = pickedItems
      .filter(i => i.pickedBySiblingId === sibling.id)
      .sort((a, b) => (a.pickRound || 0) - (b.pickRound || 0));
    const rows: (string | number | null | undefined)[][] = [["Round", "Item", "Description"]];
    picks.forEach(p => rows.push([p.pickRound ?? "", p.name, p.description ?? ""]));
    const slug = sibling.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadCsv(`${slug}-picks-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  // Slugify an item name into a safe-for-filesystem stem.
  const fileSlug = (s: string) => s.replace(/[\\/:*?"<>|\n\r\t]+/g, "-").replace(/\s+/g, "_").slice(0, 80);

  // Fetch the image for an item, return { blob, ext } or null if no image.
  const fetchItemImage = async (itemId: string): Promise<{ blob: Blob; ext: string } | null> => {
    const res = await fetch(`/api/items/${itemId}/image`);
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = blob.type || "image/jpeg";
    const ext = type.includes("png") ? "png" : type.includes("gif") ? "gif" : type.includes("webp") ? "webp" : "jpg";
    return { blob, ext };
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSiblingImages = async (sibling: SiblingResponse) => {
    const picks = pickedItems
      .filter(i => i.pickedBySiblingId === sibling.id && i.hasImage)
      .sort((a, b) => (a.pickRound || 0) - (b.pickRound || 0));
    if (picks.length === 0) {
      toast({ title: "No images", description: `${sibling.name}'s items don't have photos attached.` });
      return;
    }
    setZipBusy(sibling.id);
    try {
      const zip = new JSZip();
      const folder = zip.folder(sibling.name) || zip;
      // CSV manifest inside the zip so they know what's what.
      const manifest: string[] = ["Round,Item,Description,File"];
      let i = 1;
      for (const p of picks) {
        const img = await fetchItemImage(p.id);
        const stem = `${String(p.pickRound ?? i).padStart(2, "0")}-${fileSlug(p.name)}`;
        if (img) {
          folder.file(`${stem}.${img.ext}`, img.blob);
          manifest.push([p.pickRound ?? "", p.name, p.description ?? "", `${stem}.${img.ext}`]
            .map(v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v)).join(","));
        } else {
          manifest.push([p.pickRound ?? "", p.name, p.description ?? "", "(no image)"]
            .map(v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v)).join(","));
        }
        i++;
      }
      folder.file("picks.csv", manifest.join("\n"));
      const blob = await zip.generateAsync({ type: "blob" });
      const slug = sibling.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      downloadBlob(blob, `${slug}-picks-${new Date().toISOString().slice(0, 10)}.zip`);
      toast({ title: `Downloaded ${sibling.name}'s photos` });
    } catch (e: any) {
      toast({ title: "Image download failed", description: e?.message || "Try again.", variant: "destructive" });
    } finally {
      setZipBusy(null);
    }
  };

  const handleDownloadAllImages = async () => {
    setZipBusy("__all__");
    try {
      const zip = new JSZip();
      for (const sib of siblings) {
        const picks = pickedItems
          .filter(i => i.pickedBySiblingId === sib.id && i.hasImage)
          .sort((a, b) => (a.pickRound || 0) - (b.pickRound || 0));
        if (picks.length === 0) continue;
        const folder = zip.folder(sib.name)!;
        for (const p of picks) {
          const img = await fetchItemImage(p.id);
          if (!img) continue;
          const stem = `${String(p.pickRound ?? "").padStart(2, "0")}-${fileSlug(p.name)}`;
          folder.file(`${stem}.${img.ext}`, img.blob);
        }
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `heirloom-draft-photos-${new Date().toISOString().slice(0, 10)}.zip`);
      toast({ title: "Downloaded photos for everyone" });
    } catch (e: any) {
      toast({ title: "Image download failed", description: e?.message || "Try again.", variant: "destructive" });
    } finally {
      setZipBusy(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-semibold">Draft Results</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {pickedItems.length > 0 && (
              <>
                <Button variant="outline" onClick={handleDownloadAll} data-testid="button-download-all">
                  <Download className="w-4 h-4 mr-2" /> Download CSV
                </Button>
                <Button variant="outline" onClick={handleDownloadAllImages} disabled={zipBusy !== null} data-testid="button-download-all-images">
                  {zipBusy === "__all__" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Img className="w-4 h-4 mr-2" />}
                  Download All Photos (ZIP)
                </Button>
              </>
            )}
            <Link href="/draft">
              <Button variant="outline" data-testid="link-to-draft">
                Draft Board
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {pickedItems.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
              <h2 className="font-serif text-2xl font-semibold mb-2">No Picks Yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                The draft hasn't started or no items have been picked yet. Head to the draft board to begin.
              </p>
              <Link href="/draft">
                <Button data-testid="button-go-to-draft">Go to Draft Board</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {siblings.map((sibling) => {
                const siblingItems = pickedItems.filter(item => item.pickedBySiblingId === sibling.id);
                return (
                  <Card key={sibling.id} data-testid={`results-summary-${sibling.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                          style={{ backgroundColor: sibling.color }}
                        >
                          {getInitials(sibling.name)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{sibling.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {siblingItems.length} item{siblingItems.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {siblings.map((sibling) => {
              const siblingItems = pickedItems
                .filter(item => item.pickedBySiblingId === sibling.id)
                .sort((a, b) => (a.pickRound || 0) - (b.pickRound || 0));

              if (siblingItems.length === 0) return null;

              return (
                <section key={sibling.id} data-testid={`results-section-${sibling.id}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: sibling.color }}
                    >
                      {getInitials(sibling.name)}
                    </div>
                    <h2 className="font-serif text-xl font-semibold">{sibling.name}'s Items</h2>
                    <Badge variant="secondary">{siblingItems.length}</Badge>
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadSibling(sibling)}
                        data-testid={`button-download-${sibling.id}`}
                      >
                        <Download className="w-4 h-4 mr-2" /> CSV
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadSiblingImages(sibling)}
                        disabled={zipBusy !== null}
                        data-testid={`button-download-images-${sibling.id}`}
                      >
                        {zipBusy === sibling.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Img className="w-4 h-4 mr-2" />}
                        Photos
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {siblingItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden" data-testid={`result-item-${item.id}`}>
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
                          <Badge className="absolute top-2 left-2" variant="secondary">
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
                              data-testid={`audio-result-${item.id}`}
                            >
                              Your browser does not support audio playback.
                            </audio>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 h-7 text-xs"
                            onClick={() => unassignMutation.mutate(item.id)}
                            disabled={unassignMutation.isPending}
                            data-testid={`button-unassign-${item.id}`}
                          >
                            <Undo2 className="w-3 h-3 mr-1" /> Move back to pool
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              );
            })}

            {unpickedItems.length > 0 && (
              <section data-testid="results-unpicked">
                <h2 className="font-serif text-xl font-semibold mb-4 text-muted-foreground">
                  Remaining Items ({unpickedItems.length})
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Use the dropdown below any item to assign it to a sibling after the live draft.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {unpickedItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden" data-testid={`result-unpicked-${item.id}`}>
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
                      </div>
                      <CardContent className="p-3 space-y-2">
                        <h3 className="font-medium text-sm truncate">{item.name}</h3>
                        <Select
                          value={assignDraft[item.id] || ""}
                          onValueChange={(v) => setAssignDraft(prev => ({ ...prev, [item.id]: v }))}
                        >
                          <SelectTrigger className="h-8 text-xs" data-testid={`assign-select-${item.id}`}>
                            <SelectValue placeholder="Assign to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {siblings.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full h-7 text-xs"
                          disabled={!assignDraft[item.id] || assignMutation.isPending}
                          onClick={() => {
                            const siblingId = assignDraft[item.id];
                            if (!siblingId) return;
                            assignMutation.mutate({ itemId: item.id, siblingId });
                            setAssignDraft(prev => { const next = { ...prev }; delete next[item.id]; return next; });
                          }}
                          data-testid={`assign-btn-${item.id}`}
                        >
                          Assign
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
