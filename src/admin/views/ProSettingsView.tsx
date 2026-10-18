import { useState, useEffect, useMemo } from "react";
import {
  AdminStore,
  type UiEditSettings,
  type SiteDialogSettings,
  type SiteDialogType,
  type SiteDialogDisplayMode,
  type SiteDialogFrequency,
  type SiteDialogTargetPages,
  type WebsiteStructureSettings,
  type GuestLimitsConfig,
  CORE_PAGE_ROUTES,
} from "@/admin/lib/admin-store";
import { tools, TOOL_CATEGORIES, type ToolCategory } from "@/lib/tools";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { toast } from "sonner";
import { GlobalSiteDialog } from "@/components/GlobalSiteDialog";
import {
  Sliders,
  Power,
  Bot,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Shield,
  Palette,
  Megaphone,
  Compass,
  Check,
  Zap,
  BotOff,
  Flame,
  Sun,
  Coins,
  Link as LinkIcon,
  LayoutTemplate,
  Smartphone,
  Monitor,
  AlertCircle,
  Info,
  AlertTriangle,
  Gift,
  Copy,
  Eye,
  Settings2,
  ArrowRight,
} from "lucide-react";

export function ProSettingsView() {
  const [settings, setSettings] = useState<UiEditSettings>(() => AdminStore.getUiSettings());
  const [activeTab, setActiveTab] = useState<"tree" | "ui-edit" | "ai-control" | "dialog" | "structure" | "guest-limits">("dialog");
  const [dialogPreviewViewport, setDialogPreviewViewport] = useState<"mobile" | "desktop">("mobile");
  const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);
  const [copiedPreviewCode, setCopiedPreviewCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Background Removal": true,
    "AI Generation": true,
  });

  useEffect(() => {
    const sync = () => {
      setSettings(AdminStore.getUiSettings());
    };
    window.addEventListener(REALTIME_EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleUpdate = (partial: Partial<UiEditSettings>, message?: string) => {
    const updated = AdminStore.saveUiSettings(partial);
    setSettings(updated);
    if (message) {
      toast.success(message);
    }
  };

  const handleUpdateDialog = (partial: Partial<SiteDialogSettings>, message?: string) => {
    const current = settings.siteDialog;
    const updated = AdminStore.saveUiSettings({
      siteDialog: {
        ...current,
        ...partial,
      },
    });
    setSettings(updated);
    if (message) {
      toast.success(message);
    }
  };

  const handleUpdateStructure = (partial: Partial<WebsiteStructureSettings>, message?: string) => {
    const current = settings.structure;
    const updated = AdminStore.saveUiSettings({
      structure: {
        ...current,
        ...partial,
      },
    });
    setSettings(updated);
    if (message) {
      toast.success(message);
    }
  };

  const handleUpdateGuestLimits = (partial: Partial<GuestLimitsConfig>, message?: string) => {
    const current = settings.guestLimits || {
      guestBaseLimit: 5,
      guestDifferentToolBonus: 2,
      guestDifferentToolBonusEnabled: true,
    };
    const updated = AdminStore.saveGuestLimitsConfig({
      ...current,
      ...partial,
    });
    setSettings(updated);
    if (message) {
      toast.success(message);
    }
  };

  const applyDialogPreset = (preset: "offer" | "maintenance" | "feature" | "security") => {
    if (preset === "offer") {
      handleUpdateDialog(
        {
          enabled: true,
          type: "offer",
          title: "Limited Festival Creator Offer! 🎉",
          badgeText: "🔥 60% OFF SPECIAL OFFER",
          message:
            "Unlock 650 high-definition processing credits, unlimited 4K batch background removal, and priority GPU inference. Use coupon at checkout!",
          couponCode: "FESTIVE50",
          ctaText: "Claim 60% Off Now",
          ctaLink: "/pricing",
          secondaryText: "Maybe Later",
          displayMode: "modal",
          frequency: "session",
          targetPages: "all",
          showIcon: true,
        },
        "Applied Festival Promo Offer template!"
      );
    } else if (preset === "maintenance") {
      handleUpdateDialog(
        {
          enabled: true,
          type: "warning",
          title: "Scheduled Cloud Upgrades Tonight ⚙️",
          badgeText: "⚠️ SYSTEM NOTICE",
          message:
            "We are upgrading our high-speed neural rendering clusters between 02:00 AM - 03:00 AM UTC. Some AI batch tools might take a few extra seconds to process.",
          couponCode: "",
          ctaText: "View System Status",
          ctaLink: "/admin#health",
          secondaryText: "Understood",
          displayMode: "bottom-sheet",
          frequency: "always",
          targetPages: "all",
          showIcon: true,
        },
        "Applied Maintenance Warning template!"
      );
    } else if (preset === "feature") {
      handleUpdateDialog(
        {
          enabled: true,
          type: "info",
          title: "New Ultra-HD 4K AI Upscaler is Live! 🚀",
          badgeText: "✨ NEW RELEASE",
          message:
            "Enhance and restore any low-resolution photograph or illustration up to 4K resolution with crystal-clear edges and zero quality loss.",
          couponCode: "",
          ctaText: "Try 4K Upscaler Free",
          ctaLink: "/tools",
          secondaryText: "Dismiss",
          displayMode: "modal",
          frequency: "session",
          targetPages: "home",
          showIcon: true,
        },
        "Applied New Feature template!"
      );
    } else if (preset === "security") {
      handleUpdateDialog(
        {
          enabled: true,
          type: "alert",
          title: "Zero-Data Retention Privacy Active 🛡️",
          badgeText: "🚨 PRIVACY GUARANTEE",
          message:
            "All customer photographs and PDF files are processed directly in browser memory and strictly deleted immediately after download.",
          couponCode: "",
          ctaText: "Read Privacy Policy",
          ctaLink: "/privacy",
          secondaryText: "Close",
          displayMode: "floating-card",
          frequency: "once",
          targetPages: "all",
          showIcon: true,
        },
        "Applied Privacy & Security notice template!"
      );
    }
  };

  const handleMasterAiToggle = (enable: boolean) => {
    const updated = AdminStore.setAllAiFeatures(enable);
    setSettings(updated);
    if (enable) {
      toast.success("All AI capabilities, Assistant, Models page & AI buttons are now ACTIVATED!");
    } else {
      toast.warning("All AI capabilities, Assistant & Models are DEACTIVATED! All AI buttons and pages are now gone from the website.");
    }
  };

  const handleToggleRoute = (path: string, label: string) => {
    const nextState = AdminStore.togglePageRoute(path);
    setSettings(AdminStore.getUiSettings());
    if (nextState) {
      toast.success(`Page "${label}" (${path}) is now ACTIVE.`);
    } else {
      toast.warning(`Page "${label}" (${path}) is now DISABLED.`);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset all UI & Page Tree settings to system defaults?")) {
      const reset = AdminStore.resetUiSettingsToDefault();
      setSettings(reset);
      toast.success("Reset all UI & Page Tree settings to factory defaults.");
    }
  };

  const toggleCategoryExpand = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  // Group tools by category
  const toolsByCategory = useMemo(() => {
    const map: Record<string, typeof tools> = {};
    for (const cat of TOOL_CATEGORIES) {
      map[cat] = tools.filter((t) => t.category === cat);
    }
    return map;
  }, []);

  // Filtered Core Pages
  const filteredCorePages = useMemo(() => {
    return CORE_PAGE_ROUTES.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        categoryFilter === "all" ||
        (categoryFilter === "ai" && r.isAiRelated) ||
        (categoryFilter === "core" && !r.isAiRelated);
      return matchSearch && matchCat;
    });
  }, [searchQuery, categoryFilter]);

  // Filtered Tools
  const filteredToolsCount = useMemo(() => {
    return tools.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === "all" || categoryFilter === "tools" || categoryFilter === t.category;
      return matchSearch && matchCat;
    }).length;
  }, [searchQuery, categoryFilter]);

  const allAiActive =
    settings.aiMasterEnabled &&
    settings.aiAssistantEnabled &&
    settings.aiModelsPageEnabled;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-accent/10 border border-accent/25 px-2.5 py-0.5 font-mono text-[11px] font-extrabold uppercase text-accent">
              Pro Feature Control
            </span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
            Pro UI & Page Tree Settings
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Turn pages ON/OFF dynamically, edit UI components, or deactivate all AI models and assistant buttons with 1 click.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
            title="Reset all settings to defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* ─── MASTER AI KILL SWITCH / DEACTIVATION BANNER ─────────────────── */}
      <div
        className={`rounded-3xl border p-6 sm:p-7 transition-all shadow-md relative overflow-hidden ${
          allAiActive
            ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20"
            : "border-rose-500/40 bg-rose-500/10 dark:bg-rose-950/30"
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                  allAiActive
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                }`}
              >
                {allAiActive ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    AI Engine & Assistant Online
                  </>
                ) : (
                  <>
                    <BotOff className="h-3.5 w-3.5 text-rose-500" />
                    All AI Features Deactivated
                  </>
                )}
              </span>

              <span className="text-[11px] font-mono text-muted-foreground">
                Master AI Controller
              </span>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-black text-foreground">
              {allAiActive
                ? "AI Assistant & Model Pages are Currently ACTIVE"
                : "AI Assistant & Model Pages are CURRENTLY TURNED OFF"}
            </h3>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {allAiActive
                ? "Smart AI Assistant (/chat), Models page (/models), header links, floating Karudi button, and home page AI cards are currently visible to all visitors."
                : "All AI entry points are gone: /chat and /models are disabled, header 'Smart Assistant.' and 'Models.' links are hidden, floating AI button is removed, and home AI cards are hidden."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {allAiActive ? (
              <button
                type="button"
                onClick={() => handleMasterAiToggle(false)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-6 py-3.5 text-sm font-black shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Power className="h-4 w-4" />
                <span>Deactivate All AI Now</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleMasterAiToggle(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 text-sm font-black shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                <span>Activate All AI Features</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("ai-control")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "ai-control"
              ? "bg-foreground text-background shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>AI & Feature Toggles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tree")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "tree"
              ? "bg-foreground text-background shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Page Tree (ON / OFF)</span>
          <span className="rounded-full bg-accent/20 text-accent px-1.5 py-0.2 text-[10px] font-mono">
            {CORE_PAGE_ROUTES.length + tools.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dialog")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "dialog"
              ? "bg-foreground text-background shadow-xs font-extrabold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Megaphone className="h-4 w-4 text-accent" />
          <span>Site Dialogs & Banners</span>
          {settings.siteDialog?.enabled && (
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("structure")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "structure"
              ? "bg-foreground text-background shadow-xs font-extrabold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <LayoutTemplate className="h-4 w-4 text-blue-500" />
          <span>Website Structure</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ui-edit")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "ui-edit"
              ? "bg-foreground text-background shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>UI Edit Options</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("guest-limits")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "guest-limits"
              ? "bg-foreground text-background shadow-xs font-extrabold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Shield className="h-4 w-4 text-emerald-500" />
          <span>Guest Tool Limits</span>
          <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-mono font-bold">
            {settings.guestLimits?.guestBaseLimit ?? 5} + {settings.guestLimits?.guestDifferentToolBonus ?? 2} Bonus
          </span>
        </button>
      </div>

      {/* ─── TAB 1: AI & FEATURE TOGGLES ─────────────────────────────────── */}
      {activeTab === "ai-control" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. AI Assistant Chat Route */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">AI Chat Assistant (/chat)</h4>
                    <p className="text-[11px] font-mono text-muted-foreground">Route & Agent Loop</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdate(
                      { aiAssistantEnabled: !settings.aiAssistantEnabled },
                      settings.aiAssistantEnabled ? "AI Chat disabled" : "AI Chat enabled"
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    settings.aiAssistantEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                  }`}
                  role="switch"
                  aria-checked={settings.aiAssistantEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      settings.aiAssistantEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When OFF, user cannot access /chat or start AI threads. A polite offline screen is displayed.
              </p>
            </div>

            {/* 2. AI Models Page */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">AI Models Page (/models)</h4>
                    <p className="text-[11px] font-mono text-muted-foreground">Model Specs & FAQ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdate(
                      { aiModelsPageEnabled: !settings.aiModelsPageEnabled },
                      settings.aiModelsPageEnabled ? "Models page disabled" : "Models page enabled"
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    settings.aiModelsPageEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                  }`}
                  role="switch"
                  aria-checked={settings.aiModelsPageEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      settings.aiModelsPageEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Controls access to the /models route detailing Karudi, Ganga, Brahmaputra, Narmada, and Saraswati.
              </p>
            </div>

            {/* 3. Floating Karudi Assistant FAB */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Floating AI Widget (FAB)</h4>
                    <p className="text-[11px] font-mono text-muted-foreground">Bottom-Right Corner</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdate(
                      { aiFabWidgetEnabled: !settings.aiFabWidgetEnabled },
                      settings.aiFabWidgetEnabled ? "Floating AI widget hidden" : "Floating AI widget shown"
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    settings.aiFabWidgetEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                  }`}
                  role="switch"
                  aria-checked={settings.aiFabWidgetEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      settings.aiFabWidgetEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Shows the floating Karudi avatar button on all public pages with quick questions popup.
              </p>
            </div>

            {/* 4. Header AI Links */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <LinkIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Header AI Links</h4>
                    <p className="text-[11px] font-mono text-muted-foreground">"Smart Assistant." & "Models."</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdate(
                      { aiHeaderLinksEnabled: !settings.aiHeaderLinksEnabled },
                      settings.aiHeaderLinksEnabled ? "Header AI links hidden" : "Header AI links shown"
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    settings.aiHeaderLinksEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                  }`}
                  role="switch"
                  aria-checked={settings.aiHeaderLinksEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      settings.aiHeaderLinksEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Displays or hides the "Smart Assistant." and "Models." navigation items in the top navbar.
              </p>
            </div>

            {/* 5. Home Page AI Sections */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Home Page AI Cards</h4>
                    <p className="text-[11px] font-mono text-muted-foreground">Hero & Showcase Sections</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdate(
                      { aiHomeSectionsEnabled: !settings.aiHomeSectionsEnabled },
                      settings.aiHomeSectionsEnabled ? "Home AI cards hidden" : "Home AI cards shown"
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    settings.aiHomeSectionsEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                  }`}
                  role="switch"
                  aria-checked={settings.aiHomeSectionsEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      settings.aiHomeSectionsEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hides the "Try Karudi 1.0 Prime" hero button, the "Five Neural Engines" section, and "Meet Karudi" section.
              </p>
            </div>

            {/* 6. Footer AI Links */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Footer AI Suite Column</h4>
                    <p className="text-[11px] font-mono text-muted-foreground">Footer Navigation</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdate(
                      { aiFooterLinksEnabled: !settings.aiFooterLinksEnabled },
                      settings.aiFooterLinksEnabled ? "Footer AI links hidden" : "Footer AI links shown"
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    settings.aiFooterLinksEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                  }`}
                  role="switch"
                  aria-checked={settings.aiFooterLinksEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      settings.aiFooterLinksEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hides the "AI Models Suite" and Karudi assistant shortcuts in the website footer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: PAGE TREE ON / OFF ──────────────────────────────────── */}
      {activeTab === "tree" && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search page tree by route path or title…"
                className="w-full rounded-2xl border border-input bg-card pl-10 pr-4 py-2.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-all shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === "all" ? "bg-foreground text-background" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                All Pages
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("core")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === "core" ? "bg-foreground text-background" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Core Site Pages
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("ai")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === "ai" ? "bg-foreground text-background" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                AI Pages
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("tools")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === "tools" ? "bg-foreground text-background" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Tool Pages ({tools.length})
              </button>
            </div>
          </div>

          {/* Core Routes Group */}
          {(categoryFilter === "all" || categoryFilter === "core" || categoryFilter === "ai") && (
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <Compass className="h-5 w-5 text-accent" />
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">
                      Core Website Pages & Navigation
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Main entry points, portals, legal pages, and AI centers.
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-mono font-bold text-muted-foreground">
                  {filteredCorePages.filter((r) => AdminStore.isPageEnabled(r.path)).length} / {filteredCorePages.length} Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredCorePages.map((route) => {
                  const isEnabled = AdminStore.isPageEnabled(route.path);
                  return (
                    <div
                      key={route.id}
                      className={`rounded-2xl border p-4 transition-all flex items-start justify-between gap-4 ${
                        isEnabled
                          ? "border-border bg-background hover:border-foreground/20"
                          : "border-destructive/20 bg-destructive/5 opacity-70"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground truncate">{route.name}</h4>
                          <span className="font-mono text-[11px] rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">
                            {route.path}
                          </span>
                          {route.isAiRelated && (
                            <span className="rounded-md bg-accent/15 border border-accent/30 px-1.5 py-0.2 text-[10px] font-black text-accent uppercase">
                              AI Engine
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{route.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleRoute(route.path, route.name)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          isEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                        }`}
                        role="switch"
                        aria-checked={isEnabled}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                            isEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tools Hierarchy Tree */}
          {(categoryFilter === "all" || categoryFilter === "tools" || TOOL_CATEGORIES.includes(categoryFilter as any)) && (
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <Layers className="h-5 w-5 text-accent" />
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">
                      Tools Directory Sub-Pages (/tools/$slug)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Toggle any individual tool page on or off. Disabled tools show maintenance state.
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-mono font-bold text-muted-foreground">
                  {tools.filter((t) => AdminStore.isToolEnabled(t.slug)).length} / {tools.length} Active
                </span>
              </div>

              {/* Grouped by Category */}
              <div className="space-y-3">
                {TOOL_CATEGORIES.map((cat) => {
                  const catTools = toolsByCategory[cat] || [];
                  const activeInCat = catTools.filter((t) => AdminStore.isToolEnabled(t.slug)).length;
                  const isExpanded = expandedCategories[cat] ?? false;

                  const filteredCatTools = catTools.filter((t) => {
                    if (!searchQuery) return true;
                    return (
                      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.slug.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                  });

                  if (filteredCatTools.length === 0) return null;

                  return (
                    <div key={cat} className="rounded-2xl border border-border/80 bg-background/60 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleCategoryExpand(cat)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/60 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-bold text-xs sm:text-sm text-foreground">{cat}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            ({activeInCat}/{catTools.length} Active)
                          </span>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            activeInCat === catTools.length
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {activeInCat === catTools.length ? "All Enabled" : `${catTools.length - activeInCat} Disabled`}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filteredCatTools.map((t) => {
                            const isEnabled = AdminStore.isToolEnabled(t.slug);
                            return (
                              <div
                                key={t.slug}
                                className={`rounded-xl border p-3 flex items-center justify-between gap-3 transition-all ${
                                  isEnabled
                                    ? "border-border bg-card hover:border-foreground/20"
                                    : "border-destructive/20 bg-destructive/5 opacity-70"
                                }`}
                              >
                                <div className="space-y-0.5 min-w-0">
                                  <p className="font-bold text-xs text-foreground truncate">{t.name}</p>
                                  <p className="font-mono text-[10px] text-muted-foreground truncate">
                                    /tools/{t.slug}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleToggleRoute(`/tools/${t.slug}`, t.name)}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                    isEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                                  }`}
                                  role="switch"
                                  aria-checked={isEnabled}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                                      isEnabled ? "translate-x-4" : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: UI EDIT OPTIONS ─────────────────────────────────────── */}
      {activeTab === "ui-edit" && (
        <div className="space-y-6">
          {/* Header Branding & Elements */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <Palette className="h-5 w-5 text-accent" />
              <div>
                <h3 className="font-display text-base font-bold text-foreground">Header & Navigation Customizer</h3>
                <p className="text-xs text-muted-foreground">Customize branding text, icons, and navbar links.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Brand Text */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Site Logo / Brand Text</label>
                <input
                  type="text"
                  value={settings.headerBrandText}
                  onChange={(e) => handleUpdate({ headerBrandText: e.target.value })}
                  placeholder="e.g. bg."
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground focus:border-foreground focus:outline-none"
                />
                <p className="text-[11px] text-muted-foreground">Displayed prominently in the center of SiteHeader.</p>
              </div>

              {/* Toggles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Festival Offer Wand Icon */}
                <div className="rounded-xl border border-border p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Festival Offer Icon</p>
                      <p className="text-[10px] text-muted-foreground">Header Wand Button</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdate({ showFestivalOfferButton: !settings.showFestivalOfferButton })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      settings.showFestivalOfferButton ? "bg-emerald-500" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        settings.showFestivalOfferButton ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Theme Toggle Icon */}
                <div className="rounded-xl border border-border p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Theme Switcher</p>
                      <p className="text-[10px] text-muted-foreground">Day/Night Pill</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdate({ showThemeToggle: !settings.showThemeToggle })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      settings.showThemeToggle ? "bg-emerald-500" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        settings.showThemeToggle ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Token Balance Pill */}
                <div className="rounded-xl border border-border p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Token Balance Pill</p>
                      <p className="text-[10px] text-muted-foreground">Header Token Count</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdate({ showTokenPill: !settings.showTokenPill })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      settings.showTokenPill ? "bg-emerald-500" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        settings.showTokenPill ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Pricing Link */}
                <div className="rounded-xl border border-border p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Pricing Link</p>
                      <p className="text-[10px] text-muted-foreground">"Pricing." In Nav</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdate({ showPricingLink: !settings.showPricingLink })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      settings.showPricingLink ? "bg-emerald-500" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        settings.showPricingLink ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Announcement Bar Customizer */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <Megaphone className="h-5 w-5 text-accent" />
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">Top Site Announcement Banner</h3>
                  <p className="text-xs text-muted-foreground">Show a promotional message or maintenance alert across all pages.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUpdate({ announcementEnabled: !settings.announcementEnabled })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.announcementEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                }`}
                role="switch"
                aria-checked={settings.announcementEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    settings.announcementEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Banner Text</label>
                <input
                  type="text"
                  value={settings.announcementText}
                  onChange={(e) => handleUpdate({ announcementText: e.target.value })}
                  placeholder="e.g. 🚀 Special 60% OFF Creator Offer Live!"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground focus:border-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Action Link URL</label>
                <input
                  type="text"
                  value={settings.announcementLink}
                  onChange={(e) => handleUpdate({ announcementLink: e.target.value })}
                  placeholder="e.g. /pricing or /tools"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground focus:border-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Banner Theme Color */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Banner Theme Style</label>
              <div className="flex items-center gap-2.5">
                {(["amber", "emerald", "indigo", "rose", "violet"] as const).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleUpdate({ announcementBgColor: color })}
                    className={`rounded-xl px-3 py-1.5 text-xs font-extrabold capitalize border transition-all cursor-pointer ${
                      settings.announcementBgColor === color
                        ? "border-foreground bg-foreground text-background scale-105"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SITE DIALOGS & ANNOUNCEMENT MODAL ───────────────────────── */}
      {activeTab === "dialog" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Banner & Quick Controls */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  settings.siteDialog.enabled
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Site-Wide Announcement & Popup Dialog Box
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                      settings.siteDialog.enabled
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        settings.siteDialog.enabled ? "bg-emerald-500 animate-ping" : "bg-muted-foreground"
                      }`}
                    />
                    {settings.siteDialog.enabled ? "Active on Website" : "Turned OFF"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Broadcast promotional offers, urgent system alerts, maintenance warnings, or feature news with 100% mobile-friendly responsive modals.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsLivePreviewOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-xs hover:bg-muted transition-all cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-accent" />
                <span>Test Live Popup</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleUpdateDialog(
                    { enabled: !settings.siteDialog.enabled },
                    settings.siteDialog.enabled ? "Site Dialog deactivated" : "Site Dialog is now live on the website!"
                  )
                }
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black shadow-md transition-all cursor-pointer ${
                  settings.siteDialog.enabled
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                <span>{settings.siteDialog.enabled ? "Deactivate Dialog" : "Activate Dialog"}</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Templates Bar */}
          <div className="rounded-2xl border border-border bg-muted/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>1-Click Preset Templates:</span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => applyDialogPreset("offer")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                <Gift className="h-3 w-3" />
                <span>Festive 60% Off Offer</span>
              </button>

              <button
                type="button"
                onClick={() => applyDialogPreset("maintenance")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Maintenance Notice</span>
              </button>

              <button
                type="button"
                onClick={() => applyDialogPreset("feature")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>New 4K Upscaler Feature</span>
              </button>

              <button
                type="button"
                onClick={() => applyDialogPreset("security")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                <Shield className="h-3 w-3" />
                <span>Privacy & Security Notice</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Editor & Live Responsive Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Dialog Configuration Form */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Dialog Type Selection */}
              <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
                  1. Select Dialog Type & Purpose
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(
                    [
                      { id: "offer", label: "New Offer", icon: Gift, color: "text-rose-500", desc: "Promo & Discounts" },
                      { id: "info", label: "Information", icon: Info, color: "text-blue-500", desc: "General News" },
                      { id: "alert", label: "Alert", icon: AlertCircle, color: "text-amber-500", desc: "Important Notice" },
                      { id: "warning", label: "Warning", icon: AlertTriangle, color: "text-rose-600", desc: "Maintenance" },
                    ] as const
                  ).map((t) => {
                    const Icon = t.icon;
                    const isSelected = settings.siteDialog.type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleUpdateDialog({ type: t.id as SiteDialogType })}
                        className={`rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-foreground bg-muted/60 shadow-sm ring-1 ring-foreground"
                            : "border-border bg-card hover:bg-muted/30"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${t.color}`} />
                        <p className="font-extrabold text-xs text-foreground mt-2">{t.label}</p>
                        <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Dialog Content Form */}
              <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
                  2. Dialog Header & Body Message
                </label>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-foreground">Dialog Title</label>
                    <input
                      type="text"
                      value={settings.siteDialog.title}
                      onChange={(e) => handleUpdateDialog({ title: e.target.value })}
                      placeholder="e.g. Special Festival Creator Offer! 🎉"
                      className="mt-1 w-full rounded-2xl border border-input bg-background px-3.5 py-2.5 text-xs font-bold text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Top Badge Text</label>
                    <input
                      type="text"
                      value={settings.siteDialog.badgeText}
                      onChange={(e) => handleUpdateDialog({ badgeText: e.target.value })}
                      placeholder="e.g. 🔥 60% OFF SPECIAL OFFER"
                      className="mt-1 w-full rounded-2xl border border-input bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Announcement Message Content</label>
                    <textarea
                      rows={3}
                      value={settings.siteDialog.message}
                      onChange={(e) => handleUpdateDialog({ message: e.target.value })}
                      placeholder="Write your announcement details here..."
                      className="mt-1 w-full rounded-2xl border border-input bg-background p-3.5 text-xs text-foreground leading-relaxed focus:border-accent focus:outline-none"
                    />
                  </div>

                  {settings.siteDialog.type === "offer" && (
                    <div>
                      <label className="text-xs font-bold text-foreground">
                        Discount Coupon Code (Optional - with 1-click copy)
                      </label>
                      <input
                        type="text"
                        value={settings.siteDialog.couponCode || ""}
                        onChange={(e) => handleUpdateDialog({ couponCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. FESTIVE50"
                        className="mt-1 w-full rounded-2xl border border-dashed border-rose-500/50 bg-rose-500/5 px-3.5 py-2.5 font-mono text-xs font-black tracking-wider text-foreground focus:border-accent focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Action Buttons & Routing */}
              <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
                  3. Buttons & Action Links
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-foreground">Primary Action Button Text</label>
                    <input
                      type="text"
                      value={settings.siteDialog.ctaText}
                      onChange={(e) => handleUpdateDialog({ ctaText: e.target.value })}
                      placeholder="e.g. Claim Offer Now"
                      className="mt-1 w-full rounded-2xl border border-input bg-background px-3.5 py-2.5 text-xs font-bold text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Primary Action Link URL</label>
                    <input
                      type="text"
                      value={settings.siteDialog.ctaLink}
                      onChange={(e) => handleUpdateDialog({ ctaLink: e.target.value })}
                      placeholder="e.g. /pricing or /tools"
                      className="mt-1 w-full rounded-2xl border border-input bg-background px-3.5 py-2.5 text-xs font-mono text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-foreground">Secondary Dismiss Button Text</label>
                    <input
                      type="text"
                      value={settings.siteDialog.secondaryText || ""}
                      onChange={(e) => handleUpdateDialog({ secondaryText: e.target.value })}
                      placeholder="e.g. Maybe Later (Leave blank to hide)"
                      className="mt-1 w-full rounded-2xl border border-input bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Display Style, Targeting & Timing */}
              <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
                <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
                  4. Layout Style, Targeting & Frequency
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground">Display Layout</label>
                    <select
                      value={settings.siteDialog.displayMode}
                      onChange={(e) => handleUpdateDialog({ displayMode: e.target.value as SiteDialogDisplayMode })}
                      className="mt-1 w-full rounded-2xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-accent focus:outline-none cursor-pointer"
                    >
                      <option value="modal">Centered Modal (Mobile Bottom-Sheet)</option>
                      <option value="bottom-sheet">Bottom Sheet Drawer</option>
                      <option value="floating-card">Floating Corner Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Target Pages</label>
                    <select
                      value={settings.siteDialog.targetPages}
                      onChange={(e) => handleUpdateDialog({ targetPages: e.target.value as SiteDialogTargetPages })}
                      className="mt-1 w-full rounded-2xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-accent focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Public Pages</option>
                      <option value="home">Homepage Only (/)</option>
                      <option value="pricing">Pricing Page Only (/pricing)</option>
                      <option value="tools">Tools Directory (/tools)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Impression Frequency</label>
                    <select
                      value={settings.siteDialog.frequency}
                      onChange={(e) => handleUpdateDialog({ frequency: e.target.value as SiteDialogFrequency })}
                      className="mt-1 w-full rounded-2xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-accent focus:outline-none cursor-pointer"
                    >
                      <option value="session">Once Per Session</option>
                      <option value="once">Once Per Visitor (Permanent)</option>
                      <option value="always">Always (Every Page Load)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Real-Time Interactive Live Mockup */}
            <div className="lg:col-span-5 sticky top-20 space-y-4">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
                {/* Viewport Switcher */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-accent" />
                    <span>Real-Time Live Preview</span>
                  </span>

                  <div className="inline-flex rounded-xl border border-border bg-muted/40 p-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setDialogPreviewViewport("mobile")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                        dialogPreviewViewport === "mobile"
                          ? "bg-foreground text-background shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>Mobile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDialogPreviewViewport("desktop")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                        dialogPreviewViewport === "desktop"
                          ? "bg-foreground text-background shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Monitor className="h-3.5 w-3.5" />
                      <span>Desktop</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Screen Frame */}
                <div className="mt-4 flex justify-center">
                  <div
                    className={`relative rounded-3xl border-2 border-border/80 bg-background/95 p-4 shadow-xl transition-all duration-300 ${
                      dialogPreviewViewport === "mobile"
                        ? "w-[360px] min-h-[480px] rounded-[36px] border-4 border-foreground/20 flex flex-col justify-end"
                        : "w-full min-h-[380px] flex items-center justify-center"
                    }`}
                  >
                    {/* Simulated Phone Notch */}
                    {dialogPreviewViewport === "mobile" && (
                      <div className="absolute top-2 inset-x-0 flex justify-center">
                        <div className="h-3.5 w-24 rounded-full bg-foreground/15" />
                      </div>
                    )}

                    {/* Preview Content Inside Phone or Desktop Frame */}
                    <div
                      className={`w-full rounded-2xl border border-border bg-card p-5 shadow-lg relative overflow-hidden transition-all ${
                        settings.siteDialog.type === "offer"
                          ? "border-rose-500/30 ring-1 ring-rose-500/15"
                          : settings.siteDialog.type === "alert"
                          ? "border-amber-500/30"
                          : settings.siteDialog.type === "warning"
                          ? "border-rose-500/40"
                          : "border-blue-500/30"
                      }`}
                    >
                      {/* Swipe Handle for Mobile Preview */}
                      {dialogPreviewViewport === "mobile" && (
                        <div className="flex justify-center -mt-2 mb-3">
                          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                        </div>
                      )}

                      <div className="flex items-start gap-3 pr-6">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            settings.siteDialog.type === "offer"
                              ? "bg-rose-500/10 text-rose-500"
                              : settings.siteDialog.type === "alert"
                              ? "bg-amber-500/10 text-amber-500"
                              : settings.siteDialog.type === "warning"
                              ? "bg-rose-600/10 text-rose-600"
                              : "bg-blue-500/10 text-blue-500"
                          }`}
                        >
                          {settings.siteDialog.type === "offer" ? (
                            <Flame className="h-4 w-4" />
                          ) : settings.siteDialog.type === "alert" ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : settings.siteDialog.type === "warning" ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <Info className="h-4 w-4" />
                          )}
                        </div>

                        <div>
                          {settings.siteDialog.badgeText && (
                            <span className="inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-extrabold uppercase text-accent tracking-wide mb-1">
                              {settings.siteDialog.badgeText}
                            </span>
                          )}
                          <h4 className="font-display text-sm font-black text-foreground leading-snug">
                            {settings.siteDialog.title || "Announcement Title"}
                          </h4>
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        {settings.siteDialog.message || "Your message body goes here..."}
                      </p>

                      {settings.siteDialog.type === "offer" && settings.siteDialog.couponCode && (
                        <div className="mt-3 rounded-xl border border-dashed border-rose-500/40 bg-rose-500/5 p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[9px] font-bold uppercase text-rose-500">Coupon</span>
                            <p className="font-mono font-black text-foreground">{settings.siteDialog.couponCode}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCopiedPreviewCode(true);
                              setTimeout(() => setCopiedPreviewCode(false), 2000);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-card border border-border px-2 py-1 text-[11px] font-bold text-foreground"
                          >
                            {copiedPreviewCode ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span>{copiedPreviewCode ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      )}

                      <div className="mt-4 flex flex-col gap-2">
                        {settings.siteDialog.ctaText && (
                          <div className="rounded-xl bg-foreground text-background px-4 py-2 text-center text-xs font-black shadow-xs">
                            {settings.siteDialog.ctaText}
                          </div>
                        )}
                        {settings.siteDialog.secondaryText && (
                          <div className="rounded-xl border border-border bg-card px-3 py-1.5 text-center text-[11px] font-bold text-muted-foreground">
                            {settings.siteDialog.secondaryText}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Target: <strong className="text-foreground">{settings.siteDialog.targetPages}</strong></span>
                  <span>Frequency: <strong className="text-foreground">{settings.siteDialog.frequency}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: WEBSITE STRUCTURE & LAYOUT ──────────────────────────────── */}
      {activeTab === "structure" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Website Layout & Container Structure
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure responsive page max-width, hero showcase layouts, navbar stickiness, and footer grid columns.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Container Width */}
            <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
              <div>
                <h4 className="font-bold text-sm text-foreground">Container Max Width</h4>
                <p className="text-xs text-muted-foreground">Defines edge margins across all public tools and landing pages.</p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    { id: "boxed", label: "Boxed (1280px)", desc: "Standard compact" },
                    { id: "wide", label: "Wide (1440px)", desc: "Modern spacious" },
                    { id: "full", label: "Full (1600px)", desc: "Maximum canvas" },
                  ] as const
                ).map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleUpdateStructure({ containerMaxWidth: w.id })}
                    className={`rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                      settings.structure.containerMaxWidth === w.id
                        ? "border-foreground bg-muted/60 shadow-sm ring-1 ring-foreground"
                        : "border-border bg-card hover:bg-muted/30"
                    }`}
                  >
                    <p className="font-bold text-xs text-foreground">{w.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{w.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Hero Section Layout */}
            <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
              <div>
                <h4 className="font-bold text-sm text-foreground">Home Hero Showcase Layout</h4>
                <p className="text-xs text-muted-foreground">Select how the primary background removal drag-and-drop zone renders.</p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    { id: "split", label: "Split Hero", desc: "Text left, Upload right" },
                    { id: "centered", label: "Centered Hero", desc: "Large central dropzone" },
                    { id: "minimal", label: "Minimalist", desc: "Speed focused" },
                  ] as const
                ).map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => handleUpdateStructure({ heroLayout: h.id })}
                    className={`rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                      settings.structure.heroLayout === h.id
                        ? "border-foreground bg-muted/60 shadow-sm ring-1 ring-foreground"
                        : "border-border bg-card hover:bg-muted/30"
                    }`}
                  >
                    <p className="font-bold text-xs text-foreground">{h.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{h.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Header & Navigation Behavior */}
            <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
              <div>
                <h4 className="font-bold text-sm text-foreground">Header & Navigation Behavior</h4>
                <p className="text-xs text-muted-foreground">Stickiness, blur intensity, and breadcrumbs navigation.</p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-border p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">Sticky Header with Backdrop Blur</p>
                    <p className="text-[11px] text-muted-foreground">Header stays fixed at top of screen while scrolling</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateStructure({ headerSticky: !settings.structure.headerSticky })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      settings.structure.headerSticky ? "bg-emerald-500" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        settings.structure.headerSticky ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="rounded-2xl border border-border p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">Show Breadcrumbs Path</p>
                    <p className="text-[11px] text-muted-foreground">Displays Home &gt; Tools &gt; Tool Name navigation on workspaces</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateStructure({ showBreadcrumbs: !settings.structure.showBreadcrumbs })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      settings.structure.showBreadcrumbs ? "bg-emerald-500" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        settings.structure.showBreadcrumbs ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Footer Columns & Trust Elements */}
            <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
              <div>
                <h4 className="font-bold text-sm text-foreground">Footer Grid & Trust Badges</h4>
                <p className="text-xs text-muted-foreground">Configure columns count, newsletter box, and security seals.</p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-border p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">Newsletter Subscription Bar</p>
                    <p className="text-[11px] text-muted-foreground">Includes email capture in website footer</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateStructure({ showFooterNewsletter: !settings.structure.showFooterNewsletter })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      settings.structure.showFooterNewsletter ? "bg-emerald-500" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        settings.structure.showFooterNewsletter ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="rounded-2xl border border-border p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">Security & 100% Privacy Badges</p>
                    <p className="text-[11px] text-muted-foreground">Zero-data retention and SSL encryption indicators</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateStructure({ showFooterBadges: !settings.structure.showFooterBadges })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      settings.structure.showFooterBadges ? "bg-emerald-500" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        settings.structure.showFooterBadges ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: GUEST TOOL LIMITS & DIFFERENT TOOL BONUS ─────────────────── */}
      {activeTab === "guest-limits" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-card p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                    Visitor Access Control
                  </span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h3 className="font-display text-2xl font-black text-foreground mt-2">
                  Guest Tool Limits & Different-Tool Bonus Engine
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  Configure tool execution limits for users working without login. When a guest finishes their base free tries on one tool, grant them extra chances if they try another type of tool!
                </p>
              </div>

              {/* Status Pill */}
              <div className="rounded-2xl border border-emerald-500/30 bg-card p-4 shadow-sm shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Current Policy</span>
                <p className="font-mono text-xl font-black text-foreground mt-1">
                  {settings.guestLimits?.guestBaseLimit ?? 5} Base + {settings.guestLimits?.guestDifferentToolBonus ?? 2} Bonus
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  {settings.guestLimits?.guestDifferentToolBonusEnabled !== false ? "✓ Different Tool Bonus Active" : "✕ Bonus Disabled"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Quick Presets:</span>
            <button
              type="button"
              onClick={() =>
                handleUpdateGuestLimits(
                  { guestBaseLimit: 5, guestDifferentToolBonus: 2, guestDifferentToolBonusEnabled: true },
                  "Applied Standard Preset: 5 Base + 2 Bonus!"
                )
              }
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-foreground hover:bg-muted transition-all cursor-pointer"
            >
              Default (5 Base + 2 Bonus)
            </button>
            <button
              type="button"
              onClick={() =>
                handleUpdateGuestLimits(
                  { guestBaseLimit: 10, guestDifferentToolBonus: 3, guestDifferentToolBonusEnabled: true },
                  "Applied Generous Preset: 10 Base + 3 Bonus!"
                )
              }
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-foreground hover:bg-muted transition-all cursor-pointer"
            >
              Generous (10 Base + 3 Bonus)
            </button>
            <button
              type="button"
              onClick={() =>
                handleUpdateGuestLimits(
                  { guestBaseLimit: 3, guestDifferentToolBonus: 1, guestDifferentToolBonusEnabled: true },
                  "Applied Strict Preset: 3 Base + 1 Bonus!"
                )
              }
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-foreground hover:bg-muted transition-all cursor-pointer"
            >
              Strict (3 Base + 1 Bonus)
            </button>
            <button
              type="button"
              onClick={() =>
                handleUpdateGuestLimits(
                  { guestBaseLimit: 5, guestDifferentToolBonus: 0, guestDifferentToolBonusEnabled: false },
                  "Bonus disabled: Single Tool 5 uses only!"
                )
              }
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-foreground hover:bg-muted transition-all cursor-pointer"
            >
              No Bonus (5 Uses Only)
            </button>
          </div>

          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Setting 1: Base Guest Limit */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-display text-base font-bold text-foreground">
                    1. Base Tool Uses Without Login
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    How many times a guest visitor can use tools before hitting the first limit.
                  </p>
                </div>
                <span className="rounded-full bg-muted border border-border px-3 py-1 font-mono text-sm font-black text-foreground">
                  {settings.guestLimits?.guestBaseLimit ?? 5} tries
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={settings.guestLimits?.guestBaseLimit ?? 5}
                    onChange={(e) =>
                      handleUpdateGuestLimits({ guestBaseLimit: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={settings.guestLimits?.guestBaseLimit ?? 5}
                    onChange={(e) =>
                      handleUpdateGuestLimits({ guestBaseLimit: Math.max(1, Number(e.target.value)) })
                    }
                    className="w-20 rounded-xl border border-input bg-background px-3 py-1.5 font-mono text-xs font-bold text-foreground focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Recommended: <strong>5 times</strong>. This lets new visitors experience quality processing before signing in.
                </p>
              </div>
            </div>

            {/* Setting 2: Different Tool Bonus Chances */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-display text-base font-bold text-foreground">
                    2. Bonus Chances for Different Tool
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Extra uses granted when the same user tries another type of tool after exhausting base tries.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                  +{settings.guestLimits?.guestDifferentToolBonus ?? 2} extra
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={settings.guestLimits?.guestDifferentToolBonus ?? 2}
                    onChange={(e) =>
                      handleUpdateGuestLimits({ guestDifferentToolBonus: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={settings.guestLimits?.guestDifferentToolBonus ?? 2}
                    onChange={(e) =>
                      handleUpdateGuestLimits({ guestDifferentToolBonus: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-20 rounded-xl border border-input bg-background px-3 py-1.5 font-mono text-xs font-bold text-foreground focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Recommended: <strong>2 chances</strong>. If they try the same tool, they stay blocked. If they test a different tool, they get 2 more chances.
                </p>
              </div>
            </div>

            {/* Setting 3: Bonus Toggle Switch */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-base font-bold text-foreground">
                    Enable Different-Tool Bonus Rule
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When toggled ON, users who finish their initial 5 tries can sample another tool for 2 bonus chances.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateGuestLimits(
                      {
                        guestDifferentToolBonusEnabled:
                          settings.guestLimits?.guestDifferentToolBonusEnabled === false ? true : false,
                      },
                      `Different-tool bonus ${
                        settings.guestLimits?.guestDifferentToolBonusEnabled === false ? "ENABLED" : "DISABLED"
                      }`
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    settings.guestLimits?.guestDifferentToolBonusEnabled !== false
                      ? "bg-emerald-500"
                      : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      settings.guestLimits?.guestDifferentToolBonusEnabled !== false
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Workflow Simulation Explainer */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs">
            <h4 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>How the Rule Works in Action</span>
            </h4>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="rounded-2xl border border-border/80 bg-background/50 p-4 space-y-1.5">
                <span className="font-mono text-[10px] font-black uppercase text-muted-foreground">Step 1 • Initial Uses</span>
                <p className="font-bold text-foreground">5 Free Tool Uses</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Visitor uses background remover or converter without needing to log in.
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-background/50 p-4 space-y-1.5">
                <span className="font-mono text-[10px] font-black uppercase text-muted-foreground">Step 2 • 5 Uses Finished</span>
                <p className="font-bold text-foreground">Same Tool Blocked</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Trying the same tool prompts: "Daily limit reached for this tool. Try another tool for 2 bonus chances!"
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-1.5">
                <span className="font-mono text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Step 3 • Switch Tool</span>
                <p className="font-bold text-foreground">2 Bonus Chances</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Switching to a different tool activates 2 free bonus runs for that new tool.
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-background/50 p-4 space-y-1.5">
                <span className="font-mono text-[10px] font-black uppercase text-muted-foreground">Step 4 • Sign Up</span>
                <p className="font-bold text-foreground">10 Daily Credits</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  After bonus is exhausted, user registers for a free account with 10 free daily Bronze Tokens.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal Popup */}
      {isLivePreviewOpen && (
        <GlobalSiteDialog
          previewMode={true}
          previewSettings={settings.siteDialog}
          onPreviewClose={() => setIsLivePreviewOpen(false)}
        />
      )}
    </div>
  );
}
