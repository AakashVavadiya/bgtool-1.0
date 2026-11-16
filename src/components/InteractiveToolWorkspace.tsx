import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Upload,
  Download,
  Check,
  Loader2,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Crop as CropIcon,
  Wand2,
  RefreshCw,
  Image as ImageIcon,
  FileType,
  Layers,
  Eye,
  EyeOff,
  Pipette,
  Copy,
  Palette,
  CheckSquare,
  Square,
  Maximize2,
  X,
  Code2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FolderUp,
  Languages,
  Globe,
  Search,
  FileText,
  ScanText,
  FileDown,
  Table2,
  MonitorPlay,
  Presentation,
  Binary,
  Cpu,
  Terminal,
  Activity,
  WrapText,
  ZoomIn,
  ZoomOut,
  Hash,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Table as TableIcon,
  FileSpreadsheet,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Sun,
  Moon,
  QrCode,
  Barcode as BarcodeIcon,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  Grid3X3,
  Stamp,
  Move,
  Bold,
  Italic,
  Sparkle,
  Smile,
  Plus,
  Minus,
  Circle,
  Zap,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminStore } from "@/admin/lib/admin-store";
import { AuthUser } from "@/lib/auth-user";
import { Telemetry, REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { TokenCoin } from "@/components/TokenCoins";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { type Tool } from "@/lib/tools";
import { PdfToolWorkspace } from "@/components/PdfToolWorkspace";
import { removeGeminiWatermark, detectGeminiWatermark } from "@/lib/watermark/geminiWatermarkEngine";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import {
  type FaceBox,
  detectFacesInImage,
  applyFaceAnonymization,
} from "@/lib/faceDetector";
import {
  OcrLanguageDialog,
  RICH_OCR_LANGUAGES,
  type OcrLanguageOption,
} from "@/components/OcrLanguageDialog";
import {
  renderPptSlideToImage,
  renderAllPptSlidesToZip,
  getPptxMetadata,
  type PptxMetadata,
} from "@/lib/pptxRenderer";
import { generateColorReportPdf } from "@/lib/color-report-pdf";


// Re-export OpenXML document & OCR builders used by the chat agent
export {
  parseOcrTextToGrid,
  parseOcrTsvToGrid,
  buildEditableDocxFromOcr,
  buildDocxFromImage,
  buildEditableXlsxFromOcr,
  buildXlsxFromImage,
  buildPptxFromOcrAndImage,
  buildPptxFromImage,
  performAdvancedOcr,
  getExcelColumnLetter,
  type AdvancedOcrResult,
} from "@/lib/ocrEngine";
import {
  parseOcrTextToGrid,
  parseOcrTsvToGrid,
  buildEditableDocxFromOcr,
  buildDocxFromImage,
  buildEditableXlsxFromOcr,
  buildXlsxFromImage,
  buildPptxFromOcrAndImage,
  buildPptxFromImage,
  performAdvancedOcr,
  getExcelColumnLetter,
  type AdvancedOcrResult,
} from "@/lib/ocrEngine";
import {
  rgbToHsl,
  SAMPLE_VISUAL_TEST,
  SAMPLE_OG_CARD,
  SAMPLE_BADGE,
  SAMPLE_INVOICE,
  SAMPLE_CODE_BOX,
  SAMPLE_BINARY_INVADER,
  SAMPLE_BINARY_HEART,
  SAMPLE_BINARY_IMAGE,
  type BinaryThemeKey,
  BINARY_THEMES,
  SAMPLE_BASE64_STAR,
  SAMPLE_BASE64_GRADIENT_ICON,
  ROTATE_GRADIENT_PRESETS,
  ROTATE_COLOR_SWATCHES,
  type EditorThemeKey,
  EDITOR_THEMES,
  calculateEntropy,
  detectMagicSignature,
  MEME_FONTS,
  SQUARE_COLOR_PRESETS,
  SQUARE_GRADIENT_PRESETS,
  type CropBox,
} from "@/lib/workspace/workspace-presets";
import {
  sanitizeHtmlForImageExport,
  tryRawSvgFallback,
  type PdfOptions,
  buildPdfFromImageDataUrl,
  buildZip,
  extractTextFromZip,
  renderTextToCanvas,
  generateLockedPdfCanvas,
  renderPdfToImage,
  renderAllPdfPagesToZip,
  type WordDocumentModel,
  parseWordDocumentToPages,
  renderWordPageToImage,
  renderAllWordPagesToZip,
  renderWordDocumentToImage,
} from "@/lib/workspace/pdf-and-word-renderer";
import {
  getColIndexFromCellRef,
  type ExcelMergeRange,
  type ExcelSheetMetadata,
  getExcelSheetsMetadata,
  renderExcelSheetToImage,
  renderAllExcelSheetsToZip,
  type RotateBatchItem,
  renderRotatedImageToBlob,
} from "@/lib/workspace/excel-and-rotate-renderer";
import {
  type WatermarkRemovalOptions,
  removeWatermarkAdvanced,
  decodeBinaryStringToImageUrl,
  encodeAscii85WithWrap,
  decodeAscii85,
  detectImageMimeType,
  tryDecodeAsciiToOriginalImage,
  renderAsciiToImage,
  type DetectedCodeItem,
  formatBarcodeTypeName,
  detectBarcodesAndQRs,
  OCR_SUPPORTED_LANGUAGES,
  assembleOcrOutputText,
  renderHtmlToImage,
  applyHDResizingEnhancement,
  type SuperResolutionOptions,
  performSuperResolutionUpscale,
} from "@/lib/workspace/pixel-and-barcode-engines";
import {
  renderSquareFrameDataUrl,
  drawWatermarkOverlayOnCanvas,
  drawMemeCaptionsOnCanvas,
  encodeBinaryStreamPayload,
} from "@/lib/workspace/canvas-compositor";
import { WorkspaceFullscreenModals } from "@/components/workspace/WorkspaceFullscreenModals";
import { WorkspaceCompletedView } from "@/components/workspace/WorkspaceCompletedView";
import { WorkspaceUploadStage } from "@/components/workspace/WorkspaceUploadStage";
import { WorkspaceCanvasPreview } from "@/components/workspace/WorkspaceCanvasPreview";
import { WorkspaceControlsCore } from "@/components/workspace/WorkspaceControlsCore";
import { WorkspaceControlsCreative } from "@/components/workspace/WorkspaceControlsCreative";
import { WorkspaceControlsDecoders } from "@/components/workspace/WorkspaceControlsDecoders";
import { WorkspaceControlsDocuments } from "@/components/workspace/WorkspaceControlsDocuments";
export type { OcrLanguageOption, RotateBatchItem, WatermarkRemovalOptions, DetectedCodeItem, SuperResolutionOptions };
export { OCR_SUPPORTED_LANGUAGES };

export function InteractiveToolWorkspace({ tool }: { tool: Tool }) {
  if (tool.category === "PDF Tools") {
    return <PdfToolWorkspace tool={tool} />;
  }
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [origSize, setOrigSize] = useState<number>(0);
  const [newSize, setNewSize] = useState<number>(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [outputDimensions, setOutputDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [creditBalance, setCreditBalance] = useState(() => AuthUser.getCredits());

  useEffect(() => {
    const handleCreditUpdate = () => {
      setCreditBalance(AuthUser.getCredits());
    };
    window.addEventListener("bg:credit_updated", handleCreditUpdate);
    window.addEventListener(REALTIME_EVENT_NAME, handleCreditUpdate);
    window.addEventListener("storage", handleCreditUpdate);
    return () => {
      window.removeEventListener("bg:credit_updated", handleCreditUpdate);
      window.removeEventListener(REALTIME_EVENT_NAME, handleCreditUpdate);
      window.removeEventListener("storage", handleCreditUpdate);
    };
  }, []);

  // Tool Specific Controls State
  // 1. Compress
  const [compressMode, setCompressMode] = useState<"quality" | "size">("quality");
  const [quality, setQuality] = useState<number>(75);
  const [targetSizeInput, setTargetSizeInput] = useState<string>("");
  const [targetSizeUnit, setTargetSizeUnit] = useState<"KB" | "MB">("KB");
  const [compressFormat, setCompressFormat] = useState<"auto" | "image/webp" | "image/jpeg" | "image/png">("auto");
  const [isEditingSettings, setIsEditingSettings] = useState<boolean>(false);
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false);
  const [previewBackdrop, setPreviewBackdrop] = useState<"checker" | "white" | "black">("white");
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const handleCopyExtractedText = () => {
    copyToClipboard(ocrText || binaryOutputText, "Extracted Text");
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // 2. Resize
  const [targetWidth, setTargetWidth] = useState<number>(800);
  const [targetHeight, setTargetHeight] = useState<number>(600);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);
  const [scalePercent, setScalePercent] = useState<number>(100);
  const [resizeQualityMode, setResizeQualityMode] = useState<"same" | "improved">("same");

  // Real-time estimated output file size for Image Resize tool
  const estimatedResizeBytes = useMemo(() => {
    if (!origSize || !dimensions.width || !dimensions.height) return 0;
    const w = targetWidth > 0 ? targetWidth : dimensions.width;
    const h = targetHeight > 0 ? targetHeight : dimensions.height;
    const pixelRatio = (w * h) / (dimensions.width * dimensions.height);
    if (resizeQualityMode === "improved") {
      return Math.max(1024, Math.round(origSize * Math.pow(pixelRatio, 0.9) * 1.25));
    } else {
      return Math.max(1024, Math.round(origSize * Math.pow(pixelRatio, 0.82)));
    }
  }, [origSize, dimensions.width, dimensions.height, targetWidth, targetHeight, resizeQualityMode]);

  // 3. Crop
  const [cropAspect, setCropAspect] = useState<"free" | "1:1" | "4:3" | "16:9" | "9:16">("free");
  const [cropBox, setCropBox] = useState<CropBox>({ x: 10, y: 10, w: 80, h: 80 });

  // Dragging crop state
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [cropDragHandle, setCropDragHandle] = useState<string | null>(null);
  const [cropDragStart, setCropDragStart] = useState<{ mouseX: number; mouseY: number; box: CropBox }>({
    mouseX: 0,
    mouseY: 0,
    box: { x: 10, y: 10, w: 80, h: 80 },
  });

  // 4. Convert
  const [targetFormat, setTargetFormat] = useState<
    "image/jpeg" | "image/png" | "image/webp" | "image/avif" | "image/gif" | "image/bmp" | "image/tiff"
  >("image/png");

  useEffect(() => {
    if (tool.slug === "convert-to-jpg") {
      setTargetFormat("image/jpeg");
    }
  }, [tool.slug]);

  // 5. Rotate & Flip (Single & Multi-Image Batch)
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [rotateBgMode, setRotateBgMode] = useState<"transparent" | "color" | "blur" | "gradient">("transparent");
  const [rotateBgColor, setRotateBgColor] = useState<string>("#ffffff");
  const [rotateBgGradient, setRotateBgGradient] = useState<string>("linear-gradient(135deg, #0f172a, #1e293b)");
  const [rotateBatch, setRotateBatch] = useState<RotateBatchItem[]>([]);
  const [rotateBatchZipBlob, setRotateBatchZipBlob] = useState<Blob | null>(null);
  const [rotateBatchOutputFormat, setRotateBatchOutputFormat] = useState<"PNG" | "JPG" | "WEBP">("PNG");

  // 6. Watermark
  const [wmMode, setWmMode] = useState<"text" | "logo">("text");
  const [wmSubTab, setWmSubTab] = useState<"style" | "position" | "all">("style");
  const [wmText, setWmText] = useState<string>("© bg Watermark");
  const [wmLogoSrc, setWmLogoSrc] = useState<string | null>(null);
  const [wmLogoScale, setWmLogoScale] = useState<number>(25);
  const [wmPosition, setWmPosition] = useState<
    | "center"
    | "top_left"
    | "top_center"
    | "top_right"
    | "middle_left"
    | "middle_right"
    | "bottom_left"
    | "bottom_center"
    | "bottom_right"
    | "tile"
    | "custom"
  >("bottom_right");
  const [wmCustomCoord, setWmCustomCoord] = useState<{ xPercent: number; yPercent: number }>({ xPercent: 50, yPercent: 50 });
  const [wmMargin, setWmMargin] = useState<number>(5);
  const [wmOpacity, setWmOpacity] = useState<number>(0.7);
  const [wmColor, setWmColor] = useState<string>("#ffffff");
  const [wmFontSize, setWmFontSize] = useState<number>(36);
  const [wmFontFamily, setWmFontFamily] = useState<string>("sans-serif");
  const [wmBold, setWmBold] = useState<boolean>(true);
  const [wmItalic, setWmItalic] = useState<boolean>(false);
  const [wmRotation, setWmRotation] = useState<number>(0);
  const [wmStroke, setWmStroke] = useState<"none" | "dark" | "light">("dark");
  const [wmBgBadge, setWmBgBadge] = useState<"none" | "dark_pill" | "light_pill">("none");
  const [isDraggingWm, setIsDraggingWm] = useState<boolean>(false);
  const wmLogoInputRef = useRef<HTMLInputElement | null>(null);

  // 6.5. Watermark Remover State
  const [wmRemovalMode, setWmRemovalMode] = useState<
    "full_auto" | "gemini_ai" | "corners" | "stock_grid"
  >("full_auto");
  const [wmRemovalSensitivity, setWmRemovalSensitivity] = useState<number>(55);
  const [wmInpaintEngine, setWmInpaintEngine] = useState<"smart_neural" | "patch_match" | "smooth_diffusion">("smart_neural");
  const [wmPreserveDetails, setWmPreserveDetails] = useState<boolean>(true);
  const [wmAlphaGain, setWmAlphaGain] = useState<number>(100);

  // 7. Upscale Super-Resolution AI State
  const [upscaleFactor, setUpscaleFactor] = useState<number>(2);
  const [upscaleEngineMode, setUpscaleEngineMode] = useState<"universal" | "photo" | "anime" | "text">("universal");
  const [upscaleDetailEnhance, setUpscaleDetailEnhance] = useState<number>(80);
  const [upscaleDenoise, setUpscaleDenoise] = useState<number>(40);
  const [upscaleFaceRefinement, setUpscaleFaceRefinement] = useState<boolean>(true);

  // 8. Blur Face / Anonymise Localized Engine
  const [blurRadius, setBlurRadius] = useState<number>(20);
  const [faceRegions, setFaceRegions] = useState<FaceBox[]>([]);
  const [faceBlurType, setFaceBlurType] = useState<"gaussian" | "pixelate" | "blackout">("gaussian");
  const [faceBlurStrength, setFaceBlurStrength] = useState<number>(25);
  const [faceShape, setFaceShape] = useState<"ellipse" | "rect">("ellipse");
  const [isDetectingFaces, setIsDetectingFaces] = useState<boolean>(false);
  const [activeFaceId, setActiveFaceId] = useState<string | null>(null);
  const [isDraggingFace, setIsDraggingFace] = useState<boolean>(false);
  const [faceDragHandle, setFaceDragHandle] = useState<string | null>(null);
  const [faceDragStart, setFaceDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    box: FaceBox;
  } | null>(null);
  const [showFaceOutlines, setShowFaceOutlines] = useState<boolean>(true);
  const [hoveredFaceId, setHoveredFaceId] = useState<string | null>(null);

  // 9. Meme Generator Suite State
  const [topText, setTopText] = useState<string>("WHEN YOU USE AI");
  const [bottomText, setBottomText] = useState<string>("AND IT JUST WORKS PERFECTLY");
  const [memeFontSize, setMemeFontSize] = useState<number>(44);
  const [memeFontFamily, setMemeFontFamily] = useState<string>("Impact, 'Arial Black', sans-serif");
  const [memeTextColor, setMemeTextColor] = useState<string>("#ffffff");
  const [memeStrokeColor, setMemeStrokeColor] = useState<string>("#000000");
  const [memeStrokeWidth, setMemeStrokeWidth] = useState<number>(4);
  const [memeAllCaps, setMemeAllCaps] = useState<boolean>(true);
  const [memeTextShadow, setMemeTextShadow] = useState<boolean>(true);
  const [memeTextAlign, setMemeTextAlign] = useState<"center" | "left" | "right">("center");
  const [memeTopPosPercent, setMemeTopPosPercent] = useState<number>(4);
  const [memeBottomPosPercent, setMemeBottomPosPercent] = useState<number>(4);
  const [isDraggingMemeText, setIsDraggingMemeText] = useState<"top" | "bottom" | null>(null);
  const [memeDragStartY, setMemeDragStartY] = useState<number>(0);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState<boolean>(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  // Close custom font selector on outside click or Escape
  useEffect(() => {
    if (!isFontDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
        setIsFontDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFontDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFontDropdownOpen]);

  // 10. Photo Editor Filters
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [grayscale, setGrayscale] = useState<number>(0);
  const [sepia, setSepia] = useState<number>(0);

  // 11. OCR Text & Barcode/QR Engine State
  const [ocrText, setOcrText] = useState<string>("");
  const [rawOcrDocumentLines, setRawOcrDocumentLines] = useState<string[]>([]);
  const [detectedBarcodes, setDetectedBarcodes] = useState<DetectedCodeItem[]>([]);
  const [skipBarcodeAndQr, setSkipBarcodeAndQr] = useState<boolean>(false);
  const [ocrContrastMode, setOcrContrastMode] = useState<"auto" | "high" | "inverted">("auto");
  const [ocrOutputStructure, setOcrOutputStructure] = useState<"structured" | "plain" | "json">("structured");
  const [ocrLanguage, setOcrLanguage] = useState<string>("eng");
  const [ocrCustomLanguage, setOcrCustomLanguage] = useState<string>("");
  const [ocrLanguageSearch, setOcrLanguageSearch] = useState<string>("");
  const [isOcrLanguageDialogOpen, setIsOcrLanguageDialogOpen] = useState<boolean>(false);
  const [ocrProgressStatus, setOcrProgressStatus] = useState<string>("");
  const [ocrProgressPercent, setOcrProgressPercent] = useState<number>(0);

  const recomputeOcrOutput = (
    skip: boolean,
    contrast: "auto" | "high" | "inverted",
    structure: "structured" | "plain" | "json"
  ) => {
    const text = assembleOcrOutputText(rawOcrDocumentLines, detectedBarcodes, skip, structure);
    setOcrText(text);
    setBinaryOutputText(text);
  };

  // 12. Square Image & New Format Tools State
  const [squareBgMode, setSquareBgMode] = useState<"blur" | "color" | "gradient" | "transparent" | "fit">("blur");
  const [squareBgColor, setSquareBgColor] = useState<string>("#ffffff");
  const [squareGradient, setSquareGradient] = useState<string>("linear-gradient(135deg, #667eea 0%, #764ba2 100%)");
  const [squareScale, setSquareScale] = useState<number>(100);
  const [squareBlurAmount, setSquareBlurAmount] = useState<number>(25);
  const [squareCornerRadius, setSquareCornerRadius] = useState<number>(0);
  const [squareShadow, setSquareShadow] = useState<"none" | "soft" | "float" | "card">("none");
  const [squareExportFormat, setSquareExportFormat] = useState<"PNG" | "JPG" | "WEBP">("PNG");
  const [inputConvertText, setInputConvertText] = useState<string>("");

  // Binary to Image Tool State
  const [binaryLandingMode, setBinaryLandingMode] = useState<"upload" | "plain_text">("upload");
  const [binaryInputTab, setBinaryInputTab] = useState<"paste" | "upload">("paste");
  const [binaryTheme, setBinaryTheme] = useState<BinaryThemeKey>("matrix");
  const [binaryPixelBlockSize, setBinaryPixelBlockSize] = useState<number>(20);

  // Base64 to Image Tool State
  const [base64LandingMode, setBase64LandingMode] = useState<"upload" | "plain_text">("upload");
  const [base64InputText, setBase64InputText] = useState<string>("");
  const [base64ExportFormat, setBase64ExportFormat] = useState<"PNG" | "JPG" | "WEBP">("PNG");
  const [base64ExportQuality, setBase64ExportQuality] = useState<number>(0.92);
  const [base64DecodedInfo, setBase64DecodedInfo] = useState<{
    format: string;
    charCount: number;
    approxBytes: number;
    width: number;
    height: number;
  } | null>(null);

  // Text Decoder Tools Landing Mode State (Octal / Hex / Decimal / ASCII / Text)
  const [textDecoderLandingMode, setTextDecoderLandingMode] = useState<"upload" | "plain_text">("upload");

  // Reset textDecoderLandingMode when navigating between tools
  useEffect(() => {
    setTextDecoderLandingMode("upload");
  }, [tool.slug]);

  // 13. Image to Binary Settings State
  const [binaryOutputMode, setBinaryOutputMode] = useState<
    "Binary" | "Base64" | "Hexadecimal" | "C-Array" | "Pixel-Matrix" | "Decimal" | "Octal"
  >("Binary");
  const [binaryDelimiter, setBinaryDelimiter] = useState<"Space" | "Comma" | "None" | "Newline">("Space");
  const [binaryBitDepth, setBinaryBitDepth] = useState<string>("8 Bit (Byte)");
  const [customBitDepth, setCustomBitDepth] = useState<number>(8);
  const [binaryWithPrefix, setBinaryWithPrefix] = useState<boolean>(false);
  const [pixelThreshold, setPixelThreshold] = useState<number>(128);
  const [binaryOutputText, setBinaryOutputText] = useState<string>("");
  const [fullBinaryOutputText, setFullBinaryOutputText] = useState<string>("");
  const [isBinaryTruncatedPreview, setIsBinaryTruncatedPreview] = useState<boolean>(false);

  // 12. Color Picker State
  const [pickedHex, setPickedHex] = useState<string>("#F97316");
  const [pickedRgb, setPickedRgb] = useState<string>("rgb(249, 115, 22)");
  const [pickedHsl, setPickedHsl] = useState<string>("hsl(22, 95%, 53%)");
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [colorHistory, setColorHistory] = useState<string[]>([]);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHoveringImage, setIsHoveringImage] = useState<boolean>(false);
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const colorSampleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-performance 120 FPS Direct DOM Refs (prevents mouse stuttering)
  const loupeRef = useRef<HTMLDivElement | null>(null);
  const loupeTickRef = useRef<HTMLDivElement | null>(null);
  const loupeHexRef = useRef<HTMLSpanElement | null>(null);
  const loupeDotRef = useRef<HTMLSpanElement | null>(null);
  const hoverSwatchRef = useRef<HTMLDivElement | null>(null);
  const hoverSwatchDotRef = useRef<HTMLSpanElement | null>(null);
  const hoverSwatchHexRef = useRef<HTMLSpanElement | null>(null);
  const colorPickerRafRef = useRef<number | null>(null);
  const lastSampledColorRef = useRef<{ hex: string; rgb: string; hsl: string } | null>(null);

  // Auto-extracted most common colors
  interface MostCommonColorItem {
    hex: string;
    rgb: string;
    hsl: string;
    percentage: number;
    r: number;
    g: number;
    b: number;
  }
  const [commonColors, setCommonColors] = useState<MostCommonColorItem[]>([]);
  const [isExtractingColors, setIsExtractingColors] = useState<boolean>(false);
  const [isGeneratingPdfReport, setIsGeneratingPdfReport] = useState<boolean>(false);
  const [focusedDim, setFocusedDim] = useState<"width" | "height" | null>(null);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [fullscreenActiveIndex, setFullscreenActiveIndex] = useState<number>(0);
  const [showDynamicIsland, setShowDynamicIsland] = useState(false);
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
  const workspaceContainerRef = useRef<HTMLDivElement>(null);

  // 14. Binary & Code Research Editor Modal State
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState<boolean>(false);
  const [showEditorTopHeading, setShowEditorTopHeading] = useState<boolean>(true);
  const [rawBinaryBytes, setRawBinaryBytes] = useState<Uint8Array | null>(null);
  const [editorTheme, setEditorTheme] = useState<EditorThemeKey>("vs-dark");
  const [editorFontSize, setEditorFontSize] = useState<number>(13);
  const [editorLineWrap, setEditorLineWrap] = useState<boolean>(true);
  const [editorSearchQuery, setEditorSearchQuery] = useState<string>("");
  const [isEditorSearching, setIsEditorSearching] = useState<boolean>(false);

  const binaryStats = useMemo(() => {
    if (!rawBinaryBytes || rawBinaryBytes.length === 0) {
      return {
        entropy: 0,
        zeroCount: 0,
        oneCount: 0,
        bitDensity: 0,
        magic: { format: "Binary Stream", description: "Raw encoded stream", magicHex: "N/A" },
        totalBytes: 0,
        totalBits: 0,
      };
    }
    const entropyData = calculateEntropy(rawBinaryBytes);
    const magic = detectMagicSignature(rawBinaryBytes);
    return {
      ...entropyData,
      magic,
      totalBytes: rawBinaryBytes.length,
      totalBits: rawBinaryBytes.length * 8,
    };
  }, [rawBinaryBytes]);

  // Scroll & Header-Offset listener for Top Dynamic Island Bar
  const [islandTopPx, setIslandTopPx] = useState<number>(104);
  useEffect(() => {
    if (!hasProcessed || isEditingSettings) {
      setShowDynamicIsland(false);
      setHasScrolledOnce(false);
      return;
    }

    const handleScroll = () => {
      const headerEl = document.querySelector("header");
      const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 0;
      const nextTop = headerBottom > 0 ? Math.max(14, Math.round(headerBottom + 14)) : 16;
      setIslandTopPx(nextTop);

      if (workspaceContainerRef.current) {
        const rect = workspaceContainerRef.current.getBoundingClientRect();
        // Only show sticky Dynamic Island when user has scrolled past the main workspace actions
        const isPastWorkspace = rect.bottom < 120;
        setShowDynamicIsland(isPastWorkspace);
        if (isPastWorkspace) setHasScrolledOnce(true);
      } else {
        const isScrolled = window.scrollY > 480;
        setShowDynamicIsland(isScrolled);
        if (isScrolled) setHasScrolledOnce(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [hasProcessed, isEditingSettings]);

  // 14. HTML to Image State
  const [htmlLandingMode, setHtmlLandingMode] = useState<"upload" | "plain_text">("upload");
  const [htmlInputMode, setHtmlInputMode] = useState<"upload" | "paste">("upload");
  const [htmlCodeText, setHtmlCodeText] = useState<string>("");
  const [htmlRenderWidth, setHtmlRenderWidth] = useState<number>(860);
  const [htmlRenderHeight, setHtmlRenderHeight] = useState<number>(740);
  const [htmlBgColor, setHtmlBgColor] = useState<string>("auto");
  const [htmlOutputFormat, setHtmlOutputFormat] = useState<"PNG" | "JPG">("PNG");
  const [isFullScreenHtmlEditorOpen, setIsFullScreenHtmlEditorOpen] = useState<boolean>(false);
  const [tempHtmlCode, setTempHtmlCode] = useState<string>("");
  const [htmlEditorViewMode, setHtmlEditorViewMode] = useState<"split" | "code" | "preview">("split");

  useEffect(() => {
    if (!isFullScreenHtmlEditorOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullScreenHtmlEditorOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreenHtmlEditorOpen]);

  const lastHtmlParamsRef = useRef<string>("");

  // Debounced live canvas preview for HTML to Image (only runs when tool workspace is active and params change)
  useEffect(() => {
    if (tool.slug !== "html-to-image") return;
    if (!htmlCodeText.trim()) return;
    if (hasProcessed) return;

    const currentParams = `${htmlCodeText}__${htmlRenderWidth}__${htmlRenderHeight}__${htmlBgColor}__${htmlOutputFormat}`;
    if (lastHtmlParamsRef.current === currentParams) return;

    let active = true;
    const timer = setTimeout(() => {
      renderHtmlToImage(htmlCodeText, htmlRenderWidth, htmlRenderHeight, htmlBgColor, htmlOutputFormat)
        .then((url) => {
          if (active) {
            lastHtmlParamsRef.current = currentParams;
            setImageSrc(url);
            setDimensions({ width: htmlRenderWidth, height: htmlRenderHeight });
          }
        })
        .catch(() => { });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [tool.slug, htmlCodeText, htmlRenderWidth, htmlRenderHeight, htmlBgColor, htmlOutputFormat, hasProcessed]);


  // 16. Document export blob (for image-to-pdf/word/excel/pptx download)
  const [documentBlob, setDocumentBlob] = useState<Blob | null>(null);
  const [documentExt, setDocumentExt] = useState<string>("pdf");
  const [pdfPageSize, setPdfPageSize] = useState<"auto" | "a4_portrait" | "a4_landscape" | "letter_portrait" | "letter_landscape">("auto");
  const [pdfMargin, setPdfMargin] = useState<"none" | "small" | "normal" | "large">("none");
  const [pdfQuality, setPdfQuality] = useState<number>(95);

  // Word (.docx) OCR state
  const [wordDocMode, setWordDocMode] = useState<"text_clean" | "text_and_image" | "image_only">("text_clean");
  const [wordFontFamily, setWordFontFamily] = useState<string>("Calibri");
  const [wordFontSize, setWordFontSize] = useState<number>(11);

  // Excel (.xlsx) OCR state
  const [excelParserMode, setExcelParserMode] = useState<"grid" | "csv" | "whitespace" | "lines">("grid");
  const [excelHighlightHeader, setExcelHighlightHeader] = useState<boolean>(true);
  const [excelSheetName, setExcelSheetName] = useState<string>("Sheet1");

  // PowerPoint (.pptx) Presentation & OCR state
  const [pptxSlideMode, setPptxSlideMode] = useState<"split" | "text_only" | "image_only">("split");
  const [pptxSlideTitle, setPptxSlideTitle] = useState<string>("");
  const [pptxTheme, setPptxTheme] = useState<"modern" | "dark" | "minimal" | "corporate">("modern");

  // General OCR Grid & Anti-Hallucination Empty State
  const [ocrTableGrid, setOcrTableGrid] = useState<string[][]>([]);
  const [ocrIsEmpty, setOcrIsEmpty] = useState<boolean>(false);

  // Document Converter State (PDF / Word / Excel / PowerPoint to Image)
  const [pdfDocPage, setPdfDocPage] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [pdfPageMode, setPdfPageMode] = useState<"all" | "single">("all");
  const [pdfDpiScale, setPdfDpiScale] = useState<number>(2.0);
  const [pdfDocOutputFormat, setPdfDocOutputFormat] = useState<"PNG" | "JPG">("PNG");
  const [pdfBgColor, setPdfBgColor] = useState<string>("#ffffff");
  const [pdfConvertingProgress, setPdfConvertingProgress] = useState<{ current: number; total: number } | null>(null);

  // PDF Password Protection State
  const [pdfIsPasswordProtected, setPdfIsPasswordProtected] = useState<boolean>(false);
  const [pdfIsUnlocked, setPdfIsUnlocked] = useState<boolean>(true);
  const [pdfPasswordInput, setPdfPasswordInput] = useState<string>("");
  const [pdfPasswordError, setPdfPasswordError] = useState<string | null>(null);
  const [pdfShowPasswordText, setPdfShowPasswordText] = useState<boolean>(false);

  const [wordDocFont, setWordDocFont] = useState<string>("Calibri, sans-serif");
  const [wordDocFontSize, setWordDocFontSize] = useState<number>(16);
  const [wordDocBg, setWordDocBg] = useState<string>("#ffffff");
  const [wordDocOutputFormat, setWordDocOutputFormat] = useState<"PNG" | "JPG">("PNG");
  const [wordDocShowHeader, setWordDocShowHeader] = useState<boolean>(true);
  const [wordDocPage, setWordDocPage] = useState<number>(1);
  const [wordTotalPages, setWordTotalPages] = useState<number>(1);
  const [wordPageMode, setWordPageMode] = useState<"single" | "all">("single");
  const [wordConvertingProgress, setWordConvertingProgress] = useState<{ current: number; total: number } | null>(null);

  const [excelTheme, setExcelTheme] = useState<"modern-slate" | "clean-white" | "emerald" | "dark">("clean-white");
  const [excelGridLines, setExcelGridLines] = useState<boolean>(true);
  const [excelDocOutputFormat, setExcelDocOutputFormat] = useState<"PNG" | "JPG">("PNG");
  const [excelShowHeader, setExcelShowHeader] = useState<boolean>(false);
  const [excelDocSheet, setExcelDocSheet] = useState<number>(1);
  const [excelTotalSheets, setExcelTotalSheets] = useState<number>(1);
  const [excelSheetNames, setExcelSheetNames] = useState<string[]>([]);
  const [excelSheetTargets, setExcelSheetTargets] = useState<string[]>([]);
  const [excelSheetMode, setExcelSheetMode] = useState<"single" | "all">("single");
  const [excelConvertingProgress, setExcelConvertingProgress] = useState<{ current: number; total: number } | null>(null);

  const [pptTheme, setPptTheme] = useState<"original" | "clean" | "indigo" | "dark">("original");
  const [pptDocOutputFormat, setPptDocOutputFormat] = useState<"PNG" | "JPG">("PNG");
  const [pptDocSlide, setPptDocSlide] = useState<number>(1);
  const [pptTotalSlides, setPptTotalSlides] = useState<number>(1);
  const [pptSlideMode, setPptSlideMode] = useState<"single" | "all">("single");
  const [pptAspectRatio, setPptAspectRatio] = useState<string>("16:9 Widescreen");
  const [pptConvertingProgress, setPptConvertingProgress] = useState<{ current: number; total: number } | null>(null);

  const docBufferRef = useRef<ArrayBuffer | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const [settingsHeight, setSettingsHeight] = useState<number | null>(null);
  const [renderedImgSize, setRenderedImgSize] = useState<{ width: number; height: number } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dynamically synchronize the image box height to the settings box height
  useEffect(() => {
    if (!settingsPanelRef.current) return;
    const updateHeight = () => {
      if (settingsPanelRef.current) {
        setSettingsHeight(settingsPanelRef.current.offsetHeight);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(settingsPanelRef.current);
    return () => observer.disconnect();
  }, [imageSrc, tool.slug, targetSizeInput, targetSizeUnit]);

  // Fullscreen Preview Body Scroll Lock, Escape Key & Arrow Keys Navigation
  useEffect(() => {
    if (!isFullscreenPreview && !isCodeEditorOpen) return;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreenPreview(false);
        setIsCodeEditorOpen(false);
      } else if (isFullscreenPreview && tool.slug === "rotate-image" && rotateBatch.length > 1) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setFullscreenActiveIndex((prev) => (prev > 0 ? prev - 1 : rotateBatch.length - 1));
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setFullscreenActiveIndex((prev) => (prev < rotateBatch.length - 1 ? prev + 1 : 0));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreenPreview, isCodeEditorOpen, tool.slug, rotateBatch.length]);

  // Track the actual rendered pixel width and height of the image
  useEffect(() => {
    if (!imgRef.current) return;
    const updateImgSize = () => {
      if (imgRef.current) {
        const rect = imgRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const nextW = Math.round(rect.width);
          const nextH = Math.round(rect.height);
          setRenderedImgSize((prev) => {
            if (prev && prev.width === nextW && prev.height === nextH) return prev;
            return { width: nextW, height: nextH };
          });
        }
      }
    };
    updateImgSize();
    const observer = new ResizeObserver(updateImgSize);
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [imageSrc, processedSrc, dimensions.width, dimensions.height, targetWidth, targetHeight, settingsHeight]);

  // Live reactive preview re-render for PDF tool when settings change
  useEffect(() => {
    if (!file || !docBufferRef.current || hasProcessed) return;

    let active = true;
    if (tool.slug === "pdf-to-image") {
      // If locked, do not trigger auto render without password unlock
      if (pdfIsPasswordProtected && !pdfIsUnlocked) return;

      const refreshPdfPreview = async () => {
        if (!docBufferRef.current) return;
        try {
          const res = await renderPdfToImage(
            docBufferRef.current,
            pdfDocPage,
            pdfDpiScale,
            pdfDocOutputFormat,
            pdfBgColor,
            pdfPasswordInput
          );
          if (active && res.isUnlocked) {
            setPdfTotalPages(res.totalPages);
            setImageSrc(res.dataUrl);
            setDimensions({ width: res.width, height: res.height });
          }
        } catch (e) {
          console.warn("Live PDF preview update failed:", e);
        }
      };
      refreshPdfPreview();
    }

    return () => {
      active = false;
    };
  }, [file, pdfDocPage, pdfDpiScale, pdfDocOutputFormat, pdfBgColor, pdfPasswordInput, pdfIsUnlocked, pdfIsPasswordProtected, tool.slug, hasProcessed]);

  // Live reactive preview re-render for PowerPoint tool when settings change
  useEffect(() => {
    if (!file || !docBufferRef.current || hasProcessed) return;
    if (tool.slug !== "powerpoint-to-image") return;

    let active = true;
    const refreshPptPreview = async () => {
      if (!docBufferRef.current) return;
      try {
        const res = await renderPptSlideToImage(
          docBufferRef.current,
          file.name,
          pptTheme,
          pptDocOutputFormat,
          pptDocSlide
        );
        if (active) {
          setPptTotalSlides(res.totalSlides);
          setImageSrc(res.dataUrl);
          setDimensions({ width: res.width, height: res.height });
        }
      } catch (e) {
        console.warn("Live PPT preview update failed:", e);
      }
    };
    refreshPptPreview();

    return () => {
      active = false;
    };
  }, [file, pptDocSlide, pptTheme, pptDocOutputFormat, tool.slug, hasProcessed]);

  // Live reactive preview re-render for Word tool when settings change
  useEffect(() => {
    if (!file || !docBufferRef.current || hasProcessed) return;
    if (tool.slug !== "word-to-image") return;

    let active = true;
    const refreshWordPreview = async () => {
      if (!docBufferRef.current) return;
      try {
        const res = await renderWordPageToImage(
          docBufferRef.current,
          file.name,
          wordDocFont,
          wordDocFontSize,
          wordDocBg,
          wordDocOutputFormat,
          wordDocShowHeader,
          wordDocPage
        );
        if (active) {
          setWordTotalPages(res.totalPages);
          setImageSrc(res.dataUrl);
          setDimensions({ width: res.width, height: res.height });
        }
      } catch (e) {
        console.warn("Live Word preview update failed:", e);
      }
    };
    refreshWordPreview();

    return () => {
      active = false;
    };
  }, [file, wordDocFont, wordDocFontSize, wordDocBg, wordDocOutputFormat, wordDocShowHeader, wordDocPage, tool.slug, hasProcessed]);

  // Live reactive preview re-render for Excel tool when settings change
  useEffect(() => {
    if (!file || !docBufferRef.current || hasProcessed) return;
    if (tool.slug !== "excel-to-image") return;

    let active = true;
    const refreshExcelPreview = async () => {
      if (!docBufferRef.current) return;
      try {
        const targetPath = excelSheetTargets[excelDocSheet - 1] || "xl/worksheets/sheet1.xml";
        const res = await renderExcelSheetToImage(
          docBufferRef.current,
          file.name,
          excelTheme,
          excelGridLines,
          excelDocOutputFormat,
          excelShowHeader,
          targetPath
        );
        if (active) {
          setImageSrc(res.dataUrl);
          setDimensions({ width: res.width, height: res.height });
        }
      } catch (e) {
        console.warn("Live Excel preview update failed:", e);
      }
    };
    refreshExcelPreview();

    return () => {
      active = false;
    };
  }, [file, excelTheme, excelGridLines, excelDocOutputFormat, excelShowHeader, excelDocSheet, excelSheetTargets, tool.slug, hasProcessed]);

  // Handle PDF Password Unlock
  const handleUnlockPdf = async () => {
    if (!docBufferRef.current) return;
    if (!pdfPasswordInput.trim()) {
      setPdfPasswordError("Please enter the PDF password.");
      toast.error("Please enter the PDF password.");
      return;
    }
    setProcessing(true);
    setPdfPasswordError(null);
    try {
      const res = await renderPdfToImage(
        docBufferRef.current,
        1,
        pdfDpiScale,
        pdfDocOutputFormat,
        pdfBgColor,
        pdfPasswordInput
      );
      if (res.isPasswordProtected && !res.isUnlocked) {
        setPdfIsUnlocked(false);
        setPdfPasswordError(res.passwordError || "Incorrect password. Please try again.");
        setImageSrc(res.dataUrl);
        setProcessing(false);
        toast.error("Incorrect password for this PDF.");
      } else {
        setPdfIsPasswordProtected(true);
        setPdfIsUnlocked(true);
        setPdfPasswordError(null);
        setPdfTotalPages(res.totalPages);
        setPdfDocPage(1);
        setPdfPageMode(res.totalPages > 1 ? "all" : "single");
        setImageSrc(res.dataUrl);
        setDimensions({ width: res.width, height: res.height });
        setProcessing(false);
        toast.success("PDF unlocked successfully!");
      }
    } catch (err) {
      setProcessing(false);
      setPdfPasswordError("Failed to decrypt PDF. Please check your password.");
      toast.error("Failed to decrypt PDF.");
    }
  };

  // Adjust crop aspect preset helper
  const applyCropAspectPreset = useCallback((ratio: "free" | "1:1" | "4:3" | "16:9" | "9:16") => {
    setCropAspect(ratio);
    if (ratio === "free") {
      setCropBox({ x: 10, y: 10, w: 80, h: 80 });
      return;
    }
    let targetRatio = 1;
    if (ratio === "1:1") targetRatio = 1;
    if (ratio === "4:3") targetRatio = 4 / 3;
    if (ratio === "16:9") targetRatio = 16 / 9;
    if (ratio === "9:16") targetRatio = 9 / 16;

    const imgAspect = dimensions.width && dimensions.height ? dimensions.width / dimensions.height : 1;
    let w = 80;
    let h = (w * imgAspect) / targetRatio;
    if (h > 90) {
      h = 80;
      w = (h * targetRatio) / imgAspect;
    }
    const x = Math.max(0, (100 - w) / 2);
    const y = Math.max(0, (100 - h) / 2);
    setCropBox({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
  }, [dimensions]);

  const decodeAndApplyBase64 = (rawText: string, fileName?: string) => {
    let clean = (rawText || "").trim();
    if (!clean) {
      toast.error("Please provide Base64 code or text.");
      setProcessing(false);
      return;
    }
    // Strip surrounding quotes or url(...) wraps
    clean = clean.replace(/^['"`]|['"`]$/g, "").trim();
    const urlMatch = clean.match(/^url\(['"]?(.*?)['"]?\)$/i);
    if (urlMatch && urlMatch[1]) clean = urlMatch[1].trim();

    let dataUrl = "";
    let detectedFormat = "PNG";
    let purePayload = "";

    if (clean.startsWith("data:image/")) {
      const commaIdx = clean.indexOf(",");
      if (commaIdx !== -1) {
        const header = clean.slice(0, commaIdx + 1);
        const payload = clean.slice(commaIdx + 1).replace(/[\r\n\t\s]+/g, "");
        dataUrl = `${header}${payload}`;
        purePayload = payload;
        const fmtMatch = header.match(/^data:image\/([a-zA-Z0-9+]+);/i);
        if (fmtMatch && fmtMatch[1]) {
          const rawFmt = fmtMatch[1].toUpperCase();
          detectedFormat = rawFmt === "JPEG" ? "JPG" : rawFmt;
        }
      } else {
        dataUrl = clean.replace(/[\r\n\t\s]+/g, "");
        purePayload = dataUrl;
      }
    } else {
      const payload = clean.replace(/[\r\n\t\s]+/g, "");
      purePayload = payload;
      if (payload.startsWith("/9j/")) {
        detectedFormat = "JPG";
        dataUrl = `data:image/jpeg;base64,${payload}`;
      } else if (payload.startsWith("R0lGOD")) {
        detectedFormat = "GIF";
        dataUrl = `data:image/gif;base64,${payload}`;
      } else if (payload.startsWith("UklGR")) {
        detectedFormat = "WEBP";
        dataUrl = `data:image/webp;base64,${payload}`;
      } else if (payload.startsWith("PHN2Zy") || payload.startsWith("PD94bW")) {
        detectedFormat = "SVG";
        dataUrl = `data:image/svg+xml;base64,${payload}`;
      } else {
        detectedFormat = "PNG";
        dataUrl = `data:image/png;base64,${payload}`;
      }
    }

    setProcessing(true);
    const testImg = new Image();
    testImg.onload = () => {
      const w = testImg.naturalWidth || testImg.width || 800;
      const h = testImg.naturalHeight || testImg.height || 600;
      const approxBytes = Math.max(512, Math.round((purePayload.length * 3) / 4));

      setBase64DecodedInfo({
        format: detectedFormat,
        charCount: purePayload.length,
        approxBytes,
        width: w,
        height: h,
      });

      setBase64InputText(clean);
      setImageSrc(dataUrl);
      setProcessedSrc(dataUrl);
      setDimensions({ width: w, height: h });
      setTargetWidth(w);
      setTargetHeight(h);
      setOrigSize(approxBytes);
      setNewSize(approxBytes);
      setHasProcessed(false);
      setIsEditingSettings(true);
      setProcessing(false);
      toast.success(
        `Decoded Base64 ${detectedFormat} (${w}×${h} px)${fileName ? ` from ${fileName}` : ""}!`
      );
    };

    testImg.onerror = () => {
      setProcessing(false);
      toast.error("Failed to decode Base64 image. Please ensure the string or file is a valid Base64 image.");
    };

    testImg.src = dataUrl;
  };

  const copyBase64DecodedImage = async () => {
    const srcToUse = processedSrc || imageSrc;
    if (!srcToUse) return;
    try {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        c.toBlob(async (pngBlob) => {
          if (pngBlob) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": pngBlob }),
              ]);
              toast.success("Decoded image copied to clipboard!");
            } catch {
              toast.error("Failed to copy image to clipboard.");
            }
          }
        }, "image/png");
      };
      img.src = srcToUse;
    } catch {
      toast.error("Could not copy image to clipboard.");
    }
  };

  const renderSquareImageToDataUrl = (
    img: HTMLImageElement,
    cfg?: {
      bgMode?: "blur" | "color" | "gradient" | "transparent" | "fit";
      blurAmount?: number;
      bgColor?: string;
      gradient?: string;
      scale?: number;
      cornerRadius?: number;
      shadow?: "none" | "soft" | "float" | "card";
      exportFormat?: "PNG" | "JPG" | "WEBP";
    }
  ): string =>
    renderSquareFrameDataUrl(img, {
      bgMode: cfg?.bgMode ?? squareBgMode,
      blurAmount: cfg?.blurAmount ?? squareBlurAmount,
      bgColor: cfg?.bgColor ?? squareBgColor,
      gradient: cfg?.gradient ?? squareGradient,
      scale: cfg?.scale ?? squareScale,
      cornerRadius: cfg?.cornerRadius ?? squareCornerRadius,
      shadow: cfg?.shadow ?? squareShadow,
      exportFormat: cfg?.exportFormat ?? squareExportFormat,
    });

  const processSelectedFile = (selected: File) => {
    if (selected.size > 30 * 1024 * 1024) {
      toast.error("File size exceeds the 30 MB limit. Please upload a smaller file.");
      return;
    }

    // Base64-to-image tool: read as text (.txt, .b64, etc.) and auto-decode
    if (tool.slug === "base64-to-image") {
      setFile(selected);
      setOrigSize(selected.size);
      setProcessing(true);
      setHasProcessed(false);
      setProcessedSrc(null);

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = (evt.target?.result as string) || "";
        decodeAndApplyBase64(text, selected.name);
      };
      reader.onerror = () => {
        setProcessing(false);
        toast.error("Failed to read Base64 text file.");
      };
      reader.readAsText(selected);
      return;
    }

    // Document-to-image tools: load buffer and render initial preview in settings mode
    if (["pdf-to-image", "word-to-image", "excel-to-image", "powerpoint-to-image"].includes(tool.slug)) {
      setFile(selected);
      setOrigSize(selected.size);
      setHasProcessed(false);
      setProcessedSrc(null);
      setIsEditingSettings(true);
      setProcessing(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const buffer = evt.target?.result as ArrayBuffer;
        if (!buffer) {
          setProcessing(false);
          toast.error("Failed to read file.");
          return;
        }
        docBufferRef.current = buffer;
        try {
          if (tool.slug === "pdf-to-image") {
            setPdfPasswordInput("");
            setPdfPasswordError(null);
            const res = await renderPdfToImage(buffer, 1, pdfDpiScale, pdfDocOutputFormat, pdfBgColor, "");
            if (res.isPasswordProtected && !res.isUnlocked) {
              setPdfIsPasswordProtected(true);
              setPdfIsUnlocked(false);
              setPdfPasswordError(null);
              setPdfTotalPages(1);
              setImageSrc(res.dataUrl);
              setDimensions({ width: res.width, height: res.height });
            } else {
              setPdfIsPasswordProtected(false);
              setPdfIsUnlocked(true);
              setPdfPasswordError(null);
              setPdfTotalPages(res.totalPages);
              setPdfDocPage(1);
              setPdfPageMode(res.totalPages > 1 ? "all" : "single");
              setImageSrc(res.dataUrl);
              setDimensions({ width: res.width, height: res.height });
            }
          } else if (tool.slug === "word-to-image") {
            const res = await renderWordPageToImage(
              buffer,
              selected.name,
              wordDocFont,
              wordDocFontSize,
              wordDocBg,
              wordDocOutputFormat,
              wordDocShowHeader,
              1
            );
            setWordTotalPages(res.totalPages);
            setWordDocPage(1);
            setWordPageMode(res.totalPages > 1 ? "all" : "single");
            setImageSrc(res.dataUrl);
            setDimensions({ width: res.width, height: res.height });
          } else if (tool.slug === "excel-to-image") {
            const meta = await getExcelSheetsMetadata(buffer);
            setExcelTotalSheets(meta.sheets.length);
            setExcelSheetNames(meta.sheets.map((s) => s.name));
            setExcelSheetTargets(meta.sheets.map((s) => s.target));
            setExcelDocSheet(1);
            setExcelSheetMode(meta.sheets.length > 1 ? "all" : "single");
            const res = await renderExcelSheetToImage(
              buffer,
              selected.name,
              excelTheme,
              excelGridLines,
              excelDocOutputFormat,
              excelShowHeader,
              meta.sheets[0]?.target || "xl/worksheets/sheet1.xml"
            );
            setImageSrc(res.dataUrl);
            setDimensions({ width: res.width, height: res.height });
          } else if (tool.slug === "powerpoint-to-image") {
            const meta = await getPptxMetadata(buffer);
            setPptTotalSlides(meta.totalSlides);
            setPptDocSlide(1);
            setPptSlideMode(meta.totalSlides > 1 ? "all" : "single");
            setPptAspectRatio(meta.aspectRatioLabel);
            const res = await renderPptSlideToImage(buffer, selected.name, pptTheme, pptDocOutputFormat, 1);
            setImageSrc(res.dataUrl);
            setDimensions({ width: res.width, height: res.height });
          }
          setProcessing(false);
        } catch (e) {
          console.error("Document render error:", e);
          setProcessing(false);
          const c = document.createElement("canvas");
          c.width = 1200;
          c.height = 800;
          const ctx = c.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, 1200, 800);
            ctx.fillStyle = "#2563eb";
            ctx.fillRect(0, 0, 1200, 70);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 22px system-ui, sans-serif";
            ctx.fillText(`📄 ${selected.name}`, 40, 44);
            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 26px system-ui, sans-serif";
            ctx.fillText("Document Loaded Successfully", 60, 160);
            ctx.font = "16px system-ui, sans-serif";
            ctx.fillStyle = "#64748b";
            ctx.fillText("Click 'Convert / Process Image' below to generate your high-resolution image.", 60, 200);
            const fallbackUrl = c.toDataURL("image/png");
            setImageSrc(fallbackUrl);
            setDimensions({ width: 1200, height: 800 });
          }
          toast.info(`Loaded ${selected.name} — Review settings and click Convert`);
        }
      };
      reader.onerror = () => {
        setProcessing(false);
        toast.error("Error reading file from disk.");
      };
      reader.readAsArrayBuffer(selected);
      return;
    }

    if (tool.slug === "html-to-image") {
      setFile(selected);
      setOrigSize(selected.size);
      setHasProcessed(false);
      setProcessedSrc(null);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          setHtmlCodeText(text);
          setHtmlInputMode("upload");
          toast.success(`Loaded HTML from ${selected.name}`);
          setProcessing(true);
          renderHtmlToImage(text, htmlRenderWidth, htmlRenderHeight, htmlBgColor, htmlOutputFormat)
            .then((dataUrl) => {
              setImageSrc(dataUrl);
              setDimensions({ width: htmlRenderWidth, height: htmlRenderHeight });
              setHasProcessed(false);
              setIsEditingSettings(true);
              setProcessing(false);
            })
            .catch(() => {
              setProcessing(false);
              toast.error("Failed to render HTML file.");
            });
        }
      };
      reader.readAsText(selected);
      return;
    }

    if (tool.slug === "binary-to-image") {
      setFile(selected);
      setOrigSize(selected.size);
      setProcessing(true);
      setHasProcessed(false);
      setProcessedSrc(null);

      const isText =
        selected.name.endsWith(".txt") ||
        selected.type.startsWith("text/") ||
        selected.type === "";

      if (selected.name.endsWith(".txt") || selected.type.startsWith("text/")) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const text = (evt.target?.result as string) || "";
          setInputConvertText(text);
          const activeTheme = BINARY_THEMES[binaryTheme];
          const url = decodeBinaryStringToImageUrl(text, {
            color0: activeTheme.bg,
            color1: activeTheme.fg,
            pixelScale: binaryPixelBlockSize,
          });
          if (url) {
            setProcessedSrc(url);
            setImageSrc(url);
            const img = new Image();
            img.onload = () => {
              setDimensions({ width: img.width, height: img.height });
              setTargetWidth(img.width);
              setTargetHeight(img.height);
            };
            img.src = url;
            setHasProcessed(false);
            setIsEditingSettings(true);
            setBinaryInputTab("upload");
            setProcessing(false);
            toast.success(`Loaded and decoded binary text from ${selected.name}!`);
          } else {
            setProcessing(false);
            toast.error("Could not decode binary string from text file. Check format.");
          }
        };
        reader.readAsText(selected);
        return;
      }

      // Read as ArrayBuffer for binary files (.bin, .dat, .raw, etc.)
      const reader = new FileReader();
      reader.onload = (evt) => {
        const buffer = evt.target?.result as ArrayBuffer;
        if (!buffer) {
          setProcessing(false);
          toast.error("Failed to read binary file.");
          return;
        }

        const uint8 = new Uint8Array(buffer);
        let isImage = false;
        let mime = "image/png";
        if (uint8[0] === 0xff && uint8[1] === 0xd8 && uint8[2] === 0xff) {
          isImage = true; mime = "image/jpeg";
        } else if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4e && uint8[3] === 0x47) {
          isImage = true; mime = "image/png";
        } else if (uint8[0] === 0x52 && uint8[1] === 0x49 && uint8[2] === 0x46 && uint8[3] === 0x46) {
          isImage = true; mime = "image/webp";
        } else if (uint8[0] === 0x47 && uint8[1] === 0x49 && uint8[2] === 0x46) {
          isImage = true; mime = "image/gif";
        } else if (uint8[0] === 0x42 && uint8[1] === 0x4d) {
          isImage = true; mime = "image/bmp";
        }

        const binaryBitsArray: string[] = [];
        const maxBitsBytes = Math.min(uint8.length, 2048);
        for (let i = 0; i < maxBitsBytes; i++) {
          const byteVal = uint8[i];
          if (byteVal !== undefined) {
            binaryBitsArray.push(byteVal.toString(2).padStart(8, "0"));
          }
        }
        let binaryStr = binaryBitsArray.join(" ");
        if (uint8.length > 2048) {
          binaryStr += `\n... [${(uint8.length - 2048).toLocaleString()} more bytes in binary file]`;
        }
        setInputConvertText(binaryStr);

        let url: string | null = null;
        if (isImage) {
          const blob = new Blob([uint8], { type: mime });
          url = URL.createObjectURL(blob);
        } else {
          const activeTheme = BINARY_THEMES[binaryTheme];
          url = decodeBinaryStringToImageUrl(binaryStr, {
            color0: activeTheme.bg,
            color1: activeTheme.fg,
            pixelScale: binaryPixelBlockSize,
          });
        }

        if (url) {
          setProcessedSrc(url);
          setImageSrc(url);
          const img = new Image();
          img.onload = () => {
            setDimensions({ width: img.width, height: img.height });
            setTargetWidth(img.width);
            setTargetHeight(img.height);
          };
          img.src = url;
          setHasProcessed(false);
          setIsEditingSettings(true);
          setBinaryInputTab("upload");
          setProcessing(false);
          toast.success(`Loaded and decoded binary file ${selected.name}!`);
        } else {
          setProcessing(false);
          toast.error("Could not decode binary file data.");
        }
      };
      reader.readAsArrayBuffer(selected);
      return;
    }

    // Text Decoder tools (Octal / Hex / Decimal / ASCII): read .txt files as text
    if (
      [
        "octal-to-image",
        "hex-to-image",
        "decimal-to-image",
        "ascii-to-image",
      ].includes(tool.slug)
    ) {
      setFile(selected);
      setOrigSize(selected.size);
      setProcessing(true);
      setHasProcessed(false);
      setProcessedSrc(null);

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = (evt.target?.result as string) || "";
        setInputConvertText(text);
        setTextDecoderLandingMode("plain_text");
        setProcessing(false);
        toast.success(`Loaded text from ${selected.name} — review and click Convert.`);
      };
      reader.onerror = () => {
        setProcessing(false);
        toast.error("Failed to read text file.");
      };
      reader.readAsText(selected);
      return;
    }

    const isImageFile =
      selected.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|avif|gif|bmp|tiff?|heic|heif|svg|ico|jfif)$/i.test(selected.name);
    if (!isImageFile) {
      toast.error("Please select a valid image file.");
      return;
    }

    setFile(selected);
    setOrigSize(selected.size);
    setHasProcessed(false);
    setIsEditingSettings(false);
    setProcessedSrc(null);
    setOcrText("");
    setRawOcrDocumentLines([]);
    setDetectedBarcodes([]);
    setOcrProgressStatus("");
    setOcrProgressPercent(0);
    setBinaryOutputText("");
    setFullBinaryOutputText("");
    setIsBinaryTruncatedPreview(false);

    // Initialize target size input to a smart value strictly lower than the uploaded image
    if (selected.size > 0) {
      const origKB = Math.round(selected.size / 1024);
      const defaultKB = Math.max(5, Math.round(origKB * 0.6));
      if (defaultKB >= 1024) {
        setTargetSizeInput(String(Number((defaultKB / 1024).toFixed(1))));
        setTargetSizeUnit("MB");
      } else {
        setTargetSizeInput(String(defaultKB));
        setTargetSizeUnit("KB");
      }
    }

    const reader = new FileReader();
    reader.onerror = () => {
      toast.error("Failed to read image file. Please try a different image.");
    };
    reader.onload = (evt) => {
      const b64 = evt.target?.result as string;
      if (!b64) {
        toast.error("Empty image file data received.");
        return;
      }
      setImageSrc(b64);

      const img = new Image();
      img.onerror = () => {
        toast.error("Could not parse image dimensions.");
      };
      img.onload = () => {
        setDimensions({ width: img.width, height: img.height });
        setOutputDimensions({ width: 0, height: 0 });
        setTargetWidth(img.width);
        setTargetHeight(img.height);
        setCropBox({ x: 10, y: 10, w: 80, h: 80 });

        // Initialize rotateBatch if on rotate-image tool
        if (tool.slug === "rotate-image") {
          setRotateBatch([
            {
              id: `${Date.now()}-0`,
              file: selected,
              name: selected.name,
              size: selected.size,
              dataUrl: b64,
              width: img.naturalWidth || img.width,
              height: img.naturalHeight || img.height,
              rotation: 0,
              flipH: false,
              flipV: false,
            },
          ]);
        }

        // Initialize 1:1 square target dimensions for Square Your Image tool
        if (tool.slug === "square-your-image") {
          const maxDim = Math.max(img.width, img.height);
          setDimensions({ width: maxDim, height: maxDim });
          setTargetWidth(maxDim);
          setTargetHeight(maxDim);
          setHasProcessed(false);
          setIsEditingSettings(true);
        }
      };
      img.src = b64;
    };
    try {
      reader.readAsDataURL(selected);
    } catch {
      toast.error("Failed to process selected file.");
    }
  };

  const processMultipleRotateFiles = async (files: File[]) => {
    const validImageFiles = files.filter(
      (f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|avif|gif|bmp|tiff?|heic|heif|svg|ico|jfif)$/i.test(f.name)
    );
    if (validImageFiles.length === 0) {
      toast.error("Please select valid image files.");
      return;
    }

    setProcessing(true);
    try {
      const items = await Promise.all(
        validImageFiles.map(
          (file, idx) =>
            new Promise<RotateBatchItem>((resolve) => {
              const reader = new FileReader();
              reader.onload = (evt) => {
                const dataUrl = (evt.target?.result as string) || "";
                const img = new Image();
                img.onload = () => {
                  resolve({
                    id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
                    file,
                    name: file.name,
                    size: file.size,
                    dataUrl,
                    width: img.naturalWidth || img.width,
                    height: img.naturalHeight || img.height,
                    rotation: 0,
                    flipH: false,
                    flipV: false,
                  });
                };
                img.onerror = () => {
                  resolve({
                    id: `${Date.now()}-${idx}`,
                    file,
                    name: file.name,
                    size: file.size,
                    dataUrl,
                    width: 800,
                    height: 600,
                    rotation: 0,
                    flipH: false,
                    flipV: false,
                  });
                };
                img.src = dataUrl;
              };
              reader.onerror = () => {
                resolve({
                  id: `${Date.now()}-${idx}`,
                  file,
                  name: file.name,
                  size: file.size,
                  dataUrl: "",
                  width: 800,
                  height: 600,
                  rotation: 0,
                  flipH: false,
                  flipV: false,
                });
              };
              reader.readAsDataURL(file);
            })
        )
      );

      setRotateBatch((prev) => [...prev, ...items]);
      if (items.length > 0 && items[0]) {
        setFile(items[0].file);
        setImageSrc(items[0].dataUrl);
        setOrigSize(items[0].size);
        setDimensions({ width: items[0].width, height: items[0].height });
        setTargetWidth(items[0].width);
        setTargetHeight(items[0].height);
      }
      setHasProcessed(false);
      setIsEditingSettings(false);
      setProcessedSrc(null);
      setProcessing(false);
      toast.success(`Loaded ${items.length} images for batch rotation!`);
    } catch (err) {
      console.error("Failed to load multiple rotate images:", err);
      setProcessing(false);
      toast.error("Failed to load images.");
    }
  };

  const sampleColorAtEvent = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return null;
    const img = imgRef.current;
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;

    const pxX = Math.max(0, Math.min(img.naturalWidth - 1, Math.floor(x * scaleX)));
    const pxY = Math.max(0, Math.min(img.naturalHeight - 1, Math.floor(y * scaleY)));

    // Cache offscreen canvas for high-performance 60fps sampling
    if (
      !colorSampleCanvasRef.current ||
      colorSampleCanvasRef.current.width !== img.naturalWidth ||
      colorSampleCanvasRef.current.height !== img.naturalHeight
    ) {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const cCtx = c.getContext("2d", { willReadFrequently: true });
      if (cCtx) {
        cCtx.drawImage(img, 0, 0);
        colorSampleCanvasRef.current = c;
      }
    }

    const sampleCanvas = colorSampleCanvasRef.current;
    if (!sampleCanvas) return null;
    const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    try {
      const p = ctx.getImageData(pxX, pxY, 1, 1).data;
      const r = p[0] ?? 0, g = p[1] ?? 0, b = p[2] ?? 0;
      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
      const rgb = `rgb(${r}, ${g}, ${b})`;
      const hsl = rgbToHsl(r, g, b);
      return { hex, rgb, hsl, pxX, pxY, x, y, r, g, b };
    } catch (err) {
      return null;
    }
  };

  const updateLoupeCanvas = (pxX: number, pxY: number) => {
    const canvas = loupeCanvasRef.current;
    const sampleCanvas = colorSampleCanvasRef.current;
    if (!canvas || !sampleCanvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Fill background with dark tone for out-of-bounds pixels
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 9x9 pixel window around cursor
    const sampleSize = 9;
    const half = Math.floor(sampleSize / 2);
    const srcX = pxX - half;
    const srcY = pxY - half;
    const cellSize = canvas.width / sampleSize;

    // Safely clamp source bounds to avoid browser out-of-bounds IndexSizeError
    const sX = Math.max(0, srcX);
    const sY = Math.max(0, srcY);
    const sRight = Math.min(sampleCanvas.width, srcX + sampleSize);
    const sBottom = Math.min(sampleCanvas.height, srcY + sampleSize);
    const sW = sRight - sX;
    const sH = sBottom - sY;

    if (sW > 0 && sH > 0) {
      const dX = (sX - srcX) * cellSize;
      const dY = (sY - srcY) * cellSize;
      const dW = sW * cellSize;
      const dH = sH * cellSize;
      ctx.drawImage(sampleCanvas, sX, sY, sW, sH, dX, dY, dW, dH);
    }

    // Draw pixel grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    for (let i = 1; i < sampleSize; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.round(i * cellSize) + 0.5, 0);
      ctx.lineTo(Math.round(i * cellSize) + 0.5, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, Math.round(i * cellSize) + 0.5);
      ctx.lineTo(canvas.width, Math.round(i * cellSize) + 0.5);
      ctx.stroke();
    }

    // Center pixel target reticle
    const centerX = half * cellSize;
    const centerY = half * cellSize;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX + 1, centerY + 1, cellSize - 2, cellSize - 2);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX, centerY, cellSize, cellSize);
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (tool.slug !== "color-picker-from-image") return;
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (colorPickerRafRef.current) {
      cancelAnimationFrame(colorPickerRafRef.current);
    }

    colorPickerRafRef.current = requestAnimationFrame(() => {
      const img = imgRef.current;
      if (!img) return;
      const rect = img.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        if (loupeRef.current) loupeRef.current.style.display = "none";
        if (hoverSwatchRef.current) hoverSwatchRef.current.style.display = "none";
        return;
      }

      const scaleX = img.naturalWidth / rect.width;
      const scaleY = img.naturalHeight / rect.height;

      const pxX = Math.max(0, Math.min(img.naturalWidth - 1, Math.floor(x * scaleX)));
      const pxY = Math.max(0, Math.min(img.naturalHeight - 1, Math.floor(y * scaleY)));

      if (
        !colorSampleCanvasRef.current ||
        colorSampleCanvasRef.current.width !== img.naturalWidth ||
        colorSampleCanvasRef.current.height !== img.naturalHeight
      ) {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const cCtx = c.getContext("2d", { willReadFrequently: true });
        if (cCtx) {
          cCtx.drawImage(img, 0, 0);
          colorSampleCanvasRef.current = c;
        }
      }

      const sampleCanvas = colorSampleCanvasRef.current;
      if (!sampleCanvas) return;
      const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      try {
        const p = ctx.getImageData(pxX, pxY, 1, 1).data;
        const r = p[0] ?? 0, g = p[1] ?? 0, b = p[2] ?? 0;
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        const rgb = `rgb(${r}, ${g}, ${b})`;
        const hsl = rgbToHsl(r, g, b);

        lastSampledColorRef.current = { hex, rgb, hsl };

        // 120 FPS Direct DOM Updates (Zero React re-render lag)
        if (loupeRef.current) {
          loupeRef.current.style.display = "flex";
          loupeRef.current.style.left = `${x}px`;
          const isTop = y <= 170;
          loupeRef.current.style.top = isTop ? `${y + 24}px` : `${y - 18}px`;
          loupeRef.current.style.transform = isTop ? "translate(-50%, 0)" : "translate(-50%, -100%)";
        }

        if (loupeTickRef.current) {
          const isTop = y <= 170;
          loupeTickRef.current.className = `absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-[7px] border-x-transparent ${isTop ? "-top-2 border-b-[9px] border-b-white" : "-bottom-2 border-t-[9px] border-t-neutral-500"
            }`;
        }

        if (loupeDotRef.current) {
          loupeDotRef.current.style.backgroundColor = hex;
        }
        if (loupeHexRef.current) {
          loupeHexRef.current.textContent = hex;
        }

        if (hoverSwatchRef.current) {
          hoverSwatchRef.current.style.display = "flex";
        }
        if (hoverSwatchDotRef.current) {
          hoverSwatchDotRef.current.style.backgroundColor = hex;
        }
        if (hoverSwatchHexRef.current) {
          hoverSwatchHexRef.current.textContent = hex;
        }

        updateLoupeCanvas(pxX, pxY);
      } catch (err) {
        // ignore
      }
    });
  };

  const handleImageMouseEnter = () => {
    if (tool.slug !== "color-picker-from-image") return;
    if (loupeRef.current) loupeRef.current.style.display = "flex";
    if (hoverSwatchRef.current) hoverSwatchRef.current.style.display = "flex";
  };

  const handleImageMouseLeave = () => {
    if (tool.slug !== "color-picker-from-image") return;
    if (colorPickerRafRef.current) {
      cancelAnimationFrame(colorPickerRafRef.current);
      colorPickerRafRef.current = null;
    }
    if (loupeRef.current) loupeRef.current.style.display = "none";
    if (hoverSwatchRef.current) hoverSwatchRef.current.style.display = "none";
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (tool.slug !== "color-picker-from-image") return;
    let res = lastSampledColorRef.current;
    if (!res) {
      const sampled = sampleColorAtEvent(e);
      if (sampled) {
        res = { hex: sampled.hex, rgb: sampled.rgb, hsl: sampled.hsl };
      }
    }
    if (res) {
      setPickedHex(res.hex);
      setPickedRgb(res.rgb);
      setPickedHsl(res.hsl);
      setColorHistory((prev) => Array.from(new Set([res.hex, ...prev])).slice(0, 24));
      // Auto-copy to clipboard for instant convenience!
      navigator.clipboard.writeText(res.hex);
      setCopiedFormat("HEX");
      toast.success(`Copied ${res.hex} to clipboard!`);
      setTimeout(() => setCopiedFormat(null), 2000);
    }
  };

  const extractMostCommonColors = useCallback((sourceImgSrc: string) => {
    if (!sourceImgSrc) return;
    setIsExtractingColors(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        // Pre-cache full resolution canvas for instantaneous sampling
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          const fullCanvas = document.createElement("canvas");
          fullCanvas.width = img.naturalWidth;
          fullCanvas.height = img.naturalHeight;
          const fullCtx = fullCanvas.getContext("2d", { willReadFrequently: true });
          if (fullCtx) {
            fullCtx.drawImage(img, 0, 0);
            colorSampleCanvasRef.current = fullCanvas;
          }
        }

        // Fast downsampled canvas (120x120 is 14,400 pixels, takes <4ms)
        const size = 120;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setIsExtractingColors(false);
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // Group into quantized color buckets (step of 24 to cluster minor variations)
        const step = 24;
        const colorBuckets = new Map<string, { sumR: number; sumG: number; sumB: number; count: number }>();
        let totalValidPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3] ?? 0;
          if (a < 64) continue; // Ignore transparent or near-transparent pixels

          const r = data[i] ?? 0;
          const g = data[i + 1] ?? 0;
          const b = data[i + 2] ?? 0;

          const qr = Math.min(255, Math.floor(r / step) * step);
          const qg = Math.min(255, Math.floor(g / step) * step);
          const qb = Math.min(255, Math.floor(b / step) * step);
          const key = `${qr},${qg},${qb}`;

          const existing = colorBuckets.get(key);
          if (existing) {
            existing.count += 1;
            existing.sumR += r;
            existing.sumG += g;
            existing.sumB += b;
          } else {
            colorBuckets.set(key, { sumR: r, sumG: g, sumB: b, count: 1 });
          }
          totalValidPixels++;
        }

        if (totalValidPixels === 0) {
          setIsExtractingColors(false);
          return;
        }

        // Sort by frequency descending
        const sorted = Array.from(colorBuckets.values())
          .map((b) => ({
            r: Math.round(b.sumR / b.count),
            g: Math.round(b.sumG / b.count),
            b: Math.round(b.sumB / b.count),
            count: b.count,
          }))
          .sort((a, b) => b.count - a.count);

        // Pick top distinct common colors (Delta E / Euclidean distance >= 38)
        const distinct: MostCommonColorItem[] = [];
        for (const item of sorted) {
          const isTooClose = distinct.some((existing) => {
            const dr = item.r - existing.r;
            const dg = item.g - existing.g;
            const db = item.b - existing.b;
            const dist = Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
            return dist < 38;
          });

          if (!isTooClose) {
            const hex = `#${((1 << 24) + (item.r << 16) + (item.g << 8) + item.b).toString(16).slice(1).toUpperCase()}`;
            const rgb = `rgb(${item.r}, ${item.g}, ${item.b})`;
            const hsl = rgbToHsl(item.r, item.g, item.b);
            const percentage = Math.max(1, Math.round((item.count / totalValidPixels) * 100));

            distinct.push({
              hex,
              rgb,
              hsl,
              percentage,
              r: item.r,
              g: item.g,
              b: item.b,
            });
          }

          // Top 6 most common colors ("not all need most comun")
          if (distinct.length >= 6) break;
        }

        setCommonColors(distinct);
        setIsExtractingColors(false);

        // AUTO-SELECT the #1 most common color from the image!
        const dominant = distinct[0];
        if (dominant) {
          setPickedHex(dominant.hex);
          setPickedRgb(dominant.rgb);
          setPickedHsl(dominant.hsl);
        }
      } catch (err) {
        console.warn("Failed to extract common colors:", err);
        setIsExtractingColors(false);
      }
    };
    img.src = sourceImgSrc;
  }, []);

  // Auto-extract most common colors whenever image or tool changes
  useEffect(() => {
    if (tool.slug === "color-picker-from-image" && imageSrc) {
      extractMostCommonColors(imageSrc);
    }
  }, [tool.slug, imageSrc, extractMostCommonColors]);

  // Generate & download official vector PDF Color Report
  const handleDownloadColorPdfReport = async () => {
    try {
      setIsGeneratingPdfReport(true);
      toast.info("Generating official PDF Color Report...");
      const { blob, filename } = await generateColorReportPdf({
        fileName: file?.name || "image-sample",
        dimensions,
        imageSrc,
        activeHex: pickedHex,
        activeRgb: pickedRgb,
        activeHsl: pickedHsl,
        dominantColors: commonColors,
        sampledHistory: colorHistory,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF Color Report downloaded successfully!");
    } catch (err: any) {
      console.error("Failed to generate PDF color report:", err);
      toast.error(err?.message || "Failed to generate PDF color report");
    } finally {
      setIsGeneratingPdfReport(false);
    }
  };

  const handleWatermarkOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (wmPosition === "tile") return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.max(2, Math.min(98, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(2, Math.min(98, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    setWmPosition("custom");
    setWmCustomCoord({ xPercent: x, yPercent: y });
  };

  const handleWatermarkMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingWm(true);
  };

  const handleWatermarkOverlayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingWm || wmPosition === "tile") return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.max(2, Math.min(98, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(2, Math.min(98, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    setWmPosition("custom");
    setWmCustomCoord({ xPercent: x, yPercent: y });
  };

  const handleWatermarkOverlayMouseUp = () => {
    if (isDraggingWm) {
      setIsDraggingWm(false);
    }
  };

  // Watermark dragging window-level listener to prevent stuck drag states
  useEffect(() => {
    if (!isDraggingWm) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (wmPosition === "tile" || !imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = Math.max(2, Math.min(98, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
      const y = Math.max(2, Math.min(98, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
      setWmPosition("custom");
      setWmCustomCoord({ xPercent: x, yPercent: y });
    };

    const handleWindowMouseUp = () => {
      setIsDraggingWm(false);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [isDraggingWm, wmPosition]);

  // Face Blur & Anonymization Handlers
  const handleFaceStart = (clientX: number, clientY: number, faceId: string, handle: string) => {
    const targetFace = faceRegions.find((f) => f.id === faceId);
    if (!targetFace) return;
    setActiveFaceId(faceId);
    setIsDraggingFace(true);
    setFaceDragHandle(handle);
    setFaceDragStart({
      mouseX: clientX,
      mouseY: clientY,
      box: { ...targetFace },
    });
  };

  const handleFaceMouseDown = (e: React.MouseEvent, faceId: string, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleFaceStart(e.clientX, e.clientY, faceId, handle);
  };

  const handleFaceTouchStart = (e: React.TouchEvent, faceId: string, handle: string) => {
    if (e.touches && e.touches[0]) {
      e.stopPropagation();
      handleFaceStart(e.touches[0].clientX, e.touches[0].clientY, faceId, handle);
    }
  };

  const handleAddFaceBox = () => {
    const newId = `face_manual_${Date.now()}`;
    const count = faceRegions.length;
    const offset = (count % 4) * 5;
    const newBox: FaceBox = {
      id: newId,
      x: Math.min(65, Math.max(5, 38 + offset)),
      y: Math.min(65, Math.max(5, 20 + offset)),
      w: 24,
      h: 28,
    };
    setFaceRegions((prev) => [...prev, newBox]);
    setActiveFaceId(newId);
    setShowFaceOutlines(true);
    toast.success("Added new blur region! Drag or resize handles to position.");
  };

  const handleDeleteFace = (idToDelete: string) => {
    setFaceRegions((prev) => {
      const remaining = prev.filter((f) => f.id !== idToDelete);
      if (activeFaceId === idToDelete) {
        setActiveFaceId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
    toast.info("Blur region removed.");
  };

  const updateActiveFace = (updates: Partial<FaceBox>) => {
    if (!activeFaceId && faceRegions.length > 0 && faceRegions[0]) {
      const firstId = faceRegions[0].id;
      setActiveFaceId(firstId);
      setFaceRegions((prev) =>
        prev.map((f) => (f.id === firstId ? { ...f, ...updates } : f))
      );
      return;
    }
    setFaceRegions((prev) =>
      prev.map((f) => (f.id === activeFaceId ? { ...f, ...updates } : f))
    );
  };

  const handleAutoDetectFaces = async () => {
    if (!imgRef.current && !imageSrc) return;
    setIsDetectingFaces(true);
    try {
      let targetImg = imgRef.current;
      if (!targetImg && imageSrc) {
        targetImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = imageSrc;
        });
      }
      if (!targetImg) return;
      const faces = await detectFacesInImage(targetImg);
      if (faces.length > 0 && faces[0]) {
        setFaceRegions(faces);
        setActiveFaceId(faces[0].id);
        setShowFaceOutlines(true);
        toast.success(`✨ Auto-detected ${faces.length} face${faces.length > 1 ? "s" : ""}! Adjust handles or drag to customize.`);
      } else {
        setFaceRegions([]);
        setActiveFaceId(null);
        toast.info("No faces detected in this image. You can click '+ Add Blur Box' to add manually.");
      }
    } catch (err) {
      toast.error("Auto face detection failed. Please try again or add a blur region manually.");
    } finally {
      setIsDetectingFaces(false);
    }
  };

  // Face Drag and Resize Mouse & Touch Listener Effect
  useEffect(() => {
    if (!isDraggingFace || !activeFaceId || !faceDragStart) return;

    const handlePointerMove = (clientX: number, clientY: number) => {
      if (!imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const deltaXPercent = ((clientX - faceDragStart.mouseX) / rect.width) * 100;
      const deltaYPercent = ((clientY - faceDragStart.mouseY) / rect.height) * 100;
      const { box } = faceDragStart;

      let newX = box.x;
      let newY = box.y;
      let newW = box.w;
      let newH = box.h;

      if (faceDragHandle === "move") {
        newX = Math.max(0, Math.min(100 - box.w, box.x + deltaXPercent));
        newY = Math.max(0, Math.min(100 - box.h, box.y + deltaYPercent));
      } else {
        if (faceDragHandle?.includes("e")) {
          newW = Math.max(4, Math.min(100 - box.x, box.w + deltaXPercent));
        }
        if (faceDragHandle?.includes("s")) {
          newH = Math.max(4, Math.min(100 - box.y, box.h + deltaYPercent));
        }
        if (faceDragHandle?.includes("w")) {
          const maxDeltaW = box.w - 4;
          const clampedDeltaX = Math.max(-box.x, Math.min(maxDeltaW, deltaXPercent));
          newX = box.x + clampedDeltaX;
          newW = box.w - clampedDeltaX;
        }
        if (faceDragHandle?.includes("n")) {
          const maxDeltaH = box.h - 4;
          const clampedDeltaY = Math.max(-box.y, Math.min(maxDeltaH, deltaYPercent));
          newY = box.y + clampedDeltaY;
          newH = box.h - clampedDeltaY;
        }
      }

      setFaceRegions((prev) =>
        prev.map((f) =>
          f.id === activeFaceId
            ? {
              ...f,
              x: Number(newX.toFixed(1)),
              y: Number(newY.toFixed(1)),
              w: Number(newW.toFixed(1)),
              h: Number(newH.toFixed(1)),
            }
            : f
        )
      );
    };

    const handleMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      setIsDraggingFace(false);
      setFaceDragHandle(null);
      setFaceDragStart(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDraggingFace, activeFaceId, faceDragStart, faceDragHandle]);

  // Auto-detect faces when switching to blur-face or when image loads
  useEffect(() => {
    if (tool.slug === "blur-face" && imageSrc && faceRegions.length === 0 && !isDetectingFaces && !hasProcessed) {
      const img = new Image();
      img.onload = () => {
        setIsDetectingFaces(true);
        detectFacesInImage(img)
          .then((faces) => {
            setFaceRegions(faces);
            if (faces.length > 0 && faces[0]) {
              setActiveFaceId(faces[0].id);
              setShowFaceOutlines(true);
              toast.success(`✨ Auto-detected ${faces.length} face${faces.length > 1 ? "s" : ""}! Adjust handles or drag to customize.`);
            } else {
              setActiveFaceId(null);
            }
          })
          .catch(() => { })
          .finally(() => setIsDetectingFaces(false));
      };
      img.src = imageSrc;
    }
  }, [tool.slug, imageSrc]);

  // Meme Text Drag Handlers
  const handleMemeTextMouseDown = (e: React.MouseEvent, target: "top" | "bottom") => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMemeText(target);
    setMemeDragStartY(e.clientY);
  };

  useEffect(() => {
    if (!isDraggingMemeText) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      if (!rect.height) return;

      const deltaYPercent = ((e.clientY - memeDragStartY) / rect.height) * 100;

      if (isDraggingMemeText === "top") {
        setMemeTopPosPercent((prev) => Math.max(1, Math.min(45, Number((prev + deltaYPercent).toFixed(1)))));
      } else {
        setMemeBottomPosPercent((prev) => Math.max(1, Math.min(45, Number((prev - deltaYPercent).toFixed(1)))));
      }
      setMemeDragStartY(e.clientY);
    };

    const handleMouseUp = () => {
      setIsDraggingMemeText(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingMemeText, memeDragStartY]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please upload a valid image file for logo watermark (PNG, SVG, JPG, WebP).");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => {
      toast.error("Failed to read logo watermark image file.");
    };
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setWmLogoSrc(dataUrl);
        setWmMode("logo");
        toast.success(`Loaded logo watermark: ${f.name}`);
      }
    };
    try {
      reader.readAsDataURL(f);
    } catch {
      toast.error("Failed to load logo image.");
    }
    e.target.value = "";
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(label);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Image to Binary / Base64 / Hex / C-Array / Pixel Matrix / Octal / Decimal Generator Handler
  const generateBinaryData = useCallback(
    (sourceB64: string | null) => {
      if (!sourceB64) {
        setBinaryOutputText("");
        setFullBinaryOutputText("");
        setIsBinaryTruncatedPreview(false);
        return;
      }
      try {
        const res = encodeBinaryStreamPayload(sourceB64, {
          toolSlug: tool.slug,
          binaryOutputMode,
          binaryDelimiter,
          binaryBitDepth,
          customBitDepth,
          binaryWithPrefix,
          pixelThreshold,
          canvas: canvasRef.current,
        });
        setRawBinaryBytes(res.bytes);
        setFullBinaryOutputText(res.fullText);
        setBinaryOutputText(res.previewText);
        setIsBinaryTruncatedPreview(res.isTruncated);
      } catch {
        setBinaryOutputText(sourceB64 || "");
        setFullBinaryOutputText(sourceB64 || "");
        setIsBinaryTruncatedPreview(false);
      }
    },
    [
      tool.slug,
      binaryOutputMode,
      binaryDelimiter,
      binaryBitDepth,
      customBitDepth,
      binaryWithPrefix,
      pixelThreshold,
    ]
  );

  useEffect(() => {
    if (
      [
        "image-to-binary",
        "image-to-base64",
        "image-to-octal",
        "image-to-hex",
        "image-to-decimal",
        "image-to-ascii",
      ].includes(tool.slug) &&
      imageSrc &&
      hasProcessed
    ) {
      generateBinaryData(imageSrc);
    }
  }, [
    tool.slug,
    imageSrc,
    hasProcessed,
    binaryOutputMode,
    binaryDelimiter,
    binaryBitDepth,
    customBitDepth,
    binaryWithPrefix,
    pixelThreshold,
    generateBinaryData,
  ]);

  const openSystemEyeDropper = async () => {
    if ("EyeDropper" in window) {
      try {
        // @ts-ignore
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase();
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          const rgb = `rgb(${r}, ${g}, ${b})`;
          const hsl = rgbToHsl(r, g, b);
          setPickedHex(hex);
          setPickedRgb(rgb);
          setPickedHsl(hsl);
          setColorHistory((prev) => Array.from(new Set([hex, ...prev])).slice(0, 16));
          toast.success(`Picked color ${hex}`);
        }
      } catch (err) {
        // user cancelled
      }
    } else {
      toast.info("Click anywhere directly on your uploaded image to pick colors!");
    }
  };

  // Crop Drag Handling
  const handleCropMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCrop(true);
    setCropDragHandle(handle);
    setCropDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      box: { ...cropBox },
    });
  };

  useEffect(() => {
    if (!isDraggingCrop) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const deltaXPercent = ((e.clientX - cropDragStart.mouseX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - cropDragStart.mouseY) / rect.height) * 100;
      const { box } = cropDragStart;

      let newX = box.x;
      let newY = box.y;
      let newW = box.w;
      let newH = box.h;

      if (cropDragHandle === "move") {
        newX = Math.max(0, Math.min(100 - box.w, box.x + deltaXPercent));
        newY = Math.max(0, Math.min(100 - box.h, box.y + deltaYPercent));
      } else {
        if (cropDragHandle?.includes("e")) {
          newW = Math.max(10, Math.min(100 - box.x, box.w + deltaXPercent));
        }
        if (cropDragHandle?.includes("s")) {
          newH = Math.max(10, Math.min(100 - box.y, box.h + deltaYPercent));
        }
        if (cropDragHandle?.includes("w")) {
          const maxDeltaW = box.w - 10;
          const clampedDeltaX = Math.max(-box.x, Math.min(maxDeltaW, deltaXPercent));
          newX = box.x + clampedDeltaX;
          newW = box.w - clampedDeltaX;
        }
        if (cropDragHandle?.includes("n")) {
          const maxDeltaH = box.h - 10;
          const clampedDeltaY = Math.max(-box.y, Math.min(maxDeltaH, deltaYPercent));
          newY = box.y + clampedDeltaY;
          newH = box.h - clampedDeltaY;
        }
      }

      setCropBox({
        x: Math.round(newX),
        y: Math.round(newY),
        w: Math.round(newW),
        h: Math.round(newH),
      });
    };

    const handleMouseUp = () => {
      setIsDraggingCrop(false);
      setCropDragHandle(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingCrop, cropDragHandle, cropDragStart]);

  const recordToolExecution = () => {
    try {
      Telemetry.trackToolUsage(tool.slug, tool.name);
      const cost = AdminStore.getToolCreditCost(tool.slug);
      if (cost > 0) {
        AuthUser.deductCredit(cost, tool.slug);
      }
      AdminStore.recordToolDailyUsage(tool.slug);
    } catch (e) {
      console.warn("recordToolExecution error:", e);
    }
  };

  const processImage = async () => {
    const cost = AdminStore.getToolCreditCost(tool.slug);
    const isFree = cost === 0;

    // Free tools: daily limit of 20 files per day per IP / user
    if (isFree) {
      const limitCheck = AdminStore.checkDailyToolLimit(tool.slug);
      if (limitCheck.reached) {
        toast.error(`Free daily limit reached (${limitCheck.usedToday}/${limitCheck.limit || 20} files today). Add Gold Tokens to continue or wait for midnight reset.`);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("bg:show_add_credits_dialog", {
              detail: {
                toolName: tool.name,
                toolSlug: tool.slug,
                creditCost: 1,
                currentCredits: AuthUser.getTotalTokens(),
              },
            })
          );
        }
        return;
      }
    } else {
      // Non-free tools: check credits or guest allowance
      if (!AuthUser.isLoggedIn()) {
        if (AuthUser.getGuestRemainingUses() <= 0) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("bg:show_guest_login_dialog", {
                detail: {
                  toolName: tool.name,
                  toolSlug: tool.slug,
                },
              })
            );
          }
          return;
        }
      } else {
        if (!AuthUser.hasCredits(cost)) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("bg:show_add_credits_dialog", {
                detail: {
                  toolName: tool.name,
                  toolSlug: tool.slug,
                  creditCost: cost,
                  currentCredits: AuthUser.getCredits(),
                },
              })
            );
          }
          return;
        }
      }
    }

    // 0. Handle Base64 to Image tool
    if (tool.slug === "base64-to-image") {
      const srcToUse = imageSrc || processedSrc;
      if (!srcToUse) {
        toast.error("Please upload a .txt file or paste Base64 code first!");
        return;
      }
      setProcessing(true);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext("2d");
        if (!ctx) {
          setProcessing(false);
          return;
        }
        if (base64ExportFormat === "JPG") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, c.width, c.height);
        }
        ctx.drawImage(img, 0, 0);
        const mime = base64ExportFormat === "PNG" ? "image/png" : base64ExportFormat === "JPG" ? "image/jpeg" : "image/webp";
        const convertedUrl = c.toDataURL(mime, base64ExportQuality);
        setProcessedSrc(convertedUrl);
        setHasProcessed(true);
        setIsEditingSettings(false);
        setProcessing(false);
        recordToolExecution();
        toast.success(`Image converted to ${base64ExportFormat}! Ready to download.`);
      };
      img.onerror = () => {
        setProcessing(false);
        toast.error("Failed to process decoded image.");
      };
      img.src = srcToUse;
      return;
    }

    // 0. Handle HTML to Image tool
    if (tool.slug === "html-to-image") {
      const code = htmlCodeText.trim() || SAMPLE_OG_CARD;
      setProcessing(true);
      renderHtmlToImage(code, htmlRenderWidth, htmlRenderHeight, htmlBgColor, htmlOutputFormat)
        .then((dataUrl) => {
          setProcessedSrc(dataUrl);
          setImageSrc(dataUrl);
          setDimensions({ width: htmlRenderWidth, height: htmlRenderHeight });
          setTargetWidth(htmlRenderWidth);
          setTargetHeight(htmlRenderHeight);

          // Calculate approximate byte size from dataUrl base64
          try {
            const head = dataUrl.split(",")[0] || "";
            const base64Len = dataUrl.length - (head.length + 1);
            const approxBytes = Math.max(1024, Math.round((base64Len * 3) / 4));
            setNewSize(approxBytes);
          } catch {
            // ignore
          }

          setHasProcessed(true);
          setIsEditingSettings(false);
          setProcessing(false);
          recordToolExecution();
          toast.success("Rendered HTML to image successfully!");
        })
        .catch((err) => {
          setProcessing(false);
          toast.error("Failed to render HTML to image. Check HTML syntax.");
          console.error(err);
        });
      return;
    }

    // 0b. Handle Document → Image tools (file-based)
    if (["pdf-to-image", "word-to-image", "excel-to-image", "powerpoint-to-image"].includes(tool.slug)) {
      if (!file) { toast.error("Please upload a document file first!"); return; }
      setProcessing(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const buffer = evt.target?.result as ArrayBuffer;
        if (!buffer) { setProcessing(false); toast.error("Failed to read file."); return; }
        try {
          let outUrl = "";
          let outW = 0;
          let outH = 0;

          if (tool.slug === "pdf-to-image") {
            if (pdfIsPasswordProtected && !pdfIsUnlocked) {
              setProcessing(false);
              toast.error("Please unlock the password-protected PDF first.");
              return;
            }
            const baseName = file.name ? file.name.replace(/\.[^.]+$/, "") : "document";
            if (pdfPageMode === "all" && pdfTotalPages > 1) {
              const res = await renderAllPdfPagesToZip(
                buffer,
                pdfTotalPages,
                pdfDpiScale,
                pdfDocOutputFormat,
                pdfBgColor,
                baseName,
                pdfPasswordInput,
                (curr, total) => setPdfConvertingProgress({ current: curr, total })
              );
              setDocumentBlob(res.zipBlob);
              setDocumentExt("zip");
              setNewSize(res.zipBlob.size);
              outUrl = res.firstPageDataUrl;
              outW = res.width;
              outH = res.height;
              setPdfConvertingProgress(null);
            } else {
              const res = await renderPdfToImage(buffer, pdfDocPage, pdfDpiScale, pdfDocOutputFormat, pdfBgColor, pdfPasswordInput);
              setDocumentBlob(null);
              setDocumentExt(pdfDocOutputFormat.toLowerCase());
              outUrl = res.dataUrl;
              outW = res.width;
              outH = res.height;
            }
          } else if (tool.slug === "word-to-image") {
            if (wordPageMode === "all" && wordTotalPages > 1) {
              const res = await renderAllWordPagesToZip(
                buffer,
                file.name,
                wordTotalPages,
                wordDocFont,
                wordDocFontSize,
                wordDocBg,
                wordDocOutputFormat,
                wordDocShowHeader,
                (curr, total) => setWordConvertingProgress({ current: curr, total })
              );
              setDocumentBlob(res.zipBlob);
              setDocumentExt("zip");
              setNewSize(res.zipBlob.size);
              outUrl = res.firstPageDataUrl;
              outW = res.width;
              outH = res.height;
              setWordConvertingProgress(null);
            } else {
              const res = await renderWordPageToImage(
                buffer,
                file.name,
                wordDocFont,
                wordDocFontSize,
                wordDocBg,
                wordDocOutputFormat,
                wordDocShowHeader,
                wordDocPage
              );
              setDocumentBlob(null);
              setDocumentExt(wordDocOutputFormat.toLowerCase());
              outUrl = res.dataUrl;
              outW = res.width;
              outH = res.height;
            }
          } else if (tool.slug === "excel-to-image") {
            const sheets = excelSheetNames.map((name, i) => ({
              name,
              target: excelSheetTargets[i] || `xl/worksheets/sheet${i + 1}.xml`,
            }));
            if (excelSheetMode === "all" && sheets.length > 1) {
              const res = await renderAllExcelSheetsToZip(
                buffer,
                file.name,
                sheets,
                excelTheme,
                excelGridLines,
                excelDocOutputFormat,
                excelShowHeader,
                (curr, total) => setExcelConvertingProgress({ current: curr, total })
              );
              setDocumentBlob(res.zipBlob);
              setDocumentExt("zip");
              setNewSize(res.zipBlob.size);
              outUrl = res.firstPageDataUrl;
              outW = res.width;
              outH = res.height;
              setExcelConvertingProgress(null);
            } else {
              const targetPath = excelSheetTargets[excelDocSheet - 1] || "xl/worksheets/sheet1.xml";
              const res = await renderExcelSheetToImage(
                buffer,
                file.name,
                excelTheme,
                excelGridLines,
                excelDocOutputFormat,
                excelShowHeader,
                targetPath
              );
              setDocumentBlob(null);
              setDocumentExt(excelDocOutputFormat.toLowerCase());
              outUrl = res.dataUrl;
              outW = res.width;
              outH = res.height;
            }
          } else if (tool.slug === "powerpoint-to-image") {
            const baseName = file.name ? file.name.replace(/\.[^.]+$/, "") : "presentation";
            if (pptSlideMode === "all" && pptTotalSlides > 1) {
              const res = await renderAllPptSlidesToZip(
                buffer,
                file.name,
                pptTotalSlides,
                pptTheme,
                pptDocOutputFormat,
                (curr, total) => setPptConvertingProgress({ current: curr, total })
              );
              setDocumentBlob(res.zipBlob);
              setDocumentExt("zip");
              setNewSize(res.zipBlob.size);
              outUrl = res.firstPageDataUrl;
              outW = res.width;
              outH = res.height;
              setPptConvertingProgress(null);
            } else {
              const res = await renderPptSlideToImage(buffer, file.name, pptTheme, pptDocOutputFormat, pptDocSlide);
              setDocumentBlob(null);
              setDocumentExt(pptDocOutputFormat.toLowerCase());
              outUrl = res.dataUrl;
              outW = res.width;
              outH = res.height;
            }
          }

          setProcessedSrc(outUrl);
          setImageSrc(outUrl);
          setDimensions({ width: outW, height: outH });
          setTargetWidth(outW);
          setTargetHeight(outH);

          try {
            const head = outUrl.split(",")[0] || "";
            const base64Len = outUrl.length - (head.length + 1);
            const approxBytes = Math.max(1024, Math.round((base64Len * 3) / 4));
            setNewSize(approxBytes);
          } catch { }

          setHasProcessed(true);
          setIsEditingSettings(false);
          setProcessing(false);
          recordToolExecution();
          toast.success(`Successfully converted ${file.name} to image!`);
        } catch (e) {
          setProcessing(false);
          toast.error("Failed to process document.");
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // 0c. Handle Binary to Image tool
    if (tool.slug === "binary-to-image") {
      if (!inputConvertText.trim() && !file) {
        toast.error("Please paste binary code or upload a .bin / .txt file first!");
        return;
      }
      setProcessing(true);
      const activeTheme = BINARY_THEMES[binaryTheme];
      const url = decodeBinaryStringToImageUrl(inputConvertText, {
        color0: activeTheme.bg,
        color1: activeTheme.fg,
        pixelScale: binaryPixelBlockSize,
      });
      if (!url) {
        setProcessing(false);
        toast.error("Invalid binary data — make sure it consists of 0s and 1s or a valid binary file.");
        return;
      }
      setProcessedSrc(url);
      setImageSrc(url);
      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.width, height: img.height });
        setTargetWidth(img.width);
        setTargetHeight(img.height);
      };
      img.src = url;
      setHasProcessed(true);
      setIsEditingSettings(false);
      setProcessing(false);
      recordToolExecution();
      toast.success("Converted Binary to Image successfully!");
      return;
    }

    // 1a. ascii-to-image: ALWAYS re-render from inputConvertText
    //     (whether imageSrc is set or not, so "Convert" works after the landing card preview too)
    if (tool.slug === "ascii-to-image") {
      if (!inputConvertText.trim()) {
        toast.error("Please enter or paste ASCII text data first!");
        return;
      }
      setProcessing(true);
      try {
        const decodedUrl = tryDecodeAsciiToOriginalImage(inputConvertText);
        const url = decodedUrl || renderAsciiToImage(inputConvertText);
        const img2 = new Image();
        img2.onload = () => {
          setDimensions({ width: img2.width, height: img2.height });
          setTargetWidth(img2.width);
          setTargetHeight(img2.height);
        };
        img2.src = url;
        setProcessedSrc(url);
        setImageSrc(url);
        setHasProcessed(true);
        setIsEditingSettings(false);
        setProcessing(false);
        recordToolExecution();
        if (decodedUrl) {
          toast.success("Decoded original image successfully!");
        } else {
          toast.success("Rendered ASCII art to image successfully!");
        }
      } catch (err) {
        setProcessing(false);
        toast.error("Failed to render ASCII text. Check your input.");
      }
      return;
    }

    // 1b. Byte-decode tools (Octal / Hex / Decimal): only run when no image is loaded yet
    if (
      !imageSrc &&
      ["octal-to-image", "hex-to-image", "decimal-to-image"].includes(tool.slug)
    ) {
      if (!inputConvertText.trim()) {
        toast.error("Please enter or paste input text data first!");
        return;
      }
      setProcessing(true);
      try {
        if (tool.slug === "octal-to-image") {
          const octs = inputConvertText.trim().split(/\s+/);
          const bytes = new Uint8Array(octs.map((o) => parseInt(o, 8)).filter((n) => !isNaN(n)));
          const blob = new Blob([bytes], { type: "image/png" });
          const url = URL.createObjectURL(blob);
          setProcessedSrc(url);
          setImageSrc(url);
          setHasProcessed(true);
          setIsEditingSettings(false);
          setProcessing(false);
          recordToolExecution();
          toast.success("Decoded Octal bytes to image!");
          return;
        }
        if (tool.slug === "hex-to-image") {
          const clean = inputConvertText.replace(/[^0-9a-fA-F]/g, "");
          const pairs = clean.match(/.{1,2}/g) || [];
          const bytes = new Uint8Array(pairs.map((h) => parseInt(h, 16)));
          const blob = new Blob([bytes], { type: "image/png" });
          const url = URL.createObjectURL(blob);
          setProcessedSrc(url);
          setImageSrc(url);
          setHasProcessed(true);
          setIsEditingSettings(false);
          setProcessing(false);
          recordToolExecution();
          toast.success("Decoded Hex bytes to image!");
          return;
        }
        if (tool.slug === "decimal-to-image") {
          const decs = inputConvertText.trim().split(/[\s,]+/);
          const bytes = new Uint8Array(decs.map((d) => parseInt(d, 10)).filter((n) => !isNaN(n)));
          const blob = new Blob([bytes], { type: "image/png" });
          const url = URL.createObjectURL(blob);
          setProcessedSrc(url);
          setImageSrc(url);
          setHasProcessed(true);
          setIsEditingSettings(false);
          setProcessing(false);
          recordToolExecution();
          toast.success("Decoded Decimal bytes to image!");
          return;
        }
        if (tool.slug === "binary-to-image") {
          const url = decodeBinaryStringToImageUrl(inputConvertText);
          if (!url) { toast.error("Invalid binary data — make sure it's a valid image encoded in binary."); setProcessing(false); return; }
          setProcessedSrc(url);
          setImageSrc(url);
          setHasProcessed(true);
          setIsEditingSettings(false);
          setProcessing(false);
          recordToolExecution();
          toast.success("Decoded binary to image!");
          return;
        }
      } catch (err) {
        toast.error("Failed to decode input text. Check string format.");
        setProcessing(false);
        return;
      }
    }

    // 0e. Handle Multi-Image Batch Rotation
    if (tool.slug === "rotate-image" && rotateBatch.length > 1) {
      setProcessing(true);
      try {
        const processedResults = await Promise.all(
          rotateBatch.map((item) =>
            renderRotatedImageToBlob(
              item,
              rotateBgMode,
              rotateBgColor,
              rotateBgGradient,
              rotateBatchOutputFormat
            )
          )
        );

        const updatedBatch = rotateBatch.map((item, idx) => ({
          ...item,
          processedDataUrl: processedResults[idx]?.dataUrl,
          processedBlob: processedResults[idx]?.blob,
          processedSize: processedResults[idx]?.blob.size,
          processedWidth: processedResults[idx]?.width,
          processedHeight: processedResults[idx]?.height,
        }));
        setRotateBatch(updatedBatch);

        const ext = rotateBatchOutputFormat.toLowerCase();
        const zipEntries = await Promise.all(
          updatedBatch.map(async (item) => {
            const cleanName = item.name.replace(/\.[^.]+$/, "") + `_rotated.${ext}`;
            const buffer = await item.processedBlob!.arrayBuffer();
            return { name: cleanName, data: new Uint8Array(buffer) };
          })
        );
        const zipUint8 = buildZip(zipEntries);
        const zipBlob = new Blob([zipUint8 as BlobPart], { type: "application/zip" });
        setRotateBatchZipBlob(zipBlob);
        setDocumentBlob(zipBlob);
        setDocumentExt("zip");
        setNewSize(zipBlob.size);

        if (processedResults[0]) {
          setProcessedSrc(processedResults[0].dataUrl);
          setImageSrc(processedResults[0].dataUrl);
          setDimensions({ width: processedResults[0].width, height: processedResults[0].height });
        }

        setHasProcessed(true);
        setIsEditingSettings(false);
        setProcessing(false);
        recordToolExecution();
        toast.success(`Successfully rotated all ${rotateBatch.length} images!`);
        return;
      } catch (e) {
        console.error("Batch rotation failed:", e);
        setProcessing(false);
        toast.error("Failed to rotate batch images.");
        return;
      }
    }

    if (!imageSrc) return;
    setProcessing(true);

    const img = new Image();
    if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onerror = () => {
      setProcessing(false);
      toast.error("Failed to load image for processing.");
    };
    img.onload = async () => {
      try {
        const canvas = canvasRef.current || document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setProcessing(false);
          toast.error("Could not obtain canvas context.");
          return;
        }

        let w = img.width;
        let h = img.height;

        // 1. Crop processing pass
        let srcX = 0;
        let srcY = 0;
        let srcW = img.width;
        let srcH = img.height;

        if (tool.slug === "crop-image") {
          srcX = Math.round((cropBox.x / 100) * img.width);
          srcY = Math.round((cropBox.y / 100) * img.height);
          srcW = Math.round((cropBox.w / 100) * img.width);
          srcH = Math.round((cropBox.h / 100) * img.height);

          w = srcW;
          h = srcH;
        } else if (tool.slug === "square-your-image") {
          const maxDim = Math.max(img.width, img.height);
          w = maxDim;
          h = maxDim;
          setDimensions({ width: maxDim, height: maxDim });
          setTargetWidth(maxDim);
          setTargetHeight(maxDim);
        }

        // 2. Resize / Upscale logic
        if (tool.slug === "resize-image") {
          if (scalePercent !== 100) {
            w = Math.round((img.width * scalePercent) / 100);
            h = Math.round((img.height * scalePercent) / 100);
          } else {
            w = targetWidth || img.width;
            h = targetHeight || img.height;
          }
        } else if (tool.slug === "upscale-image") {
          w = img.width * upscaleFactor;
          h = img.height * upscaleFactor;
        }

        // Orientation & rotation bounding box calculation
        const rad = (rotation * Math.PI) / 180;
        const is90or270 = Math.abs(rotation % 180) === 90;
        const sin = Math.abs(Math.sin(rad));
        const cos = Math.abs(Math.cos(rad));
        const rotCanvasW = is90or270 ? h : Math.round(w * cos + h * sin);
        const rotCanvasH = is90or270 ? w : Math.round(w * sin + h * cos);

        canvas.width = rotCanvasW;
        canvas.height = rotCanvasH;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // For JPEG conversion or OCR/QR scanning, fill with white so transparent PNG/WEBP areas convert cleanly without black artifacts
        if (
          tool.slug === "convert-to-jpg" ||
          (tool.slug === "convert-from-jpg" && targetFormat === "image/jpeg") ||
          tool.slug === "image-to-text-ocr" ||
          tool.slug === "image-to-text"
        ) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Rotate Image Custom Background Fill Pass
        if (tool.slug === "rotate-image") {
          if (rotateBgMode === "color") {
            ctx.fillStyle = rotateBgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (rotateBgMode === "gradient") {
            const gradObj = ROTATE_GRADIENT_PRESETS.find((g) => g.css === rotateBgGradient) || ROTATE_GRADIENT_PRESETS[0];
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, gradObj!.stops[0]!);
            grad.addColorStop(1, gradObj!.stops[1]!);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (rotateBgMode === "blur") {
            ctx.save();
            ctx.filter = "blur(28px)";
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height) * 1.25;
            const bgW = img.width * scale;
            const bgH = img.height * scale;
            ctx.drawImage(img, (canvas.width - bgW) / 2, (canvas.height - bgH) / 2, bgW, bgH);
            ctx.restore();
          } else if (rotateBgMode === "transparent" && targetFormat === "image/jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }

        ctx.save();

        // Transform origin center
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

        // Apply Photo Editor filters
        if (tool.slug === "photo-editor") {
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) sepia(${sepia}%)`;
        }

        // Draw image onto canvas
        const drawW = tool.slug === "rotate-image" ? w : is90or270 ? h : w;
        const drawH = tool.slug === "rotate-image" ? h : is90or270 ? w : h;

        if (tool.slug === "square-your-image") {
          ctx.restore();
          canvas.width = w;
          canvas.height = h;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.clearRect(0, 0, w, h);

          // 1. Draw Background Layer
          if (squareBgMode === "blur") {
            ctx.save();
            const blurPx = Math.max(10, Math.round((squareBlurAmount / 500) * w));
            ctx.filter = `blur(${blurPx}px)`;
            const bgScale = Math.max(w / img.width, h / img.height) * 1.25;
            const bgW = img.width * bgScale;
            const bgH = img.height * bgScale;
            ctx.drawImage(img, (w - bgW) / 2, (h - bgH) / 2, bgW, bgH);
            ctx.restore();
          } else if (squareBgMode === "color") {
            ctx.fillStyle = squareBgColor;
            ctx.fillRect(0, 0, w, h);
          } else if (squareBgMode === "gradient") {
            const grad = ctx.createLinearGradient(0, 0, w, h);
            const colorMatches = squareGradient.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgba?\([^)]+\)/g);
            if (colorMatches && colorMatches.length >= 2 && colorMatches[0] && colorMatches[colorMatches.length - 1]) {
              grad.addColorStop(0, colorMatches[0]);
              grad.addColorStop(1, colorMatches[colorMatches.length - 1] as string);
            } else {
              grad.addColorStop(0, "#667eea");
              grad.addColorStop(1, "#764ba2");
            }
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
          } else if (squareBgMode === "transparent") {
            if (squareExportFormat === "JPG" || targetFormat === "image/jpeg") {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, w, h);
            } else {
              ctx.clearRect(0, 0, w, h);
            }
          }

          // 2. Draw Foreground Image Layer
          if (squareBgMode === "fit") {
            const coverScale = Math.max(w / img.width, h / img.height) * (squareScale / 100);
            const drawW = img.width * coverScale;
            const drawH = img.height * coverScale;
            const dx = (w - drawW) / 2;
            const dy = (h - drawH) / 2;

            ctx.save();
            if (squareCornerRadius > 0) {
              const radPx = squareCornerRadius === 9999 ? w / 2 : Math.round((squareCornerRadius / 500) * w);
              ctx.beginPath();
              if (typeof ctx.roundRect === "function") {
                ctx.roundRect(0, 0, w, h, radPx);
              } else {
                ctx.rect(0, 0, w, h);
              }
              ctx.clip();
            }
            ctx.drawImage(img, dx, dy, drawW, drawH);
            ctx.restore();
          } else {
            const scaleMultiplier = Math.max(0.2, Math.min(1.0, squareScale / 100));
            let fgW = img.width;
            let fgH = img.height;
            if (fgW >= fgH) {
              fgW = w * scaleMultiplier;
              fgH = (img.height / img.width) * fgW;
            } else {
              fgH = h * scaleMultiplier;
              fgW = (img.width / img.height) * fgH;
            }

            const dx = (w - fgW) / 2;
            const dy = (h - fgH) / 2;
            const radPx = squareCornerRadius === 9999 ? Math.min(fgW, fgH) / 2 : Math.round((squareCornerRadius / 500) * w);

            if (squareShadow !== "none") {
              ctx.save();
              if (squareShadow === "soft") {
                ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
                ctx.shadowBlur = Math.round(w * 0.035);
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = Math.round(w * 0.015);
              } else if (squareShadow === "float") {
                ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
                ctx.shadowBlur = Math.round(w * 0.06);
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = Math.round(w * 0.03);
              } else if (squareShadow === "card") {
                ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
                ctx.shadowBlur = Math.round(w * 0.02);
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = Math.round(w * 0.01);
              }

              ctx.beginPath();
              if (radPx > 0 && typeof ctx.roundRect === "function") {
                ctx.roundRect(dx, dy, fgW, fgH, radPx);
              } else {
                ctx.rect(dx, dy, fgW, fgH);
              }
              ctx.fillStyle = "#ffffff";
              ctx.fill();
              ctx.restore();
            }

            ctx.save();
            if (radPx > 0) {
              ctx.beginPath();
              if (typeof ctx.roundRect === "function") {
                ctx.roundRect(dx, dy, fgW, fgH, radPx);
              } else {
                ctx.rect(dx, dy, fgW, fgH);
              }
              ctx.clip();
            }
            ctx.drawImage(img, dx, dy, fgW, fgH);
            ctx.restore();
          }
        } else if (tool.slug === "crop-image") {
          ctx.drawImage(img, srcX, srcY, srcW, srcH, -drawW / 2, -drawH / 2, drawW, drawH);
        } else if (tool.slug === "resize-image" && resizeQualityMode === "improved") {
          // Multi-step stepped downsampling to avoid decimation/aliasing artifacts
          let curW = img.width;
          let curH = img.height;
          if (curW > drawW * 2 && curH > drawH * 2) {
            let stepCanvas = document.createElement("canvas");
            const stepCtx = stepCanvas.getContext("2d")!;
            stepCanvas.width = curW;
            stepCanvas.height = curH;
            stepCtx.imageSmoothingEnabled = true;
            stepCtx.imageSmoothingQuality = "high";
            stepCtx.drawImage(img, 0, 0);

            while (curW / 2 > drawW && curH / 2 > drawH) {
              const nextW = Math.round(curW / 2);
              const nextH = Math.round(curH / 2);
              const nextCanvas = document.createElement("canvas");
              nextCanvas.width = nextW;
              nextCanvas.height = nextH;
              const nextCtx = nextCanvas.getContext("2d")!;
              nextCtx.imageSmoothingEnabled = true;
              nextCtx.imageSmoothingQuality = "high";
              nextCtx.drawImage(stepCanvas, 0, 0, curW, curH, 0, 0, nextW, nextH);
              stepCanvas = nextCanvas;
              curW = nextW;
              curH = nextH;
            }
            ctx.drawImage(stepCanvas, 0, 0, curW, curH, -drawW / 2, -drawH / 2, drawW, drawH);
          } else {
            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          }
        } else if (tool.slug === "upscale-image") {
          const upscaledCanvas = performSuperResolutionUpscale(img, drawW, drawH, {
            mode: upscaleEngineMode,
            factor: upscaleFactor,
            detailEnhance: upscaleDetailEnhance,
            denoise: upscaleDenoise,
            faceRefine: upscaleFaceRefinement,
          });
          ctx.drawImage(upscaledCanvas, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        }
        if (tool.slug !== "square-your-image") {
          ctx.restore();
        }

        // Localized Face Anonymization Pass (Python YuNet AI Backend + High-Precision Client Fallback)
        if (tool.slug === "blur-face") {
          let appliedPython = false;
          try {
            const rawDataUrl = canvas.toDataURL("image/png");
            const pyRes = await fetch("/api/blur-face", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                base64Image: rawDataUrl,
                blurType: faceBlurType,
                strength: faceBlurStrength,
                shape: faceShape,
                faces: faceRegions.length > 0 ? faceRegions : undefined,
              }),
            });
            if (pyRes.ok) {
              const json = await pyRes.json();
              if (json.success && json.base64Image) {
                const pyImg = await new Promise<HTMLImageElement>((resolve, reject) => {
                  const i = new Image();
                  i.onload = () => resolve(i);
                  i.onerror = reject;
                  i.src = json.base64Image;
                });
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(pyImg, 0, 0);
                appliedPython = true;
                if (Array.isArray(json.faces) && json.faces.length > 0) {
                  setFaceRegions(json.faces);
                }
              }
            }
          } catch (pyErr) {
            console.warn("Python face blur server unreachable, using client anonymizer:", pyErr);
          }

          if (!appliedPython) {
            applyFaceAnonymization(ctx, canvas.width, canvas.height, faceRegions, {
              type: faceBlurType,
              strength: faceBlurStrength,
              shape: faceShape,
            });
          }
        }

        // Apply HD Sharpening & Micro-contrast pass if resize with quality improvement
        if (tool.slug === "resize-image" && resizeQualityMode === "improved") {
          applyHDResizingEnhancement(ctx, canvas.width, canvas.height, 0.45);
        }

        // Watermark Removal — High-Precision Client Gemini Engine + Python AI Server Fallback
        if (tool.slug === "remove-watermark") {
          let applied = false;

          // 1. First run high-precision client-side Gemini AI engine (instant, 100% mathematical fidelity)
          if (wmRemovalMode === "gemini_ai" || wmRemovalMode === "full_auto") {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const gRes = removeGeminiWatermark(imageData.data, canvas.width, canvas.height, {
              sensitivity: wmRemovalSensitivity,
              alphaGain: wmAlphaGain / 100,
              forceRemoval: wmRemovalMode === "gemini_ai",
            });
            if (gRes.detected) {
              ctx.putImageData(new ImageData(gRes.cleanedData as unknown as ImageData["data"], canvas.width, canvas.height), 0, 0);
              applied = true;
            }
          }

          // 2. If not detected by Gemini engine or mode is corners/stock, call Python AI server
          if (!applied && wmRemovalMode !== "gemini_ai") {
            try {
              const rawDataUrl = canvas.toDataURL("image/png");
              const pyRes = await fetch("/api/remove-watermark", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  base64Image: rawDataUrl,
                  mode: wmRemovalMode,
                  sensitivity: wmRemovalSensitivity,
                  engine: wmInpaintEngine,
                  preserveDetails: wmPreserveDetails,
                  alphaGain: wmAlphaGain / 100,
                }),
              });
              if (pyRes.ok) {
                const json = await pyRes.json();
                if (json.success && json.base64Image && json.watermarkDetected !== false) {
                  const pyImg = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const i = new Image();
                    i.onload = () => resolve(i);
                    i.onerror = reject;
                    i.src = json.base64Image;
                  });
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(pyImg, 0, 0);
                  applied = true;
                }
              }
            } catch (pyErr) {
              console.warn("Python watermark server unreachable, falling back to client engine:", pyErr);
            }
          }

          // 3. Client inpainting fallback if still not applied
          if (!applied) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const cleaned = removeWatermarkAdvanced(imageData, {
              mode: wmRemovalMode,
              sensitivity: wmRemovalSensitivity,
              engine: wmInpaintEngine,
              preserveDetails: wmPreserveDetails,
              alphaGain: wmAlphaGain / 100,
            });
            ctx.putImageData(cleaned, 0, 0);
          }
        }

        // Watermark Draw Pass
        if (tool.slug === "watermark-image") {
          await drawWatermarkOverlayOnCanvas(ctx, canvas, {
            wmMargin,
            wmPosition,
            wmCustomCoord,
            wmMode,
            wmLogoSrc,
            wmLogoScale,
            wmOpacity,
            wmRotation,
            wmText,
            wmFontSize,
            wmItalic,
            wmBold,
            wmFontFamily,
            wmStroke,
            wmColor,
            wmBgBadge,
          });
        }

        // Meme Generator Pass
        if (tool.slug === "meme-generator") {
          drawMemeCaptionsOnCanvas(ctx, canvas, {
            memeFontSize,
            memeFontFamily,
            memeTextAlign,
            memeStrokeWidth,
            memeStrokeColor,
            memeTextColor,
            memeTextShadow,
            memeAllCaps,
            topText,
            bottomText,
            memeTopPosPercent,
            memeBottomPosPercent,
          });
        }

        // Image → Document export tools (PDF, DOCX, XLSX, PPTX)
        if (["image-to-pdf", "image-to-word", "image-to-excel", "image-to-powerpoint"].includes(tool.slug)) {
          const jpegQ = Math.max(0.6, Math.min(1.0, (pdfQuality || 95) / 100));
          const jpegDataUrl = canvas.toDataURL("image/jpeg", jpegQ);
          const pngDataUrl = canvas.toDataURL("image/png");
          const fname = file?.name?.replace(/\.[^.]+$/, "") || "image";

          const effectiveLang = ocrLanguage === "custom" ? (ocrCustomLanguage.trim() || "eng") : ocrLanguage;
          const langObj = OCR_SUPPORTED_LANGUAGES.find((l) => l.code === effectiveLang);
          const langName = langObj ? langObj.name : effectiveLang;

          let blob: Blob;
          let ext: string;

          if (tool.slug === "image-to-pdf") {
            blob = buildPdfFromImageDataUrl(jpegDataUrl, canvas.width, canvas.height, {
              pageSize: pdfPageSize,
              margin: pdfMargin,
              quality: pdfQuality,
            });
            ext = "pdf";
          } else if (tool.slug === "image-to-word") {
            setOcrProgressStatus(`Loading OCR model (${langName}) for Word export...`);
            setOcrProgressPercent(20);

            let lines: string[] = [];
            let tableGrid: string[][] = [];
            if (wordDocMode !== "image_only") {
              const ocrRes = await performAdvancedOcr(canvas, {
                contrastMode: ocrContrastMode,
                language: effectiveLang,
                onProgress: (status, progress) => {
                  setOcrProgressStatus(status);
                  setOcrProgressPercent(Math.min(95, 20 + Math.round(progress * 0.75)));
                },
              });
              lines = ocrRes.textLines;
              tableGrid = ocrRes.tableGrid;
              setOcrTableGrid(tableGrid);
              setRawOcrDocumentLines(lines);
              const assembled = lines.join("\n");
              setOcrText(assembled);
              setBinaryOutputText(assembled);
              setOcrIsEmpty(ocrRes.isEmpty);
            }

            blob = buildEditableDocxFromOcr(lines, {
              fontFamily: wordFontFamily,
              fontSize: wordFontSize,
              mode: wordDocMode,
              imageDataUrl: pngDataUrl,
              imgW: canvas.width,
              imgH: canvas.height,
              filename: fname,
              tableGrid: tableGrid.length > 0 ? tableGrid : undefined,
            });
            ext = "docx";
          } else if (tool.slug === "image-to-excel") {
            setOcrProgressStatus(`Analyzing and extracting spreadsheet table (${langName})...`);
            setOcrProgressPercent(20);

            const ocrRes = await performAdvancedOcr(canvas, {
              contrastMode: ocrContrastMode,
              language: effectiveLang,
              onProgress: (status, progress) => {
                setOcrProgressStatus(status);
                setOcrProgressPercent(Math.min(95, 20 + Math.round(progress * 0.75)));
              },
            });
            setRawOcrDocumentLines(ocrRes.textLines);
            setOcrTableGrid(ocrRes.tableGrid);
            const assembled = ocrRes.textLines.join("\n");
            setOcrText(assembled);
            setBinaryOutputText(assembled);
            setOcrIsEmpty(ocrRes.isEmpty);

            blob = buildEditableXlsxFromOcr(ocrRes.textLines, {
              parserMode: excelParserMode,
              sheetName: excelSheetName,
              highlightHeader: excelHighlightHeader,
              filename: fname,
              tableGrid: ocrRes.tableGrid,
            });
            ext = "xlsx";
          } else if (tool.slug === "image-to-powerpoint") {
            setOcrProgressStatus(`Analyzing presentation slide & text (${langName})...`);
            setOcrProgressPercent(20);

            let lines: string[] = [];
            if (pptxSlideMode !== "image_only") {
              const ocrRes = await performAdvancedOcr(canvas, {
                contrastMode: ocrContrastMode,
                language: effectiveLang,
                onProgress: (status, progress) => {
                  setOcrProgressStatus(status);
                  setOcrProgressPercent(Math.min(95, 20 + Math.round(progress * 0.75)));
                },
              });
              lines = ocrRes.textLines;
              setRawOcrDocumentLines(lines);
              const assembled = lines.join("\n");
              setOcrText(assembled);
              setBinaryOutputText(assembled);
              setOcrIsEmpty(ocrRes.isEmpty);
            }

            blob = buildPptxFromOcrAndImage(lines, {
              mode: pptxSlideMode,
              title: pptxSlideTitle || undefined,
              theme: pptxTheme,
              imageDataUrl: pngDataUrl,
              imgW: canvas.width,
              imgH: canvas.height,
              filename: fname,
            });
            ext = "pptx";
          } else {
            blob = buildPptxFromImage(pngDataUrl, canvas.width, canvas.height, fname);
            ext = "pptx";
          }

          setDocumentBlob(blob);
          setDocumentExt(ext);
          const previewUrl = canvas.toDataURL("image/png");
          setProcessedSrc(previewUrl);
          setNewSize(blob.size);
          setHasProcessed(true);
          setIsEditingSettings(false);
          setProcessing(false);
          setOcrProgressStatus("");
          setOcrProgressPercent(0);

          if (tool.slug === "image-to-word") {
            toast.success(`OCR Complete! Generated editable Word document (${ext.toUpperCase()}) with ${langName}.`);
          } else if (tool.slug === "image-to-excel") {
            toast.success(`OCR Complete! Generated editable Excel spreadsheet (${ext.toUpperCase()}) with ${langName}.`);
          } else if (tool.slug === "image-to-powerpoint") {
            toast.success(`OCR Complete! Generated valid PowerPoint presentation (${ext.toUpperCase()}) with ${langName}.`);
          } else {
            toast.success(`Image converted to ${ext.toUpperCase()} — click Download to save!`);
          }

          recordToolExecution();
          return;
        }

        // OCR & QR/Barcode extraction pass
        if (tool.slug === "image-to-text-ocr" || tool.slug === "image-to-text") {
          const effectiveLang = ocrLanguage === "custom" ? (ocrCustomLanguage.trim() || "eng") : ocrLanguage;
          const langObj = OCR_SUPPORTED_LANGUAGES.find((l) => l.code === effectiveLang);
          const langName = langObj ? langObj.name : effectiveLang;

          setOcrProgressStatus("Scanning barcodes & QR codes...");
          setOcrProgressPercent(10);
          const detectedCodes = await detectBarcodesAndQRs(canvas);
          setDetectedBarcodes(detectedCodes);

          setOcrProgressStatus(`Loading OCR model (${langName})...`);
          setOcrProgressPercent(25);

          const ocrRes = await performAdvancedOcr(canvas, {
            contrastMode: ocrContrastMode,
            outputStructure: ocrOutputStructure,
            language: effectiveLang,
            onProgress: (status, progress) => {
              setOcrProgressStatus(status);
              setOcrProgressPercent(Math.min(95, 25 + Math.round(progress * 0.7)));
            },
          });
          setRawOcrDocumentLines(ocrRes.textLines);
          setOcrTableGrid(ocrRes.tableGrid);

          const isEmptyDetection = ocrRes.isEmpty && detectedCodes.length === 0;
          setOcrIsEmpty(isEmptyDetection);

          if (isEmptyDetection) {
            setOcrText("");
            setBinaryOutputText("");
          } else {
            const assembled = assembleOcrOutputText(
              ocrRes.textLines,
              detectedCodes,
              skipBarcodeAndQr,
              ocrOutputStructure
            );
            setOcrText(assembled);
            setBinaryOutputText(assembled);
          }

          const previewUrl = canvas.toDataURL("image/png");
          setProcessedSrc(previewUrl);
          setHasProcessed(true);
          setIsEditingSettings(false);
          setProcessing(false);
          setOcrProgressStatus("");
          setOcrProgressPercent(0);

          recordToolExecution();

          if (isEmptyDetection) {
            toast.info("OCR Scan Complete: No readable text or barcodes detected in this image.");
          } else if (detectedCodes.length > 0) {
            toast.success(`OCR Complete! Detected ${detectedCodes.length} code(s) & extracted text (${langName}).`);
          } else {
            toast.success(`Text extracted successfully (${langName})!`);
          }
          return;
        }

        // DEDICATED BINARY & ENCODED DATA PIPELINE
        if (
          [
            "image-to-binary",
            "image-to-base64",
            "image-to-octal",
            "image-to-hex",
            "image-to-decimal",
            "image-to-ascii",
          ].includes(tool.slug)
        ) {
          generateBinaryData(imageSrc);
          setHasProcessed(true);
          setIsEditingSettings(false);
          setProcessing(false);

          recordToolExecution();

          toast.success(`Generated ${binaryOutputMode} output successfully!`);
          return;
        }

        // DEDICATED COMPRESSION PIPELINE FOR "compress-image"
        if (tool.slug === "compress-image") {
          const origMime = file?.type || "";
          let effectiveFormat = "image/jpeg";

          if (compressFormat === "image/jpeg" || compressFormat === "image/webp" || compressFormat === "image/png") {
            effectiveFormat = compressFormat;
          } else {
            // "auto" mode:
            // If original file is webp -> use webp
            // If original file is png -> use webp (lossy compression + transparency preserved)
            // If jpeg or other -> use jpeg
            if (origMime === "image/webp") {
              effectiveFormat = "image/webp";
            } else if (origMime === "image/png") {
              effectiveFormat = "image/webp";
            } else {
              effectiveFormat = "image/jpeg";
            }
          }

          const calcByteSize = (dataUrlStr: string): number => {
            const b64 = dataUrlStr.split(",")[1] || "";
            const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
            return Math.max(1, Math.round((b64.length * 3) / 4 - padding));
          };

          let finalDataUrl = "";
          let finalQuality = quality / 100;

          // Mode A: SIZE WISE COMPRESSION (Target File Size e.g. 200 KB)
          if (compressMode === "size") {
            const rawTarget = targetSizeInput.trim() || String(Math.max(5, Math.round((origSize * 0.6) / 1024)));
            const parsedTarget = parseFloat(rawTarget);
            if (isNaN(parsedTarget) || parsedTarget <= 0) {
              toast.error("Please enter a valid target file size.");
              setProcessing(false);
              return;
            }

            const targetBytes = targetSizeUnit === "MB" ? parsedTarget * 1024 * 1024 : parsedTarget * 1024;
            if (origSize > 0 && targetBytes >= origSize) {
              toast.error(`Target size must be less than original size (${formatBytes(origSize)}).`);
              setProcessing(false);
              return;
            }

            const searchFormat = effectiveFormat === "image/png" ? "image/webp" : effectiveFormat;

            let bestUrl = canvas.toDataURL(searchFormat, 0.75);
            let bestQ = 0.75;
            let lowQ = 0.02;
            let highQ = 0.98;

            for (let step = 0; step < 12; step++) {
              const testQ = (lowQ + highQ) / 2;
              const testUrl = canvas.toDataURL(searchFormat, testQ);
              const testBytes = calcByteSize(testUrl);

              if (testBytes <= targetBytes) {
                bestQ = testQ;
                bestUrl = testUrl;
                lowQ = testQ; // can try slightly higher quality
              } else {
                highQ = testQ; // too big, reduce quality
              }
            }

            // If even lowest quality on full canvas is still larger than targetBytes, downscale resolution
            if (calcByteSize(bestUrl) > targetBytes) {
              let scale = 0.9;
              while (scale >= 0.15) {
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = Math.max(1, Math.round(canvas.width * scale));
                tempCanvas.height = Math.max(1, Math.round(canvas.height * scale));
                const tempCtx = tempCanvas.getContext("2d");
                if (tempCtx) {
                  tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

                  let sLow = 0.02, sHigh = 0.95;
                  let sBestUrl = tempCanvas.toDataURL(searchFormat, 0.05);
                  let sBestQ = 0.05;

                  for (let j = 0; j < 8; j++) {
                    const tQ = (sLow + sHigh) / 2;
                    const tUrl = tempCanvas.toDataURL(searchFormat, tQ);
                    if (calcByteSize(tUrl) <= targetBytes) {
                      sBestQ = tQ;
                      sBestUrl = tUrl;
                      sLow = tQ;
                    } else {
                      sHigh = tQ;
                    }
                  }

                  if (calcByteSize(sBestUrl) <= targetBytes) {
                    bestUrl = sBestUrl;
                    bestQ = sBestQ;
                    break;
                  }
                }
                scale -= 0.1;
              }
            }

            finalDataUrl = bestUrl;
            finalQuality = bestQ;
            setQuality(Math.round(bestQ * 100));
          } else {
            // Mode B: QUALITY WISE COMPRESSION (Standard Quality Slider Mode)
            const exportQ = Math.max(0.02, Math.min(0.98, quality / 100));
            if (effectiveFormat === "image/png") {
              finalDataUrl = canvas.toDataURL("image/png");
            } else {
              finalDataUrl = canvas.toDataURL(effectiveFormat, exportQ);
            }

            // Safety optimization: if output exceeds original and WebP could be smaller, use WebP
            if (origSize > 0 && calcByteSize(finalDataUrl) >= origSize && effectiveFormat !== "image/webp") {
              const webpUrl = canvas.toDataURL("image/webp", exportQ);
              if (calcByteSize(webpUrl) < calcByteSize(finalDataUrl)) {
                finalDataUrl = webpUrl;
              }
            }
          }

          const outBytes = calcByteSize(finalDataUrl);
          setProcessedSrc(finalDataUrl);
          setNewSize(outBytes);
          setHasProcessed(true);
          setIsEditingSettings(false);
          setProcessing(false);

          recordToolExecution();

          const pctSaved = origSize > 0 ? Math.max(0, Math.round(((origSize - outBytes) / origSize) * 100)) : 0;
          toast.success(`Image compressed! File size reduced by ${pctSaved}%.`);
          return;
        }

        // Format output encoding for other tools
        let format = targetFormat;
        let exportQuality = 0.98; // Preserve ultra-high quality by default for format conversions

        if (tool.slug === "convert-to-jpg") {
          format = "image/jpeg";
          exportQuality = 0.98; // Maintain maximum image quality in JPG conversion
        } else if (tool.slug === "convert-from-jpg") {
          format = targetFormat;
          exportQuality = 0.98;
        } else if (tool.slug === "square-your-image") {
          format = squareExportFormat === "PNG" ? "image/png" : squareExportFormat === "JPG" ? "image/jpeg" : "image/webp";
          exportQuality = 0.98;
        } else if (tool.slug === "resize-image") {
          if (resizeQualityMode === "improved") {
            // Quality Improvement: preserve highest bitrate (0.99) & lossless chroma for true HD output with larger file size
            if (file?.type === "image/png") {
              format = "image/png";
            } else if (file?.type === "image/webp") {
              format = "image/webp";
              exportQuality = 0.99;
            } else {
              format = "image/jpeg";
              exportQuality = 0.99;
            }
          } else {
            // Same Quality: lean, balanced web size without inflating file size
            if (file?.type === "image/png") {
              format = "image/png";
            } else if (file?.type === "image/webp") {
              format = "image/webp";
              exportQuality = 0.85;
            } else {
              format = "image/jpeg";
              exportQuality = 0.85;
            }
          }
        } else {
          exportQuality = Math.max(0.02, Math.min(1.0, quality / 100));
        }

        let dataUrl = "";
        if (tool.slug === "square-your-image") {
          try {
            dataUrl = renderSquareImageToDataUrl(img);
          } catch {
            // fallback to canvas
          }
        }
        if (!dataUrl) {
          try {
            dataUrl = canvas.toDataURL(format, exportQuality);
          } catch {
            try {
              dataUrl = canvas.toDataURL("image/png");
            } catch (canvasErr) {
              console.error("Canvas export failed:", canvasErr);
              setProcessing(false);
              toast.error("Could not export image. Please try another image file.");
              return;
            }
          }
        }

        setProcessedSrc(dataUrl);
        const b64 = dataUrl.split(",")[1] || "";
        const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
        setNewSize(Math.max(1, Math.round((b64.length * 3) / 4 - padding)));
        setOutputDimensions({ width: canvas.width, height: canvas.height });
        setHasProcessed(true);
        setIsEditingSettings(false);
        setProcessing(false);

        // Real telemetry, quota tracking & custom credit deduction
        recordToolExecution();

        toast.success(`${tool.name} completed successfully!`);
      } catch (fatalErr) {
        console.error("Fatal error inside processImage:", fatalErr);
        setProcessing(false);
        toast.error("An unexpected error occurred while processing image.");
      }
    };
    img.src = imageSrc;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (tool.slug === "rotate-image") {
        if (files.length > 1) {
          processMultipleRotateFiles(Array.from(files));
        } else if (rotateBatch.length > 0) {
          processMultipleRotateFiles([files[0]!]);
        } else {
          processSelectedFile(files[0]!);
        }
      } else {
        processSelectedFile(files[0]!);
      }
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (tool.slug === "rotate-image") {
        if (files.length > 1) {
          processMultipleRotateFiles(Array.from(files));
        } else if (rotateBatch.length > 0) {
          processMultipleRotateFiles([files[0]!]);
        } else {
          processSelectedFile(files[0]!);
        }
      } else {
        processSelectedFile(files[0]!);
      }
    }
  };

  const handleDownloadSingleRotatedItem = async (item: RotateBatchItem) => {
    try {
      let url = item.processedDataUrl;
      if (!url) {
        const res = await renderRotatedImageToBlob(
          item,
          rotateBgMode,
          rotateBgColor,
          rotateBgGradient,
          rotateBatchOutputFormat
        );
        url = res.dataUrl;
      }
      const ext = rotateBatchOutputFormat.toLowerCase();
      const cleanName = item.name.replace(/\.[^.]+$/, "") + `_rotated.${ext}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = cleanName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloaded ${cleanName}!`);
    } catch (e) {
      console.error("Individual rotate download error:", e);
      toast.error("Failed to download rotated image.");
    }
  };

  const handleDownload = () => {
    const triggerFileDownload = (targetUrl: string, downloadName: string) => {
      if (targetUrl.startsWith("data:")) {
        try {
          const parts = targetUrl.split(",");
          const mime = parts[0]?.match(/:(.*?);/)?.[1] || "image/png";
          const binary = atob(parts[1] || "");
          const array = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([array], { type: mime });
          const objectUrl = URL.createObjectURL(blob);
          const el = document.createElement("a");
          el.href = objectUrl;
          el.download = downloadName;
          document.body.appendChild(el);
          el.click();
          document.body.removeChild(el);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
          return;
        } catch (e) {
          console.warn("data URL conversion failed, fallback:", e);
        }
      }
      const el = document.createElement("a");
      el.href = targetUrl;
      el.download = downloadName;
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);
    };

    // OCR & Extracted text tools: serve the extracted text file (.txt)
    if (tool.slug === "image-to-text-ocr" || tool.slug === "image-to-text") {
      const textToSave = ocrText || binaryOutputText;
      const blob = new Blob([textToSave], { type: "text/plain;charset=utf-8" });
      const textUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = textUrl;
      const baseName = file?.name ? file.name.replace(/\.[^.]+$/, "") : "extracted_text";
      a.download = `${baseName}_ocr_text.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(textUrl), 5000);
      toast.success("Downloaded extracted text file (.txt)!");
      return;
    }

    // Binary & Encoded Data tools: serve the complete generated binary data file
    if (
      tool.slug === "image-to-binary" ||
      tool.slug === "image-to-base64" ||
      tool.slug === "image-to-hex" ||
      tool.slug === "image-to-octal" ||
      tool.slug === "image-to-decimal" ||
      tool.slug === "image-to-ascii"
    ) {
      const textToSave = fullBinaryOutputText || binaryOutputText;
      const extMap: Record<string, string> = {
        Binary: "bin.txt",
        Base64: "base64.txt",
        Hexadecimal: "hex.txt",
        "C-Array": "h",
        "Pixel-Matrix": "matrix.txt",
        Decimal: "dec.txt",
        Octal: "oct.txt",
      };
      const ext = extMap[binaryOutputMode] || "txt";
      const blob = new Blob([textToSave], { type: "text/plain;charset=utf-8" });
      const textUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = textUrl;
      const baseName = file?.name ? file.name.replace(/\.[^.]+$/, "") : "image_binary";
      a.download = `${baseName}_${binaryOutputMode.toLowerCase()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(textUrl), 5000);
      toast.success(`Downloaded complete ${binaryOutputMode} data file!`);
      return;
    }

    // Base64 to Image tool with format conversion export
    if (tool.slug === "base64-to-image") {
      const srcToUse = processedSrc || imageSrc;
      if (!srcToUse) return;
      const ext = base64ExportFormat.toLowerCase();
      const mime = base64ExportFormat === "PNG" ? "image/png" : base64ExportFormat === "JPG" ? "image/jpeg" : "image/webp";
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        if (base64ExportFormat === "JPG") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, c.width, c.height);
        }
        ctx.drawImage(img, 0, 0);
        const outUrl = c.toDataURL(mime, base64ExportQuality);
        const baseName = file?.name ? file.name.replace(/\.[^.]+$/, "") : "decoded_image";
        triggerFileDownload(outUrl, `${baseName}.${ext}`);
        toast.success(`Downloaded decoded ${base64ExportFormat} image!`);
      };
      img.src = srcToUse;
      return;
    }

    // PDF to Image tool with multi-page ZIP bundle
    if (tool.slug === "pdf-to-image" && documentBlob) {
      const docUrl = URL.createObjectURL(documentBlob);
      const a = document.createElement("a");
      a.href = docUrl;
      const baseName = file?.name ? file.name.replace(/\.[^.]+$/, "") : "pdf_pages";
      a.download = `${baseName}_all_pages_${pdfDocOutputFormat.toLowerCase()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(docUrl), 5000);
      toast.success(`Downloaded all ${pdfTotalPages} PDF pages in ZIP archive (${formatBytes(documentBlob.size)})!`);
      return;
    }

    // PowerPoint to Image tool with multi-slide ZIP bundle
    if (tool.slug === "powerpoint-to-image" && documentBlob) {
      const docUrl = URL.createObjectURL(documentBlob);
      const a = document.createElement("a");
      a.href = docUrl;
      const baseName = file?.name ? file.name.replace(/\.[^.]+$/, "") : "presentation_slides";
      a.download = `${baseName}_all_slides_${pptDocOutputFormat.toLowerCase()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(docUrl), 5000);
      toast.success(`Downloaded all ${pptTotalSlides} presentation slides in ZIP archive (${formatBytes(documentBlob.size)})!`);
      return;
    }

    // Word to Image tool with multi-page ZIP bundle
    if (tool.slug === "word-to-image" && documentBlob) {
      const docUrl = URL.createObjectURL(documentBlob);
      const a = document.createElement("a");
      a.href = docUrl;
      const baseName = file?.name ? file.name.replace(/\.[^.]+$/, "") : "word_pages";
      a.download = `${baseName}_all_pages_${wordDocOutputFormat.toLowerCase()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(docUrl), 5000);
      toast.success(`Downloaded all ${wordTotalPages} Word pages in ZIP archive (${formatBytes(documentBlob.size)})!`);
      return;
    }

    // Excel to Image tool with multi-sheet ZIP bundle
    if (tool.slug === "excel-to-image" && documentBlob) {
      const docUrl = URL.createObjectURL(documentBlob);
      const a = document.createElement("a");
      a.href = docUrl;
      const baseName = file?.name ? file.name.replace(/\.[^.]+$/, "") : "excel_sheets";
      a.download = `${baseName}_all_sheets_${excelDocOutputFormat.toLowerCase()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(docUrl), 5000);
      toast.success(`Downloaded all ${excelTotalSheets} Excel sheets in ZIP archive (${formatBytes(documentBlob.size)})!`);
      return;
    }

    // Rotate Image tool with multi-image ZIP bundle
    if (tool.slug === "rotate-image" && rotateBatch.length > 1 && (rotateBatchZipBlob || documentBlob)) {
      const blobToUse = rotateBatchZipBlob || documentBlob;
      if (blobToUse) {
        const docUrl = URL.createObjectURL(blobToUse);
        const a = document.createElement("a");
        a.href = docUrl;
        const baseName = file?.name ? file.name.replace(/\.[^.]+$/, "") : "batch";
        a.download = `${baseName}_all_rotated_images.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(docUrl), 5000);
        toast.success(`Downloaded all ${rotateBatch.length} rotated images in ZIP archive (${formatBytes(blobToUse.size)})!`);
        return;
      }
    }

    // Document export tools (PDF, DOCX, XLSX, PPTX): serve real document file
    if (["image-to-pdf", "image-to-word", "image-to-excel", "image-to-powerpoint"].includes(tool.slug)) {
      const ext = documentExt || (tool.slug === "image-to-pdf" ? "pdf" : tool.slug === "image-to-word" ? "docx" : tool.slug === "image-to-excel" ? "xlsx" : "pptx");
      let blobToDownload = documentBlob;

      // If documentBlob is not yet generated, build standard document directly on-the-fly
      if (!blobToDownload) {
        const srcToUse = processedSrc || imageSrc;
        if (srcToUse) {
          const fname = file?.name?.replace(/\.[^.]+$/, "") || "image";
          const w = dimensions.width || 800;
          const h = dimensions.height || 600;
          if (tool.slug === "image-to-pdf") {
            blobToDownload = buildPdfFromImageDataUrl(srcToUse, w, h, {
              pageSize: pdfPageSize,
              margin: pdfMargin,
              quality: pdfQuality,
            });
          } else if (tool.slug === "image-to-word") {
            blobToDownload = buildDocxFromImage(srcToUse, w, h, fname);
          } else if (tool.slug === "image-to-excel") {
            blobToDownload = buildXlsxFromImage(srcToUse, w, h, fname);
          } else if (tool.slug === "image-to-powerpoint") {
            blobToDownload = buildPptxFromImage(srcToUse, w, h, fname);
          }
        }
      }

      if (blobToDownload) {
        const mimeMap: Record<string, string> = {
          pdf: "application/pdf",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        };
        const mimeType = mimeMap[ext] || "application/octet-stream";
        const docBlob = blobToDownload.type === mimeType ? blobToDownload : new Blob([blobToDownload], { type: mimeType });
        const docUrl = URL.createObjectURL(docBlob);
        const a = document.createElement("a");
        a.href = docUrl;
        const baseName = file?.name ? file.name.replace(/\.[^.]+$/, "") : `converted_${ext}`;
        a.download = `${baseName}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(docUrl), 5000);
        toast.success(`Downloaded ${ext.toUpperCase()} file (${formatBytes(docBlob.size)})!`);
        return;
      }
    }

    const url = processedSrc || imageSrc;
    if (!url) return;

    let ext = "png";
    const mimeMatch = url.match(/^data:image\/([a-zA-Z0-9+]+);/);
    if (mimeMatch && mimeMatch[1]) {
      ext = mimeMatch[1].toLowerCase();
      if (ext === "jpeg") ext = "jpg";
    } else {
      const activeFmt = tool.slug === "convert-to-jpg" ? "image/jpeg" : targetFormat;
      const formatExtMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/avif": "avif",
        "image/gif": "gif",
        "image/bmp": "bmp",
        "image/tiff": "tiff",
      };
      ext = formatExtMap[activeFmt] || "png";
    }

    const baseName = file?.name ? file.name.replace(/\.[^.]+$/, "") : `${tool.slug}_output`;
    const downloadFilename =
      tool.slug === "compress-image"
        ? `${baseName}_compressed.${ext}`
        : tool.slug === "resize-image"
          ? `${baseName}_resized.${ext}`
          : tool.slug === "crop-image"
            ? `${baseName}_cropped.${ext}`
            : tool.slug === "square-your-image"
              ? `${baseName}_square.${ext}`
              : tool.slug === "rotate-image"
                ? `${baseName}_rotated.${ext}`
                : tool.slug === "watermark-image"
                  ? `${baseName}_watermarked.${ext}`
                  : tool.slug === "blur-face"
                    ? `${baseName}_anonymized.${ext}`
                    : tool.slug === "meme-generator"
                      ? `${baseName}_meme.${ext}`
                      : `${baseName}_${tool.slug}.${ext}`;

    triggerFileDownload(url, downloadFilename);

    if (tool.slug === "square-your-image") {
      recordToolExecution();
    }

    toast.success(
      tool.slug === "compress-image"
        ? `Downloaded compressed image (${formatBytes(newSize || origSize)})!`
        : tool.slug === "resize-image"
          ? `Downloaded resized image (${ext.toUpperCase()})!`
          : tool.slug === "crop-image"
            ? `Downloaded cropped image (${ext.toUpperCase()})!`
            : tool.slug === "square-your-image"
              ? `Downloaded 1:1 square image (${ext.toUpperCase()})!`
              : "Processed image downloaded!"
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const isOcrTool =
    tool.slug.includes("ocr") ||
    tool.slug.includes("to-text") ||
    tool.slug === "image-to-text";

  const isDocumentTool =
    tool.slug === "image-to-word" ||
    tool.slug === "image-to-excel" ||
    tool.slug === "image-to-powerpoint" ||
    tool.slug === "image-to-pdf";

  const isBinaryTool =
    tool.slug === "image-to-binary" ||
    tool.slug === "image-to-base64" ||
    tool.slug === "image-to-hex" ||
    tool.slug === "image-to-octal" ||
    tool.slug === "image-to-decimal" ||
    tool.slug === "image-to-ascii";

  const isConversionTool =
    (tool.slug.startsWith("convert-") ||
      tool.slug.includes("-to-") ||
      tool.category === "Format Converters") &&
    !isOcrTool &&
    !isDocumentTool &&
    !isBinaryTool;

  const formatLabelMap: Record<string, string> = {
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/webp": "WebP",
    "image/avif": "AVIF",
    "image/gif": "GIF",
    "image/bmp": "BMP",
    "image/tiff": "TIFF",
  };

  const getTargetFormatLabel = (): string => {
    if (isOcrTool) return "TXT";
    if (tool.slug === "image-to-pdf") return "PDF";
    if (tool.slug === "image-to-word") return "DOCX";
    if (tool.slug === "image-to-excel") return "XLSX";
    if (tool.slug === "image-to-powerpoint") return "PPTX";
    if (tool.slug === "convert-to-jpg") return "JPG";
    if (tool.slug === "convert-to-png") return "PNG";
    if (tool.slug === "convert-to-webp") return "WebP";
    if (tool.slug === "convert-from-jpg") return formatLabelMap[targetFormat] || "PNG";
    if (tool.slug === "html-to-image") return htmlOutputFormat || "PNG";
    if (tool.slug === "pdf-to-image") return pdfDocOutputFormat || "PNG";
    if (tool.slug === "word-to-image") return wordDocOutputFormat || "PNG";
    if (tool.slug === "excel-to-image") return excelDocOutputFormat || "PNG";
    if (tool.slug === "powerpoint-to-image") return pptDocOutputFormat || "PNG";
    if (tool.slug === "base64-to-image") return base64ExportFormat;
    if (tool.slug === "square-your-image") return squareExportFormat;
    if (isConversionTool && tool.slug.includes("-to-")) {
      const parts = tool.slug.split("-to-");
      if (parts[1]) {
        const p = parts[1].toLowerCase();
        if (p === "jpg" || p === "jpeg") return "JPG";
        if (p === "png") return "PNG";
        if (p === "webp") return "WebP";
        return parts[1].toUpperCase();
      }
    }
    if (tool.outputs && !tool.outputs.includes(",")) {
      return tool.outputs.trim().toUpperCase();
    }
    return formatLabelMap[targetFormat] || "JPG";
  };

  const getSourceFormatLabel = (): string => {
    if (file?.name) {
      const ext = file.name.split(".").pop()?.toUpperCase();
      if (ext && ext.length <= 5) return ext === "JPEG" ? "JPG" : ext;
    }
    if (file?.type) {
      const sub = file.type.split("/")[1]?.toUpperCase();
      if (sub) return sub === "JPEG" ? "JPG" : sub;
    }
    if (tool.slug === "convert-from-jpg") return "JPG";
    if (isConversionTool && tool.slug.includes("-to-")) {
      const parts = tool.slug.split("-to-");
      if (parts[0]) {
        const p = parts[0].replace("convert-", "").toLowerCase();
        if (p === "jpg" || p === "jpeg") return "JPG";
        return p.toUpperCase();
      }
    }
    if (tool.accepts && !tool.accepts.includes(",")) {
      return tool.accepts.trim().toUpperCase();
    }
    return "IMAGE";
  };

  const sourceFormatLabel = getSourceFormatLabel();
  const targetFormatLabel = getTargetFormatLabel();

  // Crop Pixel Dimension Calculation
  const cropPixelWidth = Math.round((cropBox.w / 100) * dimensions.width);
  const cropPixelHeight = Math.round((cropBox.h / 100) * dimensions.height);

  // Target file size calculation and boundary validation for Compress Image
  const parsedTargetSize = parseFloat(targetSizeInput);
  const currentTargetBytes = !isNaN(parsedTargetSize) && parsedTargetSize > 0
    ? (targetSizeUnit === "MB" ? parsedTargetSize * 1024 * 1024 : parsedTargetSize * 1024)
    : 0;
  const isTargetSizeExceeding = origSize > 0 && currentTargetBytes >= origSize;

  // Dynamic suggestions strictly lower than uploaded image file size
  const smartTargetPresets = (() => {
    if (!origSize || origSize <= 0) {
      return [
        { label: "50 KB", val: "50", unit: "KB" as const },
        { label: "100 KB", val: "100", unit: "KB" as const },
        { label: "200 KB", val: "200", unit: "KB" as const },
      ];
    }

    const origKB = Math.round(origSize / 1024);
    const presets: Array<{ label: string; val: string; unit: "KB" | "MB" }> = [];

    // Percentage presets (75%, 50%, 25%)
    const p75 = Math.round(origKB * 0.75);
    const p50 = Math.round(origKB * 0.5);
    const p25 = Math.round(origKB * 0.25);

    if (p75 >= 10 && p75 < origKB) {
      presets.push({
        label: `75% (${p75 >= 1024 ? (p75 / 1024).toFixed(1) + " MB" : p75 + " KB"})`,
        val: p75 >= 1024 ? String(Number((p75 / 1024).toFixed(1))) : String(p75),
        unit: p75 >= 1024 ? "MB" : "KB",
      });
    }
    if (p50 >= 5 && p50 < p75) {
      presets.push({
        label: `50% (${p50 >= 1024 ? (p50 / 1024).toFixed(1) + " MB" : p50 + " KB"})`,
        val: p50 >= 1024 ? String(Number((p50 / 1024).toFixed(1))) : String(p50),
        unit: p50 >= 1024 ? "MB" : "KB",
      });
    }
    if (p25 >= 3 && p25 < p50) {
      presets.push({
        label: `25% (${p25 >= 1024 ? (p25 / 1024).toFixed(1) + " MB" : p25 + " KB"})`,
        val: p25 >= 1024 ? String(Number((p25 / 1024).toFixed(1))) : String(p25),
        unit: p25 >= 1024 ? "MB" : "KB",
      });
    }

    // Fixed standards strictly < origSize * 0.90
    const standards: Array<{ label: string; val: string; unit: "KB" | "MB"; bytes: number }> = [
      { label: "20 KB", val: "20", unit: "KB", bytes: 20 * 1024 },
      { label: "50 KB", val: "50", unit: "KB", bytes: 50 * 1024 },
      { label: "100 KB", val: "100", unit: "KB", bytes: 100 * 1024 },
      { label: "200 KB", val: "200", unit: "KB", bytes: 200 * 1024 },
      { label: "300 KB", val: "300", unit: "KB", bytes: 300 * 1024 },
      { label: "500 KB", val: "500", unit: "KB", bytes: 500 * 1024 },
      { label: "1 MB", val: "1", unit: "MB", bytes: 1024 * 1024 },
      { label: "2 MB", val: "2", unit: "MB", bytes: 2 * 1024 * 1024 },
      { label: "5 MB", val: "5", unit: "MB", bytes: 5 * 1024 * 1024 },
    ];

    standards
      .filter((s) => s.bytes <= origSize * 0.9)
      .forEach((s) => {
        if (!presets.some((p) => p.val === s.val && p.unit === s.unit)) {
          presets.push({ label: s.label, val: s.val, unit: s.unit });
        }
      });

    return presets.slice(0, 5);
  })();

  const workspaceScope = {
    tool,
    file,
    imageSrc,
    processedSrc,
    hasProcessed,
    origSize,
    newSize,
    setNewSize,
    dimensions,
    outputDimensions,
    setIsEditingSettings,
    showOriginalComparison,
    setShowOriginalComparison,
    previewBackdrop,
    setPreviewBackdrop,
    copiedText,
    handleCopyExtractedText,
    targetWidth,
    targetHeight,
    resizeQualityMode,
    rotation,
    rotateBatch,
    rotateBatchOutputFormat,
    ocrText,
    setOcrText,
    rawOcrDocumentLines,
    setRawOcrDocumentLines,
    detectedBarcodes,
    skipBarcodeAndQr,
    setSkipBarcodeAndQr,
    ocrContrastMode,
    setOcrContrastMode,
    ocrOutputStructure,
    ocrLanguage,
    setIsOcrLanguageDialogOpen,
    recomputeOcrOutput,
    squareExportFormat,
    binaryOutputText,
    setBinaryOutputText,
    setIsFullscreenPreview,
    setFullscreenActiveIndex,
    setIsCodeEditorOpen,
    documentBlob,
    setDocumentBlob,
    wordDocMode,
    wordFontFamily,
    wordFontSize,
    excelParserMode,
    excelHighlightHeader,
    excelSheetName,
    pptxSlideMode,
    pptxSlideTitle,
    setPptxSlideTitle,
    pptxTheme,
    ocrTableGrid,
    ocrIsEmpty,
    pdfDocPage,
    pdfTotalPages,
    pdfDocOutputFormat,
    wordDocOutputFormat,
    wordDocPage,
    wordTotalPages,
    excelDocOutputFormat,
    excelDocSheet,
    excelTotalSheets,
    pptDocOutputFormat,
    pptDocSlide,
    pptTotalSlides,
    fileInputRef,
    copyToClipboard,
    processImage,
    handleDownloadSingleRotatedItem,
    handleDownload,
    formatBytes,
    isOcrTool,
    isDocumentTool,
    isBinaryTool,
    isConversionTool,
    sourceFormatLabel,
    targetFormatLabel,
    setFile,
    setImageSrc,
    setProcessedSrc,
    processing,
    setProcessing,
    setHasProcessed,
    setDimensions,
    setTargetWidth,
    setTargetHeight,
    inputConvertText,
    setInputConvertText,
    setBinaryLandingMode,
    setBinaryInputTab,
    binaryTheme,
    binaryPixelBlockSize,
    setBase64LandingMode,
    base64InputText,
    setBase64InputText,
    setTextDecoderLandingMode,
    setHtmlLandingMode,
    setHtmlInputMode,
    htmlCodeText,
    setHtmlCodeText,
    htmlRenderWidth,
    setHtmlRenderWidth,
    htmlRenderHeight,
    setHtmlRenderHeight,
    htmlBgColor,
    setHtmlBgColor,
    htmlOutputFormat,
    isDraggingFile,
    decodeAndApplyBase64,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    setOrigSize,
    isEditingSettings,
    estimatedResizeBytes,
    cropBox,
    flipH,
    flipV,
    rotateBgMode,
    rotateBgColor,
    rotateBgGradient,
    setRotateBatch,
    wmMode,
    wmText,
    wmLogoSrc,
    wmLogoScale,
    wmPosition,
    wmCustomCoord,
    wmMargin,
    wmOpacity,
    wmColor,
    wmFontSize,
    wmFontFamily,
    wmBold,
    wmItalic,
    wmRotation,
    wmStroke,
    wmBgBadge,
    isDraggingWm,
    faceRegions,
    faceBlurType,
    faceBlurStrength,
    faceShape,
    isDetectingFaces,
    activeFaceId,
    setActiveFaceId,
    showFaceOutlines,
    setShowFaceOutlines,
    hoveredFaceId,
    setHoveredFaceId,
    topText,
    bottomText,
    memeFontSize,
    memeFontFamily,
    memeTextColor,
    memeStrokeColor,
    memeStrokeWidth,
    memeAllCaps,
    memeTextShadow,
    memeTextAlign,
    memeTopPosPercent,
    memeBottomPosPercent,
    squareBgMode,
    squareBgColor,
    squareGradient,
    squareScale,
    squareBlurAmount,
    squareCornerRadius,
    squareShadow,
    pickedHex,
    loupeCanvasRef,
    loupeRef,
    loupeTickRef,
    loupeHexRef,
    loupeDotRef,
    hoverSwatchRef,
    hoverSwatchDotRef,
    hoverSwatchHexRef,
    focusedDim,
    imgRef,
    previewContainerRef,
    settingsHeight,
    renderedImgSize,
    setRenderedImgSize,
    handleImageMouseMove,
    handleImageMouseEnter,
    handleImageMouseLeave,
    handleImageClick,
    extractMostCommonColors,
    handleWatermarkOverlayClick,
    handleWatermarkMouseDown,
    handleWatermarkOverlayMouseMove,
    handleWatermarkOverlayMouseUp,
    handleFaceMouseDown,
    handleFaceTouchStart,
    handleDeleteFace,
    handleMemeTextMouseDown,
    handleCropMouseDown,
    cropPixelWidth,
    cropPixelHeight,
    compressMode,
    setCompressMode,
    quality,
    setQuality,
    targetSizeInput,
    setTargetSizeInput,
    targetSizeUnit,
    setTargetSizeUnit,
    compressFormat,
    setCompressFormat,
    maintainAspect,
    setMaintainAspect,
    scalePercent,
    setScalePercent,
    setResizeQualityMode,
    cropAspect,
    targetFormat,
    setTargetFormat,
    setRotation,
    setFlipH,
    setFlipV,
    setRotateBgMode,
    setRotateBgColor,
    setRotateBgGradient,
    setRotateBatchOutputFormat,
    setWmMode,
    wmSubTab,
    setWmSubTab,
    setWmText,
    setWmLogoSrc,
    setWmLogoScale,
    setWmPosition,
    setWmMargin,
    setWmOpacity,
    setWmColor,
    setWmFontSize,
    setWmFontFamily,
    setWmBold,
    setWmItalic,
    setWmRotation,
    setWmStroke,
    setWmBgBadge,
    wmLogoInputRef,
    wmRemovalMode,
    setWmRemovalMode,
    wmRemovalSensitivity,
    setWmRemovalSensitivity,
    wmInpaintEngine,
    setWmInpaintEngine,
    wmPreserveDetails,
    setWmPreserveDetails,
    wmAlphaGain,
    setWmAlphaGain,
    setFocusedDim,
    applyCropAspectPreset,
    handleLogoUpload,
    currentTargetBytes,
    isTargetSizeExceeding,
    smartTargetPresets,
    upscaleFactor,
    setUpscaleFactor,
    upscaleEngineMode,
    setUpscaleEngineMode,
    upscaleDetailEnhance,
    setUpscaleDetailEnhance,
    upscaleDenoise,
    setUpscaleDenoise,
    upscaleFaceRefinement,
    setUpscaleFaceRefinement,
    setFaceRegions,
    setFaceBlurType,
    setFaceBlurStrength,
    setFaceShape,
    setTopText,
    setBottomText,
    setMemeFontSize,
    setMemeFontFamily,
    setMemeTextColor,
    setMemeStrokeWidth,
    setMemeAllCaps,
    setMemeTextShadow,
    setMemeTextAlign,
    setMemeTopPosPercent,
    setMemeBottomPosPercent,
    isFontDropdownOpen,
    setIsFontDropdownOpen,
    fontDropdownRef,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    grayscale,
    setGrayscale,
    setSquareBgMode,
    setSquareBgColor,
    setSquareGradient,
    setSquareScale,
    setSquareBlurAmount,
    setSquareCornerRadius,
    setSquareShadow,
    setSquareExportFormat,
    binaryOutputMode,
    setBinaryOutputMode,
    binaryDelimiter,
    setBinaryDelimiter,
    binaryBitDepth,
    setBinaryBitDepth,
    customBitDepth,
    setCustomBitDepth,
    binaryWithPrefix,
    setBinaryWithPrefix,
    pixelThreshold,
    setPixelThreshold,
    fullBinaryOutputText,
    isBinaryTruncatedPreview,
    copiedFormat,
    handleAddFaceBox,
    updateActiveFace,
    handleAutoDetectFaces,
    setOcrOutputStructure,
    setOcrLanguage,
    ocrCustomLanguage,
    setOcrCustomLanguage,
    isOcrLanguageDialogOpen,
    ocrProgressStatus,
    ocrProgressPercent,
    binaryInputTab,
    setBinaryTheme,
    setBinaryPixelBlockSize,
    base64ExportFormat,
    setBase64ExportFormat,
    base64ExportQuality,
    setBase64ExportQuality,
    base64DecodedInfo,
    setBase64DecodedInfo,
    setHtmlOutputFormat,
    setIsFullScreenHtmlEditorOpen,
    setTempHtmlCode,
    copyBase64DecodedImage,
    setPickedHex,
    pickedRgb,
    setPickedRgb,
    pickedHsl,
    setPickedHsl,
    colorHistory,
    setColorHistory,
    commonColors,
    isExtractingColors,
    pdfPageSize,
    setPdfPageSize,
    pdfMargin,
    setPdfMargin,
    pdfQuality,
    setPdfQuality,
    setWordDocMode,
    setWordFontFamily,
    setWordFontSize,
    setExcelParserMode,
    setExcelHighlightHeader,
    setExcelSheetName,
    setPptxSlideMode,
    setPptxTheme,
    setPdfDocPage,
    pdfPageMode,
    setPdfPageMode,
    pdfDpiScale,
    setPdfDpiScale,
    setPdfDocOutputFormat,
    pdfBgColor,
    setPdfBgColor,
    pdfIsPasswordProtected,
    pdfIsUnlocked,
    pdfPasswordInput,
    setPdfPasswordInput,
    pdfPasswordError,
    setPdfPasswordError,
    pdfShowPasswordText,
    setPdfShowPasswordText,
    wordDocFont,
    setWordDocFont,
    wordDocFontSize,
    setWordDocFontSize,
    setWordDocOutputFormat,
    wordDocShowHeader,
    setWordDocShowHeader,
    setWordDocPage,
    wordPageMode,
    setWordPageMode,
    excelTheme,
    setExcelTheme,
    excelGridLines,
    setExcelGridLines,
    setExcelDocOutputFormat,
    excelShowHeader,
    setExcelShowHeader,
    setExcelDocSheet,
    excelSheetNames,
    excelSheetMode,
    setExcelSheetMode,
    pptTheme,
    setPptTheme,
    setPptDocOutputFormat,
    setPptDocSlide,
    pptSlideMode,
    setPptSlideMode,
    pptAspectRatio,
    handleUnlockPdf,
    openSystemEyeDropper
  };

  return (
    <div ref={workspaceContainerRef} className="w-full flex flex-col gap-8">
      {/* DYNAMIC ISLAND FLOATING BAR (Smooth Centered Animation, Header-Aware) */}
      {typeof document !== "undefined" && hasProcessed && !isEditingSettings && !isCodeEditorOpen && createPortal(
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
                {processedSrc || imageSrc ? (
                  <img
                    src={processedSrc || imageSrc || undefined}
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
                  {file?.name || `${tool.name}`}
                </span>
                {isConversionTool ? (
                  <span className="text-[11px] font-bold text-[#ff5500] leading-tight flex items-center gap-1 mt-0.5">
                    {sourceFormatLabel} → {targetFormatLabel}
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-bold text-emerald-400 leading-tight mt-0.5">
                    {tool.slug === "resize-image" && (outputDimensions.width || targetWidth) > 0
                      ? `${outputDimensions.width || targetWidth}×${outputDimensions.height || targetHeight} · ${formatBytes(newSize || origSize)}`
                      : formatBytes(newSize || origSize)}
                  </span>
                )}
              </div>
            </div>

            {/* 2. Primary Large Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="wobbly-btn h-9 sm:h-11 flex items-center gap-2 rounded-full bg-white text-[#0a0a0a] hover:bg-neutral-100 px-4 sm:px-5 text-xs sm:text-sm font-black shadow-lg active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4 text-[#ff5500] shrink-0" />
              <span>
                {tool.slug === "compress-image"
                  ? "Download Image"
                  : tool.slug === "convert-to-jpg"
                    ? "Download JPG"
                    : tool.slug === "convert-from-jpg"
                      ? `Download ${targetFormatLabel}`
                      : tool.slug === "convert-to-png"
                        ? "Download PNG"
                        : tool.slug === "convert-to-webp"
                          ? "Download WebP"
                          : tool.slug === "image-to-pdf"
                            ? "Download PDF"
                            : tool.slug === "image-to-word"
                              ? "Download Word"
                              : tool.slug === "image-to-excel"
                                ? "Download Excel"
                                : tool.slug === "image-to-powerpoint"
                                  ? "Download Presentation"
                                  : isConversionTool
                                    ? `Download ${targetFormatLabel}`
                                    : tool.slug === "resize-image"
                                      ? "Download Resized"
                                      : tool.slug === "crop-image"
                                        ? "Download Cropped"
                                        : tool.slug.includes("ocr") || tool.slug === "image-to-text"
                                          ? "Download Text"
                                          : "Download Result"}
              </span>
              {!isConversionTool && (
                <span className="hidden md:inline-block rounded-full bg-black/10 text-neutral-800 px-2 py-0.5 text-[11px] font-mono font-bold">
                  {formatBytes(newSize || origSize)}
                </span>
              )}
            </button>

            {/* 3. Change Settings (Concentric Circular Button) */}
            <button
              type="button"
              onClick={() => {
                setIsEditingSettings(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="wobbly-btn flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white hover:text-[#0a0a0a] hover:scale-105 active:scale-90 transition-all shadow-sm cursor-pointer"
              title="Change Settings"
              aria-label="Change Settings"
            >
              <Sliders className="h-4 w-4 text-[#ff5500]" />
            </button>

            {/* 4. Upload Another File (Concentric Circular Button) */}
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="wobbly-btn flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white hover:text-[#0a0a0a] hover:scale-105 active:scale-90 transition-all shadow-sm cursor-pointer"
              title="Process another File"
              aria-label="Process another File"
            >
              <FolderUp className="h-4 w-4" />
            </button>
          </aside>
        </div>,
        document.body
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple={tool.slug === "rotate-image"}
        accept={
          tool.slug === "base64-to-image" ? ".txt,.b64,.base64,.text,text/plain,text/*" :
            tool.slug === "html-to-image" ? ".html,.htm,.txt,text/html" :
              tool.slug === "binary-to-image" ? ".bin,.txt,.dat,.raw,text/plain,application/octet-stream,image/*" :
                ["octal-to-image", "hex-to-image", "decimal-to-image", "ascii-to-image"].includes(tool.slug) ? ".txt,.text,text/plain" :
                  ["pdf-to-image"].includes(tool.slug) ? ".pdf,application/pdf" :
                    ["word-to-image"].includes(tool.slug) ? ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" :
                      ["excel-to-image"].includes(tool.slug) ? ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" :
                        ["powerpoint-to-image"].includes(tool.slug) ? ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" :
                          "image/*"
        }
        className="hidden"
        onChange={handleFileChange}
      />
      <canvas ref={canvasRef} className="hidden" />

      {hasProcessed && !isEditingSettings ? (
        /* Dedicated Processed View for All Tools */
        <WorkspaceCompletedView {...workspaceScope} />
      ) : !imageSrc && !file && !processedSrc ? (
        <WorkspaceUploadStage {...workspaceScope} />
      ) : (
        /* Workspace Active Mode: Image Preview + Settings (Full width, no excess margins) */
        <div className={`grid items-start gap-6 lg:gap-8 w-full ${tool.slug === "watermark-image" || tool.slug === "meme-generator" || tool.slug === "color-picker-from-image" || tool.slug === "square-your-image" ? "lg:grid-cols-[1.15fr_1fr]" : "lg:grid-cols-[2fr_1.2fr]"}`}>
          {/* Canvas & Image Preview View */}
          <WorkspaceCanvasPreview {...workspaceScope} />
          <div
            ref={settingsPanelRef}
            className={`min-w-0 rounded-3xl border-2 border-border bg-card shadow-md flex flex-col ${tool.slug === "meme-generator" || tool.slug === "color-picker-from-image" || tool.slug === "square-your-image"
                ? "p-3.5 sm:p-4 space-y-3 max-h-[min(580px,calc(100vh-140px))] overflow-y-auto"
                : "p-5 sm:p-6 space-y-5"
              }`}
          >
            <div className={`flex items-center justify-between border-b border-border ${tool.slug === "meme-generator" || tool.slug === "color-picker-from-image" || tool.slug === "square-your-image" ? "pb-2" : "pb-3.5"}`}>
              <div>
                <h3 className={`font-display font-bold ${tool.slug === "meme-generator" || tool.slug === "color-picker-from-image" || tool.slug === "square-your-image" ? "text-base sm:text-lg" : "text-xl"}`}>
                  {tool.name} Settings
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{tool.blurb}</p>
              </div>
              <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-extrabold text-accent-foreground uppercase">
                {tool.tag || "Tool"}
              </span>
            </div>

            <div className={tool.slug === "square-your-image" ? "space-y-3" : "space-y-5"}>
              <WorkspaceControlsCore {...workspaceScope} />
              <WorkspaceControlsCreative {...workspaceScope} />
              <WorkspaceControlsDecoders {...workspaceScope} />
              <WorkspaceControlsDocuments {...workspaceScope} />

              {/* Action Buttons: Convert/Process + Download */}
              <div className="pt-6 border-t border-border flex flex-col gap-3">
                {/* Credit Cost or Free Daily Quota Indicator */}
                {(() => {
                  const cost = AdminStore.getToolCreditCost(tool.slug);
                  const isFree = cost === 0;
                  const currentCredits = AuthUser.getCredits();

                  if (isFree) {
                    const usage = AdminStore.getToolDailyUsage(tool.slug);
                    return (
                      <div className="flex items-center justify-between text-xs px-1 text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <Wand2 className="h-3.5 w-3.5" />
                          <span>Free Tool (20 files/day)</span>
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {usage} / 20 used today
                        </span>
                      </div>
                    );
                  }

                  if (!AuthUser.isLoggedIn()) {
                    return null;
                  }

                  const silver = AuthUser.getSilverTokens();
                  const gold = AuthUser.getGoldTokens();

                  return (
                    <div className="flex items-center justify-between text-xs px-1 text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-foreground font-bold">
                          Cost: {cost} Token{cost === 1 ? "" : "s"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] bg-muted/60 px-2 py-0.5 rounded-full border border-border/60">
                          <span className="flex items-center gap-1" title="Silver Tokens (Free)">
                            <TokenCoin type="silver" size="xs" />
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{silver}</span>
                          </span>
                          <span className="text-border">|</span>
                          <span className="flex items-center gap-1" title="Gold Tokens (Purchased)">
                            <TokenCoin type="gold" size="xs" showGlow={gold > 0} />
                            <span className="font-mono text-amber-500 font-bold">{gold}</span>
                          </span>
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            window.dispatchEvent(
                              new CustomEvent("bg:show_add_credits_dialog", {
                                detail: {
                                  toolName: tool.name,
                                  toolSlug: tool.slug,
                                  creditCost: cost,
                                  currentCredits,
                                },
                              })
                            );
                          }
                        }}
                        className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-extrabold cursor-pointer text-xs"
                      >
                        <TokenCoin type="gold" size="xs" />
                        <span>Get Gold Tokens</span>
                      </button>
                    </div>
                  );
                })()}

                {/* 1. Primary Convert / Process Image Button */}
                {tool.slug === "color-picker-from-image" ? (
                  <div className="space-y-2 pt-0.5">
                    {/* Primary Active Color Action */}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(pickedHex, "HEX")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black shadow-sm transition-all border-2 bg-accent text-accent-foreground border-accent hover:scale-[1.01] active:scale-95 cursor-pointer"
                      title="Copy picked active color HEX"
                    >
                      {copiedFormat === "HEX" ? <Check className="h-4 w-4 text-emerald-400 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
                      <span>{copiedFormat === "HEX" ? `Copied ${pickedHex} to Clipboard!` : `Copy Active Color (${pickedHex})`}</span>
                    </button>

                    {/* Dual Action Row: Red Download PDF Report Button + Export Palette */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isGeneratingPdfReport}
                        onClick={handleDownloadColorPdfReport}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white active:scale-95 px-3 py-2 text-xs font-black shadow-md hover:shadow-red-600/25 transition-all cursor-pointer disabled:opacity-50 truncate"
                        title="Download official PDF Color & Palette Report"
                      >
                        {isGeneratingPdfReport ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span className="truncate">{isGeneratingPdfReport ? "Generating..." : "Download PDF Report"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const paletteList = colorHistory.length > 0 ? colorHistory : [pickedHex];
                          const paletteContent = [
                            `# BG Tool - Color Palette Export`,
                            `# Active Color: ${pickedHex} | ${pickedRgb} | ${pickedHsl}`,
                            ``,
                            `/* CSS Variables */`,
                            `:root {`,
                            `  --color-active: ${pickedHex};`,
                            ...paletteList.map((hex, i) => `  --color-${i + 1}: ${hex};`),
                            `}`,
                            ``,
                            `/* Sampled Color Hex List (${paletteList.length} colors) */`,
                            ...paletteList,
                          ].join("\n");
                          const blob = new Blob([paletteContent], { type: "text/plain;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `palette-${pickedHex.replace("#", "")}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success(`Exported ${paletteList.length} color palette (.txt)!`);
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-foreground text-background hover:scale-[1.01] active:scale-95 px-3 py-2 text-xs font-black shadow-sm transition-all cursor-pointer truncate"
                        title="Export color palette as .txt"
                      >
                        <Download className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Export Palette (.txt)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={processImage}
                    disabled={
                      processing ||
                      (tool.slug === "pdf-to-image" && pdfIsPasswordProtected && !pdfIsUnlocked) ||
                      (tool.slug === "compress-image" && compressMode === "size" && isTargetSizeExceeding)
                    }
                    className={`w-full flex items-center justify-center gap-2 transition-all border-2 ${tool.slug === "square-your-image" || tool.slug === "meme-generator"
                        ? "rounded-xl px-4 py-2.5 text-sm font-black shadow-md"
                        : "rounded-2xl px-6 py-4 text-base font-extrabold shadow-xl"
                      } ${tool.slug === "pdf-to-image" && pdfIsPasswordProtected && !pdfIsUnlocked
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 cursor-not-allowed opacity-80"
                        : "bg-accent text-accent-foreground border-accent hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      }`}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>
                          {tool.slug === "compress-image"
                            ? "Compressing Image…"
                            : tool.slug === "image-to-word"
                              ? ocrProgressStatus || "Extracting Text & Building Word Doc…"
                              : tool.slug === "image-to-excel"
                                ? ocrProgressStatus || "Extracting Table & Building Excel Sheet…"
                                : tool.slug === "image-to-text-ocr" || tool.slug === "image-to-text"
                                  ? ocrProgressStatus || "Extracting Text with OCR…"
                                  : tool.slug === "binary-to-image"
                                    ? "Decoding Binary Data…"
                                    : tool.slug === "html-to-image"
                                      ? "Rendering HTML to Image…"
                                      : tool.slug === "pdf-to-image"
                                        ? pdfConvertingProgress
                                          ? `Converting Page ${pdfConvertingProgress.current} of ${pdfConvertingProgress.total}…`
                                          : "Rendering PDF to Image…"
                                        : tool.slug === "word-to-image"
                                          ? "Rendering Word Document to Image…"
                                          : tool.slug === "excel-to-image"
                                            ? "Rendering Excel Sheet to Image…"
                                            : tool.slug === "powerpoint-to-image"
                                              ? pptConvertingProgress
                                                ? `Converting Slide ${pptConvertingProgress.current} of ${pptConvertingProgress.total}…`
                                                : "Rendering PowerPoint Slide to Image…"
                                              : tool.slug === "rotate-image"
                                                ? rotateBatch.length > 1
                                                  ? `Rotating All ${rotateBatch.length} Images…`
                                                  : "Rotating Image…"
                                                : "Processing Image…"}
                        </span>
                      </>
                    ) : tool.slug === "pdf-to-image" && pdfIsPasswordProtected && !pdfIsUnlocked ? (
                      <>
                        <Lock className="h-5 w-5 text-amber-500" />
                        <span>Unlock PDF with Password First</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5" />
                        <span>
                          {hasProcessed
                            ? tool.slug === "compress-image"
                              ? "Re-compress Image"
                              : tool.slug === "image-to-word"
                                ? "Re-extract Text (Word)"
                                : tool.slug === "image-to-excel"
                                  ? "Re-extract Table (Excel)"
                                  : tool.slug === "image-to-text-ocr" || tool.slug === "image-to-text"
                                    ? "Re-extract Text (OCR)"
                                    : tool.slug === "binary-to-image"
                                      ? "Re-convert Binary to Image"
                                      : tool.slug === "base64-to-image"
                                        ? `Re-export Image (${base64ExportFormat})`
                                        : tool.slug === "html-to-image"
                                          ? "Re-render HTML to Image"
                                          : tool.slug === "pdf-to-image"
                                            ? pdfPageMode === "all" && pdfTotalPages > 1
                                              ? `Re-convert All ${pdfTotalPages} Pages (ZIP)`
                                              : `Re-convert Page ${pdfDocPage} to ${pdfDocOutputFormat}`
                                            : tool.slug === "word-to-image"
                                              ? wordPageMode === "all" && wordTotalPages > 1
                                                ? `Re-convert All ${wordTotalPages} Pages (ZIP)`
                                                : `Re-convert Page ${wordDocPage} to ${wordDocOutputFormat}`
                                              : tool.slug === "excel-to-image"
                                                ? excelSheetMode === "all" && excelTotalSheets > 1
                                                  ? `Re-convert All ${excelTotalSheets} Sheets (ZIP)`
                                                  : `Re-convert Sheet ${excelDocSheet} to ${excelDocOutputFormat}`
                                                : tool.slug === "powerpoint-to-image"
                                                  ? pptSlideMode === "all" && pptTotalSlides > 1
                                                    ? `Re-convert All ${pptTotalSlides} Slides (ZIP)`
                                                    : `Re-convert Slide ${pptDocSlide} to ${pptDocOutputFormat}`
                                                  : tool.slug === "watermark-image"
                                                    ? "Update Watermarked Image"
                                                    : tool.slug === "square-your-image"
                                                      ? "Update 1:1 Square Image"
                                                      : tool.slug === "rotate-image"
                                                        ? rotateBatch.length > 1
                                                          ? `Update All ${rotateBatch.length} Rotated Images (ZIP)`
                                                          : "Update Rotated Image"
                                                        : tool.slug === "blur-face"
                                                          ? "Update Blurred Faces"
                                                          : tool.slug === "meme-generator"
                                                            ? "Update Meme Image"
                                                            : tool.slug === "resize-image"
                                                              ? "Update Resized Image"
                                                              : tool.slug === "crop-image"
                                                                ? "Update Cropped Image"
                                                                : `Re-process ${tool.name}`
                            : tool.slug === "compress-image"
                              ? "Compress Image"
                              : tool.slug === "image-to-word"
                                ? "Extract Text to Word (.docx)"
                                : tool.slug === "image-to-excel"
                                  ? "Extract Table to Excel (.xlsx)"
                                  : tool.slug === "image-to-text-ocr" || tool.slug === "image-to-text"
                                    ? "Extract Text with OCR"
                                    : tool.slug === "binary-to-image"
                                      ? "Convert Binary to Image"
                                      : tool.slug === "base64-to-image"
                                        ? `Export Image (${base64ExportFormat})`
                                        : tool.slug === "html-to-image"
                                          ? "Render HTML to Image"
                                          : tool.slug === "pdf-to-image"
                                            ? pdfPageMode === "all" && pdfTotalPages > 1
                                              ? `Convert All ${pdfTotalPages} Pages to ${pdfDocOutputFormat} (ZIP)`
                                              : `Convert Page ${pdfDocPage} to ${pdfDocOutputFormat}`
                                            : tool.slug === "word-to-image"
                                              ? wordPageMode === "all" && wordTotalPages > 1
                                                ? `Convert All ${wordTotalPages} Pages to ${wordDocOutputFormat} (ZIP)`
                                                : `Convert Page ${wordDocPage} to ${wordDocOutputFormat}`
                                              : tool.slug === "excel-to-image"
                                                ? excelSheetMode === "all" && excelTotalSheets > 1
                                                  ? `Convert All ${excelTotalSheets} Sheets to ${excelDocOutputFormat} (ZIP)`
                                                  : `Convert Sheet ${excelDocSheet} to ${excelDocOutputFormat}`
                                                : tool.slug === "powerpoint-to-image"
                                                  ? pptSlideMode === "all" && pptTotalSlides > 1
                                                    ? `Convert All ${pptTotalSlides} Slides to ${pptDocOutputFormat} (ZIP)`
                                                    : `Convert Slide ${pptDocSlide} to ${pptDocOutputFormat}`
                                                  : tool.slug === "watermark-image"
                                                    ? "Apply Watermark & View Output"
                                                    : tool.slug === "square-your-image"
                                                      ? "Square Image & View Output"
                                                      : tool.slug === "rotate-image"
                                                        ? rotateBatch.length > 1
                                                          ? `Rotate All ${rotateBatch.length} Images to ${rotateBatchOutputFormat} (ZIP)`
                                                          : "Apply Rotation & View Output"
                                                        : tool.slug === "blur-face"
                                                          ? "Apply Face Blur & View Output"
                                                          : tool.slug === "meme-generator"
                                                            ? "Generate Meme & View Output"
                                                            : tool.slug === "resize-image"
                                                              ? "Resize Image & View Output"
                                                              : tool.slug === "crop-image"
                                                                ? "Crop Image & View Output"
                                                                : "Convert / Process Image"}
                        </span>
                      </>
                    )}
                  </button>
                )}

                {/* Cancel & Return to Processed Result Button */}
                {hasProcessed && isEditingSettings && (
                  <button
                    type="button"
                    onClick={() => setIsEditingSettings(false)}
                    className={`w-full flex items-center justify-center gap-2 border-2 border-border bg-card font-bold text-muted-foreground hover:text-foreground hover:border-foreground transition-all cursor-pointer ${tool.slug === "square-your-image" || tool.slug === "meme-generator"
                        ? "rounded-xl px-4 py-2 text-xs"
                        : "rounded-2xl px-6 py-3.5 text-sm"
                      }`}
                  >
                    <span>Cancel & View Processed Result</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Fullscreen preview, binary lab, and HTML live editor modals */}
      <WorkspaceFullscreenModals
        tool={tool}
        file={file}
        imageSrc={imageSrc}
        processedSrc={processedSrc}
        hasProcessed={hasProcessed}
        dimensions={dimensions}
        outputDimensions={outputDimensions}
        targetWidth={targetWidth}
        targetHeight={targetHeight}
        origSize={origSize}
        newSize={newSize}
        formatBytes={formatBytes}
        handleDownload={handleDownload}
        isFullscreenPreview={isFullscreenPreview}
        setIsFullscreenPreview={setIsFullscreenPreview}
        rotateBatch={rotateBatch}
        fullscreenActiveIndex={fullscreenActiveIndex}
        setFullscreenActiveIndex={setFullscreenActiveIndex}
        handleDownloadSingleRotatedItem={handleDownloadSingleRotatedItem}
        isCodeEditorOpen={isCodeEditorOpen}
        setIsCodeEditorOpen={setIsCodeEditorOpen}
        editorTheme={editorTheme}
        setEditorTheme={setEditorTheme}
        showEditorTopHeading={showEditorTopHeading}
        setShowEditorTopHeading={setShowEditorTopHeading}
        binaryOutputMode={binaryOutputMode}
        setBinaryOutputMode={setBinaryOutputMode}
        generateBinaryData={generateBinaryData}
        binaryStats={binaryStats}
        fullBinaryOutputText={fullBinaryOutputText}
        binaryOutputText={binaryOutputText}
        isEditorSearching={isEditorSearching}
        setIsEditorSearching={setIsEditorSearching}
        editorSearchQuery={editorSearchQuery}
        setEditorSearchQuery={setEditorSearchQuery}
        editorLineWrap={editorLineWrap}
        setEditorLineWrap={setEditorLineWrap}
        editorFontSize={editorFontSize}
        setEditorFontSize={setEditorFontSize}
        copyToClipboard={copyToClipboard}
        binaryBitDepth={binaryBitDepth}
        binaryDelimiter={binaryDelimiter}
        isFullScreenHtmlEditorOpen={isFullScreenHtmlEditorOpen}
        setIsFullScreenHtmlEditorOpen={setIsFullScreenHtmlEditorOpen}
        tempHtmlCode={tempHtmlCode}
        setTempHtmlCode={setTempHtmlCode}
        htmlEditorViewMode={htmlEditorViewMode}
        setHtmlEditorViewMode={setHtmlEditorViewMode}
        setHtmlCodeText={setHtmlCodeText}
        htmlRenderWidth={htmlRenderWidth}
        htmlRenderHeight={htmlRenderHeight}
      />
    </div>
  );
}
