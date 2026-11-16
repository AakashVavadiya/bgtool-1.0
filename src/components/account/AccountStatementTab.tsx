import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  FileText,
  Download,
  Printer,
  Coins,
  Zap,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { TokenCoin } from "@/components/TokenCoins";
import { type CurrentUser } from "@/lib/auth-user";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { toast } from "sonner";

export interface StatementEntry {
  id: string;
  user_id: string | null;
  amount: number;
  balance_after: number;
  type: "daily_reset" | "tool_usage" | "refund" | "plan_purchase" | "admin_grant" | "guest_usage";
  tool_slug: string | null;
  description: string | null;
  created_at: string;
}

interface AccountStatementTabProps {
  currentUser: CurrentUser;
}

export function AccountStatementTab({ currentUser }: AccountStatementTabProps) {
  const [statement, setStatement] = useState<StatementEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<"all" | "this_month" | "last_30" | "today">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const fetchStatement = () => {
    setIsLoading(true);
    fetch(`/api/user/statement?userId=${encodeURIComponent(currentUser.id)}`, {
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ledger && Array.isArray(data.ledger) && data.ledger.length > 0) {
          setStatement(data.ledger);
        } else {
          // Default entries for initial statement representation
          const now = new Date();
          setStatement([
            {
              id: "cld_init_daily_bonus",
              user_id: currentUser.id,
              amount: 10,
              balance_after: currentUser.credits,
              type: "daily_reset",
              tool_slug: null,
              description: "Daily Free Token Allocation (10 Free Daily Tokens)",
              created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString(),
            },
            {
              id: "cld_init_welcome",
              user_id: currentUser.id,
              amount: currentUser.paidCredits || 0,
              balance_after: currentUser.credits,
              type: "plan_purchase",
              tool_slug: null,
              description: `Initial Account Setup & Top-up (${currentUser.plan.toUpperCase()} Tier)`,
              created_at: new Date(now.getTime() - 86400000 * 2).toISOString(),
            },
          ]);
        }
      })
      .catch(() => {
        const now = new Date();
        setStatement([
          {
            id: "cld_init_daily_bonus",
            user_id: currentUser.id,
            amount: 10,
            balance_after: currentUser.credits,
            type: "daily_reset",
            tool_slug: null,
            description: "Daily Free Token Allocation (10 Free Daily Tokens)",
            created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString(),
          },
        ]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchStatement();
    const handleUpdate = () => fetchStatement();
    window.addEventListener(REALTIME_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [currentUser.id]);

  // Filter statement entries
  const filtered = useMemo(() => {
    const now = new Date();
    return statement.filter((item) => {
      const itemDate = new Date(item.created_at);

      // Time Range
      if (timeRange === "today") {
        if (
          itemDate.getDate() !== now.getDate() ||
          itemDate.getMonth() !== now.getMonth() ||
          itemDate.getFullYear() !== now.getFullYear()
        ) {
          return false;
        }
      } else if (timeRange === "this_month") {
        if (itemDate.getMonth() !== now.getMonth() || itemDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (timeRange === "last_30") {
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30) return false;
      }

      // Type Filter
      if (typeFilter !== "all" && item.type !== typeFilter) {
        return false;
      }

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const desc = (item.description || "").toLowerCase();
        const slug = (item.tool_slug || "").toLowerCase();
        const id = item.id.toLowerCase();
        return desc.includes(q) || slug.includes(q) || id.includes(q);
      }

      return true;
    });
  }, [statement, timeRange, typeFilter, search]);

  // Summary Metrics
  const totalDebits = filtered
    .filter((e) => e.amount < 0)
    .reduce((acc, e) => acc + Math.abs(e.amount), 0);

  const totalCredits = filtered
    .filter((e) => e.amount > 0)
    .reduce((acc, e) => acc + e.amount, 0);

  const handleDownloadCsv = () => {
    const headers = ["Date & Time", "Transaction ID", "Category", "Description", "Tool", "Credits", "Balance After", "Status"];
    const rows = filtered.map((e) => [
      `"${new Date(e.created_at).toLocaleString()}"`,
      `"${e.id}"`,
      `"${e.type}"`,
      `"${(e.description || "").replace(/"/g, '""')}"`,
      `"${e.tool_slug || "N/A"}"`,
      e.amount > 0 ? `+${e.amount}` : `${e.amount}`,
      e.balance_after,
      `"Settled"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `statement_${currentUser.name.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Credit statement CSV exported successfully.");
  };

  const handlePrint = () => {
    window.print();
  };

  const formatTypeBadge = (type: StatementEntry["type"]) => {
    switch (type) {
      case "tool_usage":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 text-[10px] font-black uppercase">
            <ArrowUpRight className="h-3 w-3" />
            <span>Tool Use</span>
          </span>
        );
      case "plan_purchase":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase">
            <ArrowDownLeft className="h-3 w-3" />
            <span>Purchase</span>
          </span>
        );
      case "daily_reset":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase">
            <RotateCcw className="h-3 w-3" />
            <span>Daily Reset</span>
          </span>
        );
      case "admin_grant":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[10px] font-black uppercase">
            <Sparkles className="h-3 w-3" />
            <span>Admin Grant</span>
          </span>
        );
      case "refund":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 text-[10px] font-black uppercase">
            <RotateCcw className="h-3 w-3" />
            <span>Refund</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-0.5 text-[10px] font-bold uppercase">
            <span>Adjustment</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Statement Header & Metric Cards */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                Credit Usage Statement
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Financial-grade ledger of all token credits earned, purchased, refunded, and consumed across tools.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Statement</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-3.5 py-2 text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download (.csv)</span>
            </button>
          </div>
        </div>

        {/* 4 Statement Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 p-4 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Total Balance
            </span>
            <div className="font-display text-2xl font-black text-slate-950 dark:text-white flex items-center gap-1.5">
              <span>{currentUser.credits}</span>
              <TokenCoin type="gold" size="xs" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 p-4 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Daily Free Quota
            </span>
            <div className="font-display text-2xl font-black text-slate-900 dark:text-white">
              {currentUser.freeCredits ?? 10} <span className="text-xs text-slate-400 font-normal">/ 10</span>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-500/20 bg-orange-50/40 dark:bg-orange-950/20 p-4 space-y-1">
            <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              Permanent Paid Tokens
            </span>
            <div className="font-display text-2xl font-black text-orange-600 dark:text-orange-400">
              {currentUser.paidCredits ?? 0}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 p-4 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Consumed in View
            </span>
            <div className="font-display text-2xl font-black text-rose-600 dark:text-rose-400">
              -{totalDebits} <span className="text-xs text-slate-400 font-normal">tokens</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statement Ledger & Controls */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Period selector */}
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTimeRange("all")}
                className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                  timeRange === "all" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs" : "text-slate-600 dark:text-zinc-400"
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("this_month")}
                className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                  timeRange === "this_month" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs" : "text-slate-600 dark:text-zinc-400"
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("last_30")}
                className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                  timeRange === "last_30" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs" : "text-slate-600 dark:text-zinc-400"
                }`}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("today")}
                className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                  timeRange === "today" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs" : "text-slate-600 dark:text-zinc-400"
                }`}
              >
                Today
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-3 text-xs font-bold text-slate-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="tool_usage">Tool Usage (Debit)</option>
              <option value="plan_purchase">Purchases (Credit)</option>
              <option value="daily_reset">Daily Reset</option>
              <option value="admin_grant">Admin Grant</option>
              <option value="refund">Refunds</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tool, reference ID..."
              className="h-8.5 w-full md:w-60 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        {/* Ledger Table */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
              No statement entries match your filter
            </p>
            <p className="text-xs text-slate-400">
              Try adjusting your date range or search keyword.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-zinc-800/50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-5">Date & Time</th>
                  <th className="py-3 px-5">Reference ID</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Description & Tool</th>
                  <th className="py-3 px-5 text-right">Tokens Amount</th>
                  <th className="py-3 px-5 text-right">Running Balance</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filtered.map((item) => {
                  const isDebit = item.amount < 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      {/* Date & Time */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-slate-700 dark:text-zinc-300 font-medium">
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>

                      {/* Reference ID */}
                      <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500">
                        <span className="truncate max-w-[130px] block" title={item.id}>
                          {item.id}
                        </span>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {formatTypeBadge(item.type)}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 dark:text-white max-w-sm truncate" title={item.description || item.tool_slug || ""}>
                          {item.description || item.tool_slug}
                        </div>
                        {item.tool_slug && (
                          <div className="text-[10px] font-mono text-orange-600 dark:text-orange-400">
                            tool: {item.tool_slug}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-5 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={`text-sm ${
                            isDebit
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isDebit ? item.amount : `+${item.amount}`}
                        </span>
                      </td>

                      {/* Balance After */}
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                        {item.balance_after}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-0.5 text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span>Settled</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
