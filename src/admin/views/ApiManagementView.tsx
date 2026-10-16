import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Terminal,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Power,
  RotateCw,
  Search,
  Filter,
  Check,
  AlertTriangle,
  Clock,
  ExternalLink,
  Loader2,
  Trash2,
  Ban,
  Activity,
  Zap,
} from "lucide-react";
import { SafeApiKey, ApiKeyEvent } from "@/lib/db/api-keys-repo";

interface AdminApiData {
  stats: {
    totalKeys: number;
    activeKeys: number;
    totalCallsToday: number;
    totalCreditsToday: number;
    errorRateToday: number;
    globalEnabled: boolean;
  };
  keys: Array<SafeApiKey & { userEmail: string; userName: string }>;
  auditLog: ApiKeyEvent[];
}

export function ApiManagementView() {
  const [data, setData] = useState<AdminApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isTogglingKillSwitch, setIsTogglingKillSwitch] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/api-management");
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        toast.error("Failed to load API management data");
      }
    } catch {
      toast.error("Network error connecting to admin API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleKillSwitch = async () => {
    if (!data) return;
    const newStatus = !data.stats.globalEnabled;
    const confirmMsg = newStatus
      ? "Enable the Public API Gateway? External traffic will be resumed."
      : "EMERGENCY: Disable the Public API Gateway? All external API calls will immediately receive HTTP 503.";

    if (!confirm(confirmMsg)) return;

    setIsTogglingKillSwitch(true);
    try {
      const res = await fetch("/api/admin/api-management/kill-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(newStatus ? "API Gateway resumed" : "API Gateway killed (all traffic blocked)");
        fetchData();
      } else {
        toast.error("Failed to update kill-switch");
      }
    } catch {
      toast.error("Network failure");
    } finally {
      setIsTogglingKillSwitch(false);
    }
  };

  const handleUpdateStatus = async (keyId: string, status: "active" | "suspended" | "revoked") => {
    try {
      const res = await fetch("/api/admin/api-management/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId, status }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Key status updated to ${status}`);
        fetchData();
      } else {
        toast.error("Failed to update key status");
      }
    } catch {
      toast.error("Network failure");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground text-xs font-mono">
        <Loader2 className="h-6 w-6 animate-spin mr-2 text-accent" />
        <span>Loading API Gateway telemetry...</span>
      </div>
    );
  }

  const filteredKeys = (data?.keys || []).filter((k) => {
    const matchesSearch =
      k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.keyPrefix.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" ? true : k.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── Top Header & Emergency Kill-Switch ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Public REST API Gateway
            </h1>
            <span className="rounded-lg bg-accent/10 border border-accent/25 px-2 py-0.5 font-mono text-[11px] font-extrabold uppercase text-accent">
              v1.0
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Global API management, cryptographic key audits, and real-time inference telemetry.
          </p>
        </div>

        {/* Global Kill Switch Button */}
        <button
          type="button"
          onClick={handleToggleKillSwitch}
          disabled={isTogglingKillSwitch}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all shadow-md cursor-pointer ${
            data?.stats.globalEnabled
              ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
              : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
          }`}
        >
          <Power className="h-4 w-4" />
          <span>
            {data?.stats.globalEnabled ? "Emergency API Kill-Switch" : "Resume API Traffic"}
          </span>
        </button>
      </div>

      {/* ── System Status Banner ── */}
      {!data?.stats.globalEnabled && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-bold">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5" />
            <span>GLOBAL API GATEWAY IS CURRENTLY DISABLED. ALL CALLS RETURN HTTP 503.</span>
          </div>
          <button
            type="button"
            onClick={handleToggleKillSwitch}
            className="underline hover:text-rose-700 font-black cursor-pointer"
          >
            Re-enable Gateway
          </button>
        </div>
      )}

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Total API Keys</div>
          <div className="font-mono text-2xl font-black text-foreground">{data?.stats.totalKeys ?? 0}</div>
          <div className="text-[10px] text-muted-foreground">{data?.stats.activeKeys ?? 0} currently active</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Calls Today</div>
          <div className="font-mono text-2xl font-black text-accent">{data?.stats.totalCallsToday ?? 0}</div>
          <div className="text-[10px] text-muted-foreground">Across all registered keys</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Credits Billed Today</div>
          <div className="font-mono text-2xl font-black text-foreground">{data?.stats.totalCreditsToday ?? 0}</div>
          <div className="text-[10px] text-muted-foreground">Debited via SQLite ledger</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Error Rate Today</div>
          <div className="font-mono text-2xl font-black text-emerald-500">{data?.stats.errorRateToday ?? 0}%</div>
          <div className="text-[10px] text-muted-foreground">Target &lt; 0.5%</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Gateway Status</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`h-2.5 w-2.5 rounded-full ${data?.stats.globalEnabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            <span className="font-mono text-sm font-black uppercase text-foreground">
              {data?.stats.globalEnabled ? "Operational" : "Paused"}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground">Cluster rate limiter active</div>
        </div>
      </div>

      {/* ── API Keys Table ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-accent" />
            <h2 className="font-bold text-sm text-foreground">Registered API Keys</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search user, key, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl border border-input bg-background/60 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-input bg-background/60 px-3 py-1.5 text-xs text-foreground focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="revoked">Revoked Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground font-mono text-[11px] uppercase border-b border-border">
              <tr>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Key Prefix</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Total Calls</th>
                <th className="py-2.5 px-3">Created</th>
                <th className="py-2.5 px-3">Last Used</th>
                <th className="py-2.5 px-3 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-muted-foreground">
                    No API keys match current search filter.
                  </td>
                </tr>
              ) : (
                filteredKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-muted/30 transition-colors font-mono">
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-bold text-foreground">{k.userName}</div>
                      <div className="text-[10px] text-muted-foreground">{k.userEmail}</div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-foreground">{k.keyPrefix}</td>
                    <td className="py-2.5 px-3">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase font-bold text-muted-foreground">
                        {k.keyType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          k.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : k.status === "suspended"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-foreground">{k.totalCalls ?? 0}</td>
                    <td className="py-2.5 px-3 text-[11px] text-muted-foreground font-sans">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-muted-foreground font-sans">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        {k.status === "active" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(k.id, "suspended")}
                            className="rounded-lg border border-border px-2 py-1 text-[11px] font-bold hover:bg-amber-500/10 hover:text-amber-600"
                          >
                            Suspend
                          </button>
                        )}
                        {k.status === "suspended" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(k.id, "active")}
                            className="rounded-lg border border-border px-2 py-1 text-[11px] font-bold hover:bg-emerald-500/10 hover:text-emerald-600"
                          >
                            Activate
                          </button>
                        )}
                        {k.status !== "revoked" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(k.id, "revoked")}
                            className="rounded-lg border border-border px-2 py-1 text-[11px] font-bold text-destructive hover:bg-destructive/10"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Audit Log ── */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" />
            <h2 className="font-bold text-sm text-foreground">API Security Audit Log</h2>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">Immutable SQLite audit events</span>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase border-b border-border sticky top-0">
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Key ID</th>
                <th className="py-2 px-3">User ID</th>
                <th className="py-2 px-3">IP Address</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[11px]">
              {(data?.auditLog || []).map((ev) => (
                <tr key={ev.id} className="hover:bg-muted/30">
                  <td className="py-2 px-3 text-muted-foreground">{new Date(ev.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-3 font-bold text-foreground uppercase">{ev.action}</td>
                  <td className="py-2 px-3 text-muted-foreground">{ev.keyId || "N/A"}</td>
                  <td className="py-2 px-3 text-muted-foreground">{ev.userId}</td>
                  <td className="py-2 px-3 text-muted-foreground">{ev.ip || "127.0.0.1"}</td>
                  <td className="py-2 px-3 text-muted-foreground max-w-xs truncate">{ev.metadata || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
