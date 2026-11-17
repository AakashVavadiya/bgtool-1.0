import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import {
  Check,
  Download,
  Loader2,
  Upload,
  Wand2,
  RefreshCw,
  Eye,
  Image as ImageIcon,
  FolderUp,
  Pencil,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { CutoutBrushEditorModal } from "@/components/CutoutBrushEditorModal";
import { AuthUser, type CurrentUser } from "@/lib/auth-user";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";

const steps = [
  { label: "Uploading image", detail: "Secure transfer · discarded after processing" },
  { label: "Detecting subject", detail: "Semantic segmentation pass" },
  { label: "Refining edges", detail: "Strand-level alpha matting" },
  { label: "Rebuilding alpha", detail: "Sub-pixel transparency map" },
  { label: "Exporting PNG", detail: "Up to 4K, lossless transparency" },
];

const checkerStyle = {
  backgroundImage:
    "linear-gradient(45deg,var(--color-secondary) 25%,transparent 25%),linear-gradient(-45deg,var(--color-secondary) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,var(--color-secondary) 75%),linear-gradient(-45deg,transparent 75%,var(--color-secondary) 75%)",
  backgroundSize: "22px 22px",
  backgroundPosition: "0 0,0 11px,11px -11px,-11px 0",
};

// Custom client-side Canvas Alpha Matting Engine (Zero external dependencies)
export const removeBackgroundClientCanvas = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(imageSrc);

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Sample background colors along outer boundary
      let bgR = 0, bgG = 0, bgB = 0, samples = 0;
      const width = canvas.width;
      const height = canvas.height;

      for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 20))) {
        const idx1 = (0 * width + x) * 4;
        const idx2 = ((height - 1) * width + x) * 4;
        bgR += (data[idx1] ?? 0) + (data[idx2] ?? 0);
        bgG += (data[idx1 + 1] ?? 0) + (data[idx2 + 1] ?? 0);
        bgB += (data[idx1 + 2] ?? 0) + (data[idx2 + 2] ?? 0);
        samples += 2;
      }

      for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 20))) {
        const idx1 = (y * width + 0) * 4;
        const idx2 = (y * width + (width - 1)) * 4;
        bgR += (data[idx1] ?? 0) + (data[idx2] ?? 0);
        bgG += (data[idx1 + 1] ?? 0) + (data[idx2 + 1] ?? 0);
        bgB += (data[idx1 + 2] ?? 0) + (data[idx2 + 2] ?? 0);
        samples += 2;
      }

      bgR = Math.round(bgR / Math.max(1, samples));
      bgG = Math.round(bgG / Math.max(1, samples));
      bgB = Math.round(bgB / Math.max(1, samples));

      // Alpha matting with smooth edge feathering and precision color distance
      const threshold = 36;
      const softBand = 30;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] ?? 0;
        const g = data[i + 1] ?? 0;
        const b = data[i + 2] ?? 0;

        const dr = r - bgR;
        const dg = g - bgG;
        const db = b - bgB;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);

        if (dist < threshold) {
          data[i + 3] = 0; // Transparent cutout
        } else if (dist < threshold + softBand) {
          const t = Math.max(0, Math.min(1, (dist - threshold) / softBand));
          // S-curve smoothstep for continuous corner curvature
          const smoothRatio = t * t * (3 - 2 * t);
          data[i + 3] = Math.round(smoothRatio * 255);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
};

