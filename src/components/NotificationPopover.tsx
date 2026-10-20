import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Check,
  CheckCheck,
  Sparkles,
  Gift,
  Wand2,
  Shield,
  Download,
  Coins,
  ArrowRight,
  X,
  ExternalLink,
  ShoppingBag,
  UserCheck,
} from "lucide-react";
import { TokenCoin } from "@/components/TokenCoins";
import { AuthUser } from "@/lib/auth-user";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "token" | "offer" | "tool" | "security" | "update" | "purchase" | "admin";
  to?: string;
  actionText?: string;
  badge?: string;
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-tokens-daily",
    title: "Daily Bronze Tokens Refreshed",
    description: "10 free daily Bronze Tokens are active in your account. Ready for background removal.",
    time: "Today",
    type: "token",
    to: "/account",
    actionText: "View Balance",
    badge: "Daily",
  },
  {
    id: "notif-festival-special",
    title: "Limited Time Token Offer Active",
    description: "Claim up to 60% festive bonus credits on Silver & Gold permanent packs.",
    time: "Active now",
    type: "offer",
    to: "/pricing",
    actionText: "View Offers",
    badge: "Sale",
  },
  {
    id: "notif-cutout-brush-live",
    title: "Cutout Brush Editor Released",
    description: "Try sub-pixel hair matting, fine transparent fabric refining, and edge restoration.",
    time: "New feature",
    type: "tool",
    to: "/tools/cutout-brush-editor",
    actionText: "Try Editor",
    badge: "New Tool",
  },
  {
    id: "notif-zero-tracking-guarantee",
    title: "Zero-Tracking Privacy Guarantee",
    description: "All uploaded images are processed entirely in memory with no data retention or tracking.",
    time: "Always active",
    type: "security",
    to: "/privacy",
    actionText: "Privacy Policy",
  },
  {
    id: "notif-desktop-offline-app",
    title: "Offline Desktop Apps Ready",
    description: "Download the native Windows & macOS offline background removal utility.",
    time: "v1.4",
    type: "update",
    to: "/download",
    actionText: "Download",
  },
];

const STORAGE_READ_NOTIFICATIONS_KEY = "bg_read_notifications_v1";

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [userNotifs, setUserNotifs] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_READ_NOTIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load user-specific notifications from server / database
  const loadUserNotifications = () => {
    const user = AuthUser.getCurrentUser();
    if (!user) {
      setUserNotifs([]);
      return;
    }
    fetch(`/api/user/notifications?userId=${encodeURIComponent(user.id)}`, {
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.notifications && Array.isArray(data.notifications)) {
          const mapped: AppNotification[] = data.notifications.map((n: any) => ({
            id: n.id,
            title: n.title,
            description: n.message,
            time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently",
            type: n.type || "admin",
            to: n.link || undefined,
            actionText: n.action_text || (n.type === "purchase" ? "View Slip" : undefined),
            badge: n.badge || undefined,
          }));
          setUserNotifs(mapped);
          // Mark already read if n.read === 1
          const readOnServer = data.notifications.filter((n: any) => n.read === 1).map((n: any) => n.id);
          if (readOnServer.length > 0) {
            setReadIds((prev) => Array.from(new Set([...prev, ...readOnServer])));
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadUserNotifications();
    const handleUpdate = () => loadUserNotifications();
    window.addEventListener(REALTIME_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const allNotifications = [...userNotifs, ...DEFAULT_NOTIFICATIONS];

  // Save read IDs to localStorage and notify server
  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(STORAGE_READ_NOTIFICATIONS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    fetch("/api/user/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      credentials: "same-origin",
    }).catch(() => {});
  };

  const markAllAsRead = () => {
    const allIds = allNotifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem(STORAGE_READ_NOTIFICATIONS_KEY, JSON.stringify(allIds));
    } catch {}
    const user = AuthUser.getCurrentUser();
    if (user) {
      fetch("/api/user/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
        credentials: "same-origin",
      }).catch(() => {});
    }
  };

  const unreadCount = allNotifications.filter((n) => !readIds.includes(n.id)).length;

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const displayedNotifications =
    filter === "unread"
      ? allNotifications.filter((n) => !readIds.includes(n.id))
      : allNotifications;

  const getNotificationIcon = (type: AppNotification["type"]) => {
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

  const handleNotificationClick = (item: AppNotification) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.to) {
      navigate({ to: item.to as any });
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="View notifications"
        aria-expanded={isOpen}
        title="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card text-foreground hover:bg-muted hover:border-foreground/30 transition-all cursor-pointer shadow-2xs group"
      >
        <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-orange-500 text-white font-mono text-[9px] font-black shadow-xs ring-2 ring-background animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Elevated Notification Popover Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications Panel"
          className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] max-w-[calc(100vw-24px)] rounded-3xl border border-border/80 bg-card/98 backdrop-blur-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 ease-out space-y-3 text-foreground"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold text-foreground">Notifications</span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 font-mono text-[10px] font-bold px-2 py-0.5">
                  {unreadCount} new
                </span>
              ) : (
                <span className="rounded-full bg-muted text-muted-foreground font-mono text-[10px] font-medium px-2 py-0.5">
                  All caught up
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-muted/50 rounded-xl">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({DEFAULT_NOTIFICATIONS.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filter === "unread"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1 divide-y divide-border/40">
            {displayedNotifications.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <Check className="h-6 w-6 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-foreground">No unread notifications</p>
                <p className="text-[11px] text-muted-foreground">You are all caught up on latest updates!</p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const isRead = readIds.includes(notif.id);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`pt-2.5 pb-2 px-2.5 rounded-2xl flex items-start gap-3 transition-colors cursor-pointer group ${
                      !isRead
                        ? "bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/20"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/80 border border-border/60">
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {notif.title}
                          </p>
                          {!isRead && (
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                          {notif.time}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                        {notif.description}
                      </p>

                      {notif.actionText && (
                        <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 group-hover:underline">
                          <span>{notif.actionText}</span>
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-mono text-[10px]">Real-time system updates</span>
            <Link
              to="/pricing"
              onClick={() => setIsOpen(false)}
              className="text-orange-600 dark:text-orange-400 font-bold hover:underline"
            >
              Top Up Tokens →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
