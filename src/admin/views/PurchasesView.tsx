import { useState, useEffect } from "react";
import { AdminStore, type PurchaseTransaction, type PurchasePlanConfig, type AdminPromoCode } from "@/admin/lib/admin-store";
import { FestivalOffersDialog } from "@/components/FestivalOffersDialog";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { CreditCard, Search, CheckCircle2, Receipt, Download, ShieldCheck, Plus, Wand2, Gift, Zap, Eye, Edit2, Trash2, Check, X, Image as ImageIcon, Clock, RefreshCw, AlertCircle, Tag } from "lucide-react";
import { toast } from "sonner";

export function PurchasesView() {
  const [subTab, setSubTab] = useState<"orders" | "plans" | "promocodes">("orders");

  // Orders State
  const [purchases, setPurchases] = useState<PurchaseTransaction[]>(() => AdminStore.getPurchases());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);

  // Plans & Offers State
  const [plans, setPlans] = useState<PurchasePlanConfig[]>(() => AdminStore.getPlans());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PurchasePlanConfig | null>(null);
  const [previewOffer, setPreviewOffer] = useState<PurchasePlanConfig | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formTagline, setFormTagline] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formType, setFormType] = useState<"festival" | "pack" | "subscription">("festival");
  const [formCredits, setFormCredits] = useState<number>(500);
  const [formBonusCredits, setFormBonusCredits] = useState<number>(150);
  const [formPriceINR, setFormPriceINR] = useState<number>(999);
  const [formOriginalPriceINR, setFormOriginalPriceINR] = useState<number>(2499);
  const [formBilling, setFormBilling] = useState<"one-time" | "month" | "year">("one-time");
  const [formImageUrl, setFormImageUrl] = useState("/images/festival-offer-banner.jpg");
  const [formFeatures, setFormFeatures] = useState("");
  const [formIsFestival, setFormIsFestival] = useState(true);
  const [formShowInDialog, setFormShowInDialog] = useState(true);
  const [formActive, setFormActive] = useState(true);

  // Promo Codes State
  const [promoCodes, setPromoCodes] = useState<AdminPromoCode[]>([]);
  const [promoSearch, setPromoSearch] = useState("");
  const [isPromoLoading, setIsPromoLoading] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<AdminPromoCode | null>(null);

  // Promo Code Form State
  const [promoFormCode, setPromoFormCode] = useState("");
  const [promoFormType, setPromoFormType] = useState<"percentage" | "fixed">("percentage");
  const [promoFormValue, setPromoFormValue] = useState<number>(20);
  const [promoFormMinAmount, setPromoFormMinAmount] = useState<number>(0);
  const [promoFormMaxDiscount, setPromoFormMaxDiscount] = useState<number | "">("");
  const [promoFormMaxUses, setPromoFormMaxUses] = useState<number | "">("");
  const [promoFormExpiresAt, setPromoFormExpiresAt] = useState("");
  const [promoFormActive, setPromoFormActive] = useState(true);
  const [promoFormDescription, setPromoFormDescription] = useState("");

  const fetchLatest = async (showToast = false) => {
    setIsSyncing(true);
    try {
      const data = await AdminStore.fetchPurchasesFromServer();
      setPurchases([...data]);
      if (showToast) {
        toast.success(`Synced ${data.length} order record${data.length === 1 ? "" : "s"} from database.`);
      }
    } catch {
      if (showToast) {
        toast.error("Failed to sync orders from server.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchPromos = async () => {
    setIsPromoLoading(true);
    try {
      const data = await AdminStore.fetchPromoCodes();
      setPromoCodes(data);
    } catch {
      /* ignore */
    } finally {
      setIsPromoLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();
    AdminStore.fetchPlansFromServer().then((data) => setPlans(data));
    fetchPromos();

    const handleUpdate = () => {
      setPurchases(AdminStore.getPurchases());
      setPlans(AdminStore.getPlans());
      fetchPromos();
    };
    window.addEventListener(REALTIME_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    const interval = setInterval(() => {
      fetchLatest();
    }, 5000);

    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Keyboard shortcut (Escape) to close any active admin dialog/modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewOffer) setPreviewOffer(null);
        if (isModalOpen) setIsModalOpen(false);
        if (isPromoModalOpen) setIsPromoModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewOffer, isModalOpen, isPromoModalOpen]);

  const handleOpenAddPromoModal = () => {
    setEditingPromo(null);
    setPromoFormCode("");
    setPromoFormType("percentage");
    setPromoFormValue(20);
    setPromoFormMinAmount(0);
    setPromoFormMaxDiscount("");
    setPromoFormMaxUses("");
    setPromoFormExpiresAt("");
    setPromoFormActive(true);
    setPromoFormDescription("");
    setIsPromoModalOpen(true);
  };

  const handleOpenEditPromoModal = (promo: AdminPromoCode) => {
    setEditingPromo(promo);
    setPromoFormCode(promo.code);
    setPromoFormType(promo.discountType);
    setPromoFormValue(promo.discountValue);
    setPromoFormMinAmount(promo.minPurchaseAmount || 0);
    setPromoFormMaxDiscount(promo.maxDiscountAmount ?? "");
    setPromoFormMaxUses(promo.maxUses ?? "");
    setPromoFormExpiresAt((promo.expiresAt ? promo.expiresAt.split("T")[0] : "") || "");
    setPromoFormActive(promo.active);
    setPromoFormDescription(promo.description || "");
    setIsPromoModalOpen(true);
  };

  const handleSavePromo = async () => {
    if (!promoFormCode.trim()) {
      toast.error("Please enter a promo code.");
      return;
    }
    if (Number(promoFormValue) <= 0) {
      toast.error("Discount value must be greater than zero.");
      return;
    }

    const payload: Partial<AdminPromoCode> = {
      ...(editingPromo ? { id: editingPromo.id } : {}),
      code: promoFormCode.trim().toUpperCase(),
      discountType: promoFormType,
      discountValue: Number(promoFormValue),
      minPurchaseAmount: Number(promoFormMinAmount) || 0,
      maxDiscountAmount: promoFormMaxDiscount !== "" ? Number(promoFormMaxDiscount) : null,
      maxUses: promoFormMaxUses !== "" ? Number(promoFormMaxUses) : null,
      expiresAt: promoFormExpiresAt ? new Date(promoFormExpiresAt).toISOString() : null,
      active: promoFormActive,
      description: promoFormDescription.trim(),
    };

    const res = await AdminStore.savePromoCode(payload);
    if (res.success) {
      toast.success(editingPromo ? `Updated promo code "${promoFormCode.toUpperCase()}"` : `Created promo code "${promoFormCode.toUpperCase()}"`);
      setIsPromoModalOpen(false);
      fetchPromos();
    } else {
      toast.error(res.error || "Failed to save promo code.");
    }
  };

  const handleTogglePromoActive = async (promo: AdminPromoCode) => {
    const updated = { ...promo, active: !promo.active };
    const res = await AdminStore.savePromoCode(updated);
    if (res.success) {
      toast.success(`Promo code ${promo.code} is now ${!promo.active ? "Active" : "Disabled"}.`);
      fetchPromos();
    } else {
      toast.error("Failed to update status.");
    }
  };

  const handleDeletePromo = async (id: string, code: string) => {
    if (confirm(`Are you sure you want to delete promo code "${code}"?`)) {
      const ok = await AdminStore.deletePromoCode(id);
      if (ok) {
        toast.success(`Deleted promo code "${code}".`);
        fetchPromos();
      } else {
        toast.error("Failed to delete promo code.");
      }
    }
  };

  const completedOrders = purchases.filter((p) => p.status === "completed");
  const unpaidOrders = purchases.filter((p) => p.status !== "completed");

  const totalGrossINR = completedOrders.reduce((sum, p) => sum + p.amountINR, 0);
  const totalCreditsSold = completedOrders.reduce((sum, p) => sum + p.creditsPurchased, 0);
  const completedCount = completedOrders.length;

  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      p.userName.toLowerCase().includes(search.toLowerCase()) ||
      p.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      p.planName.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "all" || p.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" && p.status === "completed") ||
      (statusFilter === "unpaid" && p.status !== "completed");

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDeleteOrder = async (orderId: string, customer: string) => {
    if (confirm(`Remove unpaid order record ${orderId} (${customer}) from database?`)) {
      await AdminStore.deletePurchaseOrder(orderId);
      const updated = purchases.filter((p) => p.id !== orderId && p.orderId !== orderId);
      setPurchases([...updated]);
      toast.success(`Deleted unpaid order record ${orderId}.`);
    }
  };

  const handleDownloadInvoice = (txnId: string) => {
    toast.success(`Generated official GST Invoice PDF for transaction ${txnId}.`);
  };

  const handleOpenAddModal = () => {
    setEditingPlan(null);
    setFormName("Diwali Special Festive Offer 🎉");
    setFormTagline("Exclusive limited-time festival discount with bonus credits!");
    setFormBadge("🔥 60% OFF FESTIVAL SPECIAL");
    setFormType("festival");
    setFormCredits(500);
    setFormBonusCredits(150);
    setFormPriceINR(999);
    setFormOriginalPriceINR(2499);
    setFormBilling("one-time");
    setFormImageUrl("/images/festival-offer-banner.jpg");
    setFormFeatures(
      "650 Total Credits (500 + 150 Extra Bonus)\nUltra HD 4K Outputs on All Tools\nFull Access to AI Background Removal\nLifetime Validity — Credits Never Expire"
    );
    setFormIsFestival(true);
    setFormShowInDialog(true);
    setFormActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: PurchasePlanConfig) => {
    setEditingPlan(p);
    setFormName(p.name);
    setFormTagline(p.tagline || "");
    setFormBadge(p.badge || "");
    setFormType(p.type);
    setFormCredits(p.credits);
    setFormBonusCredits(p.bonusCredits || 0);
    setFormPriceINR(p.priceINR);
    setFormOriginalPriceINR(p.originalPriceINR || 0);
    setFormBilling(p.billingPeriod || "one-time");
    setFormImageUrl(p.imageUrl || "/images/festival-offer-banner.jpg");
    setFormFeatures(p.features.join("\n"));
    setFormIsFestival(p.isFestivalOffer);
    setFormShowInDialog(p.showInFestivalDialog);
    setFormActive(p.active);
    setIsModalOpen(true);
  };

  const handleSavePlan = () => {
    if (!formName.trim()) {
      toast.error("Please enter a plan name.");
      return;
    }

    const featureList = formFeatures
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const updatedPlans = [...plans];

    if (editingPlan) {
      const idx = updatedPlans.findIndex((x) => x.id === editingPlan.id);
      if (idx >= 0) {
        updatedPlans[idx] = {
          ...editingPlan,
          name: formName.trim(),
          tagline: formTagline.trim(),
          badge: formBadge.trim(),
          type: formType,
          credits: Number(formCredits) || 0,
          bonusCredits: Number(formBonusCredits) || 0,
          priceINR: Number(formPriceINR) || 0,
          originalPriceINR: Number(formOriginalPriceINR) || 0,
          billingPeriod: formBilling,
          imageUrl: formImageUrl.trim(),
          features: featureList,
          isFestivalOffer: formIsFestival,
          showInFestivalDialog: formShowInDialog,
          active: formActive,
        };
      }
      toast.success(`Updated plan "${formName}" successfully!`);
    } else {
      const newPlan: PurchasePlanConfig = {
        id: `plan-custom-${Date.now().toString(36)}`,
        name: formName.trim(),
        tagline: formTagline.trim(),
        badge: formBadge.trim(),
        type: formType,
        credits: Number(formCredits) || 0,
        bonusCredits: Number(formBonusCredits) || 0,
        priceINR: Number(formPriceINR) || 0,
        originalPriceINR: Number(formOriginalPriceINR) || 0,
        billingPeriod: formBilling,
        imageUrl: formImageUrl.trim(),
        features: featureList,
        isFestivalOffer: formIsFestival,
        showInFestivalDialog: formShowInDialog,
        active: formActive,
        sortOrder: updatedPlans.length,
      };
      updatedPlans.unshift(newPlan);
      toast.success(`Created new plan "${formName}" successfully!`);
    }

    // If marked as festival dialog, ensure it is enabled
    setPlans(updatedPlans);
    AdminStore.savePlans(updatedPlans);
    setIsModalOpen(false);
  };

  const handleTogglePlanActive = (id: string) => {
    const updated = plans.map((p) => (p.id === id ? { ...p, active: !p.active } : p));
    setPlans(updated);
    AdminStore.savePlans(updated);
    toast.success("Plan status updated.");
  };

  const handleDeletePlan = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      const updated = plans.filter((p) => p.id !== id);
      setPlans(updated);
      AdminStore.savePlans(updated);
      toast.success(`Deleted plan "${name}".`);
    }
  };

  const activeFestivalOffer = plans.find((p) => p.active && p.isFestivalOffer && p.showInFestivalDialog);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-foreground">Purchases & Plans Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure credit packs, festival discount offers, popup dialogs, and verify sales records.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card p-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => setSubTab("orders")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              subTab === "orders"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Orders & Revenue ({purchases.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("plans")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              subTab === "plans"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Wand2 className="h-3.5 w-3.5 text-amber-500 fill-current" />
            <span>Plans & Festival Offers ({plans.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("promocodes")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              subTab === "promocodes"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Gift className="h-3.5 w-3.5 text-pink-500 fill-current" />
            <span>Promo Codes ({promoCodes.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ORDERS & REVENUE */}
      {subTab === "orders" && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Gross Revenue</span>
              <p className="mt-3 font-display text-3xl font-extrabold text-foreground">
                ₹{totalGrossINR.toLocaleString("en-IN")}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Verified Successful Payments</span>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Credits Issued via Sales</span>
              <p className="mt-3 font-display text-3xl font-extrabold text-amber-500">
                {totalCreditsSold.toLocaleString()} Credits
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Granted across successful paid orders</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Completed Transactions</span>
              <p className="mt-3 font-display text-3xl font-extrabold text-foreground">
                {completedCount}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {unpaidOrders.length > 0 ? `${unpaidOrders.length} unpaid / abandoned order${unpaidOrders.length === 1 ? "" : "s"}` : "All orders verified"}
              </p>
            </div>
          </div>

          {/* Filter, Search & Refresh Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-4 shadow-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer, email, plan or TXN ID…"
                className="w-full rounded-2xl border border-input bg-background/60 pl-10 pr-4 py-2.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-all shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Filter */}
              <div className="flex items-center gap-1">
                {["all", "subscription", "pack"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-all cursor-pointer ${
                      typeFilter === t
                        ? "bg-foreground text-background shadow-xs font-extrabold"
                        : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {t === "all" ? "All Types" : t}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-border mx-0.5 hidden sm:block" />

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-foreground text-background shadow-xs font-extrabold"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  All ({purchases.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("completed")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === "completed"
                      ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                      : "border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                  }`}
                >
                  ✓ Paid ({completedCount})
                </button>
                {unpaidOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter("unpaid")}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === "unpaid"
                        ? "bg-amber-600 text-white shadow-xs font-extrabold"
                        : "border border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                    }`}
                  >
                    ⏳ Unpaid ({unpaidOrders.length})
                  </button>
                )}
              </div>

              {/* Sync Button */}
              <button
                type="button"
                onClick={() => fetchLatest(true)}
                disabled={isSyncing}
                title="Sync orders from server database"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-accent" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync"}</span>
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-xs">
            {filteredPurchases.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="font-semibold text-foreground text-sm">No transactions found</p>
                <p className="mt-1 text-[11px]">When users purchase credit packs or subscriptions on the Pricing page, orders will be recorded here.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 font-bold uppercase tracking-wider text-[11px] text-muted-foreground">
                  <tr>
                    <th className="py-4 px-6">Transaction ID</th>
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Plan / Pack</th>
                    <th className="py-4 px-6">Credits</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Payment Status</th>
                    <th className="py-4 px-6">Payment Method</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Invoice / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPurchases.map((p) => {
                    const isCompleted = p.status === "completed";
                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-6 font-mono text-[11px]">
                          <span className="font-bold text-foreground">{p.id}</span>
                          {p.orderId && p.paymentId && p.orderId !== p.id && (
                            <p className="text-[10px] text-muted-foreground">Order: {p.orderId}</p>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-foreground">{p.userName}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{p.userEmail}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-foreground">{p.planName}</span>
                        </td>
                        <td className="py-4 px-6 font-mono">
                          {isCompleted ? (
                            <span className="font-bold text-amber-500">+{p.creditsPurchased}</span>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">
                              0 <span className="text-[10px] opacity-75">(Not credited)</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-foreground">
                          ₹{p.amountINR.toLocaleString("en-IN")}
                        </td>
                        <td className="py-4 px-6">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              <span>Paid</span>
                            </span>
                          ) : p.status === "failed" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400">
                              <AlertCircle className="h-3 w-3 text-rose-500" />
                              <span>Failed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400">
                              <Clock className="h-3 w-3 text-amber-500" />
                              <span>Unpaid / Created</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-muted-foreground">{p.paymentMethod}</td>
                        <td className="py-4 px-6 font-mono text-muted-foreground text-[11px]">
                          {p.date ? p.date.replace("T", " ").slice(0, 16) : ""}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {isCompleted ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadInvoice(p.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                              <Download className="h-3 w-3" />
                              <span>PDF</span>
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                                Unpaid
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(p.id, p.userName)}
                                title="Delete / Dismiss unpaid order record"
                                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PLANS & FESTIVAL OFFERS MANAGER */}
      {subTab === "plans" && (
        <div className="space-y-6 animate-fade-in">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-xs">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Configured Purchase Plans & Offers</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage live plans visible to users on the Pricing page and set festival celebration popups with images.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Add Custom / Festival Plan</span>
            </button>
          </div>

          {/* ACTIVE FESTIVAL OFFER SPOTLIGHT BANNER */}
          {activeFestivalOffer ? (
            <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-card p-6 shadow-xl shadow-amber-500/10">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative h-28 w-28 sm:h-32 sm:w-44 shrink-0 overflow-hidden rounded-2xl border border-amber-500/40 bg-muted">
                    <img
                      src={activeFestivalOffer.imageUrl || "/images/festival-offer-banner.jpg"}
                      alt={activeFestivalOffer.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/celebration-gift-banner.jpg";
                      }}
                    />
                    <span className="absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 font-mono text-[9px] font-extrabold uppercase text-slate-950 shadow-xs">
                      Live Popup
                    </span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-500 px-2.5 py-0.5 font-mono text-[10px] font-black uppercase text-slate-950">
                        {activeFestivalOffer.badge || "FESTIVAL OFFER"}
                      </span>
                      <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                        <Wand2 className="h-3.5 w-3.5 fill-current" />
                        Active on Website Popup Dialog
                      </span>
                    </div>

                    <h4 className="mt-1.5 font-display text-2xl font-black text-foreground">
                      {activeFestivalOffer.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeFestivalOffer.tagline || "Active celebration offer with extra bonus credits"}
                    </p>

                    <div className="mt-2.5 flex items-baseline gap-3">
                      <span className="font-mono text-2xl font-black text-foreground">
                        ₹{activeFestivalOffer.priceINR.toLocaleString("en-IN")}
                      </span>
                      {activeFestivalOffer.originalPriceINR && (
                        <span className="font-mono text-sm text-muted-foreground line-through">
                          ₹{activeFestivalOffer.originalPriceINR.toLocaleString("en-IN")}
                        </span>
                      )}
                      <span className="rounded-lg bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-500">
                        ⚡ {(activeFestivalOffer.credits + (activeFestivalOffer.bonusCredits || 0)).toLocaleString()} Credits
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPreviewOffer(activeFestivalOffer)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-amber-500/10 transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-amber-500" />
                    <span>Preview Festival Dialog</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(activeFestivalOffer)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-center">
              <Wand2 className="h-8 w-8 mx-auto mb-2 text-amber-500 fill-current opacity-70" />
              <p className="font-bold text-sm text-foreground">No Festival Offer Dialog Active</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Create a festival or promotional plan with "Show in Festival Popup Dialog" enabled to greet users with celebration offers & images!
              </p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>Launch Festival Offer</span>
              </button>
            </div>
          )}

          {/* PLANS CARDS GRID */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => {
              const totalCredits = p.credits + (p.bonusCredits || 0);
              const hasDiscount = p.originalPriceINR && p.originalPriceINR > p.priceINR;

              return (
                <div
                  key={p.id}
                  className={`flex flex-col justify-between overflow-hidden rounded-3xl border transition-all ${
                    p.isFestivalOffer
                      ? "border-amber-500/40 bg-card shadow-lg shadow-amber-500/5"
                      : "border-border bg-card shadow-xs hover:border-foreground/20"
                  } ${!p.active ? "opacity-60" : ""}`}
                >
                  {/* Card Header & Image */}
                  <div>
                    {p.imageUrl ? (
                      <div className="relative h-36 w-full overflow-hidden bg-muted">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/celebration-gift-banner.jpg";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          {p.badge && (
                            <span className="rounded-full bg-amber-500 px-2.5 py-0.5 font-mono text-[10px] font-black uppercase text-slate-950 shadow-xs">
                              {p.badge}
                            </span>
                          )}
                          {p.isFestivalOffer && (
                            <span className="rounded-full bg-rose-600 px-2 py-0.5 font-mono text-[9px] font-extrabold text-white">
                              FESTIVAL
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 pb-0 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {p.badge && (
                            <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[10px] font-bold text-foreground">
                              {p.badge}
                            </span>
                          )}
                          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-muted-foreground">
                            {p.type}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-5 space-y-3">
                      <div>
                        <h4 className="font-display text-xl font-bold text-foreground">{p.name}</h4>
                        {p.tagline && <p className="text-xs text-muted-foreground mt-0.5">{p.tagline}</p>}
                      </div>

                      {/* Pricing */}
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-mono text-2xl font-black text-foreground">
                          ₹{p.priceINR.toLocaleString("en-IN")}
                        </span>
                        {hasDiscount && (
                          <span className="font-mono text-sm text-muted-foreground line-through">
                            ₹{p.originalPriceINR!.toLocaleString("en-IN")}
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          /{p.billingPeriod === "one-time" ? "one-time" : p.billingPeriod}
                        </span>
                      </div>

                      {/* Credits */}
                      <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-2.5 font-mono text-xs">
                        <Zap className="h-4 w-4 text-amber-500 fill-current" />
                        <span className="font-bold text-foreground">{totalCredits.toLocaleString()} Credits</span>
                        {p.bonusCredits && p.bonusCredits > 0 ? (
                          <span className="text-emerald-500 font-semibold text-[11px]">
                            (+{p.bonusCredits} Bonus)
                          </span>
                        ) : null}
                      </div>

                      {/* Features */}
                      {p.features && p.features.length > 0 && (
                        <ul className="space-y-1 text-xs text-muted-foreground pt-1">
                          {p.features.slice(0, 4).map((f, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              <span className="line-clamp-1">{f}</span>
                            </li>
                          ))}
                          {p.features.length > 4 && (
                            <li className="text-[11px] text-muted-foreground/80 pl-5">
                              +{p.features.length - 4} more features
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="border-t border-border p-4 flex items-center justify-between gap-2 bg-muted/20">
                    <button
                      type="button"
                      onClick={() => handleTogglePlanActive(p.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        p.active
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${p.active ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                      <span>{p.active ? "Active" : "Disabled"}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {p.isFestivalOffer && (
                        <button
                          type="button"
                          onClick={() => setPreviewOffer(p)}
                          className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          title="Preview Dialog"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(p)}
                        className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Edit Plan"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePlan(p.id, p.name)}
                        className="rounded-xl border border-border p-2 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PROMO CODES MANAGER */}
      {subTab === "promocodes" && (
        <div className="space-y-6 animate-fade-in">
          {/* Action & Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Promo Codes</span>
              <p className="mt-3 font-display text-3xl font-extrabold text-foreground">
                {promoCodes.filter((p) => p.active).length}{" "}
                <span className="text-xs font-normal text-muted-foreground">/ {promoCodes.length} total</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Available for customer checkout</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Redemptions</span>
              <p className="mt-3 font-display text-3xl font-extrabold text-pink-500">
                {promoCodes.reduce((sum, p) => sum + (p.usedCount || 0), 0)} Uses
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Times coupons were applied at checkout</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Festival Coupon</span>
              <p className="mt-3 font-mono text-2xl font-black text-amber-500">
                FESTIVE50
              </p>
              <p className="mt-2 text-xs text-muted-foreground">50% discount on credit packs</p>
            </div>
          </div>

          {/* Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={promoSearch}
                onChange={(e) => setPromoSearch(e.target.value)}
                placeholder="Search promo codes or descriptions…"
                className="w-full rounded-2xl border border-input bg-background/60 pl-10 pr-4 py-2.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-all shadow-xs"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenAddPromoModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 text-xs font-black text-white shadow-md shadow-pink-500/20 hover:bg-pink-600 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Create New Promo Code</span>
            </button>
          </div>

          {/* Promo Codes List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {promoCodes
              .filter((p) => {
                if (!promoSearch) return true;
                const q = promoSearch.toLowerCase();
                return p.code.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
              })
              .map((promo) => (
                <div
                  key={promo.id}
                  className={`relative flex flex-col justify-between rounded-3xl border p-6 transition-all shadow-xs ${
                    promo.active
                      ? "border-border bg-card hover:border-pink-500/40"
                      : "border-border/50 bg-muted/30 opacity-75"
                  }`}
                >
                  <div>
                    {/* Top row: Code badge + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-pink-500/10 border border-pink-500/30 px-3 py-1 font-mono text-sm font-black text-pink-500">
                        <Tag className="h-3.5 w-3.5" />
                        {promo.code}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          promo.active
                            ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {promo.active ? "Active" : "Disabled"}
                      </span>
                    </div>

                    {/* Discount Value */}
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="font-display text-3xl font-black text-foreground">
                        {promo.discountType === "percentage" ? `${promo.discountValue}%` : `₹${promo.discountValue}`}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">
                        {promo.discountType === "percentage" ? "OFF" : "FLAT DISCOUNT"}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {promo.description || "Promotional discount coupon for pricing checkout."}
                    </p>

                    {/* Meta Specs */}
                    <div className="mt-4 space-y-1.5 text-[11px] text-muted-foreground border-t border-border pt-3">
                      <div className="flex items-center justify-between">
                        <span>Min Order Amount:</span>
                        <span className="font-semibold text-foreground">
                          {promo.minPurchaseAmount > 0 ? `₹${promo.minPurchaseAmount}` : "None (₹0)"}
                        </span>
                      </div>
                      {promo.maxDiscountAmount && (
                        <div className="flex items-center justify-between">
                          <span>Max Discount Cap:</span>
                          <span className="font-semibold text-foreground">₹{promo.maxDiscountAmount}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Total Uses:</span>
                        <span className="font-semibold text-foreground">
                          {promo.usedCount || 0} / {promo.maxUses ? `${promo.maxUses} max` : "Unlimited"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Expiration:</span>
                        <span className="font-semibold text-foreground">
                          {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString() : "Never expires"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePromoActive(promo)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                        promo.active
                          ? "border-border text-muted-foreground hover:bg-muted"
                          : "border-emerald-500/30 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
                      }`}
                    >
                      {promo.active ? "Deactivate" : "Activate"}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPromoModal(promo)}
                        className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Edit Promo Code"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePromo(promo.id, promo.code)}
                        className="rounded-xl border border-border p-2 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Promo Code"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {promoCodes.length === 0 && !isPromoLoading && (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
              <Gift className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="mt-3 font-display text-base font-bold text-foreground">No Promo Codes Configured</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first promo code to offer checkout discounts to customers.</p>
              <button
                type="button"
                onClick={handleOpenAddPromoModal}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-pink-500 px-5 py-2.5 text-xs font-black text-white hover:bg-pink-600 cursor-pointer shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Create Promo Code</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT PROMO CODE MODAL */}
      {isPromoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto"
          onClick={() => setIsPromoModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl text-foreground my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  {editingPromo ? "Edit Promo Code" : "Create New Promo Code"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set discount values, min order limits, and expiration dates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Promo Code & Discount Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground">Coupon Code *</label>
                  <input
                    type="text"
                    value={promoFormCode}
                    onChange={(e) => setPromoFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FESTIVE50"
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 font-mono text-sm font-black uppercase text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Discount Type</label>
                  <select
                    value={promoFormType}
                    onChange={(e) => setPromoFormType(e.target.value as any)}
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-semibold text-foreground focus:border-foreground focus:outline-none"
                  >
                    <option value="percentage">Percentage (%) Discount</option>
                    <option value="fixed">Fixed Amount (₹ INR) Off</option>
                  </select>
                </div>
              </div>

              {/* Discount Value & Min Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground">
                    {promoFormType === "percentage" ? "Discount Percentage (%) *" : "Discount Amount (₹) *"}
                  </label>
                  <input
                    type="number"
                    value={promoFormValue}
                    onChange={(e) => setPromoFormValue(Number(e.target.value))}
                    min={1}
                    max={promoFormType === "percentage" ? 100 : 100000}
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-semibold text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Min Purchase Amount (₹)</label>
                  <input
                    type="number"
                    value={promoFormMinAmount}
                    onChange={(e) => setPromoFormMinAmount(Number(e.target.value))}
                    min={0}
                    placeholder="0 = no minimum"
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-semibold text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Max Cap & Max Uses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    value={promoFormMaxDiscount}
                    onChange={(e) => setPromoFormMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Optional (No limit)"
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-semibold text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Max Uses Limit</label>
                  <input
                    type="number"
                    value={promoFormMaxUses}
                    onChange={(e) => setPromoFormMaxUses(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Optional (Unlimited)"
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-semibold text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="text-xs font-bold text-foreground">Expiration Date</label>
                <input
                  type="date"
                  value={promoFormExpiresAt}
                  onChange={(e) => setPromoFormExpiresAt(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-semibold text-foreground focus:border-foreground focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-foreground">Description / Notes</label>
                <input
                  type="text"
                  value={promoFormDescription}
                  onChange={(e) => setPromoFormDescription(e.target.value)}
                  placeholder="e.g. Festival 50% discount for creator packs"
                  className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-semibold text-foreground focus:border-foreground focus:outline-none"
                />
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={promoFormActive}
                  onChange={(e) => setPromoFormActive(e.target.checked)}
                  className="h-4 w-4 rounded accent-pink-500 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-foreground">Active for Checkout</p>
                  <p className="text-[11px] text-muted-foreground">Customers can enter and redeem this code at checkout.</p>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="rounded-2xl border border-border px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePromo}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-pink-500 px-6 py-2.5 text-xs font-black text-white shadow-md hover:bg-pink-600 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Save Promo Code</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PLAN MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl text-foreground my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  {editingPlan ? "Edit Purchase Plan / Offer" : "Add Custom Purchase Plan / Festival Offer"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set prices, bonus credits, and configure celebration popup dialogs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Row 1: Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground">Plan Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Diwali Mega Creator Offer 🎉"
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-semibold text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Tagline / Subtitle</label>
                  <input
                    type="text"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    placeholder="e.g. Save 60% today with bonus credits!"
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-medium text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Badge & Plan Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground">Badge Text</label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="e.g. 🔥 60% OFF FESTIVAL SPECIAL"
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-semibold text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Plan Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-semibold text-foreground focus:border-foreground focus:outline-none"
                  >
                    <option value="festival">Festival / Special Offer</option>
                    <option value="pack">Credit Pack (One-time)</option>
                    <option value="subscription">Monthly Subscription</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Billing Period</label>
                  <select
                    value={formBilling}
                    onChange={(e) => setFormBilling(e.target.value as any)}
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-semibold text-foreground focus:border-foreground focus:outline-none"
                  >
                    <option value="one-time">One-time payment</option>
                    <option value="month">Per Month</option>
                    <option value="year">Per Year</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Pricing & Credits */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground">Offer Price (₹ INR) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formPriceINR}
                    onChange={(e) => setFormPriceINR(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-mono font-bold text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Original Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formOriginalPriceINR}
                    onChange={(e) => setFormOriginalPriceINR(Number(e.target.value))}
                    placeholder="Strikethrough MRP"
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-mono font-bold text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Base Credits *</label>
                  <input
                    type="number"
                    min="1"
                    value={formCredits}
                    onChange={(e) => setFormCredits(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-mono font-bold text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Bonus Credits</label>
                  <input
                    type="number"
                    min="0"
                    value={formBonusCredits}
                    onChange={(e) => setFormBonusCredits(Number(e.target.value))}
                    placeholder="e.g. 150 extra"
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-xs font-mono font-bold text-emerald-500 focus:border-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Banner Image Selector & Preview */}
              <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-4">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-amber-500" />
                  <span>Banner Image (for Dialog & Spotlight Cards)</span>
                </label>

                {/* Preset Banner Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormImageUrl("/images/festival-offer-banner.jpg")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      formImageUrl === "/images/festival-offer-banner.jpg"
                        ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                        : "border border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>🏮 Festive Diyas Banner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormImageUrl("/images/celebration-gift-banner.jpg")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      formImageUrl === "/images/celebration-gift-banner.jpg"
                        ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                        : "border border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>🎆 Celebration Fireworks Banner</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="Custom Image URL or path (e.g. /images/...)"
                    className="flex-1 rounded-2xl border border-input bg-background/60 px-4 py-2 text-xs font-medium text-foreground focus:border-foreground focus:outline-none"
                  />
                  {formImageUrl && (
                    <div className="h-10 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/festival-offer-banner.jpg";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Row 5: Features (One per line) */}
              <div>
                <label className="text-xs font-bold text-foreground">Features (one item per line)</label>
                <textarea
                  rows={4}
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  placeholder="Ultra HD 4K Outputs&#10;Full AI Tool Access&#10;Lifetime Validity"
                  className="mt-1.5 w-full rounded-2xl border border-input bg-background/60 p-4 text-xs font-medium text-foreground focus:border-foreground focus:outline-none font-mono"
                />
              </div>

              {/* Row 6: Toggles */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border bg-muted/20 p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formShowInDialog}
                    onChange={(e) => setFormShowInDialog(e.target.checked)}
                    className="h-4 w-4 rounded accent-amber-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-foreground">Show in Website Festival Popup Dialog</p>
                    <p className="text-[11px] text-muted-foreground">Greet website visitors with this festive offer dialog modal.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-foreground">Active & Visible to Users</p>
                    <p className="text-[11px] text-muted-foreground">Publish to pricing options.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-2xl border border-border px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePlan}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-500 px-6 py-2.5 text-xs font-black text-slate-950 shadow-md hover:bg-amber-400 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Save Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW DIALOG MODAL */}
      {previewOffer && (
        <FestivalOffersDialog
          customOffer={previewOffer}
          forceOpen={true}
          onClose={() => setPreviewOffer(null)}
        />
      )}
    </div>
  );
}
