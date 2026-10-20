import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AuthUser } from "@/lib/auth-user";
import { initiateRazorpayCheckout } from "@/lib/razorpay";
import {
  Coffee,
  Heart,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";

interface BuyMeCoffeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuyMeCoffeeDialog({ open, onOpenChange }: BuyMeCoffeeDialogProps) {
  const [region, setRegion] = useState<"india" | "international">("india");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<number>(99); // default ₹99 or $1
  const [customAmount, setCustomAmount] = useState<string>("");
  const [supporterName, setSupporterName] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successPaymentId, setSuccessPaymentId] = useState<string | null>(null);

  // 3D Card Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const currentUser = AuthUser.getCurrentUser();

  useEffect(() => {
    if (currentUser?.name && !supporterName) {
      setSupporterName(currentUser.name);
    }
  }, [currentUser]);

  // When region changes, adjust default preset
  useEffect(() => {
    if (region === "india") {
      setSelectedPreset(99);
      if (isCustom && customAmount && Number(customAmount) < 50) {
        setCustomAmount("99");
      }
    } else {
      setSelectedPreset(1);
      if (isCustom && customAmount && Number(customAmount) < 1) {
        setCustomAmount("1");
      }
    }
  }, [region]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / (rect.height / 2)) * 12;
    const rotateY = (x / (rect.width / 2)) * 12;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Presets definition
  const indiaPresets = [
    { amount: 99, label: "1 Coffee", cups: 1, icon: "☕" },
    { amount: 199, label: "2 Coffees", cups: 2, icon: "☕☕" },
    { amount: 499, label: "5 Coffees", cups: 5, icon: "☕☕☕" },
  ];

  const intlPresets = [
    { amount: 1, label: "1 Coffee", cups: 1, icon: "☕" },
    { amount: 3, label: "3 Coffees", cups: 3, icon: "☕☕" },
    { amount: 5, label: "5 Coffees", cups: 5, icon: "☕☕☕" },
  ];

  // Effective calculation
  const effectiveAmount = isCustom
    ? Number(customAmount) || (region === "india" ? 99 : 1)
    : selectedPreset;

  const finalAmountINR = region === "india" ? effectiveAmount : Math.max(90, Math.round(effectiveAmount * 90));

  const handleLoginRedirect = () => {
    if (typeof window !== "undefined") {
      const redirectUrl = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl || "/developer")}`;
    }
  };

  const handleDonate = async () => {
    if (!currentUser) {
      toast.error("Please sign in first to support developers!");
      handleLoginRedirect();
      return;
    }

    if (isCustom) {
      const num = Number(customAmount);
      if (isNaN(num) || (region === "india" ? num < 50 : num < 1)) {
        toast.error(
          region === "india"
            ? "Please enter a valid amount (minimum ₹50)."
            : "Please enter a valid amount (minimum $1 USD)."
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      await initiateRazorpayCheckout({
        planName: `Coffee Support (${region === "india" ? `₹${effectiveAmount}` : `$${effectiveAmount} USD`})`,
        planType: "coffee",
        credits: 0,
        amountINR: finalAmountINR,
        currency: region === "india" ? "INR" : "USD",
        supporterName: supporterName.trim() || currentUser?.name || "Generous Supporter",
        supporterEmail: currentUser?.email || undefined,
        customDescription: `Coffee Support for Aakash & Piyush - Upanishad (${region === "india" ? `₹${effectiveAmount}` : `$${effectiveAmount} USD`})`,
        onSuccess: (paymentId) => {
          setIsLoading(false);
          setSuccessPaymentId(paymentId);
        },
        onError: () => {
          setIsLoading(false);
        },
        onCancel: () => {
          setIsLoading(false);
        },
      });
    } catch {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessPaymentId(null);
    setIsCustom(false);
    setSelectedPreset(region === "india" ? 99 : 1);
    setCustomAmount("");
    setMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:max-w-none max-sm:w-full max-sm:rounded-b-none max-sm:rounded-t-[2.25rem] max-sm:border-x-0 max-sm:border-b-0 max-sm:border-t-2 max-sm:border-amber-500/40 max-sm:max-h-[90vh] max-sm:overflow-y-auto max-sm:p-0 max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom sm:max-w-xl sm:rounded-3xl border-amber-500/30 bg-background/95 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Buy Me a Coffee - Support Upanishad Developers</DialogTitle>
          <DialogDescription>
            Support Aakash Vavadiya & Piyush Chodvadiya with a cup of coffee.
          </DialogDescription>
        </DialogHeader>

        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        {!currentUser ? (
          /* Must Login First Screen */
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="relative mx-auto flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-linear-to-tr from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/25">
              <Coffee className="h-10 w-10 sm:h-12 sm:w-12" />
              <div className="absolute -top-2 -right-2 rounded-full bg-emerald-500 p-2 text-white shadow-md">
                <Heart className="h-4 w-4 fill-white" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Coffee className="h-3.5 w-3.5" />
                <span>Sign In Required</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Sign In to Support Developers
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                Please log in before buying coffee so your contribution is linked to your account profile.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3.5 text-left">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                <Coffee className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground">Support Developer Craft</h4>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Support Aakash & Piyush directly. Your generous contribution fuels open tools and new feature engineering on bg.tools.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleLoginRedirect}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Log In to Support Developers</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        ) : successPaymentId ? (
          /* Thank You Screen */
          <div className="p-6 sm:p-10 text-center space-y-5 sm:space-y-6">
            <div className="relative mx-auto flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-linear-to-tr from-amber-500 to-orange-500 text-white shadow-xl shadow-orange-500/25 animate-bounce">
              <Coffee className="h-10 w-10 sm:h-12 sm:w-12" />
              <div className="absolute -top-2 -right-2 rounded-full bg-emerald-500 p-1.5 text-white shadow-md">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Gratitude from Upanishad</span>
              </div>
              <h3 className="font-display text-xl sm:text-3xl font-black tracking-tight text-foreground">
                Thank You, {supporterName || "Friend"}! ☕
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                Your generosity fuels our craft. You just supported late-night engineering sessions for{" "}
                <strong className="text-foreground">Aakash Vavadiya</strong> &{" "}
                <strong className="text-foreground">Piyush Chodvadiya</strong>!
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 p-4 text-xs space-y-1.5 text-left font-mono">
              <div className="flex justify-between text-muted-foreground">
                <span>Payment Reference:</span>
                <span className="font-bold text-foreground">{successPaymentId}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Contribution:</span>
                <span className="font-bold text-foreground">
                  {region === "india" ? `₹${effectiveAmount}` : `$${effectiveAmount} USD`}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Supporter Status:</span>
                <span className="font-bold text-emerald-500">Official Coffee Supporter</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full rounded-2xl bg-foreground py-3.5 text-sm font-extrabold text-background shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Continue Exploring bg.tools
            </button>
          </div>
        ) : (
          /* Main 3D Support Flow */
          <div className="flex flex-col">
            {/* 3D Visual Header Banner */}
            <div
              className="relative overflow-hidden bg-linear-to-b from-amber-500/20 via-orange-500/10 to-transparent p-4 sm:p-8 pb-3 sm:pb-4 border-b border-border/50 text-center select-none"
              style={{ perspective: 1000 }}
            >
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.18)_0,transparent_70%)] pointer-events-none" />

              {/* 3D Tilt Container */}
              <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                  transition: "transform 0.15s ease-out",
                  transformStyle: "preserve-3d",
                }}
                className="relative inline-block cursor-grab active:cursor-grabbing"
              >
                {/* 3D Isometric Coffee Mug Illustration (Scales cleanly on mobile) */}
                <div className="relative mx-auto h-24 w-24 sm:h-32 sm:w-32 flex items-center justify-center">
                  {/* Floating Steam Animation */}
                  <div className="absolute -top-4 sm:-top-6 inset-x-0 flex justify-center gap-1.5 sm:gap-2 pointer-events-none opacity-80">
                    <span className="h-6 sm:h-8 w-1 sm:w-1.5 rounded-full bg-linear-to-t from-amber-400 to-transparent animate-pulse delay-100" />
                    <span className="h-7 sm:h-10 w-1 sm:w-1.5 rounded-full bg-linear-to-t from-orange-400 to-transparent animate-pulse delay-300" />
                    <span className="h-5 sm:h-7 w-1 sm:w-1.5 rounded-full bg-linear-to-t from-amber-300 to-transparent animate-pulse delay-500" />
                  </div>

                  {/* 3D Cup Body */}
                  <div className="relative h-18 w-18 sm:h-24 sm:w-24 rounded-b-[1.75rem] sm:rounded-b-[2rem] rounded-t-xl bg-linear-to-tr from-amber-600 via-amber-500 to-orange-400 p-1 shadow-xl shadow-orange-500/30 flex flex-col items-center justify-center transform-gpu">
                    {/* Coffee Top Rim */}
                    <div className="absolute -top-2 sm:-top-2.5 h-5 sm:h-6 w-16 sm:w-22 rounded-[50%] bg-amber-900 border-2 border-amber-300/80 shadow-inner flex items-center justify-center overflow-hidden">
                      <div className="h-3 sm:h-4 w-14 sm:w-18 rounded-[50%] bg-linear-to-r from-amber-800 via-amber-700 to-amber-900 flex items-center justify-center">
                        {/* Latte Art Heart */}
                        <Heart className="h-2 sm:h-2.5 w-2 sm:w-2.5 text-amber-200 fill-amber-200 animate-pulse" />
                      </div>
                    </div>

                    {/* Mug Face / Upanishad Brand Tag */}
                    <div className="mt-2 sm:mt-3 flex flex-col items-center">
                      <div className="flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-black/30 backdrop-blur-xs text-white">
                        <img
                          src="/brand/upanishad-logo.png"
                          alt="Upanishad"
                          className="h-3.5 w-3.5 sm:h-5 sm:w-5 object-contain invert dark:invert-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/90 drop-shadow-xs mt-0.5">
                        UPANISHAD
                      </span>
                    </div>

                    {/* Mug Handle (3D side loop) */}
                    <div className="absolute -right-4 sm:-right-5 top-3 sm:top-5 h-9 sm:h-12 w-4 sm:w-6 rounded-r-2xl border-3 sm:border-4 border-amber-500 bg-transparent shadow-md" />
                  </div>

                  {/* Saucer shadow */}
                  <div className="absolute -bottom-1 sm:-bottom-2 h-2.5 sm:h-3 w-24 sm:w-32 rounded-full bg-black/20 dark:bg-white/10 blur-xs" />
                </div>
              </div>

              {/* Header Title */}
              <div className="mt-2 sm:mt-4 space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Coffee className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Support Independent Creators</span>
                </div>
                <h2 className="font-display text-lg sm:text-2xl font-black tracking-tight text-foreground">
                  Buy Us a Coffee
                </h2>
                <p className="text-[11px] sm:text-sm text-muted-foreground font-medium max-w-sm mx-auto">
                  Choose a coffee package or enter your own custom amount to support our team.
                </p>
              </div>
            </div>

            {/* Support Form Body */}
            <div className="p-4 sm:p-8 space-y-4 sm:space-y-5 pb-6 sm:pb-8">
              {/* Supporter Badge & Gold Gift Eligibility */}
              {currentUser && (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-linear-to-tr from-amber-500 to-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {currentUser.name || "Supporter"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate font-mono">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 shrink-0">
                    <Heart className="h-3 w-3 text-amber-500 fill-amber-500" />
                    <span>Supporter Account</span>
                  </div>
                </div>
              )}

              {/* Region / Currency Switcher */}
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1.5 border border-border">
                <button
                  type="button"
                  onClick={() => setRegion("india")}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2 text-xs font-extrabold transition-all cursor-pointer ${
                    region === "india"
                      ? "bg-background text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-sm sm:text-base">🇮🇳</span>
                  <span>India (INR ₹)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegion("international")}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2 text-xs font-extrabold transition-all cursor-pointer ${
                    region === "international"
                      ? "bg-background text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-sm sm:text-base">🌍</span>
                  <span>Outside India (USD $)</span>
                </button>
              </div>

              {/* Amount Selection: Presets + Custom Option */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Select Contribution Amount
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustom(!isCustom);
                      if (!isCustom && !customAmount) {
                        setCustomAmount(region === "india" ? "150" : "2");
                      }
                    }}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>{isCustom ? "Show Presets" : "Enter Custom Amount"}</span>
                  </button>
                </div>

                {!isCustom ? (
                  /* Presets Grid: 2 columns on mobile, 4 columns on desktop */
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(region === "india" ? indiaPresets : intlPresets).map((preset) => {
                      const isSelected = selectedPreset === preset.amount;
                      const displayAmount = region === "india" ? `₹${preset.amount}` : `$${preset.amount}`;
                      return (
                        <button
                          key={preset.amount}
                          type="button"
                          onClick={() => {
                            setSelectedPreset(preset.amount);
                            setIsCustom(false);
                          }}
                          className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-2.5 sm:p-3 transition-all cursor-pointer ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/10 text-foreground ring-2 ring-amber-500/20 scale-[1.02]"
                              : "border-border bg-card hover:border-amber-500/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="text-sm">{preset.icon}</span>
                          <span className="text-xs sm:text-sm font-black text-foreground">{displayAmount}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold">{preset.label}</span>
                        </button>
                      );
                    })}

                    {/* Custom Button in Grid */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustom(true);
                        if (!customAmount) {
                          setCustomAmount(region === "india" ? "150" : "2");
                        }
                      }}
                      className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-card/60 hover:border-amber-500 hover:bg-amber-500/5 p-2.5 sm:p-3 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      <Edit3 className="h-4 w-4 text-amber-500" />
                      <span className="text-xs sm:text-sm font-extrabold">Custom</span>
                      <span className="text-[10px] text-muted-foreground">Any Amount</span>
                    </button>
                  </div>
                ) : (
                  /* Custom Amount Input View */
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-3 sm:p-3.5 space-y-2.5 sm:space-y-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-display text-base sm:text-lg font-black border border-amber-500/20">
                        {region === "india" ? "₹" : "$"}
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min={region === "india" ? 50 : 1}
                          step={region === "india" ? 10 : 1}
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder={region === "india" ? "Enter amount in ₹ (e.g. 150)" : "Enter amount in $ (e.g. 5)"}
                          className="w-full rounded-xl border border-border bg-background px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground">Quick:</span>
                      {(region === "india" ? [150, 250, 500, 1000] : [2, 5, 10, 25]).map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCustomAmount(String(val))}
                          className={`rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                            customAmount === String(val)
                              ? "bg-amber-500 text-white"
                              : "bg-muted/80 text-foreground hover:bg-muted"
                          }`}
                        >
                          {region === "india" ? `₹${val}` : `$${val}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Supporter Details */}
              <div className="space-y-2.5 sm:space-y-3">
                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-muted-foreground block mb-1">
                    Your Name or Handle (Optional)
                  </label>
                  <input
                    type="text"
                    value={supporterName}
                    onChange={(e) => setSupporterName(e.target.value)}
                    placeholder="e.g. Rahul, Sarah, or Anonymous"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 sm:py-2.5 text-xs font-semibold placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-muted-foreground block mb-1">
                    Warm Words / Message for Creators (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Keep up the great work on Upanishad AI tools!"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-1.5 sm:py-2 text-xs font-semibold placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Summary & Checkout Button */}
              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between mb-2.5 sm:mb-3 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px] sm:text-xs">
                    <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                    <span>Secured with Razorpay Live</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] sm:text-xs text-muted-foreground">Total: </span>
                    <strong className="text-sm sm:text-base font-black text-foreground">
                      {region === "india" ? `₹${effectiveAmount}` : `$${effectiveAmount} USD`}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDonate}
                  disabled={isLoading}
                  className="w-full relative flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 py-3 sm:py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  <Coffee className="h-4 w-4" />
                  <span>
                    {isLoading
                      ? "Launching Razorpay..."
                      : `Support Developers with ${region === "india" ? `₹${effectiveAmount}` : `$${effectiveAmount} USD`}`}
                  </span>
                </button>

                <p className="mt-2 text-center text-[10px] sm:text-[11px] text-muted-foreground font-medium">
                  Accepted: UPI (GPay/PhonePe), Credit & Debit Cards, NetBanking & International Cards
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
