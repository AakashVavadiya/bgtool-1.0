import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, ShoppingBag, Gift, Wand2, Shield, Download, Sparkles, Search, UserCheck, ArrowRight } from "lucide-react";
import { TokenCoin } from "@/components/TokenCoins";
import { type CurrentUser } from "@/lib/auth-user";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { toast } from "sonner";

export interface AccountNotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "token" | "offer" | "tool" | "security" | "update" | "purchase" | "admin";
  to?: string;
  actionText?: string;
  badge?: string;
  read: boolean;
}

interface AccountNotificationsTabProps {
  currentUser: CurrentUser;
  onSwitchTab?: (tab: "workspace" | "notifications" | "purchases" | "statement") => void;
}

const STORAGE_READ_NOTIFS_KEY = "bg_user_read_notifications_v1";

const SYSTEM_DEFAULT_NOTIFICATIONS: AccountNotificationItem[] = [
  {
    id: "sys-notif-daily-credits",
    title: "Daily Bronze Tokens Refreshed",
    description: "10 free daily Bronze Tokens are active in your account. Ready for background removal and smart conversions.",
    timestamp: "Today at 00:00 UTC",
    type: "token",
    to: "/account?tab=statement",
    actionText: "View Statement",
    badge: "Daily Bonus",
    read: false,
  },
  {
    id: "sys-notif-festival-special",
    title: "Limited Time Festive Token Offer",
    description: "Claim up to 60% festive bonus credits on Silver & Gold permanent packs.",
    timestamp: "Active Policy",
    type: "offer",
    to: "/pricing",
    actionText: "View Offers",
    badge: "Festival Sale",
    read: false,
  },
  {
    id: "sys-notif-zero-storage",
    title: "Zero Data Retention Guarantee Active",
    description: "All uploaded images and PDFs are processed strictly in RAM and deleted after job export.",
    timestamp: "Always Active",
    type: "security",
    badge: "Compliance",
    read: true,
  },
];

