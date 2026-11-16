import { useState, useEffect } from "react";
import { AdminStore, type LoggedUser } from "@/admin/lib/admin-store";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  Minus,
  Ban,
  CheckCircle2,
  Coins,
  MapPin,
  Clock,
  Wand2,
  Shield,
  RefreshCw,
  User,
  X,
  Zap,
  Calendar,
  BadgeCheck,
  FileText,
  Mail,
  ExternalLink,
  Bell,
  Send,
} from "lucide-react";
import { TokenCoin } from "@/components/TokenCoins";

export function UsersManagement() {
  const [users, setUsers] = useState<LoggedUser[]>(() => AdminStore.getUsers());
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [customCreditUser, setCustomCreditUser] = useState<string | null>(null);
  const [customCreditAmount, setCustomCreditAmount] = useState<number>(50);
  const [isSyncing, setIsSyncing] = useState(false);
  const [inspectingUser, setInspectingUser] = useState<LoggedUser | null>(null);

  // Send Direct User Notification Modal State
  const [notifUser, setNotifUser] = useState<LoggedUser | null>(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState<"admin" | "token" | "offer" | "security" | "update">("admin");
  const [notifBadge, setNotifBadge] = useState("Admin Message");
  const [notifLink, setNotifLink] = useState("");
  const [notifActionText, setNotifActionText] = useState("");
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  const handleOpenNotificationModal = (user: LoggedUser) => {
    setNotifUser(user);
    setNotifTitle("");
    setNotifMessage("");
    setNotifType("admin");
    setNotifBadge("Admin Message");
    setNotifLink("");
    setNotifActionText("");
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifUser) return;
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.error("Please provide both a title and message.");
      return;
    }
    setIsSendingNotif(true);
    try {
      const payload: {
        userId: string;
        title: string;
        message: string;
        type?: "admin" | "token" | "offer" | "security" | "update" | undefined;
        badge?: string | undefined;
        link?: string | undefined;
        actionText?: string | undefined;
      } = {
        userId: notifUser.id,
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        type: notifType,
        badge: notifBadge.trim() || "Admin Notice",
      };
      if (notifLink.trim()) payload.link = notifLink.trim();
      if (notifActionText.trim()) payload.actionText = notifActionText.trim();

      const res = await AdminStore.sendUserNotification(payload);
      if (res.success) {
        toast.success(`Notification sent directly to ${notifUser.name}!`);
        setNotifUser(null);
      } else {
        toast.error(res.error || "Failed to send notification.");
      }
    } finally {
      setIsSendingNotif(false);
    }
  };

  const fetchLatest = async (showToast = false) => {
    setIsSyncing(true);
    try {
      const serverUsers = await AdminStore.fetchUsersFromServer();
      setUsers([...serverUsers]);
      if (showToast) {
        toast.success(`Synced ${serverUsers.length} user account${serverUsers.length === 1 ? "" : "s"} from database.`);
      }
    } catch {
      if (showToast) {
        toast.error("Failed to sync users from server.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Initial fetch from server
    fetchLatest();

    const handleUpdate = () => {
      setUsers(AdminStore.getUsers());
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

  const handleAdjustCredits = (userId: string, delta: number) => {
    const updated = AdminStore.adjustUserCredits(userId, delta);
    setUsers([...updated]);
    const target = updated.find((u) => u.id === userId);
    toast.success(
      `${delta > 0 ? "Added" : "Deducted"} ${Math.abs(delta)} credits for ${target?.name}. New balance: ${target?.credits}`
    );
  };

  const handleToggleRestriction = (userId: string) => {
    const updated = AdminStore.toggleUserRestriction(userId);
    setUsers([...updated]);
    const target = updated.find((u) => u.id === userId);
    if (target?.status === "restricted") {
      toast.warning(`Account for ${target.name} has been RESTRICTED.`);
    } else {
      toast.success(`Account for ${target?.name} is now ACTIVE.`);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.ip && u.ip.includes(search)) ||
      (u.location && u.location.toLowerCase().includes(search.toLowerCase()));

    const matchesPlan = planFilter === "all" || u.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-foreground">Logged Users Directory</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage real registered user accounts, allocate credits, and manage account statuses.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchLatest(true)}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Fetch latest user accounts from server database"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-accent" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Database"}</span>
          </button>
          <span className="rounded-full bg-muted/60 border border-border px-4 py-1.5 text-xs font-bold text-foreground">
            {filteredUsers.length} User{filteredUsers.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, IP or city…"
            className="w-full rounded-2xl border border-input bg-background/60 pl-10 pr-4 py-2.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-all shadow-xs"
          />
        </div>

        {/* Plan Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["all", "free", "lite", "pro", "enterprise"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlanFilter(p)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold capitalize transition-all cursor-pointer ${
                planFilter === p
                  ? "bg-foreground text-background shadow-xs font-extrabold"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-xs">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="font-semibold text-foreground text-sm">No registered users found</p>
            <p className="mt-1 text-[11px]">When users sign up or log in on the website, their accounts will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-bold uppercase tracking-wider text-[11px] text-muted-foreground">
              <tr>
                <th className="py-4 px-6">User & Profile</th>
                <th className="py-4 px-6">Current Plan</th>
                <th className="py-4 px-6">Tokens Balance</th>
                <th className="py-4 px-6">Total Processed</th>
                <th className="py-4 px-6">Location & Last Active</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  {/* User Profile */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 font-bold text-accent">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-xs leading-snug">{u.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Plan Badge */}
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        u.plan === "enterprise"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                          : u.plan === "pro"
                          ? "bg-accent/10 text-accent border border-accent/20"
                          : u.plan === "lite"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {u.plan}
                    </span>
                  </td>

                  {/* Tokens */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                      <span>{u.credits.toLocaleString()} Total</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                      <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                        <TokenCoin type="silver" size="xs" />
                        <span>{u.freeCredits ?? 10} Silver</span>
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                        <TokenCoin type="gold" size="xs" showGlow={(u.paidCredits ?? 0) > 0} />
                        <span>{u.paidCredits ?? 0} Gold</span>
                      </span>
                    </div>
                  </td>

                  {/* Total Processed */}
                  <td className="py-4 px-6 font-mono text-muted-foreground">
                    {u.totalProcessed.toLocaleString()} images
                  </td>

                  {/* Location & Last Active */}
                  <td className="py-4 px-6 text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{u.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] mt-0.5 font-mono">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{u.lastActive}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        u.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <span>{u.status}</span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInspectingUser(u)}
                        title="View Full Profile"
                        className="rounded-lg border border-slate-200 dark:border-zinc-800 p-1.5 text-orange-600 hover:bg-orange-500/10 hover:border-orange-500/40 transition-colors cursor-pointer"
                      >
                        <User className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenNotificationModal(u)}
                        title={`Send Notification to ${u.name}`}
                        className="rounded-lg border border-blue-200 dark:border-blue-900/60 p-1.5 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <Bell className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustCredits(u.id, 10)}
                        title="Add 10 Credits"
                        className="rounded-lg border border-border p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustCredits(u.id, -10)}
                        title="Deduct 10 Credits"
                        className="rounded-lg border border-border p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleRestriction(u.id)}
                        title={u.status === "active" ? "Restrict User" : "Activate User"}
                        className={`rounded-lg border p-1.5 transition-colors cursor-pointer ${
                          u.status === "active"
                            ? "border-border text-muted-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/10"
                            : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                        }`}
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* User Profile Inspect Modal (White, Black & Orange Design) */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-zinc-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white font-display text-2xl font-black shadow-md ring-4 ring-orange-500/10">
                  {inspectingUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-xl font-black text-slate-950 dark:text-white">
                      {inspectingUser.name}
                    </h3>
                    <span className="rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 px-2.5 py-0.5 text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase">
                      {inspectingUser.plan}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {inspectingUser.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Token Quotas / Available Balances (White, Black & Orange Split Gauge) */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-850 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-orange-500" />
                  <span>Token Allowance & Quotas</span>
                </span>
                <span className="text-slate-950 dark:text-white font-black font-mono">
                  {inspectingUser.credits} Total
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-600 dark:text-zinc-400">Daily Silver</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {inspectingUser.freeCredits ?? 10} / 10
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, ((inspectingUser.freeCredits ?? 10) / 10) * 100)}%` }}
                      className="h-full bg-slate-900 dark:bg-white rounded-full"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-orange-500/30 bg-orange-50/40 dark:bg-orange-950/20 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-orange-800 dark:text-orange-300">Paid Gold</span>
                    <span className="font-mono font-black text-orange-600 dark:text-orange-400">
                      {inspectingUser.paidCredits ?? 0}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-orange-200 dark:bg-orange-950 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, ((inspectingUser.paidCredits ?? 0) / 50) * 100)}%` }}
                      className="h-full bg-orange-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Specializations & Tools */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tools & Capabilities
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "AI Background Remover",
                  "4K Super-Res Upscaler",
                  "PDF to JPG Transcoder",
                  "Face Blur Privacy",
                  "Smart Image Compress",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Account Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100 dark:border-zinc-800">
              <div className="space-y-1">
                <span className="text-slate-400">Detected Location</span>
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-orange-500" />
                  <span>{inspectingUser.location}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400">Total Processed Images</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white">
                  {inspectingUser.totalProcessed.toLocaleString()} jobs
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400">Account Status</span>
                <p className={`font-bold flex items-center gap-1.5 ${
                  inspectingUser.status === "active" ? "text-emerald-600" : "text-rose-600"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${inspectingUser.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                  <span className="capitalize">{inspectingUser.status}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400">Last Active Ping</span>
                <p className="font-mono text-slate-600 dark:text-zinc-400">
                  {inspectingUser.lastActive}
                </p>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleAdjustCredits(inspectingUser.id, 50);
                    setInspectingUser({ ...inspectingUser, credits: inspectingUser.credits + 50 });
                  }}
                  className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                >
                  + Add 50 Credits
                </button>
              </div>

              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-5 py-2 text-xs shadow-sm shadow-orange-500/20 cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct User Notification Modal */}
      {notifUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black text-slate-950 dark:text-white">
                    Send User Notification
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Direct notification to <span className="font-bold text-slate-800 dark:text-zinc-200">{notifUser.name}</span> ({notifUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotifUser(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Notification Title *
                </label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="e.g. VIP Bonus: 50 Permanent Tokens Added!"
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Message Details *
                </label>
                <textarea
                  required
                  rows={3}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Enter message visible to this specific user in their profile..."
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Notification Type
                  </label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value as any)}
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 px-3 text-xs text-slate-900 dark:text-white font-medium focus:outline-none"
                  >
                    <option value="admin">Admin Notice</option>
                    <option value="token">Token Credit / Bonus</option>
                    <option value="offer">Special Offer</option>
                    <option value="security">Security Alert</option>
                    <option value="update">System Update</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={notifBadge}
                    onChange={(e) => setNotifBadge(e.target.value)}
                    placeholder="e.g. VIP Notice"
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 px-3 text-xs text-slate-900 dark:text-white font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Action Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={notifLink}
                    onChange={(e) => setNotifLink(e.target.value)}
                    placeholder="e.g. /pricing or /account"
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 px-3 text-xs text-slate-900 dark:text-white font-medium focus:outline-none font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Action Button Text
                  </label>
                  <input
                    type="text"
                    value={notifActionText}
                    onChange={(e) => setNotifActionText(e.target.value)}
                    placeholder="e.g. View Offer"
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 px-3 text-xs text-slate-900 dark:text-white font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setNotifUser(null)}
                  className="rounded-xl border border-slate-200 dark:border-zinc-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingNotif}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2 text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSendingNotif ? "Dispatching..." : "Send to User"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