export function RemovalProcess() {
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const [step, setStep] = useState<number>(0);
  const model = "ganga";
  const [processing, setProcessing] = useState<boolean>(false);
  const [hasProcessed, setHasProcessed] = useState<boolean>(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [bgType, setBgType] = useState<"checker" | "white" | "black">("checker");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showDynamicIsland, setShowDynamicIsland] = useState<boolean>(false);
  const [hasScrolledOnce, setHasScrolledOnce] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [showCutoutEditor, setShowCutoutEditor] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => AuthUser.getCurrentUser());
  const [guestRemaining, setGuestRemaining] = useState<number>(() => AuthUser.getGuestRemainingUses());

  const [sliderPos, setSliderPos] = useState<number>(50);
  const [imageAspect, setImageAspect] = useState<number | null>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const isDraggingSliderRef = useRef<boolean>(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth right-to-left reveal animation returning back to center (50%)
  const runRevealAnimation = useCallback(() => {
    if (isDraggingSliderRef.current) return;
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const startTime = performance.now();
    const phase1Duration = 850; // 100% -> 0% (Right to Left background removal sweep)
    const pauseDuration = 100;  // Brief pause at 0% to appreciate full transparent cutout
    const phase2Duration = 600; // 0% -> 50% (Glide back to center)
    const totalDuration = phase1Duration + pauseDuration + phase2Duration;

    const easeInOut = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const frame = (now: number) => {
      if (isDraggingSliderRef.current) return;
      const elapsed = now - startTime;

      if (elapsed < phase1Duration) {
        // Right to Left: 100% down to 0%
        const progress = elapsed / phase1Duration;
        const current = 100 - easeInOut(progress) * 100;
        setSliderPos(Number(current.toFixed(1)));
        animFrameRef.current = requestAnimationFrame(frame);
      } else if (elapsed < phase1Duration + pauseDuration) {
        // Pause at 0%
        setSliderPos(0);
        animFrameRef.current = requestAnimationFrame(frame);
      } else if (elapsed < totalDuration) {
        // Return back to center: 0% up to 50%
        const progress = (elapsed - phase1Duration - pauseDuration) / phase2Duration;
        const current = easeOut(progress) * 50;
        setSliderPos(Number(current.toFixed(1)));
        animFrameRef.current = requestAnimationFrame(frame);
      } else {
        setSliderPos(50);
        animFrameRef.current = null;
      }
    };

    setSliderPos(100);
    animFrameRef.current = requestAnimationFrame(frame);
  }, []);

  const updateSliderFromClientX = useCallback((clientX: number) => {
    const container = sliderContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(Number(pct.toFixed(1)));
  }, []);

  const handleSliderPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { }
    isDraggingSliderRef.current = true;
    setIsDraggingSlider(true);
    updateSliderFromClientX(e.clientX);
  }, [updateSliderFromClientX]);

  const handleSliderPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSliderRef.current) return;
    updateSliderFromClientX(e.clientX);
  }, [updateSliderFromClientX]);

  const handleSliderPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch { }
    isDraggingSliderRef.current = false;
    setIsDraggingSlider(false);
  }, []);

  const handleSliderWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      setSliderPos((prev) => Math.max(0, Math.min(100, Number((prev + (e.deltaX > 0 ? 2.5 : -2.5)).toFixed(1)))));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Sync auth and guest limits
  useEffect(() => {
    setMounted(true);
    const handleSync = () => {
      setCurrentUser(AuthUser.getCurrentUser());
      setGuestRemaining(AuthUser.getGuestRemainingUses());
    };
    window.addEventListener(REALTIME_EVENT_NAME, handleSync);
    window.addEventListener("bg:credit_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, handleSync);
      window.removeEventListener("bg:credit_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Dynamic Island scroll & header-offset listener
  const [islandTopPx, setIslandTopPx] = useState<number>(104);
  useEffect(() => {
    if (!hasProcessed) {
      setShowDynamicIsland(false);
      setHasScrolledOnce(false);
      return;
    }
    const handleScroll = () => {
      const headerEl = document.querySelector("header");
      const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 0;
      const nextTop = headerBottom > 0 ? Math.max(14, Math.round(headerBottom + 14)) : 16;
      setIslandTopPx(nextTop);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const shouldShow = rect.bottom < 120;
        setShowDynamicIsland(shouldShow);
        if (shouldShow) setHasScrolledOnce(true);
      } else {
        const shouldShow = window.scrollY > 480;
        setShowDynamicIsland(shouldShow);
        if (shouldShow) setHasScrolledOnce(true);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [hasProcessed]);

  const progress = processing
    ? Math.min(95, Math.round(((step + 1) / steps.length) * 100))
    : hasProcessed
      ? 100
      : 0;

  const handleSelectFile = (file: File) => {
    if (AuthUser.isUserRestricted()) {
      window.dispatchEvent(new CustomEvent("bg:show_restricted_dialog"));
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      toast.error("File size exceeds the 30 MB limit. Please upload a smaller file.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          setImageAspect(img.naturalWidth / img.naturalHeight);
        }
      };
      img.src = b64;
      setBeforeImage(b64);
      setAfterImage(null);
      setFileName(file.name);
      setHasProcessed(false);
      setProcessing(false);
      setStep(0);
      setDuration(null);
      toast.success("Image uploaded! Click image or 'Remove Background' to process.");
    };
    reader.readAsDataURL(file);
  };

  const startRemovalProcess = async () => {
    if (AuthUser.isUserRestricted()) {
      window.dispatchEvent(new CustomEvent("bg:show_restricted_dialog"));
      return;
    }
    if (!beforeImage || processing) return;

    const { AdminStore } = await import("@/admin/lib/admin-store");
    const cost = AdminStore.getToolCreditCost("remove-background");
    const isFree = cost === 0;

    if (isFree) {
      const limitCheck = AdminStore.checkDailyToolLimit("remove-background");
      if (limitCheck.reached) {
        toast.error(`Free daily limit reached (${limitCheck.usedToday}/${limitCheck.limit || 20} files today). Add credits or wait until midnight.`);
        window.dispatchEvent(
          new CustomEvent("bg:show_add_credits_dialog", {
            detail: {
              toolName: "Background Remover",
              toolSlug: "remove-background",
              creditCost: 1,
              currentCredits: AuthUser.getCredits(),
            },
          })
        );
        return;
      }
    } else {
      if (!currentUser) {
        if (AuthUser.getGuestRemainingUses() <= 0) {
          window.dispatchEvent(
            new CustomEvent("bg:show_guest_login_dialog", {
              detail: {
                toolName: "Background Remover",
                toolSlug: "remove-background",
              },
            })
          );
          return;
        }
      } else {
        if (!AuthUser.hasCredits(cost)) {
          window.dispatchEvent(
            new CustomEvent("bg:show_add_credits_dialog", {
              detail: {
                toolName: "Background Remover",
                toolSlug: "remove-background",
                creditCost: cost,
                currentCredits: AuthUser.getCredits(),
              },
            })
          );
          return;
        }
      }
    }

    setProcessing(true);
    setHasProcessed(false);
    setAfterImage(null);
    setStep(0);

    const startTime = performance.now();

    // Advance steps with ~1.1-second intervals so user experiences steady, active progress
    // and is not kept waiting on the last "Exporting PNG" step while server processes.
    let currentStep = 0;
    const stepTimer = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setStep(currentStep);
      }
    }, 1100);

    let outputResult = "";

    try {
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image: beforeImage,
          model,
          smoothEdge: 0.6,
        }),
      });
      clearInterval(stepTimer);
      if (res.status === 402 || res.status === 429) {
        const errData = await res.json().catch(() => ({}));
        if (!AuthUser.getCurrentUser()) {
          window.dispatchEvent(
            new CustomEvent("bg:show_guest_login_dialog", {
              detail: {
                toolName: "Background Remover",
                toolSlug: "remove-background",
              },
            })
          );
          throw new Error(errData.error || "Free guest limit of 5 uses reached. Please log in for 10 daily free credits.");
        } else {
          window.dispatchEvent(
            new CustomEvent("bg:show_add_credits_dialog", {
              detail: {
                toolName: "Background Remover",
                toolSlug: "remove-background",
                creditCost: cost,
                currentCredits: 0,
              },
            })
          );
          throw new Error(errData.error || "Credit limit exceeded. Please top up your tokens.");
        }
      }
      const data = await res.json();
      if (data.success && data.base64Image) {
        outputResult = data.base64Image;
      } else {
        throw new Error(data.error || "AI background removal failed. Please check server.");
      }

      // Smoothly advance through any remaining steps if server responded faster
      while (currentStep < steps.length - 1) {
        currentStep++;
        setStep(currentStep);
        await new Promise((r) => setTimeout(r, 250));
      }

      // Briefly display 100% completion before concluding
      setStep(steps.length);
      await new Promise((r) => setTimeout(r, 350));
    } catch (err: any) {
      clearInterval(stepTimer);
      console.error("AI removal error:", err);
      toast.error(err.message || "Failed to remove background with AI. Please try again.");
      setProcessing(false);
      return;
    }

    const endTime = performance.now();
    const finalSec = parseFloat(((endTime - startTime) / 1000).toFixed(2));

    setAfterImage(outputResult);
    setDuration(finalSec);
    setStep(steps.length);
    setProcessing(false);
    setHasProcessed(true);

    // Trigger right-to-left reveal animation then glide back to center
    setTimeout(() => {
      runRevealAnimation();
    }, 60);

    // Telemetry & credit deduction tracking
    import("@/lib/telemetry").then(({ Telemetry }) => {
      Telemetry.trackToolUsage("remove-background", "Background Remover");
    });
    import("@/admin/lib/admin-store").then(({ AdminStore }) => {
      AdminStore.recordToolDailyUsage("remove-background");
      const cost = AdminStore.getToolCreditCost("remove-background");
      if (cost > 0) {
        import("@/lib/auth-user").then(({ AuthUser }) => {
          AuthUser.deductCredit(cost, "remove-background", true);
        });
      }
    });

    toast.success("Background removed cleanly with AI!");
  };

  const handleDownload = () => {
    if (!afterImage) return;
    const baseName = fileName ? fileName.replace(/\.[^.]+$/, "") : "image";
    const downloadName = `${baseName}_transparent_cutout.png`;
    const dataToDownload = afterImage;

    if (dataToDownload.startsWith("data:")) {
      try {
        const parts = dataToDownload.split(",");
        const mime = parts[0]?.match(/:(.*?);/)?.[1] || "image/png";
        const binary = atob(parts[1] || "");
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([array], { type: mime });
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
        toast.success(`Downloaded ${downloadName}`);
        return;
      } catch (e) {
        console.warn("Fallback to direct data url click:", e);
      }
    }
    const a = document.createElement("a");
    a.href = dataToDownload;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded ${downloadName}`);
  };

  const handleReset = () => {
    setBeforeImage(null);
    setAfterImage(null);
    setImageAspect(null);
    setFileName("");
    setHasProcessed(false);
    setProcessing(false);
    setStep(0);
    setDuration(null);
    setBgType("checker");
  };

  return (
    <div ref={containerRef} className="w-full">
      {/* ── TOP DYNAMIC ISLAND FLOATING BAR (Animated on Scroll, Header-Aware) ─────── */}
      {mounted && typeof document !== "undefined" && hasProcessed && !showCutoutEditor && createPortal(
        <div
          style={{ top: `${islandTopPx}px` }}
          className="dynamic-island-wrapper fixed inset-x-0 flex justify-center items-center z-[90] pointer-events-none px-3 sm:px-4"
        >
          <aside
            aria-label="Quick download dynamic island"
            className={`pointer-events-auto dynamic-island-box flex items-center gap-2 sm:gap-3 rounded-full border border-white/15 bg-black text-white p-1.5 sm:p-2 mx-auto ${showDynamicIsland
              ? "island-enter"
              : hasScrolledOnce
                ? "island-exit"
                : "opacity-0 -translate-y-12 scale-90 pointer-events-none"
              }`}
          >
            {/* 1. Large Processed Image Thumbnail & Details */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="relative h-9 w-9 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-full border border-white/25 bg-neutral-900 shadow-inner">
                {afterImage || beforeImage ? (
                  <img
                    src={afterImage || beforeImage || undefined}
                    alt="Processed thumbnail"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    className="h-full w-full object-cover select-none workspace-protected-image"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#ff5500]/20 text-[#ff5500]">
                    <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                )}
              </div>
              <div className="hidden sm:flex flex-col justify-center text-left pr-1">
                <span className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[130px] lg:max-w-[190px] leading-tight">
                  {fileName || "Background Removed"}
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-400 leading-tight mt-0.5">
                  PNG Cutout
                </span>
              </div>
            </div>

            {/* 2. Edit Cutout Button */}
            <button
              type="button"
              onClick={() => setShowCutoutEditor(true)}
              className="wobbly-btn h-9 sm:h-11 flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white hover:text-[#0a0a0a] px-3 sm:px-4 text-xs sm:text-sm font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Edit cutout with remove brush, restore brush, and magic brush"
            >
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Edit</span>
            </button>

            {/* 3. Primary Large Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="wobbly-btn h-9 sm:h-11 flex items-center gap-2 rounded-full bg-white text-[#0a0a0a] hover:bg-neutral-100 px-4 sm:px-5 text-xs sm:text-sm font-black shadow-lg active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4 text-[#ff5500] shrink-0" />
              <span>Download PNG</span>
            </button>

            {/* 4. Upload Another File (Concentric Circular Button) */}
            <button
              type="button"
              onClick={handleReset}
              className="wobbly-btn flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-citation items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white hover:text-[#0a0a0a] hover:scale-105 active:scale-90 transition-all shadow-sm cursor-pointer"
              title="Process another File"
              aria-label="Process another File"
            >
              <FolderUp className="h-4 w-4" />
            </button>
          </aside>
        </div>,
        document.body
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleSelectFile(file);
        }}
      />

      {!beforeImage ? (
        /* Standalone Centered Drag & Drop Upload Zone (Matching All Tools) */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) handleSelectFile(dropped);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`group cursor-pointer flex flex-col items-center justify-center text-center rounded-3xl border-3 border-dashed px-8 py-24 sm:py-32 w-full transition-all duration-300 ${isDragging
            ? "border-accent bg-accent/10 scale-[1.01] shadow-2xl"
            : "border-border bg-card/60 hover:border-foreground hover:bg-card shadow-lg"
            }`}
        >
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-foreground text-background shadow-xl transition-all group-hover:scale-110">
            <Upload className="h-10 w-10" />
            <span className="absolute -inset-1 rounded-3xl bg-foreground/20 blur-lg animate-pulse" />
          </div>

          <h2 className="mt-8 font-display text-3xl font-extrabold md:text-4xl">
            Select File or Drag & Drop Image Here
          </h2>

          <p className="mt-3 max-w-md text-sm font-semibold text-muted-foreground md:text-base">
            Accepts <span className="font-extrabold text-foreground">Any image</span> · Returns{" "}
            <span className="font-extrabold text-foreground">Transparent PNG</span>
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-foreground px-10 py-5 text-base font-extrabold text-background shadow-2xl transition-all group-hover:scale-105">
            Select Image File <span aria-hidden>→</span>
          </div>

          <p className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Enterprise-grade security &amp; privacy · Safe File Processing</span>
          </p>
        </div>
      ) : (
        /* Active Workspace: Image Preview (Left) + Settings / Pipeline (Right) */
        <div className={`w-full transition-all duration-300 ${hasProcessed ? "max-w-5xl mx-auto" : "grid items-start gap-8 lg:grid-cols-[1.8fr_1fr]"}`}>
          {/* Left Column: Canvas Preview Area */}
          <div className="flex flex-col gap-3 w-full">
            {/* Top Canvas Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 px-1 sm:px-2 py-1 w-full">
              <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                  {hasProcessed ? "Cutout Result" : "Uploaded Image"}
                </span>
                {fileName && (
                  <span
                    className="rounded-md bg-secondary/60 px-2 py-0.5 text-xs font-medium text-foreground max-w-[130px] xs:max-w-[180px] sm:max-w-[200px] truncate"
                    title={fileName}
                  >
                    {fileName}
                  </span>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-2 justify-between sm:justify-end">
                {hasProcessed && (
                  <>
                    <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-xs font-semibold shrink-0">
                      <button
                        type="button"
                        onClick={() => setBgType("checker")}
                        className={`px-2 sm:px-2.5 py-1 rounded-md transition-all ${bgType === "checker" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        Checker
                      </button>
                      <button
                        type="button"
                        onClick={() => setBgType("white")}
                        className={`px-2 sm:px-2.5 py-1 rounded-md transition-all ${bgType === "white" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        White
                      </button>
                      <button
                        type="button"
                        onClick={() => setBgType("black")}
                        className={`px-2 sm:px-2.5 py-1 rounded-md transition-all ${bgType === "black" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        Black
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCutoutEditor(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 sm:px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-secondary cursor-pointer shadow-xs shrink-0"
                      title="Edit cutout with remove brush, restore brush, and magic brush"
                    >
                      <Pencil className="h-3.5 w-3.5 text-primary" /> Edit Cutout
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 sm:px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Change Image</span><span className="xs:hidden">Change</span>
                </button>
              </div>
            </div>

            {/* Main Visual Canvas Frame */}
            <div
              onContextMenu={(e) => e.preventDefault()}
              className="group relative flex h-[440px] xs:h-[500px] sm:h-[620px] md:h-[680px] lg:h-[720px] w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-border bg-card transition-all shadow-xl select-none"
              style={
                hasProcessed && bgType === "checker"
                  ? checkerStyle
                  : hasProcessed
                    ? { backgroundColor: bgType === "black" ? "#0a0a0c" : bgType === "white" ? "#ffffff" : undefined }
                    : undefined
              }
            >
              {/* If processed with beforeImage & afterImage, render interactive Before/After Comparison Slider */}
              {hasProcessed && afterImage && beforeImage ? (
                <div
                  ref={sliderContainerRef}
                  onPointerDown={handleSliderPointerDown}
                  onPointerMove={handleSliderPointerMove}
                  onPointerUp={handleSliderPointerUp}
                  onPointerCancel={handleSliderPointerUp}
                  onWheel={handleSliderWheel}
                  onContextMenu={(e) => e.preventDefault()}
                  className="relative flex items-center justify-center w-full h-full p-2 sm:p-4 cursor-ew-resize touch-none select-none overflow-hidden"
                >
                  <div
                    className="relative flex items-center justify-center max-w-[96%] max-h-[92%] h-full w-auto"
                    style={{
                      aspectRatio: imageAspect ? `${imageAspect}` : undefined,
                    }}
                  >
                    {/* BASE LAYER (Underneath): Cutout PNG over checker/color */}
                    <img
                      src={afterImage}
                      alt="Cutout PNG"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      onLoad={(e) => {
                        const w = e.currentTarget.naturalWidth;
                        const h = e.currentTarget.naturalHeight;
                        if (w > 0 && h > 0) setImageAspect(w / h);
                      }}
                      className="w-full h-full object-contain pointer-events-none select-none block workspace-protected-image"
                    />

                    {/* OVERLAY LAYER (Left): Original Photo with background, clipped to slider position */}
                    <div
                      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none will-change-[clip-path]"
                      style={{
                        clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                      }}
                    >
                      <img
                        src={beforeImage}
                        alt="Original photo"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        onContextMenu={(e) => e.preventDefault()}
                        className="w-full h-full object-contain pointer-events-none select-none block workspace-protected-image"
                      />
                    </div>

                    {/* Vertical Divider Line with Glow */}
                    <div
                      className="pointer-events-none absolute top-0 bottom-0 z-20 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.8)] will-change-[left]"
                      style={{ left: `${sliderPos}%` }}
                    >
                      {/* Handle Button with ↔ Arrows */}
                      <button
                        type="button"
                        aria-label="Drag before and after slider"
                        className={`pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-foreground text-background shadow-2xl transition-transform hover:scale-110 active:scale-95 border-2 border-background/25 ${isDraggingSlider ? "cursor-grabbing scale-110" : "cursor-grab"
                          }`}
                      >
                        <svg
                          className="h-4 w-4 sm:h-5 sm:w-5 stroke-current pointer-events-none"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m9 18-6-6 6-6" />
                          <path d="m15 6 6 6-6 6" />
                        </svg>
                      </button>
                    </div>

                    {/* Badges: Left = Before, Right = After */}
                    <div className="pointer-events-none select-none absolute bottom-3 left-3 z-20 rounded-full bg-background/90 backdrop-blur-md px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-extrabold text-foreground shadow-md border border-border">
                      Original
                    </div>
                    <div className="pointer-events-none select-none absolute bottom-3 right-3 z-20 rounded-full bg-foreground/90 backdrop-blur-md px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-extrabold text-background shadow-md border border-foreground/20">
                      Removed
                    </div>
                  </div>
                </div>
              ) : (
                /* Unprocessed / Uploaded View */
                beforeImage && (
                  <img
                    src={beforeImage}
                    alt="Original uploaded"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    onLoad={(e) => {
                      const w = e.currentTarget.naturalWidth;
                      const h = e.currentTarget.naturalHeight;
                      if (w > 0 && h > 0) setImageAspect(w / h);
                    }}
                    className="max-h-[92%] max-w-[96%] w-auto h-auto object-contain transition-opacity duration-300 select-none workspace-protected-image"
                  />
                )
              )}

              {/* Scanning Laser Sweep Animation during processing */}
              {processing ? (
                <>
                  <span className="scan-sweep pointer-events-none absolute inset-x-0 top-0 h-full z-10" />
                  <span className="pointer-events-none absolute inset-4 sm:inset-6 rounded-2xl border-2 border-dashed border-accent/80 animate-pulse z-10" />
                </>
              ) : null}

              {/* Status / Progress Pill (only shown while image is preparing or processing) */}
              {!hasProcessed ? (
                <div className="absolute top-3 left-3 sm:top-auto sm:bottom-6 sm:left-6 flex items-center gap-2 sm:gap-2.5 rounded-full bg-card/95 px-3.5 sm:px-5 py-1.5 sm:py-2.5 text-xs md:text-sm font-bold backdrop-blur shadow-md border border-border z-20 max-w-[calc(100%-24px)]">
                  {processing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-amber-500 shrink-0" />
                      <span className="truncate">{steps[step]?.label || "Processing"}…</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">Image ready</span>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            {/* Quick Action Bar under Canvas when Cutout is ready */}
            {hasProcessed && afterImage && !processing && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 px-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowCutoutEditor(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-foreground bg-background px-5 py-3 text-xs sm:text-sm font-extrabold text-foreground shadow-md transition-all hover:scale-105 hover:bg-foreground hover:text-background cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" /> Edit Cutout
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs sm:text-sm font-extrabold text-background shadow-xl transition-all hover:scale-105 cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-amber-400" />
                    <span>Download PNG</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border bg-card px-4 py-3 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-all hover:scale-105 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Another Image
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Pipeline Status before processing */}
          {!hasProcessed && (
            <div className="rounded-3xl border-2 border-border bg-card p-5 sm:p-6 md:p-8 shadow-md flex flex-col justify-between min-h-0 sm:min-h-[620px] md:min-h-[680px] lg:min-h-[720px] lg:sticky lg:top-6">
              <div>
                <div className="flex items-center justify-between text-xs md:text-sm font-bold text-foreground">
                  <span>Pipeline Status</span>
                  <span className="text-accent-foreground font-mono text-sm">{progress}%</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <ol className="mt-7 space-y-4">
                  {steps.map((s, i) => {
                    const isStepDone = hasProcessed || (processing && i < step);
                    const isStepActive = processing && i === step;
                    return (
                      <li key={s.label} className="flex items-start gap-4">
                        <span
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold transition-all duration-300 ${isStepDone
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                            : isStepActive
                              ? "border-accent bg-accent text-accent-foreground animate-pulse scale-110 shadow-md"
                              : "border-border text-muted-foreground bg-secondary/40"
                            }`}
                        >
                          {isStepDone ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : i + 1}
                        </span>
                        <div>
                          <p
                            className={`text-sm font-bold transition-colors ${isStepDone || isStepActive ? "text-foreground" : "text-muted-foreground"
                              }`}
                          >
                            {s.label}
                            {isStepActive ? <span className="dot-ellipsis" /> : null}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <div className="flex flex-col gap-3">
                  {/* Credit Cost Indicator (only for logged-in users) */}
                  {currentUser && (
                    <div className="flex items-center justify-between text-xs px-1 text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-500 fill-current" />
                        <span>Cost: <strong className="text-foreground">1 credit</strong></span>
                        <span className="text-[11px] text-muted-foreground ml-1">
                          (Balance: <span className="font-mono font-bold text-amber-500">{AuthUser.getCredits()}</span>)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.dispatchEvent(
                              new CustomEvent("bg:show_add_credits_dialog", {
                                detail: {
                                  toolName: "Background Remover",
                                  toolSlug: "remove-background",
                                  creditCost: 1,
                                  currentCredits: AuthUser.getCredits(),
                                },
                              })
                            );
                          }
                        }}
                        className="text-amber-600 dark:text-amber-400 hover:underline font-extrabold cursor-pointer text-xs"
                      >
                        + Add Credits
                      </button>
                    </div>
                  )}

                  {!hasProcessed && !processing ? (
                    <button
                      type="button"
                      onClick={startRemovalProcess}
                      className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-foreground px-8 py-4 text-sm md:text-base font-extrabold text-background shadow-xl transition-all hover:scale-105 hover:shadow-accent/30"
                    >
                      <Wand2 className="h-5 w-5 text-amber-400" /> Remove Background Now →
                    </button>
                  ) : processing ? (
                    <button
                      type="button"
                      disabled
                      className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-secondary px-8 py-4 text-sm md:text-base font-extrabold text-muted-foreground cursor-not-allowed"
                    >
                      <Loader2 className="h-5 w-5 animate-spin text-amber-500" /> Processing AI Pipeline…
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowCutoutEditor(true)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border-2 border-foreground bg-background px-4 py-4 text-xs md:text-sm font-extrabold text-foreground shadow-lg transition-all hover:scale-105 hover:bg-foreground hover:text-background cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload()}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-4 text-xs md:text-sm font-extrabold text-background shadow-xl transition-all hover:scale-105 cursor-pointer"
                      >
                        <Download className="h-4 w-4" /> Download
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border bg-card px-4 py-4 text-xs font-bold text-muted-foreground hover:text-foreground transition-all hover:scale-105 cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Another
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Cutout Editor Modal (Remove Brush, Restore Brush, Magic Brush) */}
      {showCutoutEditor && beforeImage && afterImage && (
        <CutoutBrushEditorModal
          originalImageSrc={beforeImage}
          cutoutImageSrc={afterImage}
          filename={fileName || "cutout.png"}
          onClose={() => setShowCutoutEditor(false)}
          onSave={(newCutoutSrc) => {
            setAfterImage(newCutoutSrc);
          }}
          onDownload={(newCutoutSrc, fname) => {
            const a = document.createElement("a");
            a.href = newCutoutSrc;
            a.download = fname;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success(`Downloaded ${fname}`);
          }}
        />
      )}
    </div>
  );
}