export function AccountNotificationsTab({ currentUser, onSwitchTab }: AccountNotificationsTabProps) {
  const [notifications, setNotifications] = useState<AccountNotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "purchase" | "admin" | "token">("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = () => {
    setIsLoading(true);
    let storedRead: string[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_READ_NOTIFS_KEY);
      if (raw) storedRead = JSON.parse(raw);
    } catch {}

    fetch(`/api/user/notifications?userId=${encodeURIComponent(currentUser.id)}`, {
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        let dbList: AccountNotificationItem[] = [];
        if (data?.notifications && Array.isArray(data.notifications)) {
          dbList = data.notifications.map((n: any) => ({
            id: n.id,
            title: n.title,
            description: n.message,
            timestamp: n.created_at ? new Date(n.created_at).toLocaleString() : "Recently",
            type: n.type || "admin",
            to: n.link || undefined,
            actionText: n.action_text || (n.type === "purchase" ? "View Purchase Slip" : undefined),
            badge: n.badge || (n.type === "purchase" ? "Payment Slip" : "Admin Notice"),
            read: n.read === 1 || storedRead.includes(n.id),
          }));
        }

        const defaultsMapped = SYSTEM_DEFAULT_NOTIFICATIONS.map((n) => ({
          ...n,
          read: n.read || storedRead.includes(n.id),
        }));

        setNotifications([...dbList, ...defaultsMapped]);
      })
      .catch(() => {
        const defaultsMapped = SYSTEM_DEFAULT_NOTIFICATIONS.map((n) => ({
          ...n,
          read: n.read || storedRead.includes(n.id),
        }));
        setNotifications(defaultsMapped);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchNotifications();
    const handleUpdate = () => fetchNotifications();
    window.addEventListener(REALTIME_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [currentUser.id]);

  const saveReadState = (id: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_READ_NOTIFS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(STORAGE_READ_NOTIFS_KEY, JSON.stringify(list));
      }
    } catch {}

    fetch("/api/user/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      credentials: "same-origin",
    }).catch(() => {});
  };

  const markSingleAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    saveReadState(id);
    toast.success("Notification marked as read.");
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const allIds = notifications.map((n) => n.id);
      localStorage.setItem(STORAGE_READ_NOTIFS_KEY, JSON.stringify(allIds));
    } catch {}

    fetch("/api/user/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
      credentials: "same-origin",
    }).catch(() => {});

    toast.success("All notifications marked as read.");
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    fetch(`/api/user/notifications?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "same-origin",
    }).catch(() => {});
    toast.info("Notification removed.");
  };

  const handleActionClick = (item: AccountNotificationItem) => {
    markSingleAsRead(item.id);
    if (item.type === "purchase" && onSwitchTab) {
      onSwitchTab("purchases");
      return;
    }
    if (item.to) {
      if (item.to.includes("tab=purchases") && onSwitchTab) {
        onSwitchTab("purchases");
      } else if (item.to.includes("tab=statement") && onSwitchTab) {
        onSwitchTab("statement");
      } else {
        window.location.href = item.to;
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((item) => {
    if (filter === "unread" && item.read) return false;
    if (filter === "purchase" && item.type !== "purchase") return false;
    if (filter === "admin" && item.type !== "admin") return false;
    if (filter === "token" && item.type !== "token") return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getIcon = (type: AccountNotificationItem["type"]) => {
    switch (type) {
      case "purchase":
        return <ShoppingBag className="h-4 w-4 text-emerald-500" />;
      case "admin":
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case "token":
        return <TokenCoin type="bronze" size="xs" />;
      case "offer":
        return <Gift className="h-4 w-4 text-amber-500" />;
      case "tool":
        return <Wand2 className="h-4 w-4 text-orange-500" />;
      case "security":
        return <Shield className="h-4 w-4 text-emerald-500" />;
      case "update":
        return <Download className="h-4 w-4 text-blue-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-orange-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-xs">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                  User Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-orange-500 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Direct messages from Administrator, purchase order receipts, token alerts, and system notices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-xs"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-950"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filter === "unread"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-orange-600"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("admin")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filter === "admin"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-blue-600"
              }`}
            >
              Admin Messages
            </button>
            <button
              type="button"
              onClick={() => setFilter("purchase")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filter === "purchase"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-emerald-600"
              }`}
            >
              Purchase Slips
            </button>
            <button
              type="button"
              onClick={() => setFilter("token")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filter === "token"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-amber-600"
              }`}
            >
              Token Updates
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="h-9 w-full md:w-56 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400">
            <Bell className="h-6 w-6" />
          </div>
          <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">
            No notifications found
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You're all caught up! When administrator dispatches direct notices or when you purchase tokens, updates appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                !item.read
                  ? "border-orange-500/30 bg-orange-50/20 dark:bg-orange-950/10 shadow-xs ring-1 ring-orange-500/20"
                  : "border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs ${
                    item.type === "purchase"
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : item.type === "admin"
                      ? "border-blue-500/30 bg-blue-500/10"
                      : "border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800"
                  }`}
                >
                  {getIcon(item.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display text-sm font-extrabold text-slate-950 dark:text-white">
                      {item.title}
                    </h4>

                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          item.type === "purchase"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : item.type === "admin"
                            ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                    {item.description}
                  </p>

                  <span className="inline-block text-[10px] font-mono text-slate-400">
                    {item.timestamp}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:self-center shrink-0">
                {item.actionText && (
                  <button
                    type="button"
                    onClick={() => handleActionClick(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-3.5 py-1.5 text-xs shadow-xs cursor-pointer transition-all"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}

                {!item.read && (
                  <button
                    type="button"
                    onClick={() => markSingleAsRead(item.id)}
                    title="Mark as Read"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteNotification(item.id)}
                  title="Remove Notification"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 text-slate-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
