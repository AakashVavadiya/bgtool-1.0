import { useState, useEffect } from "react";
import { AdminStore, type CoffeeSupporter } from "@/admin/lib/admin-store";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { toast } from "sonner";
import { Coffee, Heart, Gift, Coins, Search, RefreshCw, CheckCircle2, CreditCard, Send, X } from "lucide-react";
import { TokenCoin } from "@/components/TokenCoins";

export function CoffeeSupportersView() {
  const [supporters, setSupporters] = useState<CoffeeSupporter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Gift Modal State
  const [selectedSupporter, setSelectedSupporter] = useState<CoffeeSupporter | null>(null);
  const [giftAmount, setGiftAmount] = useState<number>(100);
  const [customGiftAmount, setCustomGiftAmount] = useState<string>("");
  const [giftNote, setGiftNote] = useState<string>(
    "A special thank-you gift from Aakash & Piyush for your coffee support! Enjoy these Gold Coins for batch 4K upscaling & HD background removal."
  );
  const [isGifting, setIsGifting] = useState<boolean>(false);

  const loadSupporters = async (showToast = false) => {
    setIsLoading(true);
    try {
      const data = await AdminStore.fetchCoffeeSupporters();
      setSupporters(data);
      if (showToast) {
        toast.success("Coffee supporters list updated.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSupporters();

    const handleSync = () => {
      loadSupporters();
    };
    window.addEventListener(REALTIME_EVENT_NAME, handleSync);
    window.addEventListener("storage", handleSync);

    const interval = setInterval(() => {
      loadSupporters();
    }, 10000);

    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, handleSync);
      window.removeEventListener("storage", handleSync);
      clearInterval(interval);
    };
  }, []);

  const handleOpenGiftModal = (supporter: CoffeeSupporter) => {
    if (!supporter.user_id || supporter.user_id === "guest" || supporter.user_id === "guest_supporter") {
      toast.error("This contribution was made as a guest without an account. Only registered accounts can receive Gold coin credit gifts.");
      return;
    }
    setSelectedSupporter(supporter);
    setGiftAmount(100);
    setCustomGiftAmount("");
    setGiftNote(
      `A special thank-you gift from Aakash & Piyush for your coffee support! We added 100 Gold Coins to your account.`
    );
  };

  const handleSendGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupporter?.user_id) return;

    const finalCoins = customGiftAmount ? Number(customGiftAmount) : giftAmount;
    if (isNaN(finalCoins) || finalCoins <= 0) {
      toast.error("Please specify a valid positive number of Gold Coins.");
      return;
    }

    setIsGifting(true);

    try {
      const res = await AdminStore.awardCoffeeGift({
        userId: selectedSupporter.user_id,
        amount: finalCoins,
        note: giftNote.trim(),
      });

      if (res.success) {
        toast.success(
          `🎉 Gift of ${finalCoins} Gold Coins successfully awarded to ${selectedSupporter.user_name || selectedSupporter.user_email}!`
        );
        setSelectedSupporter(null);
        loadSupporters();
      } else {
        toast.error(res.error || "Failed to award gift.");
      }
    } finally {
      setIsGifting(false);
    }
  };

  // Metrics
  const totalContributions = supporters.length;
  const completedContributions = supporters.filter((s) => s.status === "completed" || s.payment_id);
  const totalRevenueINR = completedContributions.reduce((acc, curr) => acc + (curr.amount_inr || 0), 0);
  const uniqueSupporters = new Set(
    supporters.map((s) => s.user_email || s.user_id || s.payment_id)
  ).size;

  const filteredSupporters = supporters.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (s.user_name && s.user_name.toLowerCase().includes(q)) ||
      (s.user_email && s.user_email.toLowerCase().includes(q)) ||
      (s.plan_name && s.plan_name.toLowerCase().includes(q)) ||
      (s.payment_id && s.payment_id.toLowerCase().includes(q)) ||
      (s.order_id && s.order_id.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" && (s.status === "completed" || Boolean(s.payment_id))) ||
      (statusFilter === "pending" && s.status !== "completed" && !s.payment_id);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Coffee className="h-3.5 w-3.5" />
            <span>Developer Support & Appreciation</span>
          </div>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Coffee Supporters & Gift Rewards
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Manage everyone who supported Aakash & Piyush with coffee, and award Gold Coin gifts to their accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadSupporters(true)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-xs hover:bg-muted transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Coffees</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Coffee className="h-4 w-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-black text-foreground">
            {totalContributions}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Generous coffee treats received</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Coffee Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            ₹{totalRevenueINR.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Collected via Razorpay Live</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Supporters</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Heart className="h-4 w-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-black text-foreground">
            {uniqueSupporters}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Unique contributors & fans</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Founder Rewards</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-tr from-amber-500 to-orange-500 text-white shadow-xs">
              <Gift className="h-4 w-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-black text-amber-500 flex items-center gap-1.5">
            <Coins className="h-5 w-5" />
            <span>Gold Coins</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Direct gifts dispatched to accounts</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/30 p-3 sm:p-4 rounded-2xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supporters by name, email, plan, or Razorpay payment ID..."
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-xs font-semibold placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses ({supporters.length})</option>
            <option value="completed">Completed / Paid ({completedContributions.length})</option>
            <option value="pending">Created / Pending</option>
          </select>
        </div>
      </div>

      {/* Supporters Table */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Supporter Profile</th>
                <th className="px-5 py-3.5">Contribution & Cups</th>
                <th className="px-5 py-3.5">Payment Ref</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Current Balance</th>
                <th className="px-5 py-3.5 text-right">Founder Gift Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSupporters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    <Coffee className="mx-auto h-8 w-8 text-amber-500/50 mb-2" />
                    <p className="font-semibold text-sm text-foreground">No coffee contributions found</p>
                    <p className="text-xs mt-1">When users support you via the Developer page, they will appear here live.</p>
                  </td>
                </tr>
              ) : (
                filteredSupporters.map((s) => {
                  const isCompleted = s.status === "completed" || Boolean(s.payment_id);
                  const isRegistered = Boolean(s.user_id && s.user_id !== "guest" && s.user_id !== "guest_supporter");

                  return (
                    <tr key={s.id || s.order_id} className="hover:bg-muted/30 transition-colors">
                      {/* Supporter Profile */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-amber-500 to-orange-500 text-white font-bold text-xs overflow-hidden ring-2 ring-border">
                            {s.avatar ? (
                              <img
                                src={s.avatar.startsWith("/") ? s.avatar : `/${s.avatar}`}
                                alt={s.user_name || "User"}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : null}
                            <span>{(s.user_name || s.user_email || "U").slice(0, 2).toUpperCase()}</span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-foreground">
                              <span>{s.user_name || "Supporter"}</span>
                              {isRegistered ? (
                                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold">
                                  Account
                                </span>
                              ) : (
                                <span className="rounded-full bg-muted text-muted-foreground px-1.5 py-0.2 text-[9px] font-bold">
                                  Guest
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {s.user_email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contribution details */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-foreground flex items-center gap-1">
                            <span>{s.plan_name}</span>
                          </div>
                          <div className="text-[11px] font-black text-amber-600 dark:text-amber-400">
                            {s.currency === "USD" ? `$${s.amount_inr / 90 || 1} USD` : `₹${s.amount_inr}`}
                          </div>
                        </div>
                      </td>

                      {/* Payment Ref */}
                      <td className="px-5 py-4 font-mono text-[11px]">
                        {s.payment_id ? (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{s.payment_id}</span>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">{s.order_id}</div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-muted-foreground text-[11px] whitespace-nowrap">
                        {new Date(s.created_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Current User Balance */}
                      <td className="px-5 py-4 font-mono font-bold">
                        {isRegistered ? (
                          <div className="flex items-center gap-1.5">
                            <TokenCoin type="gold" size="xs" />
                            <span className="text-foreground">{s.currentPaidCredits || s.currentCredits || 0}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">N/A (Guest)</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        {isRegistered ? (
                          <button
                            type="button"
                            onClick={() => handleOpenGiftModal(s)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 px-3.5 py-1.5 text-xs font-black text-white shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          >
                            <Gift className="h-3.5 w-3.5" />
                            <span>Give Gift (Gold Coins)</span>
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-[11px] italic">
                            Guest Checkout
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Give Gold Coin Gift Modal */}
      {selectedSupporter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/30 bg-background/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              type="button"
              onClick={() => setSelectedSupporter(null)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/25">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-black text-foreground">
                  Give Founder Gift (Gold Coins)
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Reward {selectedSupporter.user_name || selectedSupporter.user_email} for supporting with coffee
                </p>
              </div>
            </div>

            <form onSubmit={handleSendGift} className="space-y-4">
              {/* Supporter Info Card */}
              <div className="rounded-2xl border border-border bg-muted/40 p-3.5 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient Account:</span>
                  <strong className="text-foreground">{selectedSupporter.user_name || "User"} ({selectedSupporter.user_email})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coffee Package:</span>
                  <span className="font-bold text-amber-500">{selectedSupporter.plan_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <span className="font-bold text-foreground">{selectedSupporter.currentPaidCredits || 0} Gold Coins</span>
                </div>
              </div>

              {/* Gift Amount Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Select Gold Coins to Gift
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2.5">
                  {[50, 100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setGiftAmount(preset);
                        setCustomGiftAmount("");
                        setGiftNote(
                          `A special thank-you gift from Aakash & Piyush for your coffee support! We added ${preset} Gold Coins to your account.`
                        );
                      }}
                      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-2.5 transition-all cursor-pointer ${
                        !customGiftAmount && giftAmount === preset
                          ? "border-amber-500 bg-amber-500/10 text-foreground ring-2 ring-amber-500/20 scale-[1.02]"
                          : "border-border bg-card hover:border-amber-500/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Coins className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-black text-foreground">+{preset}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">Coins</span>
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    value={customGiftAmount}
                    onChange={(e) => {
                      setCustomGiftAmount(e.target.value);
                      if (e.target.value) {
                        setGiftNote(
                          `A special thank-you gift from Aakash & Piyush for your coffee support! We added ${e.target.value} Gold Coins to your account.`
                        );
                      }
                    }}
                    placeholder="Or enter custom Gold Coins amount (e.g. 75, 1000)..."
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Founder Gift Note */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Personal Founder's Notification Note
                </label>
                <textarea
                  rows={3}
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                  placeholder="Personal note delivered directly into the supporter's notification inbox..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSupporter(null)}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isGifting}
                  className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {isGifting
                      ? "Awarding Coins..."
                      : `Award +${customGiftAmount || giftAmount} Gold Coins Now`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
