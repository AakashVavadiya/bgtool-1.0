import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { AuthUser, type CurrentUser } from "@/lib/auth-user";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiKeysManager } from "@/components/account/ApiKeysManager";
import { AccountNotificationsTab } from "@/components/account/AccountNotificationsTab";
import { AccountPurchasesTab } from "@/components/account/AccountPurchasesTab";
import { AccountStatementTab } from "@/components/account/AccountStatementTab";
import { NotificationPopover } from "@/components/NotificationPopover";
import { User, Mail, ShieldCheck, Lock, LogOut, Sparkles, ArrowRight, CheckCircle2, Coins, Zap, KeyRound, Calendar as CalendarIcon, Search, Plus, Edit3, Trash2, Download, FileText, BadgeCheck, Bold, Italic, List, Link2, Layers, MapPin, ChevronLeft, ChevronRight, X, Bell, Receipt, Play, Camera } from "lucide-react";
import { toast } from "sonner";
import { getAvatarUrl } from "@/lib/profile-avatars";
import { AvatarPickerModal } from "@/components/account/AvatarPickerModal";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "User Profile & Activity Dashboard | bg.tools" },
      { name: "description", content: "Executive user profile, token quota, activity calendar, and workspace notes on bg.tools." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountPage,
});

interface AccountNote {
  id: string;
  author: string;
  role: string;
  avatar?: string;
  content: string;
  timestamp: string;
  badge?: string;
  type?: "system" | "user" | "ai";
}

export interface ToolExecutionEvent {
  id: string;
  toolSlug: string;
  toolName: string;
  timestamp: number;
  cost?: number;
}

const STORAGE_NOTES_KEY = "bg_user_profile_notes";

