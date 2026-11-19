// Interactive Refrens-style GST & Tax Invoice Builder with 10 Premium Themes and Default Brand Orange (#ff5500).
import React, { useState, useRef } from "react";
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
  headerStyle: "centered" | "banner" | "left-rule" | "split-top" | "frame" | "hero-tint" | "sidebar";
}

const PREMIUM_INVOICE_THEMES: PremiumThemeConfig[] = [
  {
    id: "executive-orange",
    name: "1. Executive Classic",
    subtitle: "Centered title, warm studio cards & solid table bar",
    badge: "Default",
    defaultColor: "#ff5500",
    defaultFont: "sans",
    headerStyle: "centered",
  },
  {
    id: "modern-banner",
    name: "2. Modern Full-Bleed Banner",
    subtitle: "Bold full-width colored top header with invoice badge",
    badge: "Popular",
    defaultColor: "#ff5500",
    defaultFont: "sans",
    headerStyle: "banner",
  },
  {
    id: "minimal-swiss",
    name: "3. Swiss Minimalist Grid",
    subtitle: "Clean left-aligned editorial typography & hairline rules",
    badge: "Minimal",
    defaultColor: "#0f172a",
    defaultFont: "sans",
    headerStyle: "left-rule",
  },
  {
    id: "corporate-split",
    name: "4. Corporate Split Header",
    subtitle: "Top accent bar with structured split corporate metadata",
    badge: "Enterprise",
    defaultColor: "#2563eb",
    defaultFont: "sans",
    headerStyle: "split-top",
  },
  {
    id: "luxury-editorial",
    name: "5. Luxury Serif Editorial",
    subtitle: "Classic Times serif typography with warm cream cards",
    badge: "Editorial",
    defaultColor: "#9a3412",
    defaultFont: "serif",
    headerStyle: "centered",
  },
  {
    id: "tech-mono",
    name: "6. Developer SaaS Mono",
    subtitle: "Precision monospace numbers, code-style headers & grid",
    badge: "SaaS / Dev",
    defaultColor: "#ff5500",
    defaultFont: "mono",
    headerStyle: "left-rule",
  },
  {
    id: "bold-sidebar",
    name: "7. Bold Left Accent Ribbon",
    subtitle: "Vertical colored accent spine along the left page edge",
    badge: "Creative",
    defaultColor: "#ea580c",
    defaultFont: "sans",
    headerStyle: "sidebar",
  },
  {
    id: "gst-pro-ledger",
    name: "8. Indian GST Pro Ledger",
    subtitle: "Full outer document border frame for official GST filing",
    badge: "GST Official",
    defaultColor: "#5b21b6",
    defaultFont: "sans",
    headerStyle: "frame",
  },
  {
    id: "agency-studio",
    name: "9. Creative Agency Studio",
    subtitle: "Soft tinted hero header block with floating party cards",
    badge: "Studio",
    defaultColor: "#e11d48",
    defaultFont: "sans",
    headerStyle: "hero-tint",
  },
  {
    id: "compact-enterprise",
    name: "10. Enterprise Compact",
    subtitle: "High-density financial statement with top accent rule",
    badge: "Compact",
    defaultColor: "#059669",
    defaultFont: "sans",
    headerStyle: "split-top",
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
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
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
      <div className="rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Interactive Clickable Stepper Pills */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 lg:pb-0">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
              activeStep === 1
                ? "text-white shadow-md scale-[1.02]"
                : "border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 hover:border-orange-500/50"
            }`}
            style={activeStep === 1 ? { backgroundColor: themeColor } : undefined}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${
                activeStep === 1 ? "bg-white/25 text-white" : "bg-emerald-500 text-white"
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
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
              activeStep === 2
                ? "text-white shadow-md scale-[1.02]"
                : "border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 hover:border-orange-500/50"
            }`}
            style={activeStep === 2 ? { backgroundColor: themeColor } : undefined}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${
                activeStep === 2 ? "bg-white/25 text-white" : "bg-slate-200 dark:bg-zinc-700"
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
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Color Swatches (Orange Default) */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 px-3 py-1.5">
            <Palette className="h-3.5 w-3.5 text-slate-400 mr-0.5" />
            {THEME_SWATCHES.slice(0, 6).map((sw) => (
              <button
                key={sw.hex}
                type="button"
                onClick={() => updateField("themeColor", sw.hex)}
                title={sw.name}
                className={`h-5 w-5 rounded-full transition-transform cursor-pointer ${
                  themeColor === sw.hex ? "scale-125 ring-2 ring-offset-2 ring-slate-900 dark:ring-white" : "opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: sw.hex }}
              />
            ))}
            <input
              type="color"
              value={themeColor}
              onChange={(e) => updateField("themeColor", e.target.value)}
              title="Custom brand color"
              className="h-5 w-5 rounded cursor-pointer border-0 bg-transparent p-0"
            />
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

            {/* 10 Premium Themes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {PREMIUM_INVOICE_THEMES.map((theme) => {
                const isSelected = activeTemplateId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectPremiumTheme(theme)}
                    className={`group relative text-left rounded-2xl border-2 p-3.5 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-[#ff5500] bg-orange-50/40 dark:bg-orange-950/20 shadow-lg scale-[1.02]"
                        : "border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/30 hover:border-slate-400 dark:hover:border-zinc-600"
                    }`}
                  >
                    {/* Mini Wireframe Preview of Template */}
                    <div className="w-full h-24 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 mb-3 overflow-hidden relative p-2 flex flex-col justify-between shadow-2xs">
                      {theme.headerStyle === "banner" && (
                        <div className=" -mx-2 -mt-2 h-6 px-2 flex items-center justify-between" style={{ backgroundColor: isSelected ? themeColor : theme.defaultColor }}>
                          <span className="h-1.5 w-10 rounded bg-white/90" />
                          <span className="h-1.5 w-5 rounded bg-white/70" />
                        </div>
                      )}
                      {theme.headerStyle === "sidebar" && (
                        <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: isSelected ? themeColor : theme.defaultColor }} />
                      )}
                      {theme.headerStyle === "split-top" && (
                        <div className="absolute left-0 right-0 top-0 h-1.5" style={{ backgroundColor: isSelected ? themeColor : theme.defaultColor }} />
                      )}
                      {theme.headerStyle === "frame" && (
                        <div className="absolute inset-1 border pointer-events-none rounded-md" style={{ borderColor: isSelected ? themeColor : theme.defaultColor }} />
                      )}
                      {theme.headerStyle === "hero-tint" && (
                        <div className="-mx-2 -mt-2 h-6 px-2 flex items-center justify-center" style={{ backgroundColor: `${isSelected ? themeColor : theme.defaultColor}22` }}>
                          <span className="h-1.5 w-12 rounded" style={{ backgroundColor: isSelected ? themeColor : theme.defaultColor }} />
                        </div>
                      )}
                      {(theme.headerStyle === "centered" || theme.headerStyle === "frame") && (
                        <div className="flex flex-col items-center pt-0.5">
                          <span className="h-1.5 w-12 rounded" style={{ backgroundColor: isSelected ? themeColor : theme.defaultColor }} />
                        </div>
                      )}
                      {theme.headerStyle === "left-rule" && (
                        <div className="flex flex-col items-start pt-0.5">
                          <span className="h-1.5 w-12 rounded" style={{ backgroundColor: isSelected ? themeColor : theme.defaultColor }} />
                          <span className="h-0.5 w-full mt-1" style={{ backgroundColor: isSelected ? themeColor : theme.defaultColor }} />
                        </div>
                      )}

                      {/* Mini Party Boxes */}
                      <div className="grid grid-cols-2 gap-1.5 my-1">
                        <div className="h-5 rounded bg-slate-100 dark:bg-zinc-800 p-1">
                          <div className="h-1 w-6 rounded bg-slate-300 dark:bg-zinc-600" />
                        </div>
                        <div className="h-5 rounded bg-slate-100 dark:bg-zinc-800 p-1">
                          <div className="h-1 w-6 rounded bg-slate-300 dark:bg-zinc-600" />
                        </div>
                      </div>

                      {/* Mini Table Bar */}
                      <div className="space-y-1">
                        <div className="h-2 w-full rounded-xs" style={{ backgroundColor: isSelected ? themeColor : theme.defaultColor }} />
                        <div className="h-1.5 w-full rounded-xs bg-slate-100 dark:bg-zinc-800" />
                        <div className="flex justify-end">
                          <div className="h-2 w-8 rounded-xs" style={{ backgroundColor: isSelected ? themeColor : theme.defaultColor }} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {theme.name}
                        </span>
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase shrink-0 text-white"
                          style={{ backgroundColor: isSelected ? themeColor : theme.defaultColor }}
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
                        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-md"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80 dark:border-zinc-800">
              {/* 10 Executive Color Swatches */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-[#ff5500]" />
                  <span>Theme Accent Color (Orange Default)</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {THEME_SWATCHES.map((sw) => (
                    <button
                      key={sw.hex}
                      type="button"
                      onClick={() => updateField("themeColor", sw.hex)}
                      title={sw.name}
                      className={`h-7 w-7 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                        themeColor === sw.hex
                          ? "scale-110 ring-2 ring-offset-2 ring-slate-900 dark:ring-white shadow-md"
                          : "opacity-85 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: sw.hex }}
                    >
                      {themeColor === sw.hex && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                  <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-zinc-200 cursor-pointer">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => updateField("themeColor", e.target.value)}
                      className="h-4 w-4 rounded cursor-pointer border-0 bg-transparent p-0"
                    />
                    <span className="font-mono uppercase">{themeColor}</span>
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
                      className={`rounded-xl border px-3 py-2 text-left transition-all cursor-pointer ${
                        activeFont === f.id
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

          {/* LIVE FULL-SHEET A4 PREVIEW IN SELECTED PREMIUM THEME */}
          <div className="rounded-3xl border-2 border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden relative">
            {/* Template-Specific Page Decorations */}
            {activeThemeObj.headerStyle === "sidebar" && (
              <div className="absolute left-0 top-0 bottom-0 w-3.5" style={{ backgroundColor: themeColor }} />
            )}
            {activeThemeObj.headerStyle === "split-top" && (
              <div className="h-3 w-full" style={{ backgroundColor: themeColor }} />
            )}

            <div
              className={`p-6 sm:p-10 md:p-12 space-y-6 ${fontClass} ${
                activeThemeObj.headerStyle === "frame" ? "m-4 sm:m-6 border-2 rounded-2xl" : ""
              }`}
              style={activeThemeObj.headerStyle === "frame" ? { borderColor: themeColor } : undefined}
            >
              {/* Header Block per Theme */}
              {activeThemeObj.headerStyle === "banner" ? (
                <div
                  className="-mx-6 -mt-6 sm:-mx-10 sm:-mt-10 md:-mx-12 md:-mt-12 p-6 sm:p-8 text-white flex flex-wrap items-center justify-between gap-4 mb-4"
                  style={{ backgroundColor: themeColor }}
                >
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                      {invoiceData.documentTitle || "Tax Invoice"}
                    </h2>
                    {invoiceData.documentSubtitle && (
                      <p className="text-xs opacity-90 mt-0.5">{invoiceData.documentSubtitle}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase font-bold opacity-80">Invoice No</div>
                    <div className="text-xl font-black font-mono">#{invoiceData.invoiceNumber}</div>
                  </div>
                </div>
              ) : activeThemeObj.headerStyle === "hero-tint" ? (
                <div
                  className="-mx-6 -mt-6 sm:-mx-10 sm:-mt-10 md:-mx-12 md:-mt-12 p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 mb-4 border-b"
                  style={{ backgroundColor: `${themeColor}15`, borderColor: `${themeColor}30` }}
                >
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black" style={{ color: themeColor }}>
                      {invoiceData.documentTitle || "Tax Invoice"}
                    </h2>
                    {invoiceData.documentSubtitle && (
                      <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">{invoiceData.documentSubtitle}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className="rounded-xl px-3.5 py-1.5 text-sm font-black text-white font-mono"
                      style={{ backgroundColor: themeColor }}
                    >
                      #{invoiceData.invoiceNumber}
                    </span>
                  </div>
                </div>
              ) : activeThemeObj.headerStyle === "left-rule" || activeThemeObj.headerStyle === "sidebar" ? (
                <div className="border-b-2 pb-3 flex items-end justify-between" style={{ borderColor: themeColor }}>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black" style={{ color: themeColor }}>
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
              ) : (
                <div className="text-center space-y-1">
                  <h2
                    className="inline-block text-2xl sm:text-3xl font-black border-b-2 pb-1 px-4"
                    style={{ color: themeColor, borderColor: themeColor }}
                  >
                    {invoiceData.documentTitle || "Tax Invoice"}
                  </h2>
                  {invoiceData.documentSubtitle && (
                    <p className="text-xs text-slate-500">{invoiceData.documentSubtitle}</p>
                  )}
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

                {invoiceData.logoDataUrl && (
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
                  className="rounded-2xl p-4 border space-y-1 text-xs"
                  style={{
                    backgroundColor: activeTemplateId === "agency-studio" ? `${themeColor}10` : undefined,
                    borderColor: activeTemplateId === "gst-pro-ledger" ? themeColor : undefined,
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
                </div>

                <div
                  className="rounded-2xl p-4 border space-y-1 text-xs"
                  style={{
                    backgroundColor: activeTemplateId === "agency-studio" ? `${themeColor}10` : undefined,
                    borderColor: activeTemplateId === "gst-pro-ledger" ? themeColor : undefined,
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
                </div>
              </div>

              {/* Line Items Table Preview */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-white font-bold" style={{ backgroundColor: themeColor }}>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      {taxMode !== "none" && <th className="py-2.5 px-3">HSN/SAC</th>}
                      {taxMode !== "none" && <th className="py-2.5 px-3">Tax %</th>}
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                    {invoiceData.items.map((it, i) => {
                      const amt = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
                      const tx = taxMode === "none" ? 0 : (amt * (Number(it.taxPercent) || 0)) / 100;
                      return (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3 font-mono">{i + 1}</td>
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
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
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
                </div>

                <div className="md:col-span-5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Taxable Amount</span>
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
                    className="rounded-xl p-3 text-white flex items-center justify-between font-black text-sm"
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
                      <span className="text-[11px] font-bold text-slate-500 mt-1">
                        {invoiceData.signatureLabel || "Authorized Signatory"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                <div className="col-span-7">
                  <input
                    type="date"
                    value={invoiceData.issueDate}
                    onChange={(e) => updateField("issueDate", e.target.value)}
                    className="w-full border-b border-slate-300 dark:border-zinc-700 bg-transparent py-1.5 text-sm font-bold text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                  />
                </div>
              </div>

              {showDueDate ? (
                <div className="grid grid-cols-12 items-center gap-3">
                  <label className="col-span-5 text-xs font-bold text-slate-600 dark:text-zinc-400 underline decoration-dotted underline-offset-4">
                    Due Date
                  </label>
                  <div className="col-span-7 flex items-center gap-1.5">
                    <input
                      type="date"
                      value={invoiceData.dueDate}
                      onChange={(e) => updateField("dueDate", e.target.value)}
                      className="flex-1 border-b border-slate-300 dark:border-zinc-700 bg-transparent py-1.5 text-sm font-bold text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
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
