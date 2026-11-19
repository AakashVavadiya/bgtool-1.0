// Interactive Refrens-style GST & Tax Invoice Builder with 10 Premium Themes and Default Brand Orange (#ff5500).
import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Copy,
  Image as ImageIcon,
  PenTool,
  FileText,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Building2,
  Phone,
  Mail,
  X,
  Upload,
  Palette,
  Landmark,
  Percent,
  Tag,
  LayoutTemplate,
  Type,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  numberToInvoiceWords,
  type InvoiceData,
  type InvoiceItem,
  type InvoiceThemeId,
} from "@/lib/pdf-engine";
import { type Tool } from "@/lib/tools";
import { AdminStore } from "@/admin/lib/admin-store";
import { AuthUser } from "@/lib/auth-user";
import { TokenCoin } from "@/components/TokenCoins";
import { toast } from "sonner";

export interface PremiumThemeConfig {
  id: InvoiceThemeId;
  name: string;
  subtitle: string;
  badge: string;
  defaultColor: string;
  defaultFont: "sans" | "serif" | "mono";
  graphicStyle:
  | "dual-wave"
  | "bottom-swoosh"
  | "angle-slash"
  | "split-hero-banner"
  | "sidebar-ribbon"
  | "editorial-crest"
  | "cyber-grid"
  | "gst-seal-frame"
  | "fluid-blobs"
  | "chevron-header";
}

const PREMIUM_INVOICE_THEMES: PremiumThemeConfig[] = [
  {
    id: "executive-orange",
    name: "1. Dual Wave Graphic Pro",
    subtitle: "Sculpted top-left & bottom-right S-curves with segmented table header",
    badge: "Default",
    defaultColor: "#ff5500",
    defaultFont: "sans",
    graphicStyle: "dual-wave",
  },
  {
    id: "modern-banner",
    name: "2. Dynamic Diagonal Slash",
    subtitle: "Full-width angled polygon banner with floating summary card",
    badge: "Popular",
    defaultColor: "#ea580c",
    defaultFont: "sans",
    graphicStyle: "angle-slash",
  },
  {
    id: "minimal-swiss",
    name: "3. Minimal Bottom Wave",
    subtitle: "Giant editorial INVOICE display with overlapping dual-tone bottom waves",
    badge: "Minimal",
    defaultColor: "#18181b",
    defaultFont: "sans",
    graphicStyle: "bottom-swoosh",
  },
  {
    id: "corporate-split",
    name: "4. Corporate Split Hero",
    subtitle: "Asymmetric two-column colored top block with 3-stat invoice bar",
    badge: "Corporate",
    defaultColor: "#042f40",
    defaultFont: "sans",
    graphicStyle: "split-hero-banner",
  },
  {
    id: "luxury-editorial",
    name: "5. Luxury Gold Crest & Arch",
    subtitle: "Centered dome arch crest, gold double-lines & classic serif typography",
    badge: "Luxury",
    defaultColor: "#9a3412",
    defaultFont: "serif",
    graphicStyle: "editorial-crest",
  },
  {
    id: "tech-mono",
    name: "6. SaaS Terminal Dark Grid",
    subtitle: "Dark-mode terminal top card, 4-metric KPI strip & monospace grid",
    badge: "SaaS / Tech",
    defaultColor: "#2563eb",
    defaultFont: "mono",
    graphicStyle: "cyber-grid",
  },
  {
    id: "bold-sidebar",
    name: "7. Vertical Spine Studio",
    subtitle: "Full-height left colored sidebar column with rotated watermark title",
    badge: "Creative",
    defaultColor: "#d97706",
    defaultFont: "sans",
    graphicStyle: "sidebar-ribbon",
  },
  {
    id: "gst-pro-ledger",
    name: "8. Indian GST Ledger Grid",
    subtitle: "Full outer ornamental seal frame with boxed tax ledger table cells",
    badge: "GST Official",
    defaultColor: "#5b21b6",
    defaultFont: "sans",
    graphicStyle: "gst-seal-frame",
  },
  {
    id: "agency-studio",
    name: "9. Creative Circle & Clouds",
    subtitle: "Layered organic corner circles & wave clouds with pill item cards",
    badge: "Studio",
    defaultColor: "#e11d48",
    defaultFont: "sans",
    graphicStyle: "fluid-blobs",
  },
  {
    id: "compact-enterprise",
    name: "10. Emerald V-Chevron Pro",
    subtitle: "Architectural V-chevron header & footer with center badge & striped grid",
    badge: "Enterprise",
    defaultColor: "#059669",
    defaultFont: "sans",
    graphicStyle: "chevron-header",
  },
];

const THEME_SWATCHES = [
  { name: "Brand Orange (Default)", hex: "#ff5500" },
  { name: "Sunset Amber", hex: "#ea580c" },
  { name: "Refrens Purple", hex: "#5b21b6" },
  { name: "Royal Blue", hex: "#2563eb" },
  { name: "Emerald Green", hex: "#059669" },
  { name: "Carbon Slate", hex: "#0f172a" },
  { name: "Ruby Red", hex: "#e11d48" },
  { name: "Teal Ocean", hex: "#0d9488" },
  { name: "Warm Terracotta", hex: "#9a3412" },
  { name: "Indigo Night", hex: "#4338ca" },
];

const CURRENCY_OPTIONS = [
  { code: "INR", symbol: "₹", label: "Indian Rupee (INR, ₹)" },
  { code: "USD", symbol: "$", label: "US Dollar (USD, $)" },
  { code: "EUR", symbol: "€", label: "Euro (EUR, €)" },
  { code: "GBP", symbol: "£", label: "British Pound (GBP, £)" },
  { code: "AED", symbol: "AED ", label: "UAE Dirham (AED)" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar (AUD, A$)" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar (CAD, C$)" },
];

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Canada",
  "Australia",
  "Singapore",
  "Germany",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_SHORT = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function parseIsoDateString(isoStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
    const [y, m, d] = isoStr.split("-").map(Number);
    const dt = new Date(y!, (m || 1) - 1, d || 1);
    if (!isNaN(dt.getTime())) return dt;
  }
  return new Date();
}

function toIsoDateString(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(isoStr: string): string {
  if (!isoStr) return "Select date";
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
    const [y, m, d] = isoStr.split("-").map(Number);
    const monthName = MONTH_NAMES[(m || 1) - 1]?.slice(0, 3) || "Jan";
    return `${String(d).padStart(2, "0")} ${monthName} ${y} (${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y})`;
  }
  return isoStr;
}

interface CustomInvoiceDatePickerProps {
  value: string;
  onChange: (nextIso: string) => void;
  accentColor: string;
  showDuePresets?: boolean;
  baseIssueDate?: string;
}

