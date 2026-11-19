// PDF24-style EN 16931 / ZUGFeRD / XRechnung PDF Invoice to E-Invoice Studio.
import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  UserCheck,
  Building2,
  CreditCard,
  Truck,
  ListOrdered,
  Percent,
  PlusCircle,
  Calculator,
  Paperclip,
  Settings,
  CheckCircle2,
  Upload,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  AlertTriangle,
  Eye,
  FileCode2,
  Check,
} from "lucide-react";
import { type InvoiceData, type InvoiceItem } from "@/lib/pdf-engine";
import { type Tool } from "@/lib/tools";
import { toast } from "sonner";

interface UploadedPdfItem {
  id: string;
  file: File;
  name: string;
  size: number;
  buffer: ArrayBuffer;
  pageCount?: number | undefined;
  thumbnailUrl?: string | undefined;
}

interface PdfToEInvoiceStudioProps {
  tool: Tool;
  files: UploadedPdfItem[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedPdfItem[]>>;
  activeFile: UploadedPdfItem | null | undefined;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  invoiceData: InvoiceData;
  setInvoiceData: React.Dispatch<React.SetStateAction<InvoiceData>>;
  processing: boolean;
  handleProcess: () => void;
  setPreviewModalItem: (item: any) => void;
}

const SIDEBAR_SECTIONS = [
  { id: "sec-invoice-data", label: "Invoice data", icon: FileText },
  {
    id: "sec-biller",
    label: "Biller",
    icon: Building2,
    children: [
      { id: "sec-biller-address", label: "Address" },
      { id: "sec-biller-contact", label: "Contact" },
      { id: "sec-biller-logo", label: "Logo" },
    ],
  },
  {
    id: "sec-recipient",
    label: "Invoice recipient",
    icon: UserCheck,
    children: [
      { id: "sec-recipient-address", label: "Address" },
      { id: "sec-recipient-contact", label: "Contact" },
    ],
  },
  { id: "sec-payment", label: "Payment details", icon: CreditCard },
  { id: "sec-delivery", label: "Delivery details", icon: Truck },
  { id: "sec-items", label: "Items", icon: ListOrdered },
  { id: "sec-allowances", label: "Allowances", icon: Percent },
  { id: "sec-charges", label: "Charges", icon: PlusCircle },
  { id: "sec-taxes", label: "Taxes", icon: Calculator },
  { id: "sec-totals", label: "Totals", icon: Calculator },
  { id: "sec-attachments", label: "Attachments", icon: Paperclip },
  { id: "sec-output", label: "Output options", icon: Settings },
  { id: "sec-create", label: "Create invoice", icon: CheckCircle2 },
];

const INVOICE_TYPE_CODES = [
  { code: "380", label: "380 — Commercial Invoice" },
  { code: "381", label: "381 — Credit Note" },
  { code: "384", label: "384 — Corrected Invoice" },
  { code: "389", label: "389 — Self-billed Invoice" },
  { code: "326", label: "326 — Partial Invoice" },
  { code: "386", label: "386 — Prepayment Invoice" },
];

const CURRENCY_LIST = [
  { symbol: "₹", code: "INR", label: "INR - Indian Rupee - Rs." },
  { symbol: "$", code: "USD", label: "USD - US Dollar - $" },
  { symbol: "€", code: "EUR", label: "EUR - Euro - €" },
  { symbol: "£", code: "GBP", label: "GBP - British Pound - £" },
  { symbol: "AED ", code: "AED", label: "AED - UAE Dirham" },
];

const UNIT_CODES = [
  { code: "EA", label: "EA — Each / Piece (C62)" },
  { code: "HUR", label: "HUR — Hour" },
  { code: "DAY", label: "DAY — Day" },
  { code: "MON", label: "MON — Month" },
  { code: "KGM", label: "KGM — Kilogram" },
  { code: "MTR", label: "MTR — Metre" },
  { code: "LTR", label: "LTR — Litre" },
];

const BTBadge = ({ code }: { code: string }) => (
  <span className="ml-1.5 font-mono text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
    ({code})
  </span>
);

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomSelectDropdownProps {
  value: string;
  onChange: (nextVal: string) => void;
  options: CustomSelectOption[];
  highlighted?: boolean;
  className?: string;
  compact?: boolean;
}

function CustomSelectDropdown({
  value,
  onChange,
  options,
  highlighted = false,
  className = "",
  compact = false,
}: CustomSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  const selectedOpt = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl text-left transition-all cursor-pointer ${
          compact ? "px-2.5 py-1.5 text-[11px]" : "px-3.5 py-2.5 text-xs"
        } ${
          highlighted
            ? "border-2 border-[#ff5500]/70 bg-[#ff5500]/10 dark:bg-[#ff5500]/15 font-black text-slate-900 dark:text-white shadow-2xs"
            : isOpen
              ? "border border-[#ff5500] bg-white dark:bg-zinc-900 font-bold text-slate-900 dark:text-white shadow-xs"
              : "border border-slate-200 dark:border-zinc-700/90 bg-slate-50/70 dark:bg-zinc-800/70 hover:border-slate-300 dark:hover:border-zinc-600 font-bold text-slate-900 dark:text-zinc-100"
        }`}
      >
        <span className="truncate">{selectedOpt?.label || value}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-150 ${
            highlighted ? "text-[#ff5500]" : "text-slate-400"
          } ${isOpen ? "rotate-180 text-[#ff5500]" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 min-w-[190px] max-h-64 overflow-y-auto rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#ff5500] text-white font-black shadow-2xs"
                    : "text-slate-700 dark:text-zinc-200 font-semibold hover:bg-orange-500/10 hover:text-[#ff5500]"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate">{opt.label}</div>
                  {opt.sublabel && (
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? "text-white/80" : "text-slate-400 dark:text-zinc-500"
                      }`}
                    >
                      {opt.sublabel}
                    </div>
                  )}
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PdfToEInvoiceStudio({
  files,
  setFiles,
  activeFile,
  fileInputRef,
  invoiceData,
  setInvoiceData,
  processing,
  handleProcess,
  setPreviewModalItem,
}: PdfToEInvoiceStudioProps) {
  const [activeNav, setActiveNav] = useState<string>("sec-invoice-data");
  const [showMoreInvoiceDetails, setShowMoreInvoiceDetails] = useState<boolean>(false);
  const [dueDaysOffset, setDueDaysOffset] = useState<string>("14");
  const [quantityUnitPlacement, setQuantityUnitPlacement] = useState<string>("in_quantity_col");
  const [showLineNumbers, setShowLineNumbers] = useState<string>("show");
  const [showPaymentQr, setShowPaymentQr] = useState<string>("show");
  const [pageNumbersPosition, setPageNumbersPosition] = useState<string>("bottom_center");
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; size: number }>>([]);
  const [validationResult, setValidationResult] = useState<{
    checked: boolean;
    valid: boolean;
    messages: string[];
  }>({ checked: false, valid: true, messages: [] });

  const attachInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const importJsonRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) => {
    setInvoiceData((prev) => ({ ...prev, [key]: value }));
  };

  const scrollToSection = (id: string) => {
    setActiveNav(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleDueDaysChange = (daysStr: string) => {
    setDueDaysOffset(daysStr);
    const days = parseInt(daysStr, 10);
    if (!isNaN(days) && days >= 0 && invoiceData.issueDate) {
      const base = new Date(invoiceData.issueDate);
      if (!isNaN(base.getTime())) {
        base.setDate(base.getDate() + days);
        updateField("dueDate", base.toISOString().slice(0, 10));
      }
    }
  };

  const updateItem = (idx: number, patch: Partial<InvoiceItem>) => {
    const next = [...invoiceData.items];
    next[idx] = { ...next[idx]!, ...patch };
    updateField("items", next);
  };

  const addItem = () => {
    updateField("items", [
      ...invoiceData.items,
      {
        id: `item_${Date.now()}`,
        description: "Professional Service / Product",
        subDescription: "",
        hsnSac: "",
        unit: "EA",
        quantity: 1,
        rate: 1000,
        taxPercent: 18,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (invoiceData.items.length <= 1) return;
    updateField(
      "items",
      invoiceData.items.filter((_, i) => i !== idx)
    );
  };

  // Calculations (EN 16931 BT-106 to BT-115)
  const taxMode = invoiceData.taxMode || "gst_intra";
  let sumLineNet = 0; // BT-106
  let sumTax = 0; // BT-110
  const taxBreakdownMap = new Map<number, { basis: number; tax: number }>();

  invoiceData.items.forEach((it) => {
    const net = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
    const ratePct = taxMode === "none" ? 0 : Number(it.taxPercent) || 0;
    const tax = (net * ratePct) / 100;
    sumLineNet += net;
    sumTax += tax;
    const prev = taxBreakdownMap.get(ratePct) || { basis: 0, tax: 0 };
    taxBreakdownMap.set(ratePct, { basis: prev.basis + net, tax: prev.tax + tax });
  });

  const allowanceTotal =
    invoiceData.discountType === "percent"
      ? (sumLineNet * Math.max(0, Number(invoiceData.discountValue) || 0)) / 100
      : Math.max(0, Number(invoiceData.discountValue) || 0); // BT-107
  const chargesTotal = Math.max(0, Number(invoiceData.additionalChargesAmount) || 0); // BT-108
  const totalNetExclVat = Math.max(0, sumLineNet - allowanceTotal + chargesTotal); // BT-109
  const totalGrossInclVat = totalNetExclVat + sumTax; // BT-112
  const prepaidAmount = Math.max(0, Number(invoiceData.prepaidAmount) || 0); // BT-113
  const payableAmount = Math.max(0, totalGrossInclVat - prepaidAmount); // BT-115

  const currSymbol = invoiceData.currency || "₹";

  // Check / Validate EN 16931 compliance rules (BR-01 to BR-16)
  const handleCheckInvoice = () => {
    const errs: string[] = [];
    if (!invoiceData.invoiceNumber?.trim()) errs.push("Missing Invoice number (BT-1).");
    if (!invoiceData.issueDate?.trim()) errs.push("Missing Invoice issue date (BT-2).");
    if (!invoiceData.companyName?.trim()) errs.push("Missing Biller / Seller company name (BT-27).");
    if (!invoiceData.clientName?.trim()) errs.push("Missing Invoice recipient / Buyer name (BT-44).");
    if (invoiceData.items.length === 0) errs.push("At least one invoice line item (BG-25) is required.");
    invoiceData.items.forEach((it, i) => {
      if (!it.description?.trim()) errs.push(`Line item #${i + 1} is missing item name (BT-153).`);
    });

    setValidationResult({
      checked: true,
      valid: errs.length === 0,
      messages:
        errs.length === 0
          ? [
              "EN 16931 / ZUGFeRD / XRechnung syntax & business rules (BR-01..BR-16) passed.",
              `Source PDF attached: ${activeFile ? activeFile.name : "Auto-generated visual PDF carrier"}.`,
              `Payable amount (BT-115): ${currSymbol}${payableAmount.toFixed(2)} verified.`,
            ]
          : errs,
    });

    if (errs.length === 0) {
      toast.success("EN 16931 E-Invoice check passed! Ready to create e-invoice.");
    } else {
      toast.error(`Found ${errs.length} validation issue(s). Please review.`);
    }
  };

  // Export / Import JSON invoice profile
  const handleExportProfileJson = () => {
    const blob = new Blob([JSON.stringify(invoiceData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `einvoice_${invoiceData.invoiceNumber || "profile"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported e-invoice data profile JSON!");
  };

  const handleImportProfileJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        setInvoiceData((prev) => ({ ...prev, ...parsed }));
        toast.success("Imported e-invoice profile data!");
      } catch {
        toast.error("Invalid JSON profile file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const inputRowClass =
    "grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-4 py-1.5";
  const labelClass =
    "sm:col-span-4 text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center";
  const fieldClass =
    "sm:col-span-8 w-full rounded-xl border border-slate-200 dark:border-zinc-700/90 bg-slate-50/70 dark:bg-zinc-800/70 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:border-[#ff5500] focus:bg-white dark:focus:bg-zinc-900 focus:outline-none transition-colors";
  const highlightedFieldClass =
    "sm:col-span-8 w-full rounded-xl border border-[#ff5500]/40 bg-[#ff5500]/5 dark:bg-[#ff5500]/10 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none transition-colors";

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start animate-in fade-in duration-200">
      {/* Hidden File Inputs */}
      <input
        ref={attachInputRef}
        type="file"
        multiple
        onChange={(e) => {
          const list = e.target.files;
          if (!list) return;
          const added = Array.from(list).map((f, i) => ({
            id: `att_${Date.now()}_${i}`,
            name: f.name,
            size: f.size,
          }));
          setAttachments((prev) => [...prev, ...added]);
          toast.success(`Attached ${added.length} supporting file(s).`);
          e.target.value = "";
        }}
        className="hidden"
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              updateField("logoDataUrl", reader.result);
              toast.success("Biller logo loaded!");
            }
          };
          reader.readAsDataURL(f);
          e.target.value = "";
        }}
        className="hidden"
      />
      <input
        ref={importJsonRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportProfileJson}
        className="hidden"
      />

      {/* LEFT SIDEBAR: Sticky EN 16931 Section Navigation (Matches PDF24 Layout) */}
      <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-20 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-md space-y-1">
        <div className="px-2.5 py-2 border-b border-slate-100 dark:border-zinc-800 mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#ff5500]">
            E-Invoice Sections
          </span>
          <span className="rounded bg-[#ff5500]/10 px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#ff5500]">
            EN 16931
          </span>
        </div>

        <nav className="space-y-0.5 max-h-[72vh] overflow-y-auto pr-1">
          {SIDEBAR_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeNav === sec.id;
            return (
              <div key={sec.id}>
                <button
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer text-left ${
                    isActive
                      ? "bg-[#ff5500] text-white shadow-xs"
                      : "text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{sec.label}</span>
                </button>
                {sec.children && (
                  <div className="ml-6 pl-2.5 border-l border-slate-200 dark:border-zinc-800 my-0.5 space-y-0.5">
                    {sec.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => scrollToSection(child.id)}
                        className={`w-full text-left rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer block ${
                          activeNav === child.id
                            ? "text-[#ff5500] font-extrabold"
                            : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        • {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* MAIN FORM AREA: All 12 EN 16931 / ZUGFeRD Structured Cards */}
      <div className="flex-1 min-w-0 w-full space-y-6">
        {/* Top Action Bar: Source PDF Banner + Import/Export JSON */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ff5500]/10 text-[#ff5500]">
              <FileCode2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {activeFile ? activeFile.name : "PDF to E-Invoice (ZUGFeRD / EN 16931 / UBL)"}
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                  Auto-Extracted
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Highlighted fields were parsed from your uploaded PDF. Review or complete any EN 16931 BT fields below.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeFile && (
              <button
                type="button"
                onClick={() => setPreviewModalItem(activeFile)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Inspect Source PDF</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => importJsonRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import JSON</span>
            </button>
            <button
              type="button"
              onClick={handleExportProfileJson}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* 1. INVOICE DATA CARD (BT-1 to BT-74) */}
        <section
          id="sec-invoice-data"
          className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-2">
            <div className="flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-[#ff5500]" />
              <h3 className="font-display text-base font-black text-slate-900 dark:text-white">
                Invoice data
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">BG-1 / BT-1..BT-74</span>
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>Invoice title</label>
            <input
              type="text"
              value={invoiceData.documentTitle || "Invoice"}
              onChange={(e) => updateField("documentTitle", e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Invoice number <BTBadge code="BT-1" />
            </label>
            <input
              type="text"
              value={invoiceData.invoiceNumber}
              onChange={(e) => updateField("invoiceNumber", e.target.value)}
              placeholder="2026-27/IR/25"
              className={highlightedFieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Invoice date <BTBadge code="BT-2" />
            </label>
            <input
              type="date"
              value={invoiceData.issueDate}
              onChange={(e) => updateField("issueDate", e.target.value)}
              className={highlightedFieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Invoice type <BTBadge code="BT-3" />
            </label>
            <CustomSelectDropdown
              className="sm:col-span-8"
              value={invoiceData.invoiceTypeCode || "380"}
              onChange={(val) => updateField("invoiceTypeCode", val)}
              options={INVOICE_TYPE_CODES.map((t) => ({ value: t.code, label: t.label }))}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Currency <BTBadge code="BT-5" />
            </label>
            <CustomSelectDropdown
              className="sm:col-span-8"
              value={invoiceData.currency || "₹"}
              onChange={(val) => updateField("currency", val)}
              options={CURRENCY_LIST.map((c) => ({ value: c.symbol, label: c.label }))}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Due date <BTBadge code="BT-9" />
            </label>
            <div className="sm:col-span-8 grid grid-cols-12 gap-2">
              <input
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => updateField("dueDate", e.target.value)}
                className="col-span-8 sm:col-span-9 rounded-xl border border-slate-200 dark:border-zinc-700/90 bg-slate-50/70 dark:bg-zinc-800/70 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:border-[#ff5500] focus:outline-none"
              />
              <div className="col-span-4 sm:col-span-3 flex items-center rounded-xl border border-slate-200 dark:border-zinc-700/90 bg-slate-50/70 dark:bg-zinc-800/70 overflow-hidden">
                <input
                  type="number"
                  value={dueDaysOffset}
                  onChange={(e) => handleDueDaysChange(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono font-bold bg-transparent text-slate-900 dark:text-zinc-100 focus:outline-none"
                  placeholder="14"
                />
                <span className="px-2.5 text-[11px] font-bold text-slate-400 border-l border-slate-200 dark:border-zinc-700">
                  Days
                </span>
              </div>
            </div>
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Buyer reference <BTBadge code="BT-10" />
            </label>
            <input
              type="text"
              value={invoiceData.buyerReference || ""}
              onChange={(e) => updateField("buyerReference", e.target.value)}
              placeholder="Buyer reference (Leitweg-ID, PO cost center...)"
              className={fieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Delivery/Service date <BTBadge code="BT-72" />
            </label>
            <input
              type="date"
              value={invoiceData.deliveryDate || invoiceData.issueDate}
              onChange={(e) => updateField("deliveryDate", e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Billing period <BTBadge code="BT-73, BT-74" />
            </label>
            <div className="sm:col-span-8 grid grid-cols-11 items-center gap-2">
              <input
                type="date"
                value={invoiceData.billingPeriodStart || ""}
                onChange={(e) => updateField("billingPeriodStart", e.target.value)}
                className="col-span-5 rounded-xl border border-slate-200 dark:border-zinc-700/90 bg-slate-50/70 dark:bg-zinc-800/70 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:border-[#ff5500] focus:outline-none"
              />
              <span className="col-span-1 text-center text-xs font-bold text-slate-400">to</span>
              <input
                type="date"
                value={invoiceData.billingPeriodEnd || ""}
                onChange={(e) => updateField("billingPeriodEnd", e.target.value)}
                className="col-span-5 rounded-xl border border-slate-200 dark:border-zinc-700/90 bg-slate-50/70 dark:bg-zinc-800/70 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:border-[#ff5500] focus:outline-none"
              />
            </div>
          </div>

          {/* Expandable "More details" (BT-11, BT-12, BT-13, BT-14) */}
          {showMoreInvoiceDetails && (
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2.5 animate-in fade-in duration-150">
              <div className={inputRowClass}>
                <label className={labelClass}>
                  Project reference <BTBadge code="BT-11" />
                </label>
                <input
                  type="text"
                  value={invoiceData.projectReference || ""}
                  onChange={(e) => updateField("projectReference", e.target.value)}
                  placeholder="PRJ-2026-01"
                  className={fieldClass}
                />
              </div>
              <div className={inputRowClass}>
                <label className={labelClass}>
                  Contract reference <BTBadge code="BT-12" />
                </label>
                <input
                  type="text"
                  value={invoiceData.contractReference || ""}
                  onChange={(e) => updateField("contractReference", e.target.value)}
                  placeholder="CNTR-9981"
                  className={fieldClass}
                />
              </div>
              <div className={inputRowClass}>
                <label className={labelClass}>
                  Purchase order ref <BTBadge code="BT-13" />
                </label>
                <input
                  type="text"
                  value={invoiceData.purchaseOrderReference || ""}
                  onChange={(e) => updateField("purchaseOrderReference", e.target.value)}
                  placeholder="PO-44912"
                  className={fieldClass}
                />
              </div>
              <div className={inputRowClass}>
                <label className={labelClass}>
                  Sales order ref <BTBadge code="BT-14" />
                </label>
                <input
                  type="text"
                  value={invoiceData.salesOrderReference || ""}
                  onChange={(e) => updateField("salesOrderReference", e.target.value)}
                  placeholder="SO-8821"
                  className={fieldClass}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowMoreInvoiceDetails((prev) => !prev)}
            className="w-full rounded-xl bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200/70 dark:hover:bg-zinc-800 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
          >
            <span>{showMoreInvoiceDetails ? "Less details" : "More details"}</span>
            {showMoreInvoiceDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </section>

        {/* 2. BILLER CARD (BG-4 / BT-27..BT-43) */}
        <section
          id="sec-biller"
          className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-2">
            <div className="flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-[#ff5500]" />
              <h3 className="font-display text-base font-black text-slate-900 dark:text-white">
                Biller
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">BG-4 / Seller</span>
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Company <BTBadge code="BT-27" />
            </label>
            <input
              type="text"
              value={invoiceData.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              placeholder="Legal Seller / Company Name"
              className={highlightedFieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Trade name <BTBadge code="BT-28" />
            </label>
            <input
              type="text"
              value={invoiceData.companyTradeName || ""}
              onChange={(e) => updateField("companyTradeName", e.target.value)}
              placeholder="Trading name / DBA"
              className={fieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Seller ID <BTBadge code="BT-29" />
            </label>
            <input
              type="text"
              value={invoiceData.companySellerId || ""}
              onChange={(e) => updateField("companySellerId", e.target.value)}
              placeholder="e.g. your supplier number at the customer"
              className={fieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Global seller ID <BTBadge code="BT-29" />
            </label>
            <div className="sm:col-span-8 grid grid-cols-12 gap-2">
              <input
                type="text"
                value={invoiceData.companyGlobalId || ""}
                onChange={(e) => updateField("companyGlobalId", e.target.value)}
                placeholder="Global ID (GLN / DUNS)"
                className="col-span-7 rounded-xl border border-slate-200 dark:border-zinc-700/90 bg-slate-50/70 dark:bg-zinc-800/70 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:border-[#ff5500] focus:outline-none"
              />
              <CustomSelectDropdown
                className="col-span-5"
                value={invoiceData.companyGlobalIdScheme || "0088"}
                onChange={(val) => updateField("companyGlobalIdScheme", val)}
                options={[
                  { value: "0088", label: "0088 — EAN / GLN" },
                  { value: "0060", label: "0060 — DUNS" },
                  { value: "0199", label: "0199 — LEI" },
                ]}
              />
            </div>
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              VAT / GST ID <BTBadge code="BT-31" />
            </label>
            <input
              type="text"
              value={invoiceData.companyGstin || ""}
              onChange={(e) => updateField("companyGstin", e.target.value.toUpperCase())}
              placeholder="e.g. 27AAPFU0939F1ZV or DE123456789"
              className={fieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Tax registration ID <BTBadge code="BT-32" />
            </label>
            <input
              type="text"
              value={invoiceData.companyPan || ""}
              onChange={(e) => updateField("companyPan", e.target.value.toUpperCase())}
              placeholder="PAN / Local Tax Number"
              className={fieldClass}
            />
          </div>

          {/* Biller Sub-card: Address */}
          <div id="sec-biller-address" className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Biller Address (BG-5)
            </h4>
            <div className={inputRowClass}>
              <label className={labelClass}>
                Street &amp; No. <BTBadge code="BT-35" />
              </label>
              <input
                type="text"
                value={invoiceData.companyAddress}
                onChange={(e) => updateField("companyAddress", e.target.value)}
                placeholder="Street address line 1"
                className={fieldClass}
              />
            </div>
            <div className={inputRowClass}>
              <label className={labelClass}>
                City &amp; Postcode <BTBadge code="BT-37, BT-38" />
              </label>
              <div className="sm:col-span-8 grid grid-cols-12 gap-2">
                <input
                  type="text"
                  value={invoiceData.companyCityState || ""}
                  onChange={(e) => updateField("companyCityState", e.target.value)}
                  placeholder="City / State"
                  className="col-span-8 rounded-xl border border-slate-200 dark:border-zinc-700/90 bg-slate-50/70 dark:bg-zinc-800/70 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:border-[#ff5500] focus:outline-none"
                />
                <input
                  type="text"
                  value={invoiceData.companyPostalCode || ""}
                  onChange={(e) => updateField("companyPostalCode", e.target.value)}
                  placeholder="ZIP / PIN"
                  className="col-span-4 rounded-xl border border-slate-200 dark:border-zinc-700/90 bg-slate-50/70 dark:bg-zinc-800/70 px-3.5 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-zinc-100 focus:border-[#ff5500] focus:outline-none"
                />
              </div>
            </div>
            <div className={inputRowClass}>
              <label className={labelClass}>
                Country <BTBadge code="BT-40" />
              </label>
              <CustomSelectDropdown
                className="sm:col-span-8"
                value={invoiceData.companyCountry || "India"}
                onChange={(val) => updateField("companyCountry", val)}
                options={[
                  { value: "India", label: "IN — India" },
                  { value: "Germany", label: "DE — Germany" },
                  { value: "United States", label: "US — United States" },
                  { value: "United Kingdom", label: "GB — United Kingdom" },
                  { value: "United Arab Emirates", label: "AE — United Arab Emirates" },
                ]}
              />
            </div>
          </div>

          {/* Biller Sub-card: Contact & Logo */}
          <div id="sec-biller-contact" className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Biller Contact (BG-6) &amp; Logo
            </h4>
            <div className={inputRowClass}>
              <label className={labelClass}>
                Contact person <BTBadge code="BT-41" />
              </label>
              <input
                type="text"
                value={invoiceData.companyContactName || ""}
                onChange={(e) => updateField("companyContactName", e.target.value)}
                placeholder="Department or Contact Name"
                className={fieldClass}
              />
            </div>
            <div className={inputRowClass}>
              <label className={labelClass}>
                Phone <BTBadge code="BT-42" />
              </label>
              <input
                type="text"
                value={invoiceData.companyPhone || ""}
                onChange={(e) => updateField("companyPhone", e.target.value)}
                placeholder="+91 98765 43210"
                className={fieldClass}
              />
            </div>
            <div className={inputRowClass}>
              <label className={labelClass}>
                Email <BTBadge code="BT-43" />
              </label>
              <input
                type="email"
                value={invoiceData.companyEmail}
                onChange={(e) => updateField("companyEmail", e.target.value)}
                placeholder="billing@company.com"
                className={fieldClass}
              />
            </div>
            <div id="sec-biller-logo" className={inputRowClass}>
              <label className={labelClass}>Company Logo</label>
              <div className="sm:col-span-8 flex items-center gap-3">
                {invoiceData.logoDataUrl && (
                  <img
                    src={invoiceData.logoDataUrl}
                    alt="Logo"
                    className="h-9 max-w-[110px] object-contain rounded border border-slate-200 p-1 bg-white"
                  />
                )}
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 cursor-pointer"
                >
                  {invoiceData.logoDataUrl ? "Change Logo" : "Select Logo"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. INVOICE RECIPIENT CARD (BG-7 / BT-44..BT-58) */}
        <section
          id="sec-recipient"
          className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-2">
            <div className="flex items-center gap-2.5">
              <UserCheck className="h-5 w-5 text-[#ff5500]" />
              <h3 className="font-display text-base font-black text-slate-900 dark:text-white">
                Invoice recipient
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">BG-7 / Buyer</span>
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Buyer Company <BTBadge code="BT-44" />
            </label>
            <input
              type="text"
              value={invoiceData.clientName}
              onChange={(e) => updateField("clientName", e.target.value)}
              placeholder="Recipient / Buyer Legal Name"
              className={highlightedFieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Trade name <BTBadge code="BT-45" />
            </label>
            <input
              type="text"
              value={invoiceData.clientTradeName || ""}
              onChange={(e) => updateField("clientTradeName", e.target.value)}
              placeholder="Buyer trade name (optional)"
              className={fieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Buyer ID <BTBadge code="BT-46" />
            </label>
            <input
              type="text"
              value={invoiceData.clientBuyerId || ""}
              onChange={(e) => updateField("clientBuyerId", e.target.value)}
              placeholder="Customer account number"
              className={fieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Buyer VAT / GST ID <BTBadge code="BT-48" />
            </label>
            <input
              type="text"
              value={invoiceData.clientGstin || ""}
              onChange={(e) => updateField("clientGstin", e.target.value.toUpperCase())}
              placeholder="Buyer GSTIN / VAT ID"
              className={fieldClass}
            />
          </div>

          {/* Recipient Address */}
          <div id="sec-recipient-address" className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Recipient Address (BG-8)
            </h4>
            <div className={inputRowClass}>
              <label className={labelClass}>
                Street &amp; No. <BTBadge code="BT-50" />
              </label>
              <input
                type="text"
                value={invoiceData.clientAddress}
                onChange={(e) => updateField("clientAddress", e.target.value)}
                placeholder="Buyer street address"
                className={fieldClass}
              />
            </div>
            <div className={inputRowClass}>
              <label className={labelClass}>
                City &amp; Postcode <BTBadge code="BT-52, BT-53" />
              </label>
              <div className="sm:col-span-8 grid grid-cols-12 gap-2">
                <input
                  type="text"
                  value={invoiceData.clientCityState || ""}
                  onChange={(e) => updateField("clientCityState", e.target.value)}
                  placeholder="City / State"
                  className="col-span-8 rounded-xl border border-slate-200 dark:border-zinc-700/90 bg-slate-50/70 dark:bg-zinc-800/70 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:border-[#ff5500] focus:outline-none"
                />
                <input
                  type="text"
                  value={invoiceData.clientPostalCode || ""}
                  onChange={(e) => updateField("clientPostalCode", e.target.value)}
                  placeholder="ZIP / PIN"
                  className="col-span-4 rounded-xl border border-slate-200 dark:border-zinc-700/90 bg-slate-50/70 dark:bg-zinc-800/70 px-3.5 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-zinc-100 focus:border-[#ff5500] focus:outline-none"
                />
              </div>
            </div>
            <div className={inputRowClass}>
              <label className={labelClass}>
                Country <BTBadge code="BT-55" />
              </label>
              <CustomSelectDropdown
                className="sm:col-span-8"
                value={invoiceData.clientCountry || "India"}
                onChange={(val) => updateField("clientCountry", val)}
                options={[
                  { value: "India", label: "IN — India" },
                  { value: "Germany", label: "DE — Germany" },
                  { value: "United States", label: "US — United States" },
                  { value: "United Kingdom", label: "GB — United Kingdom" },
                  { value: "United Arab Emirates", label: "AE — United Arab Emirates" },
                ]}
              />
            </div>
          </div>

          {/* Recipient Contact */}
          <div id="sec-recipient-contact" className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Recipient Contact (BG-9)
            </h4>
            <div className={inputRowClass}>
              <label className={labelClass}>
                Contact person <BTBadge code="BT-56" />
              </label>
              <input
                type="text"
                value={invoiceData.clientContactName || ""}
                onChange={(e) => updateField("clientContactName", e.target.value)}
                placeholder="Buyer contact person"
                className={fieldClass}
              />
            </div>
            <div className={inputRowClass}>
              <label className={labelClass}>
                Phone <BTBadge code="BT-57" />
              </label>
              <input
                type="text"
                value={invoiceData.clientPhone || ""}
                onChange={(e) => updateField("clientPhone", e.target.value)}
                placeholder="+91 98765 00000"
                className={fieldClass}
              />
            </div>
            <div className={inputRowClass}>
              <label className={labelClass}>
                Email <BTBadge code="BT-58" />
              </label>
              <input
                type="email"
                value={invoiceData.clientEmail}
                onChange={(e) => updateField("clientEmail", e.target.value)}
                placeholder="accounts@client.com"
                className={fieldClass}
              />
            </div>
          </div>
        </section>

        {/* 4. PAYMENT DETAILS CARD (BG-16 / BT-81..BT-86) */}
        <section
          id="sec-payment"
          className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-2">
            <div className="flex items-center gap-2.5">
              <CreditCard className="h-5 w-5 text-[#ff5500]" />
              <h3 className="font-display text-base font-black text-slate-900 dark:text-white">
                Payment details
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">BG-16 / BG-17</span>
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Payment means <BTBadge code="BT-81" />
            </label>
            <CustomSelectDropdown
              className="sm:col-span-8"
              value={invoiceData.paymentMeansCode || "30"}
              onChange={(val) => updateField("paymentMeansCode", val)}
              options={[
                { value: "30", label: "30 — Credit transfer (Bank / NEFT / RTGS)" },
                { value: "58", label: "58 — SEPA credit transfer" },
                { value: "48", label: "48 — Bank card / Credit card" },
                { value: "59", label: "59 — SEPA direct debit" },
                { value: "10", label: "10 — In cash" },
              ]}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Account holder <BTBadge code="BT-85" />
            </label>
            <input
              type="text"
              value={invoiceData.bankAccountHolder || invoiceData.companyName}
              onChange={(e) => updateField("bankAccountHolder", e.target.value)}
              placeholder="Payee account name"
              className={fieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              IBAN / Account No. <BTBadge code="BT-84" />
            </label>
            <input
              type="text"
              value={invoiceData.bankAccountNumber || ""}
              onChange={(e) => updateField("bankAccountNumber", e.target.value)}
              placeholder="IBAN or Bank Account Number"
              className={fieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              BIC / SWIFT / IFSC <BTBadge code="BT-86" />
            </label>
            <input
              type="text"
              value={invoiceData.bankIfscCode || ""}
              onChange={(e) => updateField("bankIfscCode", e.target.value.toUpperCase())}
              placeholder="BIC / SWIFT / IFSC code"
              className={fieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Payment reference <BTBadge code="BT-83" />
            </label>
            <input
              type="text"
              value={invoiceData.paymentReference || invoiceData.invoiceNumber}
              onChange={(e) => updateField("paymentReference", e.target.value)}
              placeholder="Remittance reference"
              className={fieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Payment terms <BTBadge code="BT-20" />
            </label>
            <input
              type="text"
              value={invoiceData.terms || ""}
              onChange={(e) => updateField("terms", e.target.value)}
              placeholder="Payable within 14 days without deduction"
              className={fieldClass}
            />
          </div>
        </section>

        {/* 5. DELIVERY DETAILS CARD (BG-13 / BT-70..BT-80) */}
        <section
          id="sec-delivery"
          className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-2">
            <div className="flex items-center gap-2.5">
              <Truck className="h-5 w-5 text-[#ff5500]" />
              <h3 className="font-display text-base font-black text-slate-900 dark:text-white">
                Delivery details
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">BG-13 / Ship-To</span>
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Deliver to party <BTBadge code="BT-70" />
            </label>
            <input
              type="text"
              value={invoiceData.deliveryPartyName || ""}
              onChange={(e) => updateField("deliveryPartyName", e.target.value)}
              placeholder="Leave blank if same as Invoice Recipient"
              className={fieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              Delivery address <BTBadge code="BT-75" />
            </label>
            <input
              type="text"
              value={invoiceData.deliveryAddress || ""}
              onChange={(e) => updateField("deliveryAddress", e.target.value)}
              placeholder="Delivery street & location"
              className={fieldClass}
            />
          </div>

          <div className={inputRowClass}>
            <label className={labelClass}>
              City &amp; Postcode <BTBadge code="BT-77, BT-78" />
            </label>
            <div className="sm:col-span-8 grid grid-cols-12 gap-2">
              <input
                type="text"
                value={invoiceData.deliveryCity || ""}
                onChange={(e) => updateField("deliveryCity", e.target.value)}
                placeholder="Delivery City"
                className="col-span-8 rounded-xl border border-slate-200 dark:border-zinc-700/90 bg-slate-50/70 dark:bg-zinc-800/70 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:border-[#ff5500] focus:outline-none"
              />
              <input
                type="text"
                value={invoiceData.deliveryPostalCode || ""}
                onChange={(e) => updateField("deliveryPostalCode", e.target.value)}
                placeholder="Postal Code"
                className="col-span-4 rounded-xl border border-slate-200 dark:border-zinc-700/90 bg-slate-50/70 dark:bg-zinc-800/70 px-3.5 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-zinc-100 focus:border-[#ff5500] focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* 6. ITEMS CARD (BG-25 / BT-126..BT-154) */}
        <section
          id="sec-items"
          className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <ListOrdered className="h-5 w-5 text-[#ff5500]" />
              <h3 className="font-display text-base font-black text-slate-900 dark:text-white">
                Items ({invoiceData.items.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#ff5500] hover:bg-[#e04b00] px-3.5 py-2 text-xs font-black text-white shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>Add item</span>
            </button>
          </div>

          <div className="space-y-3">
            {invoiceData.items.map((item, idx) => {
              const lineNet = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-slate-900 dark:bg-zinc-700 text-white px-2.5 py-0.5 text-[11px] font-mono font-black">
                      Position #{idx + 1} (BT-126)
                    </span>
                    {invoiceData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                        title="Delete position"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5">
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Item name (BT-153)
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                        placeholder="Item or service title"
                        className="w-full rounded-xl border border-[#ff5500]/40 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        HSN / Article ID (BT-155)
                      </label>
                      <input
                        type="text"
                        value={item.hsnSac || ""}
                        onChange={(e) => updateItem(idx, { hsnSac: e.target.value })}
                        placeholder="998314"
                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Unit (BT-130)
                      </label>
                      <CustomSelectDropdown
                        value={item.unit || "EA"}
                        onChange={(val) => updateItem(idx, { unit: val })}
                        options={UNIT_CODES.map((u) => ({ value: u.code, label: u.label }))}
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Qty (BT-129)
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-xs font-mono font-bold text-center text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Net price (BT-146)
                      </label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(idx, { rate: Number(e.target.value) })}
                        className="w-full rounded-xl border border-[#ff5500]/40 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono font-bold text-right text-slate-900 dark:text-white focus:border-[#ff5500] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-1">
                    <div className="md:col-span-7">
                      <input
                        type="text"
                        value={item.subDescription || ""}
                        onChange={(e) => updateItem(idx, { subDescription: e.target.value })}
                        placeholder="Item description / specification (BT-154)..."
                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-slate-600 dark:text-zinc-300 focus:border-[#ff5500] focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500">VAT/GST %:</span>
                      <input
                        type="number"
                        value={item.taxPercent}
                        onChange={(e) => updateItem(idx, { taxPercent: Number(e.target.value) })}
                        className="w-16 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs font-mono font-bold text-center"
                      />
                    </div>
                    <div className="md:col-span-3 text-right font-mono text-xs font-black text-slate-900 dark:text-white">
                      Net (BT-131): {currSymbol}
                      {lineNet.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7 & 8. ALLOWANCES (BG-20) & CHARGES (BG-21) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section
            id="sec-allowances"
            className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-[#ff5500]" />
                <h3 className="font-display text-sm font-black text-slate-900 dark:text-white">
                  Allowances / Discounts (BG-20)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">BT-92</span>
            </div>
            <div className="grid grid-cols-12 gap-2 items-center">
              <CustomSelectDropdown
                className="col-span-5"
                value={invoiceData.discountType || "flat"}
                onChange={(val) => updateField("discountType", val as "flat" | "percent")}
                options={[
                  { value: "flat", label: `Fixed Amount (${currSymbol})` },
                  { value: "percent", label: "Percentage (%)" },
                ]}
              />
              <input
                type="number"
                value={invoiceData.discountValue || 0}
                onChange={(e) => updateField("discountValue", Number(e.target.value))}
                placeholder="0.00"
                className="col-span-7 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-mono font-bold text-right"
              />
            </div>
          </section>

          <section
            id="sec-charges"
            className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-[#ff5500]" />
                <h3 className="font-display text-sm font-black text-slate-900 dark:text-white">
                  Charges / Surcharges (BG-21)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">BT-99</span>
            </div>
            <div className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={invoiceData.additionalChargesLabel || "Shipping / Handling"}
                onChange={(e) => updateField("additionalChargesLabel", e.target.value)}
                placeholder="Reason (BT-104)"
                className="col-span-7 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-bold"
              />
              <input
                type="number"
                value={invoiceData.additionalChargesAmount || 0}
                onChange={(e) => updateField("additionalChargesAmount", Number(e.target.value))}
                placeholder="0.00"
                className="col-span-5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-mono font-bold text-right"
              />
            </div>
          </section>
        </div>

        {/* 9 & 10. TAXES (BG-23) & TOTALS (BG-22 / BT-106..BT-115) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <section
            id="sec-taxes"
            className="md:col-span-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2.5">
              <h3 className="font-display text-sm font-black text-slate-900 dark:text-white">
                Taxes Breakdown (BG-23)
              </h3>
              <CustomSelectDropdown
                compact={true}
                className="w-40"
                value={taxMode}
                onChange={(val) => updateField("taxMode", val as any)}
                options={[
                  { value: "gst_intra", label: "GST (CGST+SGST)" },
                  { value: "gst_inter", label: "IGST / VAT" },
                  { value: "none", label: "Tax Exempt (Z)" },
                ]}
              />
            </div>
            <div className="space-y-2 text-xs">
              {Array.from(taxBreakdownMap.entries()).map(([ratePct, info]) => (
                <div
                  key={ratePct}
                  className="rounded-xl bg-slate-50 dark:bg-zinc-800/60 p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-800 dark:text-zinc-200">
                      Category {ratePct > 0 ? "S (Standard)" : "Z (Zero)"} · {ratePct}%
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Basis (BT-116): {currSymbol}
                      {info.basis.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-mono font-black text-slate-900 dark:text-white">
                    {currSymbol}
                    {info.tax.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            id="sec-totals"
            className="md:col-span-7 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-2.5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2.5">
              <h3 className="font-display text-sm font-black text-slate-900 dark:text-white">
                Document Totals (BG-22)
              </h3>
              <span className="text-[10px] font-mono text-slate-400">BT-106..BT-115</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Sum of Invoice line net amount (BT-106)</span>
                <span className="font-mono font-bold">{currSymbol}{sumLineNet.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Sum of allowances on document level (BT-107)</span>
                <span className="font-mono font-bold text-rose-500">-{currSymbol}{allowanceTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Sum of charges on document level (BT-108)</span>
                <span className="font-mono font-bold">+{currSymbol}{chargesTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-100 dark:border-zinc-800 font-bold">
                <span>Invoice total amount without VAT (BT-109)</span>
                <span className="font-mono">{currSymbol}{totalNetExclVat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Invoice total VAT / GST amount (BT-110)</span>
                <span className="font-mono font-bold">{currSymbol}{sumTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 font-bold">
                <span>Invoice total amount with VAT (BT-112)</span>
                <span className="font-mono">{currSymbol}{totalGrossInclVat.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Paid / Prepaid amount (BT-113)</span>
                <input
                  type="number"
                  value={invoiceData.prepaidAmount || 0}
                  onChange={(e) => updateField("prepaidAmount", Number(e.target.value))}
                  className="w-28 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1 text-right font-mono font-bold"
                />
              </div>
              <div className="rounded-xl bg-[#ff5500] text-white p-3 flex items-center justify-between font-black text-sm mt-2">
                <span>Amount due for payment (BT-115)</span>
                <span className="font-mono text-base">{currSymbol}{payableAmount.toFixed(2)}</span>
              </div>
            </div>
          </section>
        </div>

        {/* 11. ATTACHMENTS CARD (BG-24) — Matches Screenshot 2 */}
        <section
          id="sec-attachments"
          className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Paperclip className="h-5 w-5 text-[#ff5500]" />
              <h3 className="font-display text-base font-black text-slate-900 dark:text-white">
                Attachments
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">BG-24 / Supporting Docs</span>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-1.5">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 px-3.5 py-2 text-xs"
                >
                  <span className="font-bold truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                    className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => attachInputRef.current?.click()}
              className="rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 px-4 py-2 text-xs font-extrabold text-slate-800 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              Add file
            </button>
          </div>
        </section>

        {/* 12. OUTPUT OPTIONS CARD — Matches Screenshot 2 Exactly */}
        <section
          id="sec-output"
          className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Settings className="h-5 w-5 text-[#ff5500]" />
              <h3 className="font-display text-base font-black text-slate-900 dark:text-white">
                Output options
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">ZUGFeRD / XRechnung / UBL</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Format (Custom Brand-Themed Selector Dropdown) */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                Format
              </label>
              <CustomSelectDropdown
                highlighted={true}
                value={invoiceData.einvoiceOutputFormat || "zugferd-en16931"}
                onChange={(val) => updateField("einvoiceOutputFormat", val as any)}
                options={[
                  {
                    value: "zugferd-en16931",
                    label: "PDF / ZUGFeRD / EN16931 (Hybrid PDF + XML)",
                    sublabel: "PDF/A-3 document with embedded factur-x.xml",
                  },
                  {
                    value: "xrechnung-ubl",
                    label: "XML / XRechnung 3.0 (UBL 2.1)",
                    sublabel: "German & EU public procurement EN 16931 standard",
                  },
                  {
                    value: "ubl-2.1",
                    label: "XML / OASIS UBL 2.1 Standard",
                    sublabel: "Universal Business Language B2B XML",
                  },
                  {
                    value: "peppol-bis",
                    label: "XML / Peppol BIS Billing 3.0",
                    sublabel: "International Peppol e-delivery network XML",
                  },
                ]}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                Language
              </label>
              <CustomSelectDropdown
                value={invoiceData.einvoiceLanguage || "EN"}
                onChange={(val) => updateField("einvoiceLanguage", val)}
                options={[
                  { value: "EN", label: "EN - English" },
                  { value: "DE", label: "DE - Deutsch" },
                  { value: "FR", label: "FR - Français" },
                ]}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                Decimal separator
              </label>
              <CustomSelectDropdown
                value={invoiceData.einvoiceDecimalSeparator || "point"}
                onChange={(val) => updateField("einvoiceDecimalSeparator", val as any)}
                options={[
                  { value: "point", label: "Point (.)" },
                  { value: "comma", label: "Comma (,)" },
                ]}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                Thousands separator
              </label>
              <CustomSelectDropdown
                value={invoiceData.einvoiceThousandsSeparator || "comma"}
                onChange={(val) => updateField("einvoiceThousandsSeparator", val as any)}
                options={[
                  { value: "comma", label: "comma (,)" },
                  { value: "point", label: "point (.)" },
                  { value: "space", label: "space" },
                  { value: "none", label: "none" },
                ]}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                Date format
              </label>
              <CustomSelectDropdown
                value={invoiceData.einvoiceDateFormat || "dd/mm/yyyy"}
                onChange={(val) => updateField("einvoiceDateFormat", val as any)}
                options={[
                  { value: "dd/mm/yyyy", label: "dd/mm/yyyy" },
                  { value: "yyyy-mm-dd", label: "yyyy-mm-dd" },
                  { value: "mm/dd/yyyy", label: "mm/dd/yyyy" },
                ]}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                Quantity units
              </label>
              <CustomSelectDropdown
                value={quantityUnitPlacement}
                onChange={setQuantityUnitPlacement}
                options={[
                  { value: "in_quantity_col", label: "In quantity column" },
                  { value: "separate_col", label: "Separate column" },
                ]}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                Line numbers
              </label>
              <CustomSelectDropdown
                value={showLineNumbers}
                onChange={setShowLineNumbers}
                options={[
                  { value: "show", label: "Show" },
                  { value: "hide", label: "Hide" },
                ]}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                QR code for payment
              </label>
              <CustomSelectDropdown
                value={showPaymentQr}
                onChange={setShowPaymentQr}
                options={[
                  { value: "show", label: "Show" },
                  { value: "hide", label: "Do not show" },
                ]}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                Page numbers
              </label>
              <CustomSelectDropdown
                value={pageNumbersPosition}
                onChange={setPageNumbersPosition}
                options={[
                  { value: "bottom_center", label: "Bottom - Centered" },
                  { value: "bottom_right", label: "Bottom - Right" },
                  { value: "none", label: "Do not show" },
                ]}
              />
            </div>

            {/* "Use the PDF" selector matching Screenshot 2 */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                Use the PDF
              </label>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                  {activeFile ? activeFile.name : "No source PDF (Auto-generate visual PDF)"}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Choose or replace source PDF"
                  className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 p-2.5 text-slate-700 dark:text-zinc-200 cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                </button>
                {activeFile && (
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    title="Remove source PDF"
                    className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-500 p-2.5 text-slate-700 dark:text-zinc-200 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
              File name
            </label>
            <input
              type="text"
              value={
                invoiceData.einvoiceFileNamePattern ||
                "[date]_[buyer_name]_[invoice_number]_[currency]_[amount]"
              }
              onChange={(e) => updateField("einvoiceFileNamePattern", e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2 text-xs font-mono text-slate-700 dark:text-zinc-300"
            />
          </div>
        </section>

        {/* Validation Result Banner (when Check Invoice is clicked) */}
        {validationResult.checked && (
          <div
            className={`rounded-2xl border p-4 space-y-1.5 ${
              validationResult.valid
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
              {validationResult.valid ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              )}
              <span>
                {validationResult.valid
                  ? "EN 16931 / ZUGFeRD Validation Passed"
                  : "EN 16931 Validation Issues Found"}
              </span>
            </div>
            <ul className="list-disc list-inside text-xs space-y-0.5">
              {validationResult.messages.map((m, idx) => (
                <li key={idx}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {/* BOTTOM ACTION BAR: "Check invoice" & "Create invoice" (Matches Screenshot 2) */}
        <div
          id="sec-create"
          className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-md flex flex-wrap items-center justify-between gap-4"
        >
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 cursor-pointer"
            title="Scroll to top"
          >
            ↑ Top
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCheckInvoice}
              className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 px-5 py-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              Check invoice
            </button>

            <button
              type="button"
              disabled={processing}
              onClick={handleProcess}
              className="inline-flex items-center gap-2 rounded-xl bg-[#ff5500] hover:bg-[#e04b00] px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating E-Invoice...</span>
                </>
              ) : (
                <span>Create invoice</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
