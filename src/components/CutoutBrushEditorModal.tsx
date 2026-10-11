import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Eraser,
  Paintbrush,
  Wand2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Check,
  X,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

export interface CutoutBrushEditorModalProps {
  originalImageSrc: string; // beforeImage (needed to restore original pixels)
  cutoutImageSrc: string;   // afterImage (current transparent cutout)
  filename?: string;
  onClose: () => void;
  onSave: (newCutoutSrc: string) => void;
  onDownload?: (newCutoutSrc: string, filename: string) => void;
}

type ToolMode = "erase" | "restore" | "magic";

export function CutoutBrushEditorModal({
  originalImageSrc,
  cutoutImageSrc,
  filename = "cutout.png",
  onClose,
  onSave,
  onDownload,
}: CutoutBrushEditorModalProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<ToolMode>("erase");
  const [brushSize, setBrushSize] = useState<number>(32);
  const [brushHardness, setBrushHardness] = useState<number>(90); // 10% to 100%
  const [brushOpacity, setBrushOpacity] = useState<number>(100);   // 10% to 100%
  
  // Ghost / older background opacity (OFF by default so user sees clean cutout with background removed!)
  const [ghostOpacity, setGhostOpacity] = useState<number>(35);
  const [isGhostVisible, setIsGhostVisible] = useState<boolean>(false);

  // Magic brush settings (safe default tolerance 14 to prevent bleeding into subject)
  const [magicTolerance, setMagicTolerance] = useState<number>(14);
  const [contiguousOnly, setContiguousOnly] = useState<boolean>(true);

  // Canvas Viewport & History
  const [zoom, setZoom] = useState<number>(1);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Dynamic Cursor Indicator
  const [cursorPos, setCursorPos] = useState<{
    x: number;
    y: number;
    displayDiameter: number;
    visible: boolean;
  }>({
    x: 0,
    y: 0,
    displayDiameter: 32,
    visible: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const offscreenOriginalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // History stack for undo/redo
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const maxHistory = 25;

  // Mount flag for SSR-safe portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when editor is active to prevent background page from scrolling
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  // Sync offscreen original canvas matching current cutout dimensions
  const syncOffscreenOriginalCanvas = useCallback((width: number, height: number) => {
    if (!originalImgRef.current || width <= 0 || height <= 0) return;
    const offCanvas = document.createElement("canvas");
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext("2d");
    if (offCtx) {
      offCtx.imageSmoothingEnabled = true;
      offCtx.imageSmoothingQuality = "high";
      offCtx.drawImage(originalImgRef.current, 0, 0, width, height);
      offscreenOriginalCanvasRef.current = offCanvas;
    }
  }, []);

  // Push state to history
  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      newHistory.push(imgData);
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      }
      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(false);
    } catch (e) {
      console.error("Failed to push history", e);
    }
  }, []);

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    historyIndexRef.current -= 1;
    const imgData = historyRef.current[historyIndexRef.current];
    if (imgData) {
      ctx.putImageData(imgData, 0, 0);
    }
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    historyIndexRef.current += 1;
    const imgData = historyRef.current[historyIndexRef.current];
    if (imgData) {
      ctx.putImageData(imgData, 0, 0);
    }
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  // Reset to initial cutout
  const handleResetToCutout = () => {
    if (historyRef.current.length > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const initial = historyRef.current[0];
      if (initial) {
        ctx.putImageData(initial, 0, 0);
        pushHistory();
        toast.info("Reset to initial cutout.");
      }
    }
  };

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, [, ], +, -, 0, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setZoom((z) => Math.min(5, Number((z + 0.2).toFixed(1))));
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "-" || e.key === "_")) {
        e.preventDefault();
        setZoom((z) => Math.max(0.25, Number((z - 0.2).toFixed(1))));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        setZoom(1);
      } else if (e.key === "[") {
        e.preventDefault();
        setBrushSize((s) => Math.max(4, s - 6));
      } else if (e.key === "]") {
        e.preventDefault();
        setBrushSize((s) => Math.min(150, s + 6));
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, onClose]);

  // Mouse wheel zoom with Ctrl key (or trackpad pinch-to-zoom)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        setZoom((prevZoom) => {
          const next = Math.min(5, Math.max(0.25, Number((prevZoom + delta).toFixed(2))));
          return next;
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // When switching to Restore Brush, auto-enable ghost backdrop so user sees what to restore
  // When switching tools: Restore brush can show faint backdrop guide; Remove and Magic keep background clearly removed
  const handleSelectTool = (tool: ToolMode) => {
    setActiveTool(tool);
    if (tool === "restore") {
      setIsGhostVisible(true);
      if (ghostOpacity <= 5) {
        setGhostOpacity(35);
      }
    } else {
      setIsGhostVisible(false);
    }
  };

  // Initialize Canvas with Cutout and Preload Original
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let canvasWidth = 0;
    let canvasHeight = 0;

    // Load original image in background
    const origImg = new Image();
    if (!originalImageSrc.startsWith("data:") && !originalImageSrc.startsWith("blob:")) {
      origImg.crossOrigin = "anonymous";
    }
    origImg.onload = () => {
      originalImgRef.current = origImg;
      if (canvasWidth > 0 && canvasHeight > 0) {
        syncOffscreenOriginalCanvas(canvasWidth, canvasHeight);
      }
    };
    origImg.src = originalImageSrc;

    // Load cutout onto canvas
    const cutoutImg = new Image();
    if (!cutoutImageSrc.startsWith("data:") && !cutoutImageSrc.startsWith("blob:")) {
      cutoutImg.crossOrigin = "anonymous";
    }

    const renderCutout = () => {
      canvasWidth = cutoutImg.width;
      canvasHeight = cutoutImg.height;
      canvas.width = cutoutImg.width;
      canvas.height = cutoutImg.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(cutoutImg, 0, 0);

      // Record first snapshot
      historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);

      if (originalImgRef.current) {
        syncOffscreenOriginalCanvas(canvas.width, canvas.height);
      }
    };

    cutoutImg.onload = renderCutout;
    cutoutImg.onerror = (e) => {
      console.warn("Cutout image load error, retrying directly:", e);
      const fallback = new Image();
      fallback.onload = () => {
        cutoutImg.width = fallback.width;
        cutoutImg.height = fallback.height;
        renderCutout();
      };
      fallback.src = cutoutImageSrc;
    };
    cutoutImg.src = cutoutImageSrc;
  }, [cutoutImageSrc, originalImageSrc, syncOffscreenOriginalCanvas]);

  // Coordinate conversion helper (Client screen -> Canvas native Pixel)
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // 1. DRAW BRUSH (Erase or Restore) with anti-aliasing interpolation & NO black marks
  const drawBrushLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const radius = Math.max(1, brushSize / 2);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const step = Math.max(1, radius / 3);
    const steps = Math.ceil(distance / step);

    if (activeTool === "erase") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = Math.min(1, Math.max(0.05, brushOpacity / 100));

      for (let i = 0; i <= steps; i++) {
        const t = steps === 0 ? 0 : i / steps;
        const x = from.x + dx * t;
        const y = from.y + dy * t;

        if (brushHardness < 95) {
          const innerRadius = radius * (brushHardness / 100);
          const grad = ctx.createRadialGradient(x, y, innerRadius, x, y, radius);
          grad.addColorStop(0, "rgba(0,0,0,1)");
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = "#000000";
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (activeTool === "restore") {
      const offCanvas = offscreenOriginalCanvasRef.current;
      if (!offCanvas) {
        if (originalImgRef.current) {
          syncOffscreenOriginalCanvas(canvas.width, canvas.height);
        }
        return;
      }

      const pattern = ctx.createPattern(offCanvas, "no-repeat");
      if (!pattern) return;

      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = Math.min(1, Math.max(0.05, brushOpacity / 100));
      ctx.fillStyle = pattern;

      for (let i = 0; i <= steps; i++) {
        const t = steps === 0 ? 0 : i / steps;
        const x = from.x + dx * t;
        const y = from.y + dy * t;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  // 2. MAGIC BRUSH: EDGE-AWARE ONE-CLICK COLOR CLEANING
  const handleMagicClick = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const pxX = Math.floor(startX);
    const pxY = Math.floor(startY);

    if (pxX < 0 || pxX >= width || pxY < 0 || pxY >= height) return;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const startIdx = (pxY * width + pxX) * 4;
    const targetR = data[startIdx] ?? 0;
    const targetG = data[startIdx + 1] ?? 0;
    const targetB = data[startIdx + 2] ?? 0;
    const targetA = data[startIdx + 3] ?? 0;

    if (targetA === 0) {
      toast.info("This area is already transparent.");
      return;
    }

    // Accurate perceptual color tolerance (ITU-R BT.601 luminance weights)
    const tolerance = Math.max(2, magicTolerance);
    // Strict edge-contrast threshold prevents crossing high-contrast outlines into faces or clothes
    const edgeContrastThreshold = Math.max(7, tolerance * 0.7);

    const totalPixels = width * height;
    const visited = new Uint8Array(totalPixels);

    if (contiguousOnly) {
      // True Breadth-First-Search (BFS) expanding evenly from clicked point
      const queueX = new Int32Array(totalPixels);
      const queueY = new Int32Array(totalPixels);
      let head = 0;
      let tail = 0;

      const startPos = pxY * width + pxX;
      visited[startPos] = 1;
      queueX[tail] = pxX;
      queueY[tail] = pxY;
      tail++;

      let erasedCount = 0;

      while (head < tail) {
        const curX = queueX[head]!;
        const curY = queueY[head]!;
        head++;

        const curPos = curY * width + curX;
        const curIdx = curPos * 4;
        const curR = data[curIdx]!;
        const curG = data[curIdx + 1]!;
        const curB = data[curIdx + 2]!;
        const curA = data[curIdx + 3]!;

        if (curA === 0) continue;

        // Perceptual distance to root clicked color
        const dr = curR - targetR;
        const dg = curG - targetG;
        const db = curB - targetB;
        const dist = Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db);

        // Erase pixel with anti-aliasing feathering near boundary
        if (dist <= tolerance) {
          const featherStart = tolerance * 0.75;
          if (dist > featherStart && featherStart < tolerance) {
            const factor = (dist - featherStart) / (tolerance - featherStart);
            data[curIdx + 3] = Math.round(curA * factor);
          } else {
            data[curIdx + 3] = 0;
          }
          erasedCount++;
        }

        // Check 4-connected neighbors
        const neighbors = [
          [curX + 1, curY],
          [curX - 1, curY],
          [curX, curY + 1],
          [curX, curY - 1],
        ];

        for (let i = 0; i < 4; i++) {
          const nx = neighbors[i]![0]!;
          const ny = neighbors[i]![1]!;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nPos = ny * width + nx;
            if (!visited[nPos]) {
              visited[nPos] = 1;
              const nIdx = nPos * 4;
              const nA = data[nIdx + 3]!;

              if (nA > 0) {
                const nR = data[nIdx]!;
                const nG = data[nIdx + 1]!;
                const nB = data[nIdx + 2]!;

                // 1. Distance to root clicked target color
                const ndr = nR - targetR;
                const ndg = nG - targetG;
                const ndb = nB - targetB;
                const nDist = Math.sqrt(0.299 * ndr * ndr + 0.587 * ndg * ndg + 0.114 * ndb * ndb);

                // 2. Local contrast gradient to neighbor (prevents crossing outlines into subject)
                const sdr = nR - curR;
                const sdg = nG - curG;
                const sdb = nB - curB;
                const stepDist = Math.sqrt(0.299 * sdr * sdr + 0.587 * sdg * sdg + 0.114 * sdb * sdb);

                // Strict boundary check: both root distance and local step gradient must pass
                if (nDist <= tolerance && stepDist <= edgeContrastThreshold) {
                  queueX[tail] = nx;
                  queueY[tail] = ny;
                  tail++;
                }
              }
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      pushHistory();
      if (erasedCount > 0) {
        toast.success(`Magic Brush erased ${erasedCount.toLocaleString()} pixels cleanly without bleeding!`);
      } else {
        toast.info("Area matches edge boundary. Try adjusting tolerance.");
      }
    } else {
      // Global color clean
      let erasedCount = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3]! > 0) {
          const dr = data[i]! - targetR;
          const dg = data[i + 1]! - targetG;
          const db = data[i + 2]! - targetB;
          const dist = Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db);
          if (dist <= tolerance) {
            data[i + 3] = 0;
            erasedCount++;
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
      pushHistory();
      toast.success(`Magic Brush cleaned ${erasedCount.toLocaleString()} matching pixels!`);
    }
  };

  // Pointer event handlers with pointer capture
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = getCanvasCoords(e);
    if (!coords) return;

    if (activeTool === "magic") {
      handleMagicClick(coords.x, coords.y);
      return;
    }

    isDrawingRef.current = true;
    lastPosRef.current = coords;
    drawBrushLine(coords, coords);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const displayScaleX = canvas.clientWidth / rect.width;
      const displayScaleY = canvas.clientHeight / rect.height;
      const localX = relX * displayScaleX;
      const localY = relY * displayScaleY;

      const canvasPixelScale = canvas.clientWidth / canvas.width;
      const displayDiameter = brushSize * canvasPixelScale;

      setCursorPos({
        x: localX,
        y: localY,
        displayDiameter: Math.max(4, displayDiameter),
        visible: true,
      });
    }

    if (!isDrawingRef.current || !lastPosRef.current) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;

    drawBrushLine(lastPosRef.current, coords);
    lastPosRef.current = coords;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPosRef.current = null;
      pushHistory();
    }
  };

  const handlePointerLeave = () => {
    setCursorPos((prev) => ({ ...prev, visible: false }));
  };

  // Save changes and close modal
  const handleSaveAndApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newSrc = canvas.toDataURL("image/png");
    onSave(newSrc);
    toast.success("Cutout edits applied successfully!");
    onClose();
  };

  // Download directly as PNG
  const handleDirectDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newSrc = canvas.toDataURL("image/png");
    const downloadName = filename.replace(/\.[^.]+$/, "") + "_edited.png";
    if (onDownload) {
      onDownload(newSrc, downloadName);
    } else {
      const a = document.createElement("a");
      a.href = newSrc;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Downloaded edited PNG!");
    }
  };

  const effectiveGhostOpacity = isGhostVisible ? ghostOpacity : 0;

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  /* Renders directly into document.body to break free of any parent stacking context or SiteHeader overlap */
  return createPortal(
    <div className="fixed inset-0 z-[99999] w-screen h-screen bg-neutral-950 flex flex-col select-none overflow-hidden">
      
      {/* ─── MAIN WORKSPACE: PURE FULL SCREEN (NO HEADER BAR) ─────────── */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden bg-neutral-950">
        
        {/* LEFT FLOATING DOCK: TOOLS & BRUSH CONTROLS + ACTIONS */}
        <div className="absolute top-4 left-4 z-20 w-64 max-h-[calc(100%-2rem)] flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/98 backdrop-blur-md p-3 shadow-2xl overflow-y-auto text-white">
          {/* Tool Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-800/80 rounded-xl border border-neutral-700/60">
            {/* Tool 1: Erase */}
            <button
              type="button"
              onClick={() => handleSelectTool("erase")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                activeTool === "erase"
                  ? "bg-white text-black shadow-md scale-102"
                  : "text-neutral-400 hover:bg-neutral-700 hover:text-white"
              }`}
              title="Remove Brush — Erase leftover background"
            >
              <Eraser className="h-4 w-4 mb-1 text-red-500" />
              <span>Remove</span>
            </button>

            {/* Tool 2: Restore */}
            <button
              type="button"
              onClick={() => handleSelectTool("restore")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                activeTool === "restore"
                  ? "bg-white text-black shadow-md scale-102"
                  : "text-neutral-400 hover:bg-neutral-700 hover:text-white"
              }`}
              title="Restore Brush — Paint back real photo parts"
            >
              <Paintbrush className="h-4 w-4 mb-1 text-amber-500" />
              <span>Restore</span>
            </button>

            {/* Tool 3: Magic */}
            <button
              type="button"
              onClick={() => handleSelectTool("magic")}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                activeTool === "magic"
                  ? "bg-white text-black shadow-md scale-102"
                  : "text-neutral-400 hover:bg-neutral-700 hover:text-white"
              }`}
              title="Magic Brush — 1-click color erase"
            >
              <Wand2 className="h-4 w-4 mb-1 text-cyan-400" />
              <span>Magic</span>
            </button>
          </div>

          {/* BRUSH SIZING & TUNING CONTROLS */}
          {activeTool !== "magic" ? (
            <div className="space-y-3 pt-1">
              {/* 1. Brush Size */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-neutral-200">Brush Size</span>
                  <span className="font-mono text-amber-400 font-bold">{brushSize}px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="140"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full h-1.5 accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer"
                />

                {/* Quick Size Presets */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  {[
                    { label: "12px", value: 12 },
                    { label: "28px", value: 28 },
                    { label: "54px", value: 54 },
                    { label: "96px", value: 96 },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setBrushSize(preset.value)}
                      className={`flex-1 h-7 flex items-center justify-center rounded-md text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                        brushSize === preset.value
                          ? "bg-white text-black border-white shadow-xs"
                          : "bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:text-white hover:bg-neutral-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Brush Edge Hardness / Softness */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-neutral-200">Edge Hardness</span>
                  <span className="font-mono text-neutral-400 font-bold">
                    {brushHardness <= 40 ? "Soft" : brushHardness <= 80 ? "Medium" : "Crisp"} ({brushHardness}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="100"
                  value={brushHardness}
                  onChange={(e) => setBrushHardness(Number(e.target.value))}
                  className="w-full h-1.5 accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between gap-1">
                  {[
                    { label: "Soft", value: 35 },
                    { label: "Natural", value: 75 },
                    { label: "Crisp", value: 100 },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setBrushHardness(preset.value)}
                      className={`flex-1 h-7 flex items-center justify-center rounded-md text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                        brushHardness === preset.value
                          ? "bg-white text-black border-white shadow-xs"
                          : "bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:text-white hover:bg-neutral-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Brush Opacity (Flow) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-neutral-200">Opacity (Flow)</span>
                  <span className="font-mono text-amber-400 font-bold">{brushOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={brushOpacity}
                  onChange={(e) => setBrushOpacity(Number(e.target.value))}
                  className="w-full h-1.5 accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          ) : (
            /* Magic Wand Controls */
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-neutral-200">Edge Tolerance</span>
                  <span className="font-mono text-cyan-400 font-bold">{magicTolerance}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="50"
                  value={magicTolerance}
                  onChange={(e) => setMagicTolerance(Number(e.target.value))}
                  className="w-full h-1.5 accent-cyan-400 bg-neutral-800 rounded-lg cursor-pointer"
                />

                {/* Quick Tolerance Presets */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  {[
                    { label: "Fine", value: 8, tip: "8" },
                    { label: "Normal", value: 14, tip: "14" },
                    { label: "Broad", value: 24, tip: "24" },
                    { label: "High", value: 38, tip: "38" },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      title={`Tolerance ${preset.tip}`}
                      onClick={() => setMagicTolerance(preset.value)}
                      className={`flex-1 h-7 flex items-center justify-center rounded-md text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap px-1 ${
                        magicTolerance === preset.value
                          ? "bg-cyan-400 text-black border-cyan-400 shadow-xs"
                          : "bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:text-white hover:bg-neutral-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-[11px] font-semibold text-neutral-200 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={contiguousOnly}
                  onChange={(e) => setContiguousOnly(e.target.checked)}
                  className="rounded accent-cyan-400 cursor-pointer"
                />
                <span>Contiguous only (protects person)</span>
              </label>

              <p className="text-[10px] text-neutral-400 leading-tight">
                Edge-aware: automatically stops at face, hair, and clothing outlines. Use <strong>Fine</strong> for delicate details.
              </p>
            </div>
          )}

          <div className="h-px bg-neutral-800 my-1" />

          {/* ── GHOST BACKDROP (OLDER BACKGROUND PREVIEW) ── */}
          <div className="space-y-2 pt-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsGhostVisible(!isGhostVisible)}
                  className="text-neutral-300 hover:text-amber-400 transition-colors cursor-pointer"
                  title={isGhostVisible ? "Hide faint background" : "Show faint background"}
                >
                  {isGhostVisible ? <Eye className="h-3.5 w-3.5 text-amber-400" /> : <EyeOff className="h-3.5 w-3.5 text-neutral-500" />}
                </button>
                <span className="font-bold text-neutral-200">Ghost Background</span>
              </div>
              <span className="font-mono text-amber-400 font-bold">
                {isGhostVisible ? `${ghostOpacity}%` : "Off"}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="90"
              value={isGhostVisible ? ghostOpacity : 0}
              onChange={(e) => {
                const val = Number(e.target.value);
                setGhostOpacity(val);
                setIsGhostVisible(val > 0);
              }}
              className="w-full h-1.5 accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between gap-1">
              {[
                { label: "Off", value: 0 },
                { label: "25%", value: 25 },
                { label: "45%", value: 45 },
                { label: "70%", value: 70 },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    if (preset.value === 0) {
                      setIsGhostVisible(false);
                    } else {
                      setIsGhostVisible(true);
                      setGhostOpacity(preset.value);
                    }
                  }}
                  className={`flex-1 h-7 flex items-center justify-center rounded-md text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    effectiveGhostOpacity === preset.value
                      ? "bg-amber-500/25 text-amber-400 border-amber-500/50"
                      : "bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:text-white hover:bg-neutral-700"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-neutral-400 leading-tight">
              Shows original background faintly underneath transparent parts to guide your Restore brush.
            </p>
          </div>

          {/* ── 4. DIRECT ACTION BUTTONS (DOWNLOAD & DONE) IN DOCK ── */}
          <div className="pt-2 border-t border-neutral-800 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white text-black font-extrabold text-xs shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer hover:bg-neutral-100"
            >
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Done & Apply Cutout</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDirectDownload}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 font-bold text-xs text-white transition-all cursor-pointer shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-amber-400" />
                <span>Download</span>
              </button>

              <button
                type="button"
                onClick={handleResetToCutout}
                title="Reset back to initial cutout"
                className="p-2 rounded-xl border border-neutral-700 bg-neutral-850 hover:bg-neutral-750 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT FLOATING DOCK: ACTIONS, ZOOM & PREVIEW MODES */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-2xl border border-neutral-800 bg-neutral-900/98 backdrop-blur-md p-1.5 shadow-2xl text-white">
          
          {/* Undo / Redo */}
          <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-800/80 p-0.5">
            <button
              type="button"
              disabled={!canUndo}
              onClick={handleUndo}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-lg text-white hover:bg-neutral-700 disabled:opacity-30 transition-all cursor-pointer"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={handleRedo}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded-lg text-white hover:bg-neutral-700 disabled:opacity-30 transition-all cursor-pointer"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>



          {/* Zoom Controls */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.2).toFixed(1))))}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="font-mono text-xs font-bold text-white px-1 hover:text-amber-400 transition-colors cursor-pointer"
            title="Reset Zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, Number((z + 0.2).toFixed(1))))}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <div className="w-px h-4 bg-neutral-800 mx-0.5" />

          {/* Quick Download button */}
          <button
            type="button"
            onClick={handleDirectDownload}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Download edited PNG"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Quick Done button */}
          <button
            type="button"
            onClick={handleSaveAndApply}
            className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-white text-black shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 hover:bg-neutral-100"
            title="Save & Done"
          >
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span>Done</span>
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer ml-0.5"
            title="Close editor (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ─── CANVAS SCROLL CONTAINER (100% OPAQUE SOLID FOUNDATION) ──── */}
        <div
          ref={containerRef}
          className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-6 sm:p-12 relative cursor-crosshair"
          style={{
            backgroundColor: "#18181b", // Solid opaque dark foundation
            backgroundImage:
              "linear-gradient(45deg, #27272a 25%, transparent 25%), linear-gradient(-45deg, #27272a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #27272a 75%), linear-gradient(-45deg, transparent 75%, #27272a 75%)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          }}
        >
          {/* TRANSFORMED CANVAS WRAPPER */}
          <div
            className="relative inline-block shadow-2xl rounded-lg transition-transform duration-100 ease-out"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            {/* Ghost Backdrop: faint original background showing through cutout transparent holes */}
            {effectiveGhostOpacity > 0 && (
              <img
                src={originalImageSrc}
                alt="Original Backdrop Guide"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0 rounded-lg block"
                style={{
                  opacity: effectiveGhostOpacity / 100,
                }}
              />
            )}

            {/* Working Cutout Canvas */}
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              className="relative z-10 max-h-[80vh] max-w-[88vw] object-contain rounded-lg block touch-none"
            />

            {/* Brush Size Ring Indicator */}
            {cursorPos.visible && activeTool !== "magic" && (
              <div
                className="pointer-events-none absolute rounded-full border border-white shadow-[0_0_6px_rgba(0,0,0,0.9),inset_0_0_3px_rgba(0,0,0,0.8)] -translate-x-1/2 -translate-y-1/2 z-30 transition-none"
                style={{
                  left: `${cursorPos.x}px`,
                  top: `${cursorPos.y}px`,
                  width: `${cursorPos.displayDiameter}px`,
                  height: `${cursorPos.displayDiameter}px`,
                  backgroundColor:
                    activeTool === "erase"
                      ? "rgba(239, 68, 68, 0.28)"
                      : "rgba(16, 185, 129, 0.32)",
                }}
              />
            )}

            {/* Magic Wand Cursor Indicator */}
            {cursorPos.visible && activeTool === "magic" && (
              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 rounded-full bg-cyan-500/30 border border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] z-30"
                style={{
                  left: `${cursorPos.x}px`,
                  top: `${cursorPos.y}px`,
                }}
              >
                <Wand2 className="h-3.5 w-3.5 text-cyan-300 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── BOTTOM FOOTER BAR (SOLID OPAQUE) ────────────────────────── */}
      <footer className="border-t border-neutral-800 bg-neutral-900 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-neutral-400 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-neutral-200 text-[11px] sm:text-xs">
            {activeTool === "erase"
              ? "Remove Brush active: Drag over areas to erase leftover background."
              : activeTool === "restore"
              ? "Restore Brush active: Drag over faint background to paint original parts back cleanly."
              : "Magic Brush active: Click on any background color or halo to remove it in one click."}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-medium mr-1 text-neutral-400">
            <span>Zoom: <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono font-bold text-neutral-200">Ctrl + Wheel</kbd></span>
            <span>Brush Size: <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono font-bold text-neutral-200">[</kbd> <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono font-bold text-neutral-200">]</kbd></span>
            <span>Undo: <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono font-bold text-neutral-200">Ctrl+Z</kbd></span>
            <span>Redo: <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono font-bold text-neutral-200">Ctrl+Y</kbd></span>
          </div>

          {/* Direct Download button in bottom footer */}
          <button
            type="button"
            onClick={handleDirectDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>Download</span>
          </button>

          {/* Direct Done button in bottom footer */}
          <button
            type="button"
            onClick={handleSaveAndApply}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white text-black text-xs font-extrabold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md hover:bg-neutral-100"
          >
            <Check className="h-4 w-4 text-emerald-600" />
            <span>Done</span>
          </button>
        </div>
      </footer>

    </div>,
    document.body
  );
}
