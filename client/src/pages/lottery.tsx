import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Lock, Loader2, Trophy, Hash, Check, Sparkles, Crown
} from "lucide-react";
import { getInitials } from "@/lib/utils-initials";
// @ts-ignore
import confetti from "canvas-confetti";

interface LotteryParticipant {
  id: string;
  name: string;
  color: string;
  lotteryNumber: number | null;
  wishlistSubmitted: boolean;
}

interface SpinResult {
  winningNumber: number;
  tiebreakerNumber: number | null;
  draftOrder: {
    id: string;
    name: string;
    lotteryNumber: number;
    distance: number;
    tiebreakerDistance: number | null;
    draftPosition: number;
  }[];
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const WHEEL_SEGMENTS = 50;
const SEGMENT_ANGLE = (2 * Math.PI) / WHEEL_SEGMENTS;

const BASE_COLORS_DARK = [
  "#44403c", "#292524", "#3f3f46", "#27272a", "#1c1917",
];
const BASE_COLORS_LIGHT = [
  "#57534e", "#44403c", "#52525b", "#3f3f46", "#292524",
];

interface NumberOwner {
  number: number;
  color: string;
  name: string;
}

function SpinWheel({
  targetNumber,
  isSpinning,
  onSpinComplete,
  takenNumbers,
  revealColors,
  numberOwners,
}: {
  targetNumber: number | null;
  isSpinning: boolean;
  onSpinComplete: () => void;
  takenNumbers: Set<number>;
  revealColors: boolean;
  numberOwners: NumberOwner[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const velocityRef = useRef(0);
  const phaseRef = useRef<"idle" | "accelerating" | "cruising" | "decelerating" | "done">("idle");
  const startTimeRef = useRef(0);
  const targetAngleRef = useRef(0);

  const ownerMap = useRef(new Map<number, NumberOwner>());
  useEffect(() => {
    const m = new Map<number, NumberOwner>();
    numberOwners.forEach(o => m.set(o.number, o));
    ownerMap.current = m;
  }, [numberOwners]);

  const drawWheel = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < WHEEL_SEGMENTS; i++) {
      const startAngle = rotation + i * SEGMENT_ANGLE - Math.PI / 2;
      const endAngle = startAngle + SEGMENT_ANGLE;
      const num = i + 1;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();

      const owner = revealColors ? ownerMap.current.get(num) : undefined;
      if (owner) {
        ctx.fillStyle = owner.color;
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fill();
        ctx.restore();
      } else {
        const colors = i % 2 === 0 ? BASE_COLORS_DARK : BASE_COLORS_LIGHT;
        ctx.fillStyle = colors[Math.floor(i / 2) % colors.length];
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const midAngle = startAngle + SEGMENT_ANGLE / 2;
      const textR = radius * 0.78;
      const tx = cx + Math.cos(midAngle) * textR;
      const ty = cy + Math.sin(midAngle) * textR;

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.fillStyle = owner && revealColors ? "#fff" : "rgba(255,255,255,0.7)";
      ctx.font = `bold ${Math.max(10, size / 38)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(num), 0, 0);
      ctx.restore();

      if (owner && revealColors) {
        const nameR = radius * 0.55;
        const nx = cx + Math.cos(midAngle) * nameR;
        const ny = cy + Math.sin(midAngle) * nameR;
        ctx.save();
        ctx.translate(nx, ny);
        ctx.rotate(midAngle + Math.PI / 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = `bold ${Math.max(6, size / 60)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const initials = owner.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
        ctx.fillText(initials, 0, 0);
        ctx.restore();
      }
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = "#1f2937";
    ctx.fill();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.stroke();

    const pointerW = size * 0.055;
    const pointerH = size * 0.09;
    const pointerTip = cy - radius + pointerH * 0.35;
    const pointerBase = cy - radius - pointerH * 0.65;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    ctx.moveTo(cx, pointerTip);
    ctx.lineTo(cx - pointerW, pointerBase);
    ctx.lineTo(cx + pointerW, pointerBase);
    ctx.closePath();
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, pointerBase + (pointerTip - pointerBase) * 0.15, pointerW * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "#dc2626";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }, [takenNumbers, revealColors]);

  useEffect(() => {
    if (!isSpinning || targetNumber === null) {
      drawWheel(rotationRef.current);
      return;
    }

    phaseRef.current = "accelerating";
    startTimeRef.current = performance.now();
    velocityRef.current = 0;

    const targetSegmentIndex = targetNumber - 1;
    const targetSegmentCenter = -(targetSegmentIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2);
    const fullRotations = 8 * Math.PI * 2;
    targetAngleRef.current = targetSegmentCenter + fullRotations;

    const accelDuration = 1200;
    const cruiseDuration = 1800;
    const decelDuration = 4500;
    const maxVelocity = 0.4;

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;

      if (phaseRef.current === "accelerating") {
        const t = Math.min(elapsed / accelDuration, 1);
        velocityRef.current = maxVelocity * easeInCubic(t);
        if (t >= 1) {
          phaseRef.current = "cruising";
          startTimeRef.current = now;
        }
      } else if (phaseRef.current === "cruising") {
        const t = (now - startTimeRef.current) / cruiseDuration;
        velocityRef.current = maxVelocity;
        if (t >= 1) {
          phaseRef.current = "decelerating";
          startTimeRef.current = now;
        }
      } else if (phaseRef.current === "decelerating") {
        const t = Math.min((now - startTimeRef.current) / decelDuration, 1);
        const ease = 1 - easeOutQuart(t);
        velocityRef.current = maxVelocity * ease;
        if (t >= 1) {
          phaseRef.current = "done";
          velocityRef.current = 0;
          const snapped = targetAngleRef.current % (Math.PI * 2);
          rotationRef.current = snapped;
          drawWheel(rotationRef.current);
          onSpinComplete();
          return;
        }
      }

      rotationRef.current += velocityRef.current;
      drawWheel(rotationRef.current);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isSpinning, targetNumber, drawWheel, onSpinComplete]);

  useEffect(() => {
    if (!isSpinning) {
      drawWheel(rotationRef.current);
    }
  }, [drawWheel, isSpinning]);

  useEffect(() => {
    drawWheel(0);
  }, [drawWheel]);

  return (
    <div className="relative mx-auto" style={{ width: "min(400px, 85vw)", height: "min(400px, 85vw)" }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        data-testid="spin-wheel-canvas"
      />
    </div>
  );
}

function easeInCubic(t: number) {
  return t * t * t;
}
function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

interface AdminStatus {
  hasAdminPin: boolean;
  contactName: string | null;
}

export default function LotteryPage() {
  const { toast } = useToast();
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [activeSiblingId, setActiveSiblingId] = useState<string | null>(null);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelTarget, setWheelTarget] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [adminVerified, setAdminVerified] = useState(false);
  const [adminPinError, setAdminPinError] = useState(false);
  const [revealedPositions, setRevealedPositions] = useState<number>(0);
  const revealTimerRef = useRef<NodeJS.Timeout | null>(null);
  const verifiedAdminPinRef = useRef<string>("");

  const { data: adminStatus } = useQuery<AdminStatus>({
    queryKey: ["/api/admin/status"],
  });

  const { data: participants = [], isLoading } = useQuery<LotteryParticipant[]>({
    queryKey: ["/api/lottery"],
  });

  useEffect(() => {
    if (adminStatus && !adminStatus.hasAdminPin) {
      setAdminVerified(true);
    }
  }, [adminStatus]);

  const allLocked = participants.length > 0 && participants.every(p => p.lotteryNumber !== null);

  const lockNumberMutation = useMutation({
    mutationFn: async ({ siblingId, number }: { siblingId: string; number: number }) => {
      return apiRequest("POST", `/api/lottery/${siblingId}/lock-number`, { number, pin: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lottery"] });
      setActiveSiblingId(null);
      setSelectedNumber(null);
      toast({ title: "Number locked in!" });
    },
    onError: (error: any) => {
      toast({ title: "Could not lock number", description: error.message, variant: "destructive" });
    },
  });

  const pendingResultRef = useRef<SpinResult | null>(null);

  const verifyAdminPin = async () => {
    if (adminPinInput.length !== 4) return;
    setAdminPinError(false);
    try {
      const response = await apiRequest("POST", "/api/admin/verify-pin", { pin: adminPinInput });
      const data = await response.json();
      if (data.verified) {
        verifiedAdminPinRef.current = adminPinInput;
        setAdminVerified(true);
        setAdminPinInput("");
      } else {
        setAdminPinError(true);
      }
    } catch {
      setAdminPinError(true);
    }
  };

  const spinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/lottery/spin", { adminPin: verifiedAdminPinRef.current });
      return response.json() as Promise<SpinResult>;
    },
    onSuccess: (data) => {
      pendingResultRef.current = data;
      setWheelTarget(data.winningNumber);
      setIsSpinning(true);
      setAdminPinInput("");
    },
  });

  const [showLandedOn, setShowLandedOn] = useState(false);

  const fireConfetti = useCallback(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ["#f59e0b", "#fbbf24", "#d97706", "#ffffff", "#ef4444"];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });
  }, []);

  const handleSpinComplete = useCallback(() => {
    setIsSpinning(false);
    const data = pendingResultRef.current;
    if (data) {
      setSpinResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/lottery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/siblings"] });

      fireConfetti();

      setTimeout(() => {
        setShowLandedOn(true);
      }, 500);

      setTimeout(() => {
        setShowResults(true);
        let pos = 0;
        revealTimerRef.current = setInterval(() => {
          pos++;
          setRevealedPositions(pos);
          if (pos >= (data.draftOrder?.length || 0)) {
            clearInterval(revealTimerRef.current!);
          }
        }, 500);
      }, 2500);
    }
  }, [fireConfetti]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearInterval(revealTimerRef.current);
    };
  }, []);

  const takenNumbers = new Set(
    participants.map(p => p.lotteryNumber).filter((n): n is number => n !== null)
  );

  const numberOwners: NumberOwner[] = participants
    .filter(p => p.lotteryNumber !== null)
    .map(p => ({ number: p.lotteryNumber!, color: p.color, name: p.name }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-amber-900/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span className="font-serif text-xl font-bold text-amber-400">Draft Lottery</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-amber-400/70 text-sm uppercase tracking-widest mb-3">
            <Sparkles className="w-4 h-4" />
            Pick Your Lucky Number
            <Sparkles className="w-4 h-4" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-white mb-3">
            Who Picks First?
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Everyone locks in a number from 1-50. The wheel spins and the closest number to it picks first in the draft.
          </p>
        </div>

        {(isSpinning || spinResult) && (
          <div className="text-center mb-12" data-testid="spin-display">
            <SpinWheel
              targetNumber={wheelTarget}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              takenNumbers={takenNumbers}
              revealColors={!isSpinning && !!spinResult}
              numberOwners={numberOwners}
            />

            {!isSpinning && spinResult && showLandedOn && (
              <div className="mt-6 animate-in fade-in zoom-in duration-500" data-testid="winning-number-display">
                <p className="text-gray-400 text-lg mb-1">The wheel landed on...</p>
                <div className="inline-flex items-center gap-3">
                  <span className="text-amber-400 text-5xl font-bold font-mono animate-bounce">
                    {spinResult.winningNumber}
                  </span>
                  <span className="text-amber-400 text-3xl">!</span>
                </div>
              </div>
            )}

            {showResults && spinResult && (
              <div className="space-y-3 max-w-md mx-auto mt-8" data-testid="draft-order-results">
                <h3 className="text-lg font-semibold text-amber-400 mb-4">Draft Order</h3>
                {spinResult.tiebreakerNumber !== null && revealedPositions >= spinResult.draftOrder.length && (
                  <div className="mb-4 text-center animate-in fade-in duration-500">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs px-3 py-1">
                      Tiebreaker round: #{spinResult.tiebreakerNumber}
                    </Badge>
                  </div>
                )}
                {spinResult.draftOrder.map((entry, idx) => {
                  const participant = participants.find(p => p.id === entry.id);
                  const isRevealed = idx < revealedPositions;
                  const hasTiebreaker = entry.tiebreakerDistance !== null;
                  return (
                    <div
                      key={entry.id}
                      className="lottery-card-flip-container"
                      style={{ perspective: "600px", minHeight: "64px" }}
                    >
                      <div
                        className="lottery-card-flip"
                        style={{
                          transition: "transform 0.6s ease",
                          transformStyle: "preserve-3d",
                          transform: isRevealed ? "rotateX(0deg)" : "rotateX(90deg)",
                        }}
                      >
                        <Card className={`bg-gray-900 border-gray-800 ${
                          entry.draftPosition === 1 && isRevealed ? "ring-2 ring-amber-400 shadow-lg shadow-amber-400/20" : ""
                        }`}>
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                                entry.draftPosition === 1 ? "bg-amber-400 text-gray-900" : "bg-gray-800 text-gray-300"
                              }`}>
                                {entry.draftPosition === 1 ? <Crown className="w-5 h-5" /> : entry.draftPosition}
                              </div>
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                                style={{ backgroundColor: participant?.color }}
                              >
                                {getInitials(entry.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-gray-400 text-xs uppercase tracking-wide">
                                    {ordinal(entry.draftPosition)} Pick:
                                  </span>
                                  <span className="font-semibold text-white truncate">{entry.name}</span>
                                </div>
                                <p className="text-gray-500 text-xs mt-0.5">
                                  picked <span className="text-amber-400 font-mono font-bold">{entry.lotteryNumber}</span>
                                  {entry.draftPosition === 1
                                    ? <span className="text-green-400">, closest at {entry.distance} away</span>
                                    : <span>, {entry.distance} away</span>
                                  }
                                  {hasTiebreaker && (
                                    <span className="text-purple-400"> (tiebreaker: {entry.tiebreakerDistance} away)</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  );
                })}

                {revealedPositions >= spinResult.draftOrder.length && (
                  <div className="mt-8 animate-in fade-in duration-500 text-center">
                    {adminVerified ? (
                      <Link href="/draft">
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-amber-400 to-amber-500 text-gray-900 hover:from-amber-300 hover:to-amber-400 text-lg px-8 py-6 gap-3"
                          data-testid="button-start-draft"
                        >
                          <Trophy className="w-6 h-6" />
                          Start Draft →
                        </Button>
                      </Link>
                    ) : (
                      <p className="text-gray-400 text-lg" data-testid="text-draft-order-set">
                        Draft order is set! Watch for{" "}
                        <span className="text-amber-400 font-semibold">
                          {adminStatus?.contactName || "the admin"}
                        </span>{" "}
                        to start the draft.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!spinResult && !isSpinning && (
          <>
            <div className="grid gap-4 mb-8" data-testid="participant-cards">
              {participants.map((p) => (
                <Card
                  key={p.id}
                  className={`bg-gray-900 border-gray-800 transition-all ${
                    activeSiblingId === p.id ? "ring-2 ring-amber-400" : ""
                  }`}
                  data-testid={`participant-card-${p.id}`}
                >
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: p.color }}
                      >
                        {getInitials(p.name)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{p.name}</h3>
                        <p className="text-sm text-gray-400">
                          {p.wishlistSubmitted ? "Rankings submitted" : "Rankings pending"}
                        </p>
                      </div>
                      {p.lotteryNumber !== null ? (
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-amber-400" />
                          <span className="font-mono text-2xl font-bold text-amber-400" data-testid={`locked-number-${p.id}`}>
                            {p.lotteryNumber}
                          </span>
                        </div>
                      ) : activeSiblingId === p.id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveSiblingId(null)}
                          className="text-gray-400"
                          data-testid={`button-cancel-pick-${p.id}`}
                        >
                          Cancel
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setActiveSiblingId(p.id);
                            setSelectedNumber(null);
                          }}
                          className="bg-amber-400 text-gray-900 hover:bg-amber-300"
                          size="sm"
                          data-testid={`button-pick-number-${p.id}`}
                        >
                          <Hash className="w-4 h-4 mr-1" />
                          Pick Number
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {activeSiblingId && (
              <div className="mb-8" data-testid="number-picker">
                <h3 className="text-center text-lg font-medium text-amber-400 mb-4">
                  Choose a number (1-50)
                </h3>
                <div className="grid grid-cols-10 gap-2 max-w-lg mx-auto">
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => {
                    const isTaken = takenNumbers.has(num);
                    const isSelected = selectedNumber === num;
                    return (
                      <button
                        key={num}
                        onClick={() => !isTaken && setSelectedNumber(num)}
                        disabled={isTaken}
                        className={`aspect-square rounded-lg font-mono font-bold text-sm transition-all ${
                          isSelected
                            ? "bg-amber-400 text-gray-900 scale-110 ring-2 ring-amber-300"
                            : isTaken
                            ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                            : "bg-gray-900 text-gray-300 border border-gray-700 hover:border-amber-400 hover:text-amber-400"
                        }`}
                        data-testid={`number-button-${num}`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
                {selectedNumber && (
                  <div className="text-center mt-6">
                    <Button
                      onClick={() => lockNumberMutation.mutate({ siblingId: activeSiblingId, number: selectedNumber })}
                      disabled={lockNumberMutation.isPending}
                      size="lg"
                      className="bg-amber-400 text-gray-900 hover:bg-amber-300 gap-2"
                      data-testid="button-lock-number"
                    >
                      {lockNumberMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                      Lock In #{selectedNumber}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {allLocked && (
              <div className="text-center" data-testid="spin-section">
                <div className="mb-6">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm px-4 py-1">
                    <Check className="w-4 h-4 mr-1" />
                    All numbers locked in
                  </Badge>
                </div>

                <div className="mb-8">
                  <SpinWheel
                    targetNumber={null}
                    isSpinning={false}
                    onSpinComplete={() => {}}
                    takenNumbers={takenNumbers}
                    revealColors={false}
                    numberOwners={numberOwners}
                  />
                </div>

                {adminVerified ? (
                  <Button
                    onClick={() => spinMutation.mutate()}
                    disabled={spinMutation.isPending}
                    size="lg"
                    className="bg-gradient-to-r from-amber-400 to-amber-500 text-gray-900 hover:from-amber-300 hover:to-amber-400 text-lg px-8 py-6 gap-3 animate-pulse hover:animate-none"
                    data-testid="button-spin"
                  >
                    {spinMutation.isPending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <span className="text-xl">🎰</span>
                        SPIN THE WHEEL
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="max-w-xs mx-auto space-y-4">
                    <div className="flex items-center gap-2 justify-center text-gray-400">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm">Admin access required to spin</span>
                    </div>
                    <input
                      type="password"
                      value={adminPinInput}
                      onChange={(e) => {
                        setAdminPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                        setAdminPinError(false);
                      }}
                      placeholder="Enter admin PIN"
                      maxLength={4}
                      className="w-full text-center text-2xl tracking-widest bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && adminPinInput.length === 4) {
                          verifyAdminPin();
                        }
                      }}
                      data-testid="input-admin-pin-lottery"
                    />
                    {adminPinError && (
                      <p className="text-red-400 text-sm">Incorrect PIN. Try again.</p>
                    )}
                    <Button
                      onClick={verifyAdminPin}
                      disabled={adminPinInput.length !== 4}
                      size="lg"
                      className="w-full bg-amber-400 text-gray-900 hover:bg-amber-300"
                      data-testid="button-verify-admin"
                    >
                      Unlock Spin
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