function CustomInvoiceDatePicker({
  value,
  onChange,
  accentColor,
  showDuePresets = false,
  baseIssueDate,
}: CustomInvoiceDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const parsedCurrent = parseIsoDateString(value);
  const [viewYear, setViewYear] = useState<number>(() => parsedCurrent.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => parsedCurrent.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dt = parseIsoDateString(value);
    setViewYear(dt.getFullYear());
    setViewMonth(dt.getMonth());
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Build 42-day Monday-start calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  // getDay() is 0 (Sun) - 6 (Sat); convert to 0 (Mon) - 6 (Sun)
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarCells: Array<{ day: number; monthOffset: -1 | 0 | 1; iso: string }> = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const dt = new Date(viewYear, viewMonth - 1, d);
    calendarCells.push({ day: d, monthOffset: -1, iso: toIsoDateString(dt) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(viewYear, viewMonth, d);
    calendarCells.push({ day: d, monthOffset: 0, iso: toIsoDateString(dt) });
  }
  const remaining = 42 - calendarCells.length;
  for (let d = 1; d <= remaining; d++) {
    const dt = new Date(viewYear, viewMonth + 1, d);
    calendarCells.push({ day: d, monthOffset: 1, iso: toIsoDateString(dt) });
  }

  const todayIso = toIsoDateString(new Date());

  const stepMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const applyOffsetDays = (days: number) => {
    const base = baseIssueDate ? parseIsoDateString(baseIssueDate) : new Date();
    const target = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
    const iso = toIsoDateString(target);
    onChange(iso);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 border-b py-1.5 text-left text-sm font-bold transition-colors cursor-pointer ${
          isOpen
            ? "border-[#ff5500] text-slate-900 dark:text-white"
            : "border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white hover:border-[#ff5500]"
        }`}
      >
        <span className="truncate">{formatDisplayDate(value)}</span>
        <Calendar className="h-4 w-4 shrink-0" style={{ color: accentColor }} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 w-76 sm:w-80 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Top Month & Year Selector Header */}
          <div className="flex items-center justify-between gap-1.5 mb-3">
            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2 py-1 text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2 py-1 text-xs font-mono font-extrabold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => stepMonth(-1)}
                className="h-7 w-7 rounded-lg border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => stepMonth(1)}
                className="h-7 w-7 rounded-lg border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Date Presets (Today / Net 7 / Net 15 / Net 30) */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3 pb-2.5 border-b border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                onChange(todayIso);
                setIsOpen(false);
              }}
              className="rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-orange-500/15 hover:text-[#ff5500] px-2.5 py-1 text-[11px] font-extrabold text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              Today
            </button>
            {showDuePresets ? (
              <>
                {[
                  { label: "+7 Days", days: 7 },
                  { label: "+15 Days", days: 15 },
                  { label: "+30 Days", days: 30 },
                  { label: "+45 Days", days: 45 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyOffsetDays(p.days)}
                    className="rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-orange-500/15 hover:text-[#ff5500] px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => applyOffsetDays(-1)}
                  className="rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-orange-500/15 hover:text-[#ff5500] px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => applyOffsetDays(1)}
                  className="rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-orange-500/15 hover:text-[#ff5500] px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  Tomorrow
                </button>
              </>
            )}
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {WEEKDAY_SHORT.map((wd) => (
              <div key={wd} className="text-[11px] font-extrabold text-slate-400 dark:text-zinc-500 py-0.5">
                {wd}
              </div>
            ))}
          </div>

          {/* 42-Day Calendar Matrix */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              const isSelected = cell.iso === value;
              const isToday = cell.iso === todayIso;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => {
                    onChange(cell.iso);
                    setIsOpen(false);
                  }}
                  className={`h-8 w-full rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? "text-white font-black shadow-md scale-105"
                      : cell.monthOffset !== 0
                        ? "text-slate-300 dark:text-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        : isToday
                          ? "border-2 text-slate-900 dark:text-white font-black"
                          : "text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                  style={
                    isSelected
                      ? { backgroundColor: accentColor }
                      : isToday
                        ? { borderColor: accentColor }
                        : undefined
                  }
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Direct Custom ISO / Manual Date Input & Footer Actions */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="w-28 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1 text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-[#ff5500]"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onChange(todayIso);
                  setIsOpen(false);
                }}
                className="text-xs font-extrabold hover:underline cursor-pointer"
                style={{ color: accentColor }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg bg-slate-900 dark:bg-white text-white dark:text-zinc-900 px-2.5 py-1 text-[11px] font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface RefrensInvoiceStudioProps {
  tool: Tool;
  invoiceData: InvoiceData;
  setInvoiceData: React.Dispatch<React.SetStateAction<InvoiceData>>;
  processing: boolean;
  handleProcess: () => void;
}

export function RefrensInvoiceStudio({
  tool,
  invoiceData,
  setInvoiceData,
  processing,
  handleProcess,
}: RefrensInvoiceStudioProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const sigPadRef = useRef<HTMLCanvasElement>(null);

  // Step 1 = Add Invoice Details, Step 2 = Select from 10 Premium Themes & Live Preview
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  const [showSubtitle, setShowSubtitle] = useState<boolean>(() => Boolean(invoiceData.documentSubtitle));
  const [showDueDate, setShowDueDate] = useState<boolean>(true);

  // Party extra field toggles
  const [showCompanyGstin, setShowCompanyGstin] = useState<boolean>(true);
  const [showCompanyPan, setShowCompanyPan] = useState<boolean>(() => Boolean(invoiceData.companyPan));
  const [showCompanyEmail, setShowCompanyEmail] = useState<boolean>(() => Boolean(invoiceData.companyEmail));
  const [showCompanyPhone, setShowCompanyPhone] = useState<boolean>(() => Boolean(invoiceData.companyPhone));

  const [showClientGstin, setShowClientGstin] = useState<boolean>(true);
  const [showClientPan, setShowClientPan] = useState<boolean>(() => Boolean(invoiceData.clientPan));
  const [showClientEmail, setShowClientEmail] = useState<boolean>(() => Boolean(invoiceData.clientEmail));
  const [showClientPhone, setShowClientPhone] = useState<boolean>(() => Boolean(invoiceData.clientPhone));

  // Optional bottom sections
  const [showDiscount, setShowDiscount] = useState<boolean>(() => Boolean(invoiceData.discountValue));
  const [showExtraCharges, setShowExtraCharges] = useState<boolean>(() => Boolean(invoiceData.additionalChargesAmount));
  const [showBankDetails, setShowBankDetails] = useState<boolean>(true);
  const [showTerms, setShowTerms] = useState<boolean>(true);
  const [showNotes, setShowNotes] = useState<boolean>(() => Boolean(invoiceData.notes));
  const [showSignaturePad, setShowSignaturePad] = useState<boolean>(false);
  const [isDrawingSig, setIsDrawingSig] = useState<boolean>(false);
  const [openDescRows, setOpenDescRows] = useState<Record<string, boolean>>({});

  const themeColor = invoiceData.themeColor || "#ff5500";
  const activeTemplateId: InvoiceThemeId = invoiceData.invoiceTemplate || "executive-orange";
  const activeThemeObj =
    PREMIUM_INVOICE_THEMES.find((t) => t.id === activeTemplateId) || PREMIUM_INVOICE_THEMES[0]!;
  const activeFont = invoiceData.invoiceFont || activeThemeObj.defaultFont;
  const taxMode = invoiceData.taxMode || "gst_intra";
  const curr = invoiceData.currency || "₹";

  const updateField = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) => {
    setInvoiceData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectPremiumTheme = (theme: PremiumThemeConfig) => {
    setInvoiceData((prev) => ({
      ...prev,
      invoiceTemplate: theme.id,
      themeColor: theme.defaultColor,
      invoiceFont: theme.defaultFont,
    }));
    toast.success(`Applied "${theme.name}" theme`);
  };

  const handleImageFileToDataUrl = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logoDataUrl" | "signatureDataUrl",
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a PNG or JPG image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField(field, reader.result);
        toast.success(`${label} uploaded.`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Signature Pad drawing handlers
  const startSigDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigPadRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawingSig(true);
  };

  const moveSigDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig) return;
    const canvas = sigPadRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const endSigDraw = () => {
    if (!isDrawingSig) return;
    setIsDrawingSig(false);
    const canvas = sigPadRef.current;
    if (canvas) {
      updateField("signatureDataUrl", canvas.toDataURL("image/png"));
    }
  };

  const clearSigPad = () => {
    const canvas = sigPadRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    updateField("signatureDataUrl", undefined);
  };

  // Line Item handlers
  const updateItem = (idx: number, patch: Partial<InvoiceItem>) => {
    const next = [...invoiceData.items];
    const target = next[idx];
    if (!target) return;
    next[idx] = { ...target, ...patch };
    updateField("items", next);
  };

  const addNewLineItem = () => {
    const newItem: InvoiceItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      description: "",
      subDescription: "",
      hsnSac: "",
      quantity: 1,
      rate: 100,
      taxPercent: taxMode === "none" ? 0 : 18,
    };
    updateField("items", [...invoiceData.items, newItem]);
  };

  const duplicateLineItem = (idx: number) => {
    const source = invoiceData.items[idx];
    if (!source) return;
    const copy: InvoiceItem = {
      ...source,
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    const next = [...invoiceData.items];
    next.splice(idx + 1, 0, copy);
    updateField("items", next);
  };

  const removeLineItem = (idx: number) => {
    if (invoiceData.items.length <= 1) return;
    updateField(
      "items",
      invoiceData.items.filter((_, i) => i !== idx)
    );
  };

  // Live financial calculations
  let taxableSubtotal = 0;
  let totalTaxAmount = 0;
  invoiceData.items.forEach((it) => {
    const qty = Number(it.quantity) || 0;
    const rate = Number(it.rate) || 0;
    const taxPct = taxMode === "none" ? 0 : Number(it.taxPercent) || 0;
    const amt = qty * rate;
    const tax = (amt * taxPct) / 100;
    taxableSubtotal += amt;
    totalTaxAmount += tax;
  });

  const rawDisc = Number(invoiceData.discountValue) || 0;
  const discountAmount =
    invoiceData.discountType === "percent"
      ? (taxableSubtotal * Math.min(100, Math.max(0, rawDisc))) / 100
      : Math.max(0, rawDisc);
  const extraCharges = Number(invoiceData.additionalChargesAmount) || 0;
  const grandTotal = Math.max(0, taxableSubtotal - discountAmount + totalTaxAmount + extraCharges);
  const totalInWords = numberToInvoiceWords(grandTotal, curr);

  const selectedCurrencyObj = CURRENCY_OPTIONS.find((c) => c.symbol === curr) || CURRENCY_OPTIONS[0]!;
  const fontClass =
    activeFont === "serif" ? "font-serif" : activeFont === "mono" ? "font-mono" : "font-sans";

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Hidden File Inputs for Logo & Signature */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => handleImageFileToDataUrl(e, "logoDataUrl", "Business logo")}
        className="hidden"
      />
      <input
        ref={sigInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => handleImageFileToDataUrl(e, "signatureDataUrl", "Signature")}
        className="hidden"
      />

      {/* Top Interactive Stepper & Quick Configuration Bar */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-md flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        {/* Interactive Clickable Stepper Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold transition-all cursor-pointer shrink-0 ${activeStep === 1
                ? "text-white shadow-md scale-[1.02]"
                : "border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 hover:border-orange-500/50"
              }`}
            style={activeStep === 1 ? { backgroundColor: themeColor } : undefined}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${activeStep === 1 ? "bg-white/25 text-white" : "bg-emerald-500 text-white"
                }`}
            >
              {activeStep > 1 ? <Check className="h-3 w-3 stroke-[3]" /> : "1"}
            </span>
            <span>Add Invoice Details</span>
          </button>

          <span className="text-slate-300 dark:text-zinc-700 font-bold">→</span>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold transition-all cursor-pointer shrink-0 ${activeStep === 2
                ? "text-white shadow-md scale-[1.02]"
                : "border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 hover:border-orange-500/50"
              }`}
            style={activeStep === 2 ? { backgroundColor: themeColor } : undefined}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${activeStep === 2 ? "bg-white/25 text-white" : "bg-slate-200 dark:bg-zinc-700"
                }`}
            >
              2
            </span>
            <span>Select Theme (10 Premium Templates)</span>
          </button>

          <span className="text-slate-300 dark:text-zinc-700 font-bold">→</span>

          <button
            type="button"
            disabled={processing}
            onClick={handleProcess}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 hover:bg-orange-500 hover:text-white hover:border-orange-500 px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 transition-all cursor-pointer shrink-0"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-700 text-[11px] font-black text-slate-700 dark:text-zinc-200">
              3
            </span>
            <span>Download PDF</span>
          </button>
        </div>

        {/* Theme Swatches, Tax Mode & Currency */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Color Swatches (Orange Default) */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-800/60 px-3.5 py-2 shadow-2xs">
            <Palette className="h-4 w-4 text-slate-400 shrink-0 mr-0.5" />
            {THEME_SWATCHES.slice(0, 6).map((sw) => {
              const isSelectedColor = themeColor.toLowerCase() === sw.hex.toLowerCase();
              return (
                <button
                  key={sw.hex}
                  type="button"
                  onClick={() => updateField("themeColor", sw.hex)}
                  title={sw.name}
                  className={`relative h-6 w-6 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${isSelectedColor
                      ? "ring-2 ring-slate-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 shadow-sm"
                      : "opacity-85 hover:opacity-100 hover:scale-105"
                    }`}
                  style={{ backgroundColor: sw.hex }}
                >
                  {isSelectedColor && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                </button>
              );
            })}
            <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700 mx-0.5" />
            <label
              title="Custom brand color"
              className="relative inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-1.5 pr-2.5 py-0.5 text-[11px] font-mono font-bold text-slate-700 dark:text-zinc-200 hover:border-[#ff5500] transition-colors cursor-pointer shrink-0"
            >
              <span
                className="h-4 w-4 rounded-full border border-black/10 shrink-0"
                style={{ backgroundColor: themeColor }}
              />
              <span className="uppercase">{themeColor}</span>
              <input
                type="color"
                value={themeColor}
                onChange={(e) => updateField("themeColor", e.target.value)}
                className="sr-only"
              />
            </label>
          </div>

          {/* Configure Tax Mode */}
          <select
            value={taxMode}
            onChange={(e) => updateField("taxMode", e.target.value as InvoiceData["taxMode"])}
            className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#ff5500] cursor-pointer"
          >
            <option value="gst_intra">GST (CGST + SGST · Intra-State)</option>
            <option value="gst_inter">GST (IGST · Inter-State)</option>
            <option value="standard">Standard Tax / VAT</option>
            <option value="none">No Tax / Non-GST</option>
          </select>

          {/* Currency Selector */}
          <select
            value={curr}
            onChange={(e) => updateField("currency", e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#ff5500] cursor-pointer"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.code} value={c.symbol}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STEP 2: 10 PREMIUM INVOICE THEMES & LIVE A4 VISUAL PREVIEW */}
      {activeStep === 2 ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
          {/* 10 Premium Themes Selector Panel */}
          <div className="rounded-3xl border-2 border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ff5500]/10 border border-[#ff5500]/25 px-3 py-1 text-[11px] font-black text-[#ff5500] uppercase tracking-wider mb-1.5">
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  <span>Step 2 of 3 · 10 Premium Invoice Templates</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Choose Your Premium Invoice Theme &amp; Brand Color
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Select any of the 10 studio-designed layouts below. Your live invoice preview and exported PDF update immediately.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Edit Details</span>
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleProcess}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-white shadow-lg hover:opacity-95 transition-all cursor-pointer"
                  style={{ backgroundColor: themeColor }}
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span>Download PDF Invoice</span>
                </button>
              </div>
            </div>

            {/* 10 Premium Graphical Themes Grid (Portrait A4 Miniature Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {PREMIUM_INVOICE_THEMES.map((theme) => {
                const isSelected = activeTemplateId === theme.id;
                const previewColor = isSelected ? themeColor : theme.defaultColor;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectPremiumTheme(theme)}
                    className={`group relative text-left rounded-2xl border-2 p-3 transition-all cursor-pointer flex flex-col justify-between ${isSelected
                        ? "border-[#ff5500] bg-orange-50/40 dark:bg-orange-950/20 shadow-lg ring-2 ring-[#ff5500]/20"
                        : "border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/30 hover:border-slate-400 dark:hover:border-zinc-600 hover:bg-white dark:hover:bg-zinc-800/60"
                      }`}
                  >
                    {/* Portrait A4 Mini Sheet Container - 10 Distinct Structural Architectures */}
                    <div className="w-full rounded-xl bg-slate-200/70 dark:bg-zinc-950/70 p-3 mb-3 flex items-center justify-center">
                      <div className="w-full max-w-[165px] aspect-[1/1.36] rounded-lg bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-md overflow-hidden relative flex flex-col justify-between transition-transform group-hover:scale-[1.02]">
                        {/* 1. DUAL WAVE GRAPHIC PRO (Top-Left S-Wave + Segmented Table Header + Bottom-Right S-Wave) */}
                        {theme.graphicStyle === "dual-wave" && (
                          <div className="relative h-full w-full p-2.5 flex flex-col justify-between">
                            <svg viewBox="0 0 200 70" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-11 pointer-events-none">
                              <path d="M 0,0 L 155,0 C 118,34 65,64 0,52 Z" fill={previewColor} fillOpacity="0.22" />
                              <path d="M 0,0 L 138,0 C 104,28 55,52 0,42 Z" fill={previewColor} />
                            </svg>
                            <svg viewBox="0 0 200 70" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-11 pointer-events-none">
                              <path d="M 0,32 C 45,20 90,38 135,70 L 0,70 Z" fill={previewColor} fillOpacity="0.24" />
                              <path d="M 35,70 C 95,28 155,16 200,10 L 200,70 Z" fill={previewColor} />
                            </svg>
                            <div className="relative z-10 flex items-start justify-between pt-0.5">
                              <div className="space-y-0.5">
                                <span className="block h-2 w-11 rounded-xs bg-white" />
                                <span className="block h-1 w-7 rounded-xs bg-white/70" />
                              </div>
                              <span className="text-[8px] font-black tracking-wider" style={{ color: previewColor }}>INVOICE</span>
                            </div>
                            <div className="relative z-10 space-y-1.5 my-auto">
                              <div className="flex justify-between items-end px-0.5">
                                <div className="space-y-0.5">
                                  <div className="h-1 w-7 rounded-xs" style={{ backgroundColor: previewColor }} />
                                  <div className="h-1 w-11 rounded-xs bg-slate-300 dark:bg-zinc-600" />
                                </div>
                                <div className="space-y-0.5 text-right">
                                  <div className="h-1 w-8 rounded-xs bg-slate-300 dark:bg-zinc-600 ml-auto" />
                                  <div className="h-1 w-6 rounded-xs bg-slate-200 dark:bg-zinc-700 ml-auto" />
                                </div>
                              </div>
                              {/* Segmented 5-column table header like Uploaded Image 2 */}
                              <div className="grid grid-cols-12 gap-0.5">
                                <div className="col-span-2 h-2.5 rounded-xs" style={{ backgroundColor: previewColor }} />
                                <div className="col-span-5 h-2.5 rounded-xs" style={{ backgroundColor: previewColor }} />
                                <div className="col-span-2 h-2.5 rounded-xs" style={{ backgroundColor: previewColor }} />
                                <div className="col-span-3 h-2.5 rounded-xs" style={{ backgroundColor: previewColor }} />
                              </div>
                              <div className="h-1.5 w-full rounded-xs bg-slate-100 dark:bg-zinc-800" />
                              <div className="h-1.5 w-full rounded-xs bg-slate-50 dark:bg-zinc-800/40" />
                              <div className="h-1.5 w-full rounded-xs bg-slate-100 dark:bg-zinc-800" />
                            </div>
                            <div className="relative z-10 flex items-end justify-between pb-2.5">
                              <div className="space-y-0.5">
                                <div className="h-1 w-8 rounded-xs bg-slate-300" />
                                <div className="h-1 w-6 rounded-xs bg-slate-200" />
                              </div>
                              <div className="h-3.5 w-12 rounded-full shadow-xs" style={{ backgroundColor: previewColor }} />
                            </div>
                          </div>
                        )}

                        {/* 2. DYNAMIC DIAGONAL SLASH (Full Angled Banner + Floating White Badge + Corner Wedge) */}
                        {theme.graphicStyle === "angle-slash" && (
                          <div className="relative h-full w-full p-2.5 flex flex-col justify-between">
                            <svg viewBox="0 0 200 75" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-12 pointer-events-none">
                              <polygon points="0,0 200,0 200,28 0,72" fill={previewColor} fillOpacity="0.22" />
                              <polygon points="0,0 200,0 200,18 0,60" fill={previewColor} />
                            </svg>
                            <svg viewBox="0 0 200 50" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-8 pointer-events-none">
                              <polygon points="40,50 200,10 200,50" fill={previewColor} fillOpacity="0.24" />
                              <polygon points="85,50 200,20 200,50" fill={previewColor} />
                            </svg>
                            <div className="relative z-10 flex items-start justify-between">
                              <span className="text-[8px] font-black text-white tracking-wider">TAX INVOICE</span>
                              <div className="rounded bg-white px-1.5 py-0.5 shadow-xs border border-slate-100">
                                <div className="h-1.5 w-6 rounded-xs" style={{ backgroundColor: previewColor }} />
                              </div>
                            </div>
                            <div className="relative z-10 space-y-1.5 my-auto pt-2">
                              <div className="grid grid-cols-2 gap-1">
                                <div className="rounded bg-slate-50 dark:bg-zinc-800 p-1 border-l-2" style={{ borderColor: previewColor }}>
                                  <div className="h-1 w-7 rounded-xs bg-slate-400" />
                                  <div className="h-1 w-5 rounded-xs bg-slate-200 mt-0.5" />
                                </div>
                                <div className="rounded bg-slate-50 dark:bg-zinc-800 p-1 border-l-2" style={{ borderColor: previewColor }}>
                                  <div className="h-1 w-7 rounded-xs bg-slate-400" />
                                  <div className="h-1 w-5 rounded-xs bg-slate-200 mt-0.5" />
                                </div>
                              </div>
                              <div className="h-2 w-full rounded-xs" style={{ backgroundColor: previewColor }} />
                              <div className="h-1.5 w-full rounded-xs bg-slate-100 dark:bg-zinc-800" />
                              <div className="h-1.5 w-full rounded-xs bg-slate-100 dark:bg-zinc-800" />
                            </div>
                            <div className="relative z-10 flex justify-end pb-2">
                              <div className="h-4 w-14 rounded-md shadow-xs" style={{ backgroundColor: previewColor }} />
                            </div>
                          </div>
                        )}

                        {/* 3. MINIMAL BOTTOM WAVE (Uploaded Image 1: Giant Editorial INVOICE + Soft Gray Bar + Dual Bottom Wave) */}
                        {theme.graphicStyle === "bottom-swoosh" && (
                          <div className="relative h-full w-full p-2.5 flex flex-col justify-between">
                            <svg viewBox="0 0 200 75" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-12 pointer-events-none">
                              <path d="M 0,25 C 55,15 100,42 145,75 L 0,75 Z" fill={previewColor} fillOpacity="0.24" />
                              <path d="M 25,75 C 85,26 150,15 200,5 L 200,75 Z" fill={previewColor} />
                            </svg>
                            <div className="relative z-10 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[6px] font-bold text-slate-500">LOGO</span>
                                <span className="text-[6px] font-mono text-slate-500">NO. 001</span>
                              </div>
                              <div className="text-[13px] font-black tracking-tight leading-none pt-0.5" style={{ color: previewColor }}>
                                INVOICE
                              </div>
                            </div>
                            <div className="relative z-10 space-y-1.5 my-auto">
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div className="space-y-0.5">
                                  <div className="h-1 w-6 rounded-xs bg-slate-800 dark:bg-zinc-300" />
                                  <div className="h-1 w-9 rounded-xs bg-slate-300 dark:bg-zinc-600" />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="h-1 w-6 rounded-xs bg-slate-800 dark:bg-zinc-300" />
                                  <div className="h-1 w-9 rounded-xs bg-slate-300 dark:bg-zinc-600" />
                                </div>
                              </div>
                              <div className="h-2.5 w-full rounded-xs bg-slate-200 dark:bg-zinc-700" />
                              <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800" />
                              <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800" />
                              <div className="border-t border-b border-slate-300 dark:border-zinc-700 py-0.5 flex justify-end">
                                <div className="h-1.5 w-8 rounded-xs" style={{ backgroundColor: previewColor }} />
                              </div>
                            </div>
                            <div className="relative z-10 h-6" />
                          </div>
                        )}

                        {/* 4. CORPORATE SPLIT HERO (2-Column Colored Top Hero Block + 3-Metric Strip + Bottom Bar) */}
                        {theme.graphicStyle === "split-hero-banner" && (
                          <div className="relative h-full w-full flex flex-col justify-between">
                            <div className="p-2.5 text-white flex items-center justify-between" style={{ backgroundColor: previewColor }}>
                              <div className="space-y-0.5">
                                <div className="h-2 w-11 rounded-xs bg-white" />
                                <div className="h-1 w-7 rounded-xs bg-white/70" />
                              </div>
                              <div className="text-right">
                                <div className="text-[8px] font-black tracking-wider">INVOICE</div>
                                <div className="h-1 w-6 rounded-xs bg-white/80 ml-auto mt-0.5" />
                              </div>
                            </div>
                            <div className="px-2.5 space-y-1.5 my-auto">
                              {/* 3-Stat KPI Strip */}
                              <div className="grid grid-cols-3 gap-1 rounded bg-slate-100 dark:bg-zinc-800 p-1">
                                <div className="h-2 rounded-xs bg-white dark:bg-zinc-900" />
                                <div className="h-2 rounded-xs bg-white dark:bg-zinc-900" />
                                <div className="h-2 rounded-xs" style={{ backgroundColor: previewColor }} />
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <div className="space-y-0.5">
                                  <div className="h-1 w-6 rounded-xs" style={{ backgroundColor: previewColor }} />
                                  <div className="h-1 w-10 rounded-xs bg-slate-300" />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="h-1 w-6 rounded-xs" style={{ backgroundColor: previewColor }} />
                                  <div className="h-1 w-10 rounded-xs bg-slate-300" />
                                </div>
                              </div>
                              <div className="h-2 w-full rounded-xs" style={{ backgroundColor: previewColor }} />
                              <div className="h-1.5 w-full rounded-xs bg-slate-100 dark:bg-zinc-800" />
                              <div className="h-1.5 w-full rounded-xs bg-slate-100 dark:bg-zinc-800" />
                            </div>
                            <div className="px-2.5 pb-2">
                              <div className="flex justify-end mb-1.5">
                                <div className="h-3.5 w-12 rounded-xs" style={{ backgroundColor: previewColor }} />
                              </div>
                              <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: previewColor }} />
                            </div>
                          </div>
                        )}

                        {/* 5. LUXURY GOLD CREST & ARCH (Ornamental Dome Arch + Floating Crest Pill + Double Rules) */}
                        {theme.graphicStyle === "editorial-crest" && (
                          <div className="relative h-full w-full p-2.5 flex flex-col justify-between bg-amber-50/25 dark:bg-zinc-900">
                            <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-9 pointer-events-none">
                              <path d="M 0,0 L 200,0 L 200,20 Q 100,58 0,20 Z" fill={previewColor} fillOpacity="0.22" />
                              <path d="M 0,0 L 200,0 L 200,12 Q 100,48 0,12 Z" fill={previewColor} />
                            </svg>
                            <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-6 pointer-events-none">
                              <path d="M 0,40 L 0,22 Q 100,0 200,22 L 200,40 Z" fill={previewColor} fillOpacity="0.2" />
                            </svg>
                            <div className="relative z-10 flex justify-center pt-2">
                              <span
                                className="rounded-full bg-white dark:bg-zinc-900 px-2.5 py-0.5 text-[7px] font-serif font-black tracking-widest shadow-xs border"
                                style={{ color: previewColor, borderColor: previewColor }}
                              >
                                INVOICE
                              </span>
                            </div>
                            <div className="relative z-10 space-y-1.5 my-auto">
                              <div className="border-y py-1 grid grid-cols-2 gap-1 text-center" style={{ borderColor: `${previewColor}55` }}>
                                <div className="h-1.5 w-8 mx-auto rounded-xs bg-slate-400" />
                                <div className="h-1.5 w-8 mx-auto rounded-xs bg-slate-400" />
                              </div>
                              <div className="h-2 w-full rounded-xs" style={{ backgroundColor: previewColor }} />
                              <div className="h-1.5 w-full rounded-xs bg-slate-200/70 dark:bg-zinc-800" />
                              <div className="h-1.5 w-full rounded-xs bg-slate-200/70 dark:bg-zinc-800" />
                            </div>
                            <div className="relative z-10 flex justify-center pb-1.5">
                              <div className="h-3.5 w-14 rounded-full border-2 flex items-center justify-center" style={{ borderColor: previewColor }}>
                                <div className="h-1 w-8 rounded-xs" style={{ backgroundColor: previewColor }} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 6. SAAS TERMINAL DARK GRID (Dark Slate Header Card + 4-Metric Strip + Monospace Grid) */}
                        {theme.graphicStyle === "cyber-grid" && (
                          <div className="relative h-full w-full p-2 flex flex-col justify-between">
                            <div className="rounded-md bg-slate-900 text-white p-2 flex items-center justify-between">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-0.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                </div>
                                <div className="text-[7px] font-mono font-black tracking-tight pt-0.5">INVOICE.SH</div>
                              </div>
                              <span className="rounded px-1 py-0.5 text-[6px] font-mono font-bold text-white" style={{ backgroundColor: previewColor }}>
                                #001
                              </span>
                            </div>
                            <div className="space-y-1 my-auto">
                              <div className="grid grid-cols-4 gap-0.5">
                                <div className="h-2.5 rounded-xs bg-slate-100 dark:bg-zinc-800 border-t-2" style={{ borderColor: previewColor }} />
                                <div className="h-2.5 rounded-xs bg-slate-100 dark:bg-zinc-800 border-t-2" style={{ borderColor: previewColor }} />
                                <div className="h-2.5 rounded-xs bg-slate-100 dark:bg-zinc-800 border-t-2" style={{ borderColor: previewColor }} />
                                <div className="h-2.5 rounded-xs bg-slate-100 dark:bg-zinc-800 border-t-2" style={{ borderColor: previewColor }} />
                              </div>
                              <div className="rounded border border-slate-200 dark:border-zinc-700 overflow-hidden">
                                <div className="h-2 w-full bg-slate-900" />
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 my-0.5" />
                                <div className="h-1.5 w-full bg-slate-50 dark:bg-zinc-800/50" />
                              </div>
                            </div>
                            <div className="rounded bg-slate-900 p-1.5 flex items-center justify-between">
                              <span className="h-1 w-6 rounded-xs bg-slate-400" />
                              <span className="h-2 w-9 rounded-xs" style={{ backgroundColor: previewColor }} />
                            </div>
                          </div>
                        )}

                        {/* 7. VERTICAL SPINE STUDIO (Wide Left Colored Sidebar Column + Right Content Sheet) */}
                        {theme.graphicStyle === "sidebar-ribbon" && (
                          <div className="relative h-full w-full flex">
                            <div
                              className="w-7 h-full p-1 flex flex-col items-center justify-between text-white shrink-0"
                              style={{ backgroundColor: previewColor }}
                            >
                              <div className="h-3 w-3 rounded-full bg-white/30" />
                              <span className="text-[7px] font-black tracking-widest uppercase [writing-mode:vertical-rl] rotate-180 opacity-90">
                                INVOICE
                              </span>
                              <div className="h-1 w-3 rounded-xs bg-white/60" />
                            </div>
                            <div className="flex-1 p-2 flex flex-col justify-between relative overflow-hidden">
                              <div className="space-y-0.5 border-b pb-1" style={{ borderColor: previewColor }}>
                                <div className="h-2 w-12 rounded-xs" style={{ backgroundColor: previewColor }} />
                                <div className="h-1 w-8 rounded-xs bg-slate-300" />
                              </div>
                              <div className="space-y-1 my-auto">
                                <div className="space-y-0.5">
                                  <div className="h-1 w-6 rounded-xs" style={{ backgroundColor: previewColor }} />
                                  <div className="h-1 w-14 rounded-xs bg-slate-300" />
                                </div>
                                <div className="h-2 w-full rounded-xs" style={{ backgroundColor: previewColor }} />
                                <div className="h-1.5 w-full rounded-xs bg-slate-100 dark:bg-zinc-800" />
                                <div className="h-1.5 w-full rounded-xs bg-slate-100 dark:bg-zinc-800" />
                              </div>
                              <div className="flex justify-end">
                                <div className="h-3.5 w-12 rounded-md" style={{ backgroundColor: previewColor }} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 8. INDIAN GST LEDGER GRID (Outer Frame + Corner Ribbons + Full Boxed Ledger Grid Table) */}
                        {theme.graphicStyle === "gst-seal-frame" && (
                          <div className="relative h-full w-full p-2 flex flex-col justify-between">
                            <div className="absolute inset-1.5 border-2 pointer-events-none rounded-md" style={{ borderColor: previewColor }} />
                            <svg viewBox="0 0 40 40" className="absolute top-1.5 left-1.5 w-4 h-4 pointer-events-none">
                              <polygon points="0,0 40,0 0,40" fill={previewColor} />
                            </svg>
                            <svg viewBox="0 0 40 40" className="absolute top-1.5 right-1.5 w-4 h-4 pointer-events-none">
                              <polygon points="40,0 0,0 40,40" fill={previewColor} />
                            </svg>
                            <div className="relative z-10 text-center pt-1">
                              <div className="text-[7px] font-black uppercase tracking-wider" style={{ color: previewColor }}>
                                GST TAX INVOICE
                              </div>
                              <div className="h-0.5 w-12 mx-auto mt-0.5" style={{ backgroundColor: previewColor }} />
                            </div>
                            <div className="relative z-10 px-1 space-y-1 my-auto">
                              <div className="grid grid-cols-2 border rounded-xs overflow-hidden" style={{ borderColor: `${previewColor}66` }}>
                                <div className="p-1 border-r" style={{ borderColor: `${previewColor}66` }}>
                                  <div className="h-1 w-6 rounded-xs" style={{ backgroundColor: previewColor }} />
                                  <div className="h-1 w-8 rounded-xs bg-slate-300 mt-0.5" />
                                </div>
                                <div className="p-1">
                                  <div className="h-1 w-6 rounded-xs" style={{ backgroundColor: previewColor }} />
                                  <div className="h-1 w-8 rounded-xs bg-slate-300 mt-0.5" />
                                </div>
                              </div>
                              <div className="border rounded-xs overflow-hidden" style={{ borderColor: previewColor }}>
                                <div className="h-2 w-full" style={{ backgroundColor: previewColor }} />
                                <div className="grid grid-cols-3 divide-x border-t h-2" style={{ borderColor: `${previewColor}44` }}>
                                  <div />
                                  <div />
                                  <div />
                                </div>
                                <div className="grid grid-cols-3 divide-x border-t h-2" style={{ borderColor: `${previewColor}44` }}>
                                  <div />
                                  <div />
                                  <div />
                                </div>
                              </div>
                            </div>
                            <div className="relative z-10 px-1 pb-1">
                              <div className="h-3 w-full rounded-xs" style={{ backgroundColor: previewColor }} />
                            </div>
                          </div>
                        )}

                        {/* 9. CREATIVE CIRCLE & CLOUDS (Organic Corner Circles + Floating Pill Rows) */}
                        {theme.graphicStyle === "fluid-blobs" && (
                          <div className="relative h-full w-full p-2.5 flex flex-col justify-between overflow-hidden">
                            <div
                              className="absolute -top-6 -right-6 w-16 h-16 rounded-full pointer-events-none"
                              style={{ backgroundColor: previewColor, opacity: 0.22 }}
                            />
                            <div
                              className="absolute -top-4 -left-4 w-14 h-14 rounded-full pointer-events-none"
                              style={{ backgroundColor: previewColor }}
                            />
                            <div
                              className="absolute -bottom-6 -right-5 w-16 h-16 rounded-full pointer-events-none"
                              style={{ backgroundColor: previewColor }}
                            />
                            <div className="relative z-10 flex items-center justify-between">
                              <span className="h-2 w-2 rounded-full bg-white" />
                              <span
                                className="rounded-full px-2 py-0.5 text-[7px] font-black text-white"
                                style={{ backgroundColor: previewColor }}
                              >
                                INVOICE
                              </span>
                            </div>
                            <div className="relative z-10 space-y-1 my-auto">
                              <div className="rounded-lg p-1.5 flex justify-between" style={{ backgroundColor: `${previewColor}15` }}>
                                <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: previewColor }} />
                                <div className="h-1.5 w-8 rounded-full bg-slate-400" />
                              </div>
                              <div className="h-2.5 w-full rounded-full" style={{ backgroundColor: previewColor }} />
                              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800" />
                              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800" />
                            </div>
                            <div className="relative z-10 flex justify-start pb-1">
                              <div className="h-3.5 w-12 rounded-full" style={{ backgroundColor: previewColor }} />
                            </div>
                          </div>
                        )}

                        {/* 10. EMERALD V-CHEVRON PRO (Sharp V-Apex Top Shield + Center Crest + V-Footer) */}
                        {theme.graphicStyle === "chevron-header" && (
                          <div className="relative h-full w-full p-2.5 flex flex-col justify-between">
                            <svg viewBox="0 0 200 65" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-11 pointer-events-none">
                              <polygon points="0,0 200,0 200,24 100,62 0,24" fill={previewColor} fillOpacity="0.24" />
                              <polygon points="0,0 200,0 200,14 100,50 0,14" fill={previewColor} />
                            </svg>
                            <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-6 pointer-events-none">
                              <polygon points="0,40 100,8 200,40" fill={previewColor} />
                            </svg>
                            <div className="relative z-10 flex justify-center pt-3">
                              <div
                                className="h-5 w-12 rounded-md bg-white dark:bg-zinc-900 shadow-xs border-2 flex items-center justify-center"
                                style={{ borderColor: previewColor }}
                              >
                                <span className="text-[6px] font-black" style={{ color: previewColor }}>INVOICE</span>
                              </div>
                            </div>
                            <div className="relative z-10 space-y-1 my-auto">
                              <div className="grid grid-cols-2 gap-1">
                                <div className="h-3 rounded-xs bg-slate-100 dark:bg-zinc-800" />
                                <div className="h-3 rounded-xs bg-slate-100 dark:bg-zinc-800" />
                              </div>
                              <div className="h-2 w-full rounded-xs" style={{ backgroundColor: previewColor }} />
                              <div className="h-1.5 w-full rounded-xs bg-slate-100 dark:bg-zinc-800" />
                              <div className="h-1.5 w-full rounded-xs bg-slate-100 dark:bg-zinc-800" />
                            </div>
                            <div className="relative z-10 flex justify-end pb-3">
                              <div className="h-3 w-11 rounded-xs" style={{ backgroundColor: previewColor }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {theme.name}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase shrink-0 text-white"
                          style={{ backgroundColor: previewColor }}
                        >
                          {theme.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-snug">
                        {theme.subtitle}
                      </p>
                    </div>

                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-md z-20"
                        style={{ backgroundColor: themeColor }}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Color Palette & Typography Fine-Tuning Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200/80 dark:border-zinc-800">
              {/* 10 Executive Color Swatches */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-[#ff5500]" />
                  <span>Theme Accent Color (Orange Default)</span>
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  {THEME_SWATCHES.map((sw) => {
                    const isSwActive = themeColor.toLowerCase() === sw.hex.toLowerCase();
                    return (
                      <button
                        key={sw.hex}
                        type="button"
                        onClick={() => updateField("themeColor", sw.hex)}
                        title={sw.name}
                        className={`h-7 w-7 rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0 ${isSwActive
                            ? "ring-2 ring-slate-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 shadow-sm"
                            : "opacity-85 hover:opacity-100 hover:scale-105"
                          }`}
                        style={{ backgroundColor: sw.hex }}
                      >
                        {isSwActive && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                  <label className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 pl-1.5 pr-3 py-1 text-[11px] font-mono font-bold text-slate-700 dark:text-zinc-200 hover:border-[#ff5500] cursor-pointer">
                    <span
                      className="h-4 w-4 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: themeColor }}
                    />
                    <span className="uppercase">{themeColor}</span>
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => updateField("themeColor", e.target.value)}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {/* Font Family Selector */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5 text-[#ff5500]" />
                  <span>Document Typography</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "sans", label: "Modern Sans", sub: "Helvetica" },
                    { id: "serif", label: "Classic Serif", sub: "Times Editorial" },
                    { id: "mono", label: "Tech Mono", sub: "Courier Code" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updateField("invoiceFont", f.id as "sans" | "serif" | "mono")}
                      className={`rounded-xl border px-3 py-2 text-left transition-all cursor-pointer ${activeFont === f.id
                          ? "border-[#ff5500] bg-orange-50/50 dark:bg-orange-950/30 text-slate-900 dark:text-white font-bold shadow-xs"
                          : "border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400"
                        }`}
                    >
                      <div className="text-xs font-extrabold">{f.label}</div>
                      <div className="text-[10px] opacity-75">{f.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* LIVE FULL-SHEET A4 PREVIEW IN SELECTED PREMIUM GRAPHICAL THEME */}
          <div className="rounded-3xl border-2 border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden relative">
            {/* TOP & SIDE GRAPHICAL ARTWORK OVERLAYS */}
            {activeThemeObj.graphicStyle === "dual-wave" && (
              <div className="relative h-36 sm:h-44 w-full overflow-hidden select-none">
                <svg viewBox="0 0 800 180" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                  <path d="M 0,0 L 580,0 C 440,105 230,185 0,148 Z" fill={themeColor} fillOpacity="0.22" />
                  <path d="M 0,0 L 535,0 C 400,90 205,162 0,128 Z" fill={themeColor} />
                </svg>
                <div className="relative z-10 h-full px-6 sm:px-10 md:px-12 pt-6 flex items-start justify-between">
                  <div className="text-white max-w-xs">
                    {invoiceData.logoDataUrl ? (
                      <img
                        src={invoiceData.logoDataUrl}
                        alt="Logo"
                        className="max-h-12 max-w-[160px] object-contain bg-white/95 rounded-lg px-2.5 py-1 shadow-sm"
                      />
                    ) : (
                      <>
                        <div className="text-xl sm:text-2xl font-black tracking-tight uppercase">
                          {invoiceData.companyName || "BRAND NAME"}
                        </div>
                        <div className="text-[11px] font-semibold opacity-85">
                          {invoiceData.companyCityState || invoiceData.companyAddress || "YOUR TAGLINE HERE"}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="text-right pt-2">
                    <h2
                      className="text-2xl sm:text-4xl font-black tracking-widest uppercase"
                      style={{ color: themeColor }}
                    >
                      {invoiceData.documentTitle || "INVOICE"}
                    </h2>
                    {invoiceData.documentSubtitle && (
                      <p className="text-xs text-slate-500 font-bold mt-0.5">{invoiceData.documentSubtitle}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeThemeObj.graphicStyle === "angle-slash" && (
              <div className="relative h-32 sm:h-40 w-full overflow-hidden select-none">
                <svg viewBox="0 0 800 160" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                  <polygon points="0,0 800,0 530,152 0,98" fill={themeColor} fillOpacity="0.2" />
                  <polygon points="0,0 740,0 470,132 0,84" fill={themeColor} />
                </svg>
                <div className="relative z-10 h-full px-6 sm:px-10 md:px-12 pt-6 flex items-start justify-between">
                  <div className="text-white">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
                      {invoiceData.documentTitle || "TAX INVOICE"}
                    </h2>
                    <p className="text-xs opacity-90 font-semibold">
                      {invoiceData.companyName || "Your Business"}
                    </p>
                  </div>
                  <div className="text-right bg-white/95 dark:bg-zinc-900/95 rounded-2xl px-4 py-2 shadow-md border border-slate-200/70">
                    <div className="text-[10px] font-black uppercase text-slate-400">Invoice No</div>
                    <div className="text-base sm:text-lg font-black font-mono" style={{ color: themeColor }}>
                      #{invoiceData.invoiceNumber}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeThemeObj.graphicStyle === "split-hero-banner" && (
              <div className="w-full overflow-hidden select-none">
                <div
                  className="px-6 sm:px-10 md:px-12 py-7 text-white flex flex-wrap items-center justify-between gap-4"
                  style={{ backgroundColor: themeColor }}
                >
                  <div className="space-y-1">
                    {invoiceData.logoDataUrl ? (
                      <img
                        src={invoiceData.logoDataUrl}
                        alt="Logo"
                        className="max-h-12 max-w-[160px] object-contain bg-white rounded-lg px-2.5 py-1"
                      />
                    ) : (
                      <div className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
                        {invoiceData.companyName || "CORPORATE ENTERPRISE"}
                      </div>
                    )}
                    <div className="text-xs opacity-85">
                      {[invoiceData.companyAddress, invoiceData.companyCityState].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-extrabold uppercase tracking-widest opacity-80">Official Document</div>
                    <h2 className="text-2xl sm:text-4xl font-black tracking-wider uppercase">
                      {invoiceData.documentTitle || "INVOICE"}
                    </h2>
                  </div>
                </div>
                {/* 3-Metric Corporate KPI Bar */}
                <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-zinc-800 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-xs">
                  <div className="px-6 py-3">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Invoice Number</div>
                    <div className="font-mono font-black text-sm text-slate-900 dark:text-white">#{invoiceData.invoiceNumber}</div>
                  </div>
                  <div className="px-6 py-3">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Issue Date</div>
                    <div className="font-mono font-black text-sm text-slate-900 dark:text-white">{invoiceData.issueDate}</div>
                  </div>
                  <div className="px-6 py-3" style={{ backgroundColor: `${themeColor}14` }}>
                    <div className="text-[10px] font-bold uppercase" style={{ color: themeColor }}>Amount Due</div>
                    <div className="font-mono font-black text-sm" style={{ color: themeColor }}>
                      {curr}{grandTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeThemeObj.graphicStyle === "editorial-crest" && (
              <div className="relative h-28 sm:h-32 w-full overflow-hidden select-none">
                <svg viewBox="0 0 800 130" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                  <path d="M 0,0 L 800,0 L 800,52 Q 400,130 0,52 Z" fill={themeColor} fillOpacity="0.18" />
                  <path d="M 0,0 L 800,0 L 800,36 Q 400,112 0,36 Z" fill={themeColor} />
                </svg>
                <div className="relative z-10 h-full flex flex-col items-center justify-center pt-4">
                  <span className="rounded-full bg-white dark:bg-zinc-900 px-6 py-1.5 text-lg sm:text-2xl font-serif font-black tracking-widest uppercase shadow-md border-2" style={{ color: themeColor, borderColor: themeColor }}>
                    {invoiceData.documentTitle || "INVOICE"}
                  </span>
                </div>
              </div>
            )}

            {activeThemeObj.graphicStyle === "cyber-grid" && (
              <div className="p-6 sm:px-10 md:px-12 pb-0 select-none">
                <div className="rounded-2xl bg-slate-950 text-white p-6 flex flex-wrap items-center justify-between gap-4 shadow-lg border border-slate-800">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-rose-500" />
                      <span className="h-3 w-3 rounded-full bg-amber-400" />
                      <span className="h-3 w-3 rounded-full bg-emerald-400" />
                      <span className="text-[11px] font-mono text-slate-400 ml-2">~/billing/{invoiceData.invoiceNumber}.json</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight">
                      {invoiceData.documentTitle || "INVOICE"}
                    </h2>
                  </div>
                  <div className="font-mono text-right space-y-1">
                    <span className="inline-block rounded-lg px-3.5 py-1.5 text-xs font-black text-white" style={{ backgroundColor: themeColor }}>
                      ID #{invoiceData.invoiceNumber}
                    </span>
                    <div className="text-[11px] text-slate-400">DATE: {invoiceData.issueDate}</div>
                  </div>
                </div>
              </div>
            )}

            {activeThemeObj.graphicStyle === "fluid-blobs" && (
              <div className="relative h-32 sm:h-36 w-full overflow-hidden select-none">
                <div
                  className="absolute -top-16 -left-12 w-56 h-56 rounded-full pointer-events-none"
                  style={{ backgroundColor: themeColor }}
                />
                <div
                  className="absolute -top-20 left-32 w-48 h-48 rounded-full pointer-events-none"
                  style={{ backgroundColor: themeColor, opacity: 0.2 }}
                />
                <div
                  className="absolute -top-16 -right-12 w-52 h-52 rounded-full pointer-events-none"
                  style={{ backgroundColor: themeColor, opacity: 0.16 }}
                />
                <div className="relative z-10 h-full px-6 sm:px-10 md:px-12 pt-6 flex items-start justify-between">
                  <div className="text-white">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                      {invoiceData.documentTitle || "Tax Invoice"}
                    </h2>
                    <p className="text-xs opacity-90 font-bold">{invoiceData.companyName}</p>
                  </div>
                  <span
                    className="rounded-full px-5 py-2 text-xs font-black font-mono text-white shadow-md"
                    style={{ backgroundColor: themeColor }}
                  >
                    #{invoiceData.invoiceNumber}
                  </span>
                </div>
              </div>
            )}

            {activeThemeObj.graphicStyle === "chevron-header" && (
              <div className="relative h-32 sm:h-36 w-full overflow-hidden select-none">
                <svg viewBox="0 0 800 140" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                  <polygon points="0,0 800,0 800,52 400,136 0,52" fill={themeColor} fillOpacity="0.22" />
                  <polygon points="0,0 800,0 800,34 400,112 0,34" fill={themeColor} />
                </svg>
                <div className="relative z-10 h-full px-6 sm:px-10 md:px-12 flex flex-col items-center justify-center pt-4">
                  <div
                    className="rounded-xl bg-white dark:bg-zinc-900 px-6 py-2 shadow-lg border-2 text-center"
                    style={{ borderColor: themeColor }}
                  >
                    <div className="text-lg sm:text-2xl font-black uppercase tracking-wider" style={{ color: themeColor }}>
                      {invoiceData.documentTitle || "INVOICE"}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-slate-500">
                      #{invoiceData.invoiceNumber} · {invoiceData.issueDate}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeThemeObj.graphicStyle === "sidebar-ribbon" && (
              <div
                className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 z-10 flex flex-col items-center justify-between py-8 text-white select-none"
                style={{ backgroundColor: themeColor }}
              >
                <div className="h-8 w-8 rounded-full bg-white/25 flex items-center justify-center font-black text-xs">
                  {(invoiceData.companyName || "B")[0]}
                </div>
                <span className="text-lg sm:text-2xl font-black tracking-[0.35em] uppercase [writing-mode:vertical-rl] rotate-180 opacity-90">
                  {invoiceData.documentTitle || "INVOICE"}
                </span>
                <div className="text-[10px] font-mono font-bold opacity-80 [writing-mode:vertical-rl] rotate-180">
                  #{invoiceData.invoiceNumber}
                </div>
              </div>
            )}

            <div
              className={`relative z-10 p-6 sm:p-10 md:p-12 space-y-6 ${fontClass} ${activeThemeObj.graphicStyle === "gst-seal-frame" ? "m-4 sm:m-6 border-2 rounded-2xl" : ""
                } ${activeThemeObj.graphicStyle === "sidebar-ribbon" ? "pl-16 sm:pl-24" : ""}`}
              style={activeThemeObj.graphicStyle === "gst-seal-frame" ? { borderColor: themeColor } : undefined}
            >
              {/* Corner Triangles for GST Seal Frame */}
              {activeThemeObj.graphicStyle === "gst-seal-frame" && (
                <>
                  <svg viewBox="0 0 60 60" className="absolute top-0 left-0 w-10 h-10 pointer-events-none">
                    <polygon points="0,0 60,0 0,60" fill={themeColor} />
                  </svg>
                  <svg viewBox="0 0 60 60" className="absolute top-0 right-0 w-10 h-10 pointer-events-none">
                    <polygon points="60,0 0,0 60,60" fill={themeColor} />
                  </svg>
                </>
              )}

              {/* Minimal Bottom Swoosh Header (Matches Uploaded Image 1: Logo Top-Left, NO. Top-Right, Huge INVOICE Title) */}
              {activeThemeObj.graphicStyle === "bottom-swoosh" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between text-xs font-bold tracking-widest uppercase text-slate-700 dark:text-zinc-300">
                    <div>
                      {invoiceData.logoDataUrl ? (
                        <img src={invoiceData.logoDataUrl} alt="Logo" className="max-h-12 max-w-[150px] object-contain" />
                      ) : (
                        <span className="font-black text-sm">{invoiceData.companyName || "YOUR LOGO"}</span>
                      )}
                    </div>
                    <div className="font-mono text-sm">NO. {invoiceData.invoiceNumber}</div>
                  </div>
                  <div>
                    <h2
                      className="text-4xl sm:text-5xl font-black tracking-tight uppercase"
                      style={{ color: themeColor }}
                    >
                      {invoiceData.documentTitle || "INVOICE"}
                    </h2>
                    {invoiceData.documentSubtitle && (
                      <p className="text-xs text-slate-500 mt-1">{invoiceData.documentSubtitle}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Header for Sidebar Ribbon or GST Seal Frame */}
              {(activeThemeObj.graphicStyle === "sidebar-ribbon" ||
                activeThemeObj.graphicStyle === "gst-seal-frame" ||
                activeThemeObj.graphicStyle === "chevron-header") && (
                  <div className="border-b-2 pb-3 flex items-end justify-between" style={{ borderColor: themeColor }}>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black uppercase" style={{ color: themeColor }}>
                        {invoiceData.documentTitle || "Tax Invoice"}
                      </h2>
                      {invoiceData.documentSubtitle && (
                        <p className="text-xs text-slate-500 mt-0.5">{invoiceData.documentSubtitle}</p>
                      )}
                    </div>
                    <span className="text-sm font-mono font-black text-slate-700 dark:text-zinc-300">
                      #{invoiceData.invoiceNumber}
                    </span>
                  </div>
                )}

              {/* Metadata & Logo Row */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold w-28 inline-block">Invoice No:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{invoiceData.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold w-28 inline-block">Invoice Date:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{invoiceData.issueDate}</span>
                  </div>
                  {invoiceData.dueDate && (
                    <div>
                      <span className="text-slate-500 font-bold w-28 inline-block">Due Date:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{invoiceData.dueDate}</span>
                    </div>
                  )}
                  {(invoiceData.customFields || []).map((cf) => (
                    <div key={cf.id}>
                      <span className="text-slate-500 font-bold w-28 inline-block">{cf.label}:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{cf.value}</span>
                    </div>
                  ))}
                </div>

                {invoiceData.logoDataUrl &&
                  activeThemeObj.graphicStyle !== "dual-wave" &&
                  activeThemeObj.graphicStyle !== "bottom-swoosh" && (
                    <img
                      src={invoiceData.logoDataUrl}
                      alt="Business Logo"
                      className="max-h-16 max-w-[180px] object-contain"
                    />
                  )}
              </div>

              {/* Billed By & Billed To Preview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`rounded-2xl p-4 space-y-1 text-xs ${activeThemeObj.graphicStyle === "bottom-swoosh" ? "border-0 px-0" : "border"
                    }`}
                  style={{
                    backgroundColor:
                      activeThemeObj.graphicStyle === "bottom-swoosh"
                        ? "transparent"
                        : `${themeColor}08`,
                    borderColor:
                      activeThemeObj.graphicStyle === "gst-seal-frame" ? themeColor : `${themeColor}28`,
                  }}
                >
                  <div className="text-xs font-black uppercase tracking-wider" style={{ color: themeColor }}>
                    Billed By
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">{invoiceData.companyName}</div>
                  <div className="text-slate-600 dark:text-zinc-400">{invoiceData.companyAddress}</div>
                  {invoiceData.companyCityState && (
                    <div className="text-slate-600 dark:text-zinc-400">{invoiceData.companyCityState}</div>
                  )}
                  {invoiceData.companyGstin && (
                    <div className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                      GSTIN: {invoiceData.companyGstin}
                    </div>
                  )}
                  {invoiceData.companyPan && (
                    <div className="font-mono text-slate-700 dark:text-zinc-300">PAN: {invoiceData.companyPan}</div>
                  )}
                  {(invoiceData.companyCustomFields || []).map((cf) =>
                    cf.label || cf.value ? (
                      <div key={cf.id} className="text-slate-700 dark:text-zinc-300">
                        <span className="font-bold">{cf.label || "Field"}:</span> {cf.value}
                      </div>
                    ) : null
                  )}
                </div>

                <div
                  className={`rounded-2xl p-4 space-y-1 text-xs ${activeThemeObj.graphicStyle === "bottom-swoosh" ? "border-0 px-0" : "border"
                    }`}
                  style={{
                    backgroundColor:
                      activeThemeObj.graphicStyle === "bottom-swoosh"
                        ? "transparent"
                        : `${themeColor}08`,
                    borderColor:
                      activeThemeObj.graphicStyle === "gst-seal-frame" ? themeColor : `${themeColor}28`,
                  }}
                >
                  <div className="text-xs font-black uppercase tracking-wider" style={{ color: themeColor }}>
                    Billed To
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">{invoiceData.clientName}</div>
                  <div className="text-slate-600 dark:text-zinc-400">{invoiceData.clientAddress}</div>
                  {invoiceData.clientCityState && (
                    <div className="text-slate-600 dark:text-zinc-400">{invoiceData.clientCityState}</div>
                  )}
                  {invoiceData.clientGstin && (
                    <div className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                      GSTIN: {invoiceData.clientGstin}
                    </div>
                  )}
                  {invoiceData.clientPan && (
                    <div className="font-mono text-slate-700 dark:text-zinc-300">PAN: {invoiceData.clientPan}</div>
                  )}
                  {(invoiceData.clientCustomFields || []).map((cf) =>
                    cf.label || cf.value ? (
                      <div key={cf.id} className="text-slate-700 dark:text-zinc-300">
                        <span className="font-bold">{cf.label || "Field"}:</span> {cf.value}
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              {/* Line Items Table Preview */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr
                      className={`font-bold ${activeThemeObj.graphicStyle === "bottom-swoosh"
                          ? "bg-slate-200/80 dark:bg-zinc-800 text-slate-900 dark:text-white"
                          : "text-white"
                        }`}
                      style={
                        activeThemeObj.graphicStyle === "bottom-swoosh"
                          ? undefined
                          : { backgroundColor: themeColor }
                      }
                    >
                      <th className="py-2.5 px-3">SL</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      {taxMode !== "none" && <th className="py-2.5 px-3">HSN/SAC</th>}
                      {taxMode !== "none" && <th className="py-2.5 px-3">Tax %</th>}
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                    {invoiceData.items.map((it, i) => {
                      const amt = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
                      const tx = taxMode === "none" ? 0 : (amt * (Number(it.taxPercent) || 0)) / 100;
                      return (
                        <tr key={it.id} className={i % 2 === 1 ? "bg-slate-50/70 dark:bg-zinc-800/30" : ""}>
                          <td className="py-2.5 px-3 font-mono">{String(i + 1).padStart(2, "0")}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            {it.description || "Item"}
                            {it.subDescription && (
                              <span className="block text-[11px] font-normal text-slate-500">{it.subDescription}</span>
                            )}
                          </td>
                          {taxMode !== "none" && <td className="py-2.5 px-3 font-mono">{it.hsnSac || "-"}</td>}
                          {taxMode !== "none" && <td className="py-2.5 px-3 font-mono">{it.taxPercent}%</td>}
                          <td className="py-2.5 px-3 text-center font-mono">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{curr}{Number(it.rate).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{curr}{amt.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-black">{curr}{(amt + tx).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Totals & Bank Preview */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 pb-16">
                <div className="md:col-span-7 space-y-2 text-xs text-slate-600 dark:text-zinc-400">
                  {(invoiceData.bankAccountNumber || invoiceData.bankName || invoiceData.upiId) && (
                    <div>
                      <div className="font-black text-slate-900 dark:text-white" style={{ color: themeColor }}>
                        Bank &amp; Payment Details
                      </div>
                      {invoiceData.bankAccountHolder && <div>Account Holder: {invoiceData.bankAccountHolder}</div>}
                      {invoiceData.bankAccountNumber && <div>A/C No: {invoiceData.bankAccountNumber}</div>}
                      {invoiceData.bankIfscCode && <div>IFSC: {invoiceData.bankIfscCode}</div>}
                      {invoiceData.bankName && <div>Bank: {invoiceData.bankName}</div>}
                      {invoiceData.upiId && <div>UPI: {invoiceData.upiId}</div>}
                    </div>
                  )}
                  {invoiceData.terms && (
                    <div>
                      <div className="font-black text-slate-900 dark:text-white" style={{ color: themeColor }}>
                        Terms &amp; Conditions
                      </div>
                      <p className="whitespace-pre-line text-[11px]">{invoiceData.terms}</p>
                    </div>
                  )}
                  <div className="pt-2 font-bold text-slate-800 dark:text-zinc-200">
                    Thank You For Your Business!
                  </div>
                </div>

                <div className="md:col-span-5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-mono font-bold">{curr}{taxableSubtotal.toFixed(2)}</span>
                  </div>
                  {taxMode === "gst_intra" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">CGST</span>
                        <span className="font-mono font-bold">{curr}{(totalTaxAmount / 2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">SGST</span>
                        <span className="font-mono font-bold">{curr}{(totalTaxAmount / 2).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {(taxMode === "gst_inter" || taxMode === "standard") && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">{taxMode === "gst_inter" ? "IGST" : "Tax"}</span>
                      <span className="font-mono font-bold">{curr}{totalTaxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div
                    className="rounded-full px-5 py-3 text-white flex items-center justify-between font-black text-sm shadow-md"
                    style={{ backgroundColor: themeColor }}
                  >
                    <span>Total ({selectedCurrencyObj.code})</span>
                    <span className="font-mono text-base">{curr}{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 pt-1">
                    {totalInWords}
                  </div>
                  {invoiceData.signatureDataUrl && (
                    <div className="pt-3 flex flex-col items-end">
                      <img src={invoiceData.signatureDataUrl} alt="Signature" className="max-h-14 object-contain" />
                      <span className="text-[11px] font-bold text-slate-500 mt-1 border-t border-slate-300 pt-1 px-3">
                        {invoiceData.signatureLabel || "Authorized Signatory"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BOTTOM GRAPHICAL WAVE / SWOOSH / POLYGON FOOTER ARTWORK */}
            {(activeThemeObj.graphicStyle === "dual-wave" || activeThemeObj.graphicStyle === "bottom-swoosh") && (
              <div className="relative h-24 sm:h-28 w-full -mt-14 pointer-events-none select-none overflow-hidden">
                <svg viewBox="0 0 800 130" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M 0,48 C 180,25 340,75 490,130 L 0,130 Z" fill={themeColor} fillOpacity="0.22" />
                  <path d="M 160,130 C 370,42 590,18 800,12 L 800,130 Z" fill={themeColor} />
                </svg>
              </div>
            )}

            {activeThemeObj.graphicStyle === "angle-slash" && (
              <div className="relative h-20 w-full -mt-12 pointer-events-none select-none overflow-hidden">
                <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="w-full h-full">
                  <polygon points="180,100 800,18 800,100" fill={themeColor} fillOpacity="0.22" />
                  <polygon points="310,100 800,32 800,100" fill={themeColor} />
                </svg>
              </div>
            )}

            {activeThemeObj.graphicStyle === "fluid-blobs" && (
              <div className="relative h-20 w-full -mt-12 pointer-events-none select-none overflow-hidden">
                <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M 0,100 L 0,48 C 220,10 460,85 800,26 L 800,100 Z" fill={themeColor} fillOpacity="0.18" />
                  <path d="M 240,100 C 440,38 640,56 800,28 L 800,100 Z" fill={themeColor} />
                </svg>
              </div>
            )}

            {activeThemeObj.graphicStyle === "sidebar-ribbon" && (
              <div className="relative h-20 w-full -mt-12 pointer-events-none select-none overflow-hidden">
                <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M 800,100 L 280,100 C 430,52 620,18 800,24 Z" fill={themeColor} fillOpacity="0.22" />
                  <path d="M 800,100 L 380,100 C 510,64 670,34 800,40 Z" fill={themeColor} />
                </svg>
              </div>
            )}

            {activeThemeObj.graphicStyle === "chevron-header" && (
              <div className="relative h-14 w-full -mt-8 pointer-events-none select-none overflow-hidden">
                <svg viewBox="0 0 800 70" preserveAspectRatio="none" className="w-full h-full">
                  <polygon points="0,70 400,18 800,70" fill={themeColor} />
                </svg>
              </div>
            )}

            {/* Bottom Step 2 Action Bar */}
            <div className="bg-slate-50 dark:bg-zinc-950/60 border-t border-slate-200 dark:border-zinc-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-3 text-xs font-extrabold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Edit Invoice Details</span>
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={handleProcess}
                className="inline-flex items-center gap-2.5 rounded-2xl px-8 py-3.5 text-sm sm:text-base font-black text-white shadow-xl hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                style={{ backgroundColor: themeColor }}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating Tax Invoice PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    <span>Generate &amp; Download PDF Invoice</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 1: Main Single-Sheet WYSIWYG Invoice Document Editor */
        <div className="rounded-3xl border-2 border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-10 md:p-12 shadow-2xl space-y-8">
          {/* 1. Centered Editable Invoice Title & Subtitle */}
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="inline-flex items-center gap-2 border-b-2 border-dashed border-slate-300 dark:border-zinc-700 pb-1 px-3 focus-within:border-[#ff5500]">
              <input
                type="text"
                value={invoiceData.documentTitle ?? "Tax Invoice"}
                onChange={(e) => updateField("documentTitle", e.target.value)}
                placeholder="Tax Invoice"
                className="font-display text-2xl sm:text-3xl font-black text-center bg-transparent text-slate-900 dark:text-white focus:outline-none w-56 sm:w-72"
              />
              <PenTool className="h-4 w-4 text-slate-400 shrink-0" />
            </div>

            {showSubtitle ? (
              <div className="inline-flex items-center gap-1.5">
                <input
                  type="text"
                  value={invoiceData.documentSubtitle ?? ""}
                  onChange={(e) => updateField("documentSubtitle", e.target.value)}
                  placeholder="Enter subtitle (e.g. Original for Recipient)"
                  className="text-xs font-semibold text-center bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-1 text-slate-600 dark:text-zinc-300 focus:outline-none w-64"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowSubtitle(false);
                    updateField("documentSubtitle", "");
                  }}
                  className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                  title="Remove subtitle"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubtitle(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Subtitle</span>
              </button>
            )}
          </div>

          {/* 2. Top Metadata Fields (Left) & Business Logo Upload Box (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
            {/* Left 7 Columns: Invoice No, Invoice Date, Due Date, Custom Fields */}
            <div className="md:col-span-7 space-y-3.5 max-w-md">
              <div className="grid grid-cols-12 items-center gap-3">
                <label className="col-span-5 text-xs font-bold text-slate-600 dark:text-zinc-400 underline decoration-dotted underline-offset-4">
                  Invoice No<span className="text-rose-500">*</span>
                </label>
                <div className="col-span-7">
                  <input
                    type="text"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => updateField("invoiceNumber", e.target.value)}
                    placeholder="A00001"
                    className="w-full border-b border-slate-300 dark:border-zinc-700 bg-transparent py-1.5 text-sm font-bold text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 items-center gap-3">
                <label className="col-span-5 text-xs font-bold text-slate-600 dark:text-zinc-400 underline decoration-dotted underline-offset-4">
                  Invoice Date<span className="text-rose-500">*</span>
                </label>
                <div className="col-span-7 flex items-center">
                  <CustomInvoiceDatePicker
                    value={invoiceData.issueDate}
                    onChange={(nextIso) => updateField("issueDate", nextIso)}
                    accentColor={themeColor}
                  />
                </div>
              </div>

              {showDueDate ? (
                <div className="grid grid-cols-12 items-center gap-3">
                  <label className="col-span-5 text-xs font-bold text-slate-600 dark:text-zinc-400 underline decoration-dotted underline-offset-4">
                    Due Date
                  </label>
                  <div className="col-span-7 flex items-center gap-1.5">
                    <CustomInvoiceDatePicker
                      value={invoiceData.dueDate}
                      onChange={(nextIso) => updateField("dueDate", nextIso)}
                      accentColor={themeColor}
                      showDuePresets={true}
                      baseIssueDate={invoiceData.issueDate}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowDueDate(false);
                        updateField("dueDate", "");
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                      title="Hide Due Date"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowDueDate(true);
                    updateField("dueDate", new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold hover:underline cursor-pointer"
                  style={{ color: themeColor }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Due Date</span>
                </button>
              )}

              {/* Dynamic Custom Header Fields (e.g. PO Number, Place of Supply) */}
              {(invoiceData.customFields || []).map((cf, idx) => (
                <div key={cf.id} className="grid grid-cols-12 items-center gap-2">
                  <input
                    type="text"
                    value={cf.label}
                    onChange={(e) => {
                      const next = [...(invoiceData.customFields || [])];
                      next[idx] = { ...cf, label: e.target.value };
                      updateField("customFields", next);
                    }}
                    placeholder="Field Name (e.g. PO No)"
                    className="col-span-5 border-b border-dashed border-slate-300 dark:border-zinc-700 bg-transparent py-1 text-xs font-bold text-slate-600 dark:text-zinc-300 focus:outline-none"
                  />
                  <div className="col-span-7 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={cf.value}
                      onChange={(e) => {
                        const next = [...(invoiceData.customFields || [])];
                        next[idx] = { ...cf, value: e.target.value };
                        updateField("customFields", next);
                      }}
                      placeholder="Value"
                      className="flex-1 border-b border-slate-300 dark:border-zinc-700 bg-transparent py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = (invoiceData.customFields || []).filter((_, i) => i !== idx);
                        updateField("customFields", next);
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const next = [
                    ...(invoiceData.customFields || []),
                    { id: `cf_${Date.now()}`, label: "PO Number", value: "" },
                  ];
                  updateField("customFields", next);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline pt-1 cursor-pointer"
                style={{ color: themeColor }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add More Fields</span>
              </button>
            </div>

            {/* Right 5 Columns: Add Business Logo Dropzone */}
            <div className="md:col-span-5 flex md:justify-end">
              {invoiceData.logoDataUrl ? (
                <div className="relative group rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 p-4 flex flex-col items-center justify-center w-full max-w-[260px] min-h-[132px]">
                  <img
                    src={invoiceData.logoDataUrl}
                    alt="Business Logo"
                    className="max-h-20 max-w-[200px] object-contain"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 hover:underline cursor-pointer"
                    >
                      Change Logo
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => updateField("logoDataUrl", undefined)}
                      className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full max-w-[260px] min-h-[132px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-[#ff5500] bg-slate-50/60 dark:bg-zinc-800/30 hover:bg-orange-50/40 dark:hover:bg-orange-950/20 p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-zinc-800 shadow-xs border border-slate-200 dark:border-zinc-700 mb-2 group-hover:scale-105 transition-transform"
                    style={{ color: themeColor }}
                  >
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">
                    Add Business Logo
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Resolution up to 1080×1080px
                    <br />
                    JPG or PNG file
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Two-Column "Billed By (Your Details)" & "Billed To (Client's Details)" Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT CARD: Billed By */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/30 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" style={{ color: themeColor }} />
                  <h3 className="font-display text-sm font-black text-slate-900 dark:text-white underline decoration-dotted underline-offset-4">
                    Billed By
                  </h3>
                  <span className="text-xs font-medium text-slate-400">(Your Details)</span>
                </div>
                <select
                  value={invoiceData.companyCountry || "India"}
                  onChange={(e) => updateField("companyCountry", e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:outline-none"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 bg-white dark:bg-zinc-900 rounded-xl p-4 border border-slate-200/70 dark:border-zinc-800 shadow-2xs">
                <input
                  type="text"
                  value={invoiceData.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  placeholder="Your Business / Company Name *"
                  className="w-full border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1.5 text-sm font-bold text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                />
                <input
                  type="text"
                  value={invoiceData.companyAddress}
                  onChange={(e) => updateField("companyAddress", e.target.value)}
                  placeholder="Street Address (optional)"
                  className="w-full border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 focus:border-[#ff5500] focus:outline-none"
                />
                <input
                  type="text"
                  value={invoiceData.companyCityState ?? ""}
                  onChange={(e) => updateField("companyCityState", e.target.value)}
                  placeholder="City, State & Postal / ZIP Code"
                  className="w-full border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 focus:border-[#ff5500] focus:outline-none"
                />

                {showCompanyGstin && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-400 w-16 shrink-0">GSTIN:</span>
                    <input
                      type="text"
                      value={invoiceData.companyGstin ?? ""}
                      onChange={(e) => updateField("companyGstin", e.target.value.toUpperCase())}
                      placeholder="e.g. 27AAPFU0939F1ZV"
                      className="flex-1 border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1 text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 focus:border-[#ff5500] focus:outline-none"
                    />
                  </div>
                )}

                {showCompanyPan && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-400 w-16 shrink-0">PAN:</span>
                    <input
                      type="text"
                      value={invoiceData.companyPan ?? ""}
                      onChange={(e) => updateField("companyPan", e.target.value.toUpperCase())}
                      placeholder="e.g. AAPFU0939F"
                      className="flex-1 border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1 text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 focus:border-[#ff5500] focus:outline-none"
                    />
                  </div>
                )}

                {showCompanyEmail && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-400 w-16 shrink-0">Email:</span>
                    <input
                      type="email"
                      value={invoiceData.companyEmail}
                      onChange={(e) => updateField("companyEmail", e.target.value)}
                      placeholder="billing@yourcompany.com"
                      className="flex-1 border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1 text-xs font-medium text-slate-800 dark:text-zinc-200 focus:border-[#ff5500] focus:outline-none"
                    />
                  </div>
                )}

                {showCompanyPhone && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-400 w-16 shrink-0">Phone:</span>
                    <input
                      type="tel"
                      value={invoiceData.companyPhone ?? ""}
                      onChange={(e) => updateField("companyPhone", e.target.value)}
                      placeholder="+91 98765 43210"
                      className="flex-1 border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1 text-xs font-medium text-slate-800 dark:text-zinc-200 focus:border-[#ff5500] focus:outline-none"
                    />
                  </div>
                )}

                {/* Dynamic Custom Fields for Billed By (Your Details) */}
                {(invoiceData.companyCustomFields || []).map((cf, idx) => (
                  <div key={cf.id} className="grid grid-cols-12 items-center gap-2">
                    <input
                      type="text"
                      value={cf.label}
                      onChange={(e) => {
                        const next = [...(invoiceData.companyCustomFields || [])];
                        next[idx] = { ...cf, label: e.target.value };
                        updateField("companyCustomFields", next);
                      }}
                      placeholder="Field Name"
                      className="col-span-4 border-b border-dashed border-slate-300 dark:border-zinc-700 bg-transparent py-1 text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 focus:border-[#ff5500] focus:outline-none"
                    />
                    <div className="col-span-8 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={cf.value}
                        onChange={(e) => {
                          const next = [...(invoiceData.companyCustomFields || [])];
                          next[idx] = { ...cf, value: e.target.value };
                          updateField("companyCustomFields", next);
                        }}
                        placeholder="Enter value"
                        className="flex-1 border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1 text-xs font-medium text-slate-800 dark:text-zinc-200 focus:border-[#ff5500] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = (invoiceData.companyCustomFields || []).filter((_, i) => i !== idx);
                          updateField("companyCustomFields", next);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        title="Remove custom field"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-bold" style={{ color: themeColor }}>
                  {!showCompanyGstin && (
                    <button type="button" onClick={() => setShowCompanyGstin(true)} className="hover:underline cursor-pointer">
                      + Add GSTIN
                    </button>
                  )}
                  {!showCompanyPan && (
                    <button type="button" onClick={() => setShowCompanyPan(true)} className="hover:underline cursor-pointer">
                      + Add PAN
                    </button>
                  )}
                  {!showCompanyEmail && (
                    <button type="button" onClick={() => setShowCompanyEmail(true)} className="inline-flex items-center gap-1 hover:underline cursor-pointer">
                      <Mail className="h-3 w-3" /> Add Email
                    </button>
                  )}
                  {!showCompanyPhone && (
                    <button type="button" onClick={() => setShowCompanyPhone(true)} className="inline-flex items-center gap-1 hover:underline cursor-pointer">
                      <Phone className="h-3 w-3" /> Add Phone
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const next = [
                        ...(invoiceData.companyCustomFields || []),
                        { id: `comp_cf_${Date.now()}`, label: "Custom Field", value: "" },
                      ];
                      updateField("companyCustomFields", next);
                    }}
                    className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Custom Field</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT CARD: Billed To */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/30 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" style={{ color: themeColor }} />
                  <h3 className="font-display text-sm font-black text-slate-900 dark:text-white underline decoration-dotted underline-offset-4">
                    Billed To
                  </h3>
                  <span className="text-xs font-medium text-slate-400">(Client&apos;s Details)</span>
                </div>
                <select
                  value={invoiceData.clientCountry || "India"}
                  onChange={(e) => updateField("clientCountry", e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:outline-none"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 bg-white dark:bg-zinc-900 rounded-xl p-4 border border-slate-200/70 dark:border-zinc-800 shadow-2xs">
                <input
                  type="text"
                  value={invoiceData.clientName}
                  onChange={(e) => updateField("clientName", e.target.value)}
                  placeholder="Client's Business / Recipient Name *"
                  className="w-full border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1.5 text-sm font-bold text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                />
                <input
                  type="text"
                  value={invoiceData.clientAddress}
                  onChange={(e) => updateField("clientAddress", e.target.value)}
                  placeholder="Client Street Address (optional)"
                  className="w-full border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 focus:border-[#ff5500] focus:outline-none"
                />
                <input
                  type="text"
                  value={invoiceData.clientCityState ?? ""}
                  onChange={(e) => updateField("clientCityState", e.target.value)}
                  placeholder="City, State & Postal / ZIP Code"
                  className="w-full border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 focus:border-[#ff5500] focus:outline-none"
                />

                {showClientGstin && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-400 w-16 shrink-0">GSTIN:</span>
                    <input
                      type="text"
                      value={invoiceData.clientGstin ?? ""}
                      onChange={(e) => updateField("clientGstin", e.target.value.toUpperCase())}
                      placeholder="Client GSTIN / Tax ID (optional)"
                      className="flex-1 border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1 text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 focus:border-[#ff5500] focus:outline-none"
                    />
                  </div>
                )}

                {showClientPan && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-400 w-16 shrink-0">PAN:</span>
                    <input
                      type="text"
                      value={invoiceData.clientPan ?? ""}
                      onChange={(e) => updateField("clientPan", e.target.value.toUpperCase())}
                      placeholder="Client PAN (optional)"
                      className="flex-1 border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1 text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 focus:border-[#ff5500] focus:outline-none"
                    />
                  </div>
                )}

                {showClientEmail && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-400 w-16 shrink-0">Email:</span>
                    <input
                      type="email"
                      value={invoiceData.clientEmail}
                      onChange={(e) => updateField("clientEmail", e.target.value)}
                      placeholder="accounts@client.com"
                      className="flex-1 border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1 text-xs font-medium text-slate-800 dark:text-zinc-200 focus:border-[#ff5500] focus:outline-none"
                    />
                  </div>
                )}

                {showClientPhone && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-400 w-16 shrink-0">Phone:</span>
                    <input
                      type="tel"
                      value={invoiceData.clientPhone ?? ""}
                      onChange={(e) => updateField("clientPhone", e.target.value)}
                      placeholder="+91 98765 00000"
                      className="flex-1 border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1 text-xs font-medium text-slate-800 dark:text-zinc-200 focus:border-[#ff5500] focus:outline-none"
                    />
                  </div>
                )}

                {/* Dynamic Custom Fields for Billed To (Client's Details) */}
                {(invoiceData.clientCustomFields || []).map((cf, idx) => (
                  <div key={cf.id} className="grid grid-cols-12 items-center gap-2">
                    <input
                      type="text"
                      value={cf.label}
                      onChange={(e) => {
                        const next = [...(invoiceData.clientCustomFields || [])];
                        next[idx] = { ...cf, label: e.target.value };
                        updateField("clientCustomFields", next);
                      }}
                      placeholder="Field Name"
                      className="col-span-4 border-b border-dashed border-slate-300 dark:border-zinc-700 bg-transparent py-1 text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 focus:border-[#ff5500] focus:outline-none"
                    />
                    <div className="col-span-8 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={cf.value}
                        onChange={(e) => {
                          const next = [...(invoiceData.clientCustomFields || [])];
                          next[idx] = { ...cf, value: e.target.value };
                          updateField("clientCustomFields", next);
                        }}
                        placeholder="Enter value"
                        className="flex-1 border-b border-slate-200 dark:border-zinc-800 bg-transparent py-1 text-xs font-medium text-slate-800 dark:text-zinc-200 focus:border-[#ff5500] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = (invoiceData.clientCustomFields || []).filter((_, i) => i !== idx);
                          updateField("clientCustomFields", next);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        title="Remove custom field"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-bold" style={{ color: themeColor }}>
                  {!showClientGstin && (
                    <button type="button" onClick={() => setShowClientGstin(true)} className="hover:underline cursor-pointer">
                      + Add GSTIN
                    </button>
                  )}
                  {!showClientPan && (
                    <button type="button" onClick={() => setShowClientPan(true)} className="hover:underline cursor-pointer">
                      + Add PAN
                    </button>
                  )}
                  {!showClientEmail && (
                    <button type="button" onClick={() => setShowClientEmail(true)} className="inline-flex items-center gap-1 hover:underline cursor-pointer">
                      <Mail className="h-3 w-3" /> Add Email
                    </button>
                  )}
                  {!showClientPhone && (
                    <button type="button" onClick={() => setShowClientPhone(true)} className="inline-flex items-center gap-1 hover:underline cursor-pointer">
                      <Phone className="h-3 w-3" /> Add Phone
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const next = [
                        ...(invoiceData.clientCustomFields || []),
                        { id: `client_cf_${Date.now()}`, label: "Custom Field", value: "" },
                      ];
                      updateField("clientCustomFields", next);
                    }}
                    className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Custom Field</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Refrens-Style GST Line Items Table */}
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
              <table className="w-full min-w-[780px] text-left border-collapse">
                <thead>
                  <tr className="text-white text-xs font-extrabold" style={{ backgroundColor: themeColor }}>
                    <th className="py-3.5 pl-4 pr-2 w-8">#</th>
                    <th className="py-3.5 px-2 min-w-[200px]">Item / Service Description</th>
                    {taxMode !== "none" && <th className="py-3.5 px-2 w-24">HSN/SAC</th>}
                    {taxMode !== "none" && (
                      <th className="py-3.5 px-2 w-24">{taxMode.startsWith("gst") ? "GST Rate" : "Tax %"}</th>
                    )}
                    <th className="py-3.5 px-2 w-20 text-center">Qty</th>
                    <th className="py-3.5 px-2 w-28 text-right">Rate ({curr.trim()})</th>
                    <th className="py-3.5 px-2 w-28 text-right">Amount</th>
                    {taxMode === "gst_intra" && (
                      <>
                        <th className="py-3.5 px-2 w-24 text-right">CGST</th>
                        <th className="py-3.5 px-2 w-24 text-right">SGST</th>
                      </>
                    )}
                    {(taxMode === "gst_inter" || taxMode === "standard") && (
                      <th className="py-3.5 px-2 w-24 text-right">{taxMode === "gst_inter" ? "IGST" : "Tax"}</th>
                    )}
                    <th className="py-3.5 pl-2 pr-4 w-32 text-right">Total</th>
                    <th className="py-3.5 pr-3 w-16 text-center" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-zinc-800 text-xs">
                  {invoiceData.items.map((item, idx) => {
                    const qty = Number(item.quantity) || 0;
                    const rate = Number(item.rate) || 0;
                    const gstPct = taxMode === "none" ? 0 : Number(item.taxPercent) || 0;
                    const amount = qty * rate;
                    const totalTax = (amount * gstPct) / 100;
                    const halfTax = totalTax / 2;
                    const lineTotal = amount + totalTax;
                    const hasDescOpen = Boolean(openDescRows[item.id] || item.subDescription);

                    return (
                      <React.Fragment key={item.id}>
                        <tr className="bg-slate-50/40 dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors align-top">
                          <td className="py-3.5 pl-4 pr-2 font-mono font-bold text-slate-400">
                            {idx + 1}.
                          </td>
                          <td className="py-3 px-2 space-y-1.5">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(idx, { description: e.target.value })}
                              placeholder="Enter item name or service (required)"
                              className="w-full border-b border-slate-300 dark:border-zinc-700 bg-transparent py-1 text-xs font-bold text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                            />
                            {hasDescOpen ? (
                              <textarea
                                rows={2}
                                value={item.subDescription ?? ""}
                                onChange={(e) => updateItem(idx, { subDescription: e.target.value })}
                                placeholder="Additional item specifications, deliverables, or serial numbers..."
                                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-[11px] text-slate-600 dark:text-zinc-300 focus:outline-none"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => setOpenDescRows((prev) => ({ ...prev, [item.id]: true }))}
                                className="inline-flex items-center gap-1 text-[11px] font-bold hover:underline cursor-pointer"
                                style={{ color: themeColor }}
                              >
                                <Plus className="h-3 w-3" />
                                <span>Add Description</span>
                              </button>
                            )}
                          </td>

                          {taxMode !== "none" && (
                            <td className="py-3 px-2">
                              <input
                                type="text"
                                value={item.hsnSac ?? ""}
                                onChange={(e) => updateItem(idx, { hsnSac: e.target.value })}
                                placeholder="9983"
                                className="w-full border-b border-slate-300 dark:border-zinc-700 bg-transparent py-1 text-xs font-mono text-slate-700 dark:text-zinc-300 focus:border-[#ff5500] focus:outline-none"
                              />
                            </td>
                          )}

                          {taxMode !== "none" && (
                            <td className="py-3 px-2">
                              <div className="flex items-center border-b border-slate-300 dark:border-zinc-700">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={item.taxPercent}
                                  onChange={(e) => updateItem(idx, { taxPercent: Number(e.target.value) })}
                                  className="w-full bg-transparent py-1 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                                />
                                <span className="text-slate-400 font-bold">%</span>
                              </div>
                            </td>
                          )}

                          <td className="py-3 px-2">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                              className="w-full border-b border-slate-300 dark:border-zinc-700 bg-transparent py-1 text-xs font-mono font-bold text-center text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                            />
                          </td>

                          <td className="py-3 px-2">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={item.rate}
                              onChange={(e) => updateItem(idx, { rate: Number(e.target.value) })}
                              className="w-full border-b border-slate-300 dark:border-zinc-700 bg-transparent py-1 text-xs font-mono font-bold text-right text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                            />
                          </td>

                          <td className="py-4 px-2 text-right font-mono font-semibold text-slate-700 dark:text-zinc-300">
                            {curr}{amount.toFixed(2)}
                          </td>

                          {taxMode === "gst_intra" && (
                            <>
                              <td className="py-4 px-2 text-right font-mono text-slate-600 dark:text-zinc-400">
                                {curr}{halfTax.toFixed(2)}
                                <span className="block text-[9px] text-slate-400">({(gstPct / 2).toFixed(1)}%)</span>
                              </td>
                              <td className="py-4 px-2 text-right font-mono text-slate-600 dark:text-zinc-400">
                                {curr}{halfTax.toFixed(2)}
                                <span className="block text-[9px] text-slate-400">({(gstPct / 2).toFixed(1)}%)</span>
                              </td>
                            </>
                          )}

                          {(taxMode === "gst_inter" || taxMode === "standard") && (
                            <td className="py-4 px-2 text-right font-mono text-slate-600 dark:text-zinc-400">
                              {curr}{totalTax.toFixed(2)}
                            </td>
                          )}

                          <td className="py-4 pl-2 pr-4 text-right font-mono font-black text-slate-900 dark:text-white">
                            {curr}{lineTotal.toFixed(2)}
                          </td>

                          <td className="py-3.5 pr-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => duplicateLineItem(idx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Duplicate row"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              {invoiceData.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeLineItem(idx)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Delete row"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Add New Line Button */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={addNewLineItem}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer"
                style={{ backgroundColor: themeColor }}
              >
                <Plus className="h-4 w-4" />
                <span>Add New Line</span>
              </button>
            </div>
          </div>

          {/* 5. Bottom Two-Column Section: Left (Bank, Terms, Notes) & Right (Totals, Words, Signature) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-slate-200/80 dark:border-zinc-800">
            {/* LEFT 7 COLUMNS: Bank & UPI Details, Terms & Conditions, Notes */}
            <div className="lg:col-span-7 space-y-5">
              {/* Optional Toggle Buttons Bar */}
              <div className="flex flex-wrap items-center gap-2.5">
                {!showBankDetails && (
                  <button
                    type="button"
                    onClick={() => setShowBankDetails(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 px-3 py-1.5 text-xs font-bold hover:border-[#ff5500] transition-colors cursor-pointer"
                    style={{ color: themeColor }}
                  >
                    <Landmark className="h-3.5 w-3.5" />
                    <span>+ Add Bank &amp; UPI Details</span>
                  </button>
                )}
                {!showTerms && (
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 px-3 py-1.5 text-xs font-bold hover:border-[#ff5500] transition-colors cursor-pointer"
                    style={{ color: themeColor }}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>+ Add Terms &amp; Conditions</span>
                  </button>
                )}
                {!showNotes && (
                  <button
                    type="button"
                    onClick={() => setShowNotes(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 px-3 py-1.5 text-xs font-bold hover:border-[#ff5500] transition-colors cursor-pointer"
                    style={{ color: themeColor }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Add Notes</span>
                  </button>
                )}
              </div>

              {/* Bank & UPI Payment Details Card */}
              {showBankDetails && (
                <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4" style={{ color: themeColor }} />
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        Bank &amp; UPI Payment Details
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBankDetails(false)}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={invoiceData.bankAccountHolder ?? ""}
                      onChange={(e) => updateField("bankAccountHolder", e.target.value)}
                      placeholder="Account Holder Name"
                      className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={invoiceData.bankAccountNumber ?? ""}
                      onChange={(e) => updateField("bankAccountNumber", e.target.value)}
                      placeholder="Account Number"
                      className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={invoiceData.bankIfscCode ?? ""}
                      onChange={(e) => updateField("bankIfscCode", e.target.value.toUpperCase())}
                      placeholder="IFSC / SWIFT / Routing Code"
                      className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={invoiceData.bankName ?? ""}
                      onChange={(e) => updateField("bankName", e.target.value)}
                      placeholder="Bank Name & Branch"
                      className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={invoiceData.upiId ?? ""}
                      onChange={(e) => updateField("upiId", e.target.value)}
                      placeholder="UPI ID (e.g. business@okicici)"
                      className="sm:col-span-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Terms & Conditions Box */}
              {showTerms && (
                <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Terms and Conditions
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTerms(false);
                        updateField("terms", "");
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={invoiceData.terms ?? ""}
                    onChange={(e) => updateField("terms", e.target.value)}
                    placeholder="1. Please pay within 15 days from the date of invoice, overdue interest @ 14% will be charged on delayed payments.&#10;2. Please quote invoice number when remitting funds."
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed focus:outline-none"
                  />
                </div>
              )}

              {/* Additional Notes Box */}
              {showNotes && (
                <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Additional Notes
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotes(false);
                        updateField("notes", "");
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={invoiceData.notes ?? ""}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Thank you for your business!"
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* RIGHT 5 COLUMNS: Totals Summary, Discounts, Total in Words & Signature */}
            <div className="lg:col-span-5 space-y-5">
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400 font-semibold">
                  <span>Amount</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {curr}{taxableSubtotal.toFixed(2)}
                  </span>
                </div>

                {taxMode === "gst_intra" && (
                  <>
                    <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400 font-semibold">
                      <span>CGST</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {curr}{(totalTaxAmount / 2).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400 font-semibold">
                      <span>SGST</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {curr}{(totalTaxAmount / 2).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}

                {(taxMode === "gst_inter" || taxMode === "standard") && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400 font-semibold">
                    <span>{taxMode === "gst_inter" ? "IGST" : "Tax / VAT"}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {curr}{totalTaxAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Discount Row */}
                {showDiscount ? (
                  <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Discount</span>
                      <select
                        value={invoiceData.discountType || "percent"}
                        onChange={(e) => updateField("discountType", e.target.value as "percent" | "flat")}
                        className="rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1.5 py-0.5 text-[11px] font-bold"
                      >
                        <option value="percent">%</option>
                        <option value="flat">{curr.trim()}</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={invoiceData.discountValue ?? 0}
                        onChange={(e) => updateField("discountValue", Number(e.target.value))}
                        className="w-20 rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs font-mono font-bold text-right"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowDiscount(false);
                          updateField("discountValue", 0);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Additional Charges Row */}
                {showExtraCharges ? (
                  <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700">
                    <input
                      type="text"
                      value={invoiceData.additionalChargesLabel ?? "Shipping / Packaging"}
                      onChange={(e) => updateField("additionalChargesLabel", e.target.value)}
                      placeholder="Charge Label"
                      className="w-36 border-b border-slate-300 dark:border-zinc-600 bg-transparent text-xs font-bold text-slate-700 dark:text-zinc-200 focus:outline-none"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={invoiceData.additionalChargesAmount ?? 0}
                        onChange={(e) => updateField("additionalChargesAmount", Number(e.target.value))}
                        className="w-20 rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs font-mono font-bold text-right"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowExtraCharges(false);
                          updateField("additionalChargesAmount", 0);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Add Discounts / Add Additional Charges Toggles */}
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-bold" style={{ color: themeColor }}>
                  {!showDiscount && (
                    <button
                      type="button"
                      onClick={() => setShowDiscount(true)}
                      className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Percent className="h-3.5 w-3.5" />
                      <span>Add Discounts</span>
                    </button>
                  )}
                  {!showExtraCharges && (
                    <button
                      type="button"
                      onClick={() => setShowExtraCharges(true)}
                      className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Tag className="h-3.5 w-3.5" />
                      <span>Add Additional Charges</span>
                    </button>
                  )}
                </div>

                {/* Grand Total Bar */}
                <div className="border-y-2 border-slate-900 dark:border-white py-3 my-2 flex items-center justify-between">
                  <span className="font-display text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Total ({selectedCurrencyObj.code})
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-black" style={{ color: themeColor }}>
                    {curr}{grandTotal.toFixed(2)}
                  </span>
                </div>

                {/* Total in Words */}
                <div className="rounded-xl bg-slate-50 dark:bg-zinc-800/40 p-3 border border-slate-200/70 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>Total (in words)</span>
                    <button
                      type="button"
                      onClick={() => updateField("showTotalInWords", invoiceData.showTotalInWords === false)}
                      className="text-[10px] hover:underline cursor-pointer"
                      style={{ color: themeColor }}
                    >
                      {invoiceData.showTotalInWords === false ? "Show in PDF" : "Included in PDF"}
                    </button>
                  </div>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 leading-snug">
                    {totalInWords}
                  </p>
                </div>
              </div>

              {/* Authorized Signatory / Signature Block */}
              <div className="pt-2 flex flex-col items-end space-y-2">
                {invoiceData.signatureDataUrl ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 p-3 flex flex-col items-center w-full max-w-[240px]">
                    <img
                      src={invoiceData.signatureDataUrl}
                      alt="Authorized Signature"
                      className="max-h-16 object-contain"
                    />
                    <div className="mt-2 flex items-center gap-2 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => sigInputRef.current?.click()}
                        className="text-slate-600 dark:text-zinc-300 hover:underline cursor-pointer"
                      >
                        Replace
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={clearSigPad}
                        className="text-rose-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : showSignaturePad ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 w-full max-w-[260px] space-y-2 shadow-md">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>Draw Signature</span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={clearSigPad} className="text-rose-500 hover:underline cursor-pointer">
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSignaturePad(false)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <canvas
                      ref={sigPadRef}
                      width={230}
                      height={80}
                      onMouseDown={startSigDraw}
                      onMouseMove={moveSigDraw}
                      onMouseUp={endSigDraw}
                      onMouseLeave={endSigDraw}
                      className="w-full h-20 rounded-xl border border-dashed border-slate-300 bg-slate-50 cursor-crosshair"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sigInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 hover:border-[#ff5500] px-3.5 py-2.5 text-xs font-extrabold transition-colors cursor-pointer"
                      style={{ color: themeColor }}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Signature</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSignaturePad(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 hover:border-[#ff5500] px-3.5 py-2.5 text-xs font-extrabold transition-colors cursor-pointer"
                      style={{ color: themeColor }}
                    >
                      <PenTool className="h-3.5 w-3.5" />
                      <span>Use Signature Pad</span>
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  value={invoiceData.signatureLabel ?? "Authorized Signatory"}
                  onChange={(e) => updateField("signatureLabel", e.target.value)}
                  placeholder="Authorized Signatory"
                  className="text-right text-xs font-bold text-slate-500 dark:text-zinc-400 bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none w-48"
                />
              </div>
            </div>
          </div>

          {/* 6. Bottom Save & Continue (Go to Step 2: 10 Premium Themes) Action Bar */}
          <div className="pt-6 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">
              {(() => {
                const cost = AdminStore.getToolCreditCost(tool.slug);
                if (cost === 0) {
                  const usage = AdminStore.getToolDailyUsage(tool.slug);
                  return (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Free GST Invoice Generator ({usage} / 20 used today)</span>
                    </span>
                  );
                }
                if (!AuthUser.isLoggedIn()) return null;
                return (
                  <span className="inline-flex items-center gap-2">
                    <span>Cost: {cost} Token</span>
                    <TokenCoin type="silver" size="xs" />
                  </span>
                );
              })()}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={processing}
                onClick={handleProcess}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 px-5 py-3.5 text-xs sm:text-sm font-extrabold text-slate-800 dark:text-zinc-200 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4 text-[#ff5500]" />
                <span>Quick Export PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveStep(2);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl px-7 py-4 text-sm sm:text-base font-black text-white shadow-xl hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                style={{ backgroundColor: themeColor }}
              >
                <LayoutTemplate className="h-5 w-5" />
                <span>Save &amp; Continue: Choose Theme (10 Templates)</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