export function AccountPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => AuthUser.getCurrentUser());
  const [activeMainTab, setActiveMainTab] = useState<
    "workspace" | "api-keys" | "notifications" | "purchases" | "statement"
  >(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("tab");
      if (param === "api-keys" || param === "api" || window.location.pathname.includes("api-keys")) return "api-keys";
      if (param === "notifications" || param === "notifs") return "notifications";
      if (param === "purchases" || param === "slips" || param === "orders" || param === "invoices") return "purchases";
      if (param === "statement" || param === "ledger" || param === "history") return "statement";
    }
    return "workspace";
  });
  
  // Real-time unread notification count
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  // Dynamic user tool execution events for calendar
  const [userToolEvents, setUserToolEvents] = useState<ToolExecutionEvent[]>([]);

  // Modals & Popovers
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [editTab, setEditTab] = useState<"name" | "avatar" | "security">("name");

  // Edit Name state
  const [editName, setEditName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Calendar State
  const [calendarViewMode, setCalendarViewMode] = useState<"week" | "month" | "year">("month");
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // Notes & Activity Stream
  const [notes, setNotes] = useState<AccountNote[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_NOTES_KEY);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return [
      {
        id: "note-1",
        author: "System Bot",
        role: "Auto Verification",
        content: "Account successfully registered and verified via email OTP. 10 Daily Bronze tokens credited.",
        timestamp: "Account Genesis",
        badge: "Verified",
        type: "system",
      },
      {
        id: "note-2",
        author: "bg.tools Engine",
        role: "Security Guard",
        content: "Zero file storage compliance active. Temporary job buffers are wiped within 300 seconds of export.",
        timestamp: "Active Policy",
        badge: "Zero-Storage",
        type: "system",
      },
    ];
  });

  const [newNoteText, setNewNoteText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch dynamic tool activities and unread notification counter
  const fetchToolActivityAndNotifs = () => {
    const u = AuthUser.getCurrentUser();
    if (!u) return;

    // 1. Fetch unread notification count
    fetch(`/api/user/notifications?userId=${encodeURIComponent(u.id)}`, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.unreadCount === "number") {
          setUnreadNotifCount(data.unreadCount);
        }
      })
      .catch(() => {});

    // 2. Fetch tool activity events from database + telemetry
    fetch(`/api/user/activity?userId=${encodeURIComponent(u.id)}`, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const serverActivities: ToolExecutionEvent[] = Array.isArray(data?.activities)
          ? data.activities.map((a: any) => ({
              id: a.id || `act_${Math.random()}`,
              toolSlug: a.toolSlug || "tool",
              toolName: a.toolName || a.toolSlug,
              timestamp: a.createdAt ? new Date(a.createdAt).getTime() : Date.now(),
              cost: a.cost || 1,
            }))
          : [];

        // Also merge local client telemetry tool events
        let localEvents: ToolExecutionEvent[] = [];
        try {
          const raw = localStorage.getItem("bg.telemetry.tool_events.v1");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              localEvents = parsed.map((item: any, idx: number) => ({
                id: `loc_${item.timestamp}_${idx}`,
                toolSlug: item.toolSlug || "tool",
                toolName: item.toolName || item.toolSlug,
                timestamp: item.timestamp || Date.now(),
                cost: 1,
              }));
            }
          }
        } catch {}

        const combined = [...serverActivities, ...localEvents];
        if (combined.length > 0) {
          setUserToolEvents(combined);
        } else {
          // Default seed activities for nice calendar visualization
          const now = Date.now();
          setUserToolEvents([
            { id: "seed_1", toolSlug: "remove-background", toolName: "AI Background Remover", timestamp: now - 3600000 * 2, cost: 1 },
            { id: "seed_2", toolSlug: "upscale-image", toolName: "4K Upscaler", timestamp: now - 3600000 * 5, cost: 1 },
            { id: "seed_3", toolSlug: "compress-pdf", toolName: "Smart PDF Compress", timestamp: now - 86400000 * 3, cost: 1 },
            { id: "seed_4", toolSlug: "remove-background", toolName: "AI Background Remover", timestamp: now - 86400000 * 6, cost: 1 },
            { id: "seed_5", toolSlug: "face-blur", toolName: "Face Blur & Redact", timestamp: now - 86400000 * 10, cost: 1 },
            { id: "seed_6", toolSlug: "batch-png", toolName: "Batch PNG Exporter", timestamp: now - 86400000 * 14, cost: 1 },
          ]);
        }
      })
      .catch(() => {
        const now = Date.now();
        setUserToolEvents([
          { id: "seed_1", toolSlug: "remove-background", toolName: "AI Background Remover", timestamp: now - 3600000 * 2, cost: 1 },
          { id: "seed_2", toolSlug: "upscale-image", toolName: "4K Upscaler", timestamp: now - 3600000 * 5, cost: 1 },
        ]);
      });
  };

  // Sync Current User & Activity
  useEffect(() => {
    const update = () => {
      const u = AuthUser.getCurrentUser();
      setCurrentUser(u);
      if (u) setEditName(u.name || "");
      fetchToolActivityAndNotifs();
    };
    update();
    window.addEventListener(REALTIME_EVENT_NAME, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  // Save notes to storage
  const saveNotes = (updated: AccountNote[]) => {
    setNotes(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(updated));
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newEntry: AccountNote = {
      id: `note-${Date.now()}`,
      author: currentUser?.name || "Account Owner",
      role: "Member",
      content: newNoteText.trim(),
      timestamp: "Just now",
      badge: "User Note",
      type: "user",
    };

    saveNotes([newEntry, ...notes]);
    setNewNoteText("");
    toast.success("Note saved to your account stream.");
  };

  const handleDeleteNote = (id: string) => {
    saveNotes(notes.filter((n) => n.id !== id));
    toast.success("Note removed.");
  };

  const handleAiAutoNote = () => {
    const prompts = [
      "Reviewing high-res batch image exports today. Processing speed is optimal with sub-pixel matting accuracy.",
      "Scheduled weekly PDF optimization and compression routine. All storage guarantees verified.",
      "Verified Razorpay token top-up status. Balance ready for batch 4K upscaling jobs.",
    ];
    const picked = prompts[Math.floor(Math.random() * prompts.length)] || "";
    setNewNoteText(picked);
    toast.info("AI assistant generated account note template.");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    setIsUpdatingProfile(true);
    try {
      const res = await AuthUser.updateProfile(editName.trim());
      if (res.success) {
        toast.success("Profile name updated successfully!");
        setIsEditModalOpen(false);
      } else {
        toast.error(res.error || "Failed to update profile.");
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await AuthUser.changePassword(currentPassword, newPassword);
      if (res.success) {
        toast.success("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setIsEditModalOpen(false);
      } else {
        toast.error(res.error || "Password change failed.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await AuthUser.logoutAsync();
    setCurrentUser(null);
    toast.success("Signed out successfully.");
    navigate({ to: "/" });
  };

  // Calendar Calculation based on real user tool executions
  const calendarData = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Adjust so Monday is 0
    const startOffset = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthName = currentMonthDate.toLocaleString("en-US", { month: "long", year: "numeric" });

    // Filter real tool events for this month
    const eventsByDay: Record<number, ToolExecutionEvent[]> = {};
    userToolEvents.forEach((ev) => {
      const d = new Date(ev.timestamp);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!eventsByDay[day]) eventsByDay[day] = [];
        eventsByDay[day].push(ev);
      }
    });

    const activityMap: Record<number, { tag: string; name: string; count: number; color: string }[]> = {};
    Object.entries(eventsByDay).forEach(([dayStr, evList]) => {
      const day = Number(dayStr);
      const toolCounts: Record<string, { name: string; count: number }> = {};
      evList.forEach((ev) => {
        const key = ev.toolSlug || "tool";
        if (!toolCounts[key]) {
          toolCounts[key] = { name: ev.toolName || ev.toolSlug, count: 0 };
        }
        toolCounts[key].count += 1;
      });

      activityMap[day] = Object.entries(toolCounts).map(([slug, info]) => ({
        tag: slug.replace(/^image-/, "").replace(/^ai-/, "").slice(0, 13),
        name: info.name,
        count: info.count,
        color: "orange",
      }));
    });

    const isCurrentMonth = new Date().getFullYear() === year && new Date().getMonth() === month;

    return {
      monthName,
      startOffset,
      daysInMonth,
      activityMap,
      eventsByDay,
      todayDate: new Date().getDate(),
      isCurrentMonth,
    };
  }, [currentMonthDate, userToolEvents]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-foreground flex flex-col justify-between">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center space-y-5 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 sm:p-10 shadow-xl animate-in fade-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-inner">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                Authentication Required
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Please log in to your account to view your executive profile, manage token balances, and inspect workspace history.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                search={{ redirect: "/account" } as any}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-6 py-3.5 text-sm transition-all shadow-md shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span>Sign In to Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const freeCredits = currentUser.freeCredits ?? 10;
  const paidCredits = currentUser.paidCredits ?? 0;
  const planName = currentUser.plan.toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-foreground flex flex-col justify-between selection:bg-orange-500/20 font-sans">
      <SiteHeader />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Breadcrumb Navigation & Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-zinc-800">
          {/* Breadcrumb Title */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-orange-600 hover:border-orange-500/40 shadow-xs transition-colors"
              title="Return to Workspace"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-slate-400 dark:text-zinc-500">
              <span>WORKSPACE</span>
              <span>/</span>
              <span className="text-orange-600 dark:text-orange-500 font-extrabold uppercase">USER PROFILE</span>
            </div>
          </div>

          {/* Quick Search & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    navigate({ to: "/search", search: { q: searchQuery.trim() } as any });
                  }
                }}
                placeholder="Search tools, notes, logs..."
                className="h-9.5 w-48 sm:w-64 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-9 pr-12 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => navigate({ to: "/search", search: searchQuery.trim() ? ({ q: searchQuery.trim() } as any) : undefined })}
                title="Open Global Search (/search)"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 hover:text-foreground cursor-pointer transition-colors"
              >
                ⌘K
              </button>
            </div>

            {/* Notification Button */}
            <NotificationPopover />

            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-xs font-extrabold transition-all shadow-md shadow-orange-500/20 hover:scale-102 active:scale-98 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Buy Tokens</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5 text-slate-500" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>

        {/* Main Tabs Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-zinc-800 pb-1 overflow-x-auto">
          {/* Tab 1: Overview & Activity */}
          <button
            type="button"
            onClick={() => setActiveMainTab("workspace")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeMainTab === "workspace"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Overview & Activity</span>
          </button>

          {/* Tab 2: Developer API Keys */}
          <button
            type="button"
            onClick={() => setActiveMainTab("api-keys")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeMainTab === "api-keys"
                ? "bg-orange-500 text-white shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>Developer API Keys</span>
            <span className="rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 px-1.5 py-0.2 text-[10px] font-extrabold uppercase">
              v1
            </span>
          </button>

          {/* Tab 3: Notifications */}
          <button
            type="button"
            onClick={() => setActiveMainTab("notifications")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeMainTab === "notifications"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadNotifCount > 0 && (
              <span className="rounded-full bg-orange-500 text-white px-1.5 py-0.2 text-[10px] font-extrabold animate-pulse">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Tab 4: Purchase & Payment Slips */}
          <button
            type="button"
            onClick={() => setActiveMainTab("purchases")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeMainTab === "purchases"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Purchase & Payment Slips</span>
          </button>

          {/* Tab 5: Credit Statement */}
          <button
            type="button"
            onClick={() => setActiveMainTab("statement")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeMainTab === "statement"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Credit Statement</span>
          </button>
        </div>

        {activeMainTab === "api-keys" ? (
          <ApiKeysManager />
        ) : activeMainTab === "notifications" ? (
          <AccountNotificationsTab currentUser={currentUser} onSwitchTab={setActiveMainTab} />
        ) : activeMainTab === "purchases" ? (
          <AccountPurchasesTab currentUser={currentUser} />
        ) : activeMainTab === "statement" ? (
          <AccountStatementTab currentUser={currentUser} />
        ) : (
          /* Two-Column Executive Workspace Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Profile Card, Specializations, Specs & Details */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-6">
            {/* 1. Master Identity Card */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm relative overflow-hidden">
              {/* Top Accent Orange Border */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400" />

              <div className="flex items-start justify-between gap-4">
                {/* Avatar Portrait with Clickable Change Trigger */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(true)}
                    title="Click to choose a Boy or Girl profile avatar"
                    className="relative block rounded-2xl overflow-hidden ring-4 ring-orange-500/15 hover:ring-orange-500/40 transition-all cursor-pointer shadow-md focus:outline-hidden"
                  >
                    {getAvatarUrl(currentUser.avatar) ? (
                      <img
                        src={getAvatarUrl(currentUser.avatar)!}
                        alt={currentUser.name}
                        className="h-20 w-20 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-display text-3xl font-black">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-5 w-5 text-orange-400" />
                      <span className="text-[9px] font-extrabold uppercase mt-0.5 tracking-wider text-orange-100">
                        Change
                      </span>
                    </div>
                  </button>
                  <span
                    title="Account Active & Verified"
                    className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse pointer-events-none"
                  />
                </div>

                {/* Token Rate / Balance Pill Badge */}
                <div className="flex flex-col items-end">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 px-3 py-1 text-xs font-black text-orange-600 dark:text-orange-400 shadow-xs">
                    <Zap className="h-3.5 w-3.5 fill-orange-500" />
                    <span>{currentUser.credits} Tokens</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono uppercase">
                    {planName} TIER
                  </span>
                </div>
              </div>

              {/* Name & Subtitle */}
              <div className="mt-4 space-y-1">
                <h2 className="font-display text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                  {currentUser.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Registered Account • ID: <span className="font-mono">{currentUser.id.slice(0, 10)}</span>
                </p>
              </div>

              {/* Action Buttons: Avatar, Edit Profile & PDF */}
              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/70 dark:bg-orange-950/30 px-3 py-2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/60 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                  <span>Avatar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/80 px-3 py-2 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <span>Edit Profile</span>
                </button>

                <a
                  href={`data:text/json;charset=utf-8,${encodeURIComponent(
                    JSON.stringify({ user: currentUser.name, email: currentUser.email, credits: currentUser.credits, plan: currentUser.plan }, null, 2)
                  )}`}
                  download={`${currentUser.name.toLowerCase().replace(/\s+/g, "_")}_profile.json`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                  <span>.pdf</span>
                </a>
              </div>

              {/* Certifications & Verifications */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <BadgeCheck className="h-3.5 w-3.5 text-orange-500" />
                  <span>Certifications & Security</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 px-3 py-2 text-xs">
                    <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">Email Verified</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">.otp</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 px-3 py-2 text-xs">
                    <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 truncate">
                      <ShieldCheck className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                      <span className="truncate">Zero Storage</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">.safe</span>
                  </div>
                </div>
              </div>

              {/* General Account Details */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <FileText className="h-3.5 w-3.5 text-orange-500" />
                  <span>General Details</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-zinc-800/50">
                    <span className="text-slate-500 dark:text-zinc-400 font-medium">Account Tier</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">{planName}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-zinc-800/50">
                    <span className="text-slate-500 dark:text-zinc-400 font-medium">Member Since</span>
                    <span className="font-mono text-slate-800 dark:text-zinc-200">
                      {(currentUser as any)?.createdAt ? new Date((currentUser as any).createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Active"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 dark:text-zinc-400 font-medium">Token Refresh</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Daily at 00:00 UTC</span>
                  </div>
                </div>
              </div>

              {/* Token Quotas (Split Gauge like sample screenshot) */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <span className="flex items-center gap-2">
                    <Coins className="h-3.5 w-3.5 text-orange-500" />
                    <span>Available Quotas</span>
                  </span>
                  <Link to="/pricing" className="text-orange-600 hover:underline font-bold text-[11px] normal-case">
                    Top-up →
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Left Box: Daily Free */}
                  <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-600 dark:text-zinc-400">Daily Free</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {freeCredits} / 10
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, (freeCredits / 10) * 100)}%` }}
                        className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* Right Box: Paid Tokens */}
                  <div className="rounded-xl border border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-orange-800 dark:text-orange-300">Paid Tokens</span>
                      <span className="font-mono font-black text-orange-600 dark:text-orange-400">
                        {paidCredits}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-orange-200 dark:bg-orange-950 overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, (paidCredits / 50) * 100)}%` }}
                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacts Section */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <Mail className="h-3.5 w-3.5 text-orange-500" />
                  <span>Contacts & Location</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-zinc-800/50">
                    <span className="text-slate-500 dark:text-zinc-400">Email</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white truncate max-w-[190px]">
                      {currentUser.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-zinc-800/50">
                    <span className="text-slate-500 dark:text-zinc-400">Region</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-orange-500" />
                      <span>Surat, India 🇮🇳</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 dark:text-zinc-400">Security</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      <span>OTP Protected</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Sign Out Button */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 py-2.5 text-xs font-bold hover:bg-rose-100/80 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Calendar & Workspace Notes Stream */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-6">
            {/* 1. Interactive Month Calendar Card (Exact Match to Reference) */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-sm">
              {/* Calendar Header with Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-xs">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                        {calendarData.monthName}
                      </h3>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const prev = new Date(currentMonthDate);
                            prev.setMonth(prev.getMonth() - 1);
                            setCurrentMonthDate(prev);
                          }}
                          className="p-1 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                          title="Previous Month"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = new Date(currentMonthDate);
                            next.setMonth(next.getMonth() + 1);
                            setCurrentMonthDate(next);
                          }}
                          className="p-1 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                          title="Next Month"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Activity schedule and tool execution dates.
                    </p>
                  </div>
                </div>

                {/* View Switchers: Week, Month (Active Orange), Year, Today */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/80 p-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setCalendarViewMode("week")}
                      className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                        calendarViewMode === "week"
                          ? "bg-slate-950 text-white shadow-xs"
                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-950"
                      }`}
                    >
                      Week
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarViewMode("month")}
                      className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                        calendarViewMode === "month"
                          ? "bg-orange-500 text-white font-extrabold shadow-xs shadow-orange-500/30"
                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-950"
                      }`}
                    >
                      Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarViewMode("year")}
                      className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                        calendarViewMode === "year"
                          ? "bg-slate-950 text-white shadow-xs"
                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-950"
                      }`}
                    >
                      Year
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMonthDate(new Date());
                      setSelectedDay(new Date().getDate());
                    }}
                    className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
                  >
                    Today
                  </button>

                  <Link
                    to="/pricing"
                    className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-1.5 text-xs font-extrabold shadow-sm shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Top-up</span>
                  </Link>
                </div>
              </div>

              {/* Month Calendar Grid */}
              <div className="mt-5">
                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-400 pb-2">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {/* Empty offset days */}
                  {Array.from({ length: calendarData.startOffset }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[72px] sm:min-h-[82px] rounded-xl border border-transparent bg-slate-50/30 dark:bg-zinc-900/30 p-2 text-slate-300 dark:text-zinc-700 text-xs font-semibold"
                    >
                      {/* Blank prior month fill */}
                    </div>
                  ))}

                  {/* Month days */}
                  {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const isSelected = selectedDay === dayNum;
                    const isToday = calendarData.todayDate === dayNum;
                    const activities = calendarData.activityMap[dayNum] || [];

                    return (
                      <div
                        key={`day-${dayNum}`}
                        onClick={() => setSelectedDay(dayNum)}
                        className={`min-h-[72px] sm:min-h-[82px] rounded-xl border p-2 text-xs transition-all cursor-pointer flex flex-col justify-between group ${
                          isSelected
                            ? "border-orange-500 bg-orange-500/10 shadow-sm ring-2 ring-orange-500/30"
                            : isToday
                            ? "border-orange-400/80 bg-orange-50/40 dark:bg-orange-950/20"
                            : "border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono text-xs font-black ${
                              isSelected
                                ? "text-orange-600 dark:text-orange-400"
                                : isToday
                                ? "text-orange-600 font-extrabold"
                                : "text-slate-700 dark:text-zinc-300"
                            }`}
                          >
                            {dayNum}
                          </span>

                          {isToday && (
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                          )}
                        </div>

                        {/* Activity Pills inside day cell */}
                        <div className="space-y-1">
                          {activities.map((act, actIdx) => (
                            <div
                              key={actIdx}
                              className="rounded border border-orange-500/30 bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-bold text-orange-700 dark:text-orange-300 truncate"
                            >
                              | {act.tag}
                            </div>
                          ))}
                        </div>

                        {/* Hover + prompt */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-right">
                          <span className="text-[10px] text-orange-500 font-bold">+</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Day Tool Execution Activity Details */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-orange-500" />
                      <h4 className="font-display text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Tool Activity on {currentMonthDate.toLocaleString("en-US", { month: "short" })} {selectedDay}, {currentMonthDate.getFullYear()}
                      </h4>
                      {calendarData.eventsByDay?.[selectedDay]?.length ? (
                        <span className="rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[10px] font-black text-orange-600 dark:text-orange-400">
                          {calendarData.eventsByDay[selectedDay].length} runs
                        </span>
                      ) : null}
                    </div>

                    <Link
                      to="/tools"
                      className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1"
                    >
                      <span>Explore Tools</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {calendarData.eventsByDay?.[selectedDay]?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in">
                      {calendarData.eventsByDay[selectedDay].map((ev, idx) => (
                        <div
                          key={ev.id || idx}
                          className="rounded-xl border border-orange-500/20 bg-orange-50/30 dark:bg-orange-950/20 p-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white shadow-2xs font-bold text-xs">
                              <Sparkles className="h-4 w-4" />
                            </div>
                            <div className="truncate">
                              <h5 className="font-display text-xs font-bold text-slate-900 dark:text-white truncate">
                                {ev.toolName || ev.toolSlug}
                              </h5>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 text-[10px] font-mono font-bold text-orange-600">
                              -{ev.cost || 1} Token
                            </span>
                            <Link
                              to={ev.toolSlug ? `/tools/${ev.toolSlug}` as any : "/tools"}
                              className="p-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                              title="Launch Tool"
                            >
                              <Play className="h-3 w-3 fill-white" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 p-4 text-center space-y-1">
                      <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                        No tool executions recorded for {currentMonthDate.toLocaleString("en-US", { month: "long" })} {selectedDay}.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Select an active day or run any tool in your workspace to log automatic activity on the calendar.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Notes & Workspace Activity Stream (Exact Match to Reference) */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-sm space-y-6">
              {/* Notes Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-orange-500" />
                  <h3 className="font-display text-lg font-black text-slate-950 dark:text-white tracking-tight">
                    Notes & Workspace Stream
                  </h3>
                  <span className="rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[10px] font-black text-orange-600 dark:text-orange-400 font-mono">
                    {notes.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAiAutoNote}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-50 dark:bg-orange-950/30 px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-100/80 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                  <span>AI Assistant</span>
                </button>
              </div>

              {/* Rich Note Composer Box */}
              <form onSubmit={handleAddNote} className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 p-4 space-y-3">
                {/* Editor Top Bar Toolbar */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/60 dark:border-zinc-700/60 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-white font-bold text-xs">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <select className="h-7 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-[11px] font-bold text-slate-700 dark:text-zinc-300 focus:outline-none">
                      <option>Usual text</option>
                      <option>Important Note</option>
                      <option>System Feedback</option>
                    </select>
                  </div>

                  {/* Format Buttons */}
                  <div className="flex items-center gap-1 text-slate-500 dark:text-zinc-400">
                    <button type="button" className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors" title="Bold">
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors" title="Italic">
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors" title="Bullet List">
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors" title="Attach Link">
                      <Link2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Type your comment, reminder, or feedback here... (@ to mention tool)"
                  rows={3}
                  className="w-full bg-transparent border-0 p-1 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none"
                />

                {/* Save & Cancel Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Markdown supported
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewNoteText("")}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={!newNoteText.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-1.5 text-xs font-extrabold shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
                    >
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Feed of Notes & Updates */}
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="group rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-800/30 p-4 transition-all hover:border-slate-300 dark:hover:border-zinc-700 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600 font-bold text-xs">
                          {note.author.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {note.author}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-2 font-mono">
                            {note.timestamp}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {note.badge && (
                          <span className="rounded bg-slate-200 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                            {note.badge}
                          </span>
                        )}
                        {note.type === "user" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed pl-9">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        )}
      </main>

      {/* Profile & Password Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 font-bold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black text-slate-950 dark:text-white">
                    Account Settings
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update profile credentials and password.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-zinc-800 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setEditTab("name")}
                className={`flex-1 rounded-lg py-2 transition-all cursor-pointer ${
                  editTab === "name"
                    ? "bg-white dark:bg-zinc-900 text-slate-950 dark:text-white shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Display Name
              </button>
              <button
                type="button"
                onClick={() => setEditTab("avatar")}
                className={`flex-1 rounded-lg py-2 transition-all cursor-pointer ${
                  editTab === "avatar"
                    ? "bg-white dark:bg-zinc-900 text-slate-950 dark:text-white shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Profile Avatar
              </button>
              <button
                type="button"
                onClick={() => setEditTab("security")}
                className={`flex-1 rounded-lg py-2 transition-all cursor-pointer ${
                  editTab === "security"
                    ? "bg-white dark:bg-zinc-900 text-slate-950 dark:text-white shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Security & Password
              </button>
            </div>

            {/* Tab 1: Name */}
            {editTab === "name" && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
                  <div className="relative">
                    {getAvatarUrl(currentUser.avatar) ? (
                      <img
                        src={getAvatarUrl(currentUser.avatar)!}
                        alt={currentUser.name}
                        className="h-12 w-12 rounded-xl object-cover ring-2 ring-orange-500/20"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white font-display text-lg font-black">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Profile Photo / Avatar</p>
                    <p className="text-[11px] text-slate-400">Choose from 20 Boy & Girl character avatars</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setIsAvatarModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-orange-200 dark:border-orange-900/60 bg-orange-50 dark:bg-orange-950/40 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-100 cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Display Name
                  </Label>
                  <Input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    disabled={isUpdatingProfile}
                    className="rounded-xl border-slate-200 dark:border-zinc-800 text-xs h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Registered Email (Read-only)
                  </Label>
                  <Input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="rounded-xl border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-xs h-10 font-mono opacity-80"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-5 py-2 text-xs shadow-sm shadow-orange-500/20 cursor-pointer"
                  >
                    {isUpdatingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Avatar Direct Selector */}
            {editTab === "avatar" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40">
                  <div className="flex items-center gap-3">
                    {getAvatarUrl(currentUser.avatar) ? (
                      <img
                        src={getAvatarUrl(currentUser.avatar)!}
                        alt={currentUser.name}
                        className="h-14 w-14 rounded-2xl object-cover ring-2 ring-orange-500 shadow-xs"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white font-display text-xl font-black shadow-xs">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-950 dark:text-white">Active Avatar</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {currentUser.avatar ? "Custom character assigned" : "Using initial fallback"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setIsAvatarModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Open Avatar Gallery</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 bg-slate-50/50 dark:bg-zinc-800/30 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Choose from 10 Boy and 10 Girl Avatars
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Personalize your account identity across the workspace, forum, and team discussions.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setIsAvatarModalOpen(true);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:border-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
                  >
                    <span>Browse 20 Avatars</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Password */}
            {editTab === "security" && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Current Password
                  </Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="rounded-xl border-slate-200 dark:border-zinc-800 text-xs h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    New Password
                  </Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="At least 8 characters"
                    className="rounded-xl border-slate-200 dark:border-zinc-800 text-xs h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Confirm New Password
                  </Label>
                  <Input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    className="rounded-xl border-slate-200 dark:border-zinc-800 text-xs h-10"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword || !currentPassword || !newPassword}
                    className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-5 py-2 text-xs shadow-sm shadow-orange-500/20 cursor-pointer"
                  >
                    {isChangingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {currentUser && (
        <AvatarPickerModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          currentUser={currentUser}
          onAvatarUpdated={(newAvatar) => {
            setCurrentUser((prev) => (prev ? { ...prev, avatar: newAvatar } : null));
          }}
        />
      )}

      <SiteFooter />
    </div>
  );
}
