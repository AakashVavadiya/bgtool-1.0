import { useEffect, useRef, useState, useCallback } from "react";
import girlBefore from "@/assets/girl-before.jpg";
import girlAfter from "@/assets/girl-after.png";

// Industry-standard crisp Photoshop transparency grid pattern
const cleanCheckerStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
  backgroundSize: "24px 24px",
  backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0",
  backgroundColor: "#ffffff",
};

export function ScrollBeforeAfter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayPos, setDisplayPos] = useState(30);
  const [isDragging, setIsDragging] = useState(false);

  const targetPosRef = useRef(30);
  const currentPosRef = useRef(30);
  const animFrameRef = useRef<number | null>(null);

  // Smooth RAF interpolation loop (LERP) for silky 60fps/120fps motion
  const startSmoothLoop = useCallback(() => {
    if (animFrameRef.current !== null) return;

    const loop = () => {
      const diff = targetPosRef.current - currentPosRef.current;

      if (Math.abs(diff) > 0.01) {
        currentPosRef.current += diff * 0.15; // Butter smooth lerp rate
        setDisplayPos(currentPosRef.current);
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        currentPosRef.current = targetPosRef.current;
        setDisplayPos(targetPosRef.current);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, []);

  const updateTargetPos = useCallback(
    (newTarget: number, immediate = false) => {
      const clamped = Math.max(0, Math.min(100, newTarget));
      targetPosRef.current = clamped;
      if (immediate) {
        currentPosRef.current = clamped;
        setDisplayPos(clamped);
      } else {
        startSmoothLoop();
      }
    },
    [startSmoothLoop]
  );

  const updatePosFromClientX = useCallback(
    (clientX: number, immediate = false) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = (x / rect.width) * 100;
      updateTargetPos(percent, immediate);
    },
    [updateTargetPos]
  );

  // Scroll-driven animation when not manually dragging the handle
  useEffect(() => {
    const handleScroll = () => {
      if (isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate scroll progress through container viewport
      const top = rect.top;
      const height = rect.height;

      // Progress from 0 (when top enters bottom of window) to 1 (when bottom leaves top of window)
      const progress = (windowHeight - top) / (windowHeight + height);

      if (progress >= 0 && progress <= 1) {
        // Map 20% to 80% scroll progress smoothly to 0% - 100% split
        const mapped = Math.max(0, Math.min(100, (progress - 0.2) * 166.6));
        updateTargetPos(mapped);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isDragging, updateTargetPos]);

  // Global mouse drag & touch handling when handle button is grabbed
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      updatePosFromClientX(e.clientX, true);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        updatePosFromClientX(e.touches[0].clientX, true);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchmove", handleGlobalTouchMove, { passive: true });
    window.addEventListener("touchend", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalMouseUp);
    };
  }, [isDragging, updatePosFromClientX]);

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => {
        setIsDragging(true);
        updatePosFromClientX(e.clientX, true);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        if (e.touches[0]) updatePosFromClientX(e.touches[0].clientX, true);
      }}
      onWheel={(e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault();
          updateTargetPos(displayPos + (e.deltaX > 0 ? 3 : -3));
        }
      }}
      className="group relative h-[380px] xs:h-[440px] sm:h-[540px] md:h-[640px] w-full max-w-5xl mx-auto overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-border shadow-2xl select-none cursor-ew-resize"
      style={{
        ...cleanCheckerStyle,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* BASE LAYER: Background Removed Cutout PNG over crisp transparency grid */}
      <div className="absolute inset-0 h-full w-full pointer-events-none select-none">
        <img
          src={girlAfter}
          alt="Portrait with background removed"
          draggable={false}
          loading="lazy"
          width={1008}
          height={1200}
          className="h-full w-full object-cover object-top pointer-events-none select-none"
          style={{ userSelect: "none", WebkitUserDrag: "none" } as React.CSSProperties}
        />
      </div>

      {/* TOP OVERLAY LAYER: Original Photo with Background (clipped from displayPos to 100%) */}
      <div
        className="pointer-events-none select-none absolute inset-0 h-full w-full overflow-hidden will-change-[clip-path]"
        style={{
          clipPath: `polygon(${displayPos}% 0, 100% 0, 100% 100%, ${displayPos}% 100%)`,
        }}
      >
        <img
          src={girlBefore}
          alt="Original portrait before background removal"
          draggable={false}
          loading="lazy"
          width={1008}
          height={1200}
          className="pointer-events-none select-none absolute inset-0 h-full w-full object-cover object-top"
          style={{ userSelect: "none", WebkitUserDrag: "none" } as React.CSSProperties}
        />
      </div>

      {/* Vertical Slider Divider Line */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 z-20 w-1 bg-white shadow-[0_0_20px_rgba(0,0,0,0.8)] will-change-[left]"
        style={{ left: `${displayPos}%` }}
      >
        {/* Marked Black Handle Button (Only manual drag trigger) */}
        <button
          type="button"
          aria-label="Drag to reveal before and after"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
            updatePosFromClientX(e.clientX, true);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setIsDragging(true);
            if (e.touches[0]) updatePosFromClientX(e.touches[0].clientX, true);
          }}
          className={`pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-foreground text-background shadow-2xl transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-accent/30 ${
            isDragging ? "cursor-grabbing scale-110" : "cursor-grab"
          }`}
        >
          <svg
            className="h-5 w-5 sm:h-7 sm:w-7 stroke-current pointer-events-none"
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

      {/* Badges: responsive and spaced so they never collide or overlap on mobile */}
      <div className="pointer-events-none select-none absolute bottom-3 sm:bottom-6 left-3 sm:left-6 z-30 rounded-full bg-foreground/95 px-3 sm:px-5 py-1.5 sm:py-2.5 text-[11px] sm:text-xs font-bold text-background backdrop-blur shadow-xl border border-foreground/20 whitespace-nowrap">
        <span className="hidden sm:inline">Background Removed ({Math.round(displayPos)}%)</span>
        <span className="inline sm:hidden">Removed ({Math.round(displayPos)}%)</span>
      </div>
      <div className="pointer-events-none select-none absolute bottom-3 sm:bottom-6 right-3 sm:right-6 z-30 rounded-full bg-background/95 px-3 sm:px-5 py-1.5 sm:py-2.5 text-[11px] sm:text-xs font-bold text-foreground backdrop-blur shadow-xl border border-border whitespace-nowrap">
        <span className="hidden sm:inline">Original Photo</span>
        <span className="inline sm:hidden">Original</span>
      </div>

      {/* Top Banner Prompt: compact on mobile so it never obscures the subject's face */}
      <div className="pointer-events-none select-none absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center rounded-full bg-background/90 px-3.5 sm:px-5 py-1 sm:py-2 text-[10px] sm:text-xs font-semibold text-foreground backdrop-blur border border-border shadow-md whitespace-nowrap max-w-[92%] sm:max-w-none">
        <span className="hidden sm:inline">Scroll page to reveal, or drag center button ↔</span>
        <span className="inline sm:hidden">Drag slider to compare ↔</span>
      </div>
    </div>
  );
}
