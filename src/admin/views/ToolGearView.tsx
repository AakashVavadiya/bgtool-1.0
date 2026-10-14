import { useState, useEffect, useMemo } from "react";
import { AdminStore, type ToolGearReport, type ToolExecutionStat } from "@/admin/lib/admin-store";
import { TOOL_CATEGORIES, type ToolCategory } from "@/lib/tools";
import {
  Cog,
  Cpu,
  Activity,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  Gauge,
  Clock,
  HardDrive,
  BarChart3,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type TimeframeOption = "1d" | "yesterday" | "7d" | "30d";

export function ToolGearView() {
  const [timeframe, setTimeframe] = useState<TimeframeOption>("1d");
  const [report, setReport] = useState<ToolGearReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | ToolCategory>("All");
  const [graphMode, setGraphMode] = useState<"volume" | "memory" | "topTools">("volume");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const loadData = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const data = await AdminStore.fetchToolGearReport(timeframe);
      if (data) {
        setReport(data);
        setLastRefreshedAt(new Date());
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [timeframe]);

  // Periodic auto-refresh every 6s when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh, timeframe]);

  // Filter per-tool stats
  const filteredTools = useMemo(() => {
    if (!report?.toolStats) return [];
    return report.toolStats.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "All" || t.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [report, search, categoryFilter]);

  // Max runs for bar width normalization
  const maxRuns = useMemo(() => {
    if (!report?.toolStats || report.toolStats.length === 0) return 1;
    return Math.max(...report.toolStats.map((t) => t.totalRuns), 1);
  }, [report]);

  // Data for Top Tools Bar Chart
  const topToolsChartData = useMemo(() => {
    if (!report?.toolStats) return [];
    return report.toolStats.slice(0, 8).map((t) => ({
      name: t.name.length > 16 ? t.name.slice(0, 15) + "…" : t.name,
      runs: t.totalRuns,
      memory: t.avgMemoryMb,
      latency: t.avgDurationMs,
    }));
  }, [report]);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 24) {
      const days = Math.floor(hrs / 24);
      return `${days}d ${hrs % 24}h`;
    }
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ─── Header & Timeframe Controls ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/20 shadow-xs">
              <Cog className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Tool Gear & Execution Analytics
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Accurate tool run counts, system memory telemetry, and latency performance reports.
              </p>
            </div>
          </div>
        </div>

        {/* Time Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Filter Buttons */}
          <div className="inline-flex rounded-2xl border border-border bg-card p-1 shadow-xs">
            {(
              [
                { id: "1d", label: "1 Day (Today)" },
                { id: "yesterday", label: "Yesterday" },
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30 Days" },
              ] as const
            ).map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  timeframe === tf.id
                    ? "bg-foreground text-background shadow-xs font-extrabold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
              autoRefresh
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
            title={autoRefresh ? "Auto-refresh active (every 6s)" : "Auto-refresh paused"}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span>{autoRefresh ? "Live (6s)" : "Paused"}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-muted transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── Top 4 KPI Metric Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Executions */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tool Runs Count
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="font-display text-3xl font-extrabold text-foreground">
              {report?.totalExecutions.toLocaleString() || "0"}
            </p>
            {report && report.totalExecutions > 0 ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {report.overallSuccessRate}% Success
              </span>
            ) : (
              <span className="text-xs font-bold text-muted-foreground">
                0 runs
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {report?.successfulExecutions || 0} passed • {report?.failedExecutions || 0} failed
          </p>
        </div>

        {/* 2. Active Tools Running */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Active Tools Used
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="font-display text-3xl font-extrabold text-foreground">
              {report?.activeToolsCount || 0}
            </p>
            <span className="text-xs font-mono text-muted-foreground">in selected period</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            Top: <strong className="text-foreground">{report?.toolStats[0]?.name || "None yet"}</strong>
          </p>
        </div>

        {/* 3. Average Speed / Latency */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Avg Processing Speed
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="font-display text-3xl font-extrabold text-foreground">
              {report?.avgLatencyMs || 0}
              <span className="text-sm font-normal text-muted-foreground">ms</span>
            </p>
            {report && report.totalExecutions > 0 ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {report.avgLatencyMs < 1000 ? "Ultra Fast" : `${report.avgLatencyMs}ms avg`}
              </span>
            ) : (
              <span className="text-xs font-bold text-muted-foreground">
                No runs yet
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Processed data: {formatBytes(report?.totalBytesProcessed || 0)}
          </p>
        </div>

        {/* 4. Memory Usage Diagnostics */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Server Memory (RAM)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="font-display text-3xl font-extrabold text-foreground">
              {report?.memory.heapUsedMb || 0}
              <span className="text-sm font-normal text-muted-foreground">MB</span>
            </p>
            <span
              className={`text-xs font-bold ${
                report?.memory.status === "Optimal"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : report?.memory.status === "Moderate"
                  ? "text-amber-500"
                  : "text-destructive"
              }`}
            >
              {report?.memory.status || "Optimal"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Physical RSS: {report?.memory.rssMb || 0} MB • Heap: {report?.memory.heapTotalMb || 0} MB
          </p>
        </div>
      </div>

      {/* ─── Memory Diagnostics & System Health Bar ────────────────────────────── */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-muted/20 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-foreground">
                Node.js V8 Process Memory & Engine Health
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time heap consumption and garbage collector telemetry under active AI/PDF load.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="rounded-2xl border border-border bg-background px-3 py-1.5 font-mono text-muted-foreground">
              Uptime: <strong className="text-foreground">{formatUptime(report?.memory.processUptimeSec || 0)}</strong>
            </div>
            <div
              className={`rounded-2xl border px-3 py-1.5 font-bold ${
                report?.memory.status === "Optimal"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : report?.memory.status === "Moderate"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              V8 Engine: {report?.memory.status || "Optimal"} ({report?.memory.heapUsagePercent || 0}% Heap)
            </div>
          </div>
        </div>

        {/* Multi-segmented RAM bar */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>Heap Used: {report?.memory.heapUsedMb || 0} MB</span>
            <span>Heap Allocated: {report?.memory.heapTotalMb || 0} MB</span>
            <span>Total Physical RSS: {report?.memory.rssMb || 0} MB</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
            <div
              style={{ width: `${Math.max(2, Math.min(100, report?.memory.heapUsagePercent || 2))}%` }}
              className={`h-full transition-all duration-700 ${
                report?.memory.status === "Critical"
                  ? "bg-destructive"
                  : report?.memory.status === "High"
                  ? "bg-rose-500"
                  : report?.memory.status === "Moderate"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              title="Active Heap Memory"
            />
            <div
              style={{
                width: `${Math.min(
                  25,
                  Math.round(
                    (((report?.memory.heapTotalMb || 60) - (report?.memory.heapUsedMb || 50)) /
                      Math.max(1, report?.memory.rssMb || 150)) *
                      100
                  )
                )}%`,
              }}
              className="h-full bg-blue-500/30 transition-all duration-700"
              title="Reserved Heap"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  report?.memory.status === "Critical"
                    ? "bg-destructive"
                    : report?.memory.status === "Moderate"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
              />
              <span>Active Heap ({report?.memory.heapUsedMb || 0} MB)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500/30" />
              <span>Reserved Heap Space</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <span>External C++ / Buffer Overhead ({report?.memory.externalMb || 0} MB)</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── Visual Graphs Section ────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              <h3 className="font-display text-lg font-bold text-foreground">
                Tool Execution & Performance Trends
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {timeframe === "1d"
                ? "Hourly execution distribution for Today (Last 24 Hours)"
                : timeframe === "yesterday"
                ? "Hourly performance recorded for Yesterday"
                : `Daily execution trends across the last ${timeframe === "7d" ? "7 days" : "30 days"}`}
            </p>
          </div>

          {/* Graph Mode Switcher */}
          <div className="inline-flex rounded-2xl border border-border bg-muted/40 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setGraphMode("volume")}
              className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                graphMode === "volume"
                  ? "bg-foreground text-background shadow-xs font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Execution Volume
            </button>
            <button
              type="button"
              onClick={() => setGraphMode("memory")}
              className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                graphMode === "memory"
                  ? "bg-foreground text-background shadow-xs font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Latency & Memory (MB)
            </button>
            <button
              type="button"
              onClick={() => setGraphMode("topTools")}
              className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                graphMode === "topTools"
                  ? "bg-foreground text-background shadow-xs font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Top Tools Compared
            </button>
          </div>
        </div>

        {/* Recharts Chart Area */}
        <div className="mt-6 h-[320px] w-full relative">
          {report?.totalExecutions === 0 && graphMode !== "memory" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/70 backdrop-blur-[1px] z-10 rounded-2xl border border-dashed border-border/80">
              <BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-bold text-foreground">Zero tool executions in this timeframe</p>
              <p className="text-xs text-muted-foreground mt-0.5">Real tool activity will appear automatically as tools are run.</p>
            </div>
          )}
          {graphMode === "volume" && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report?.timeSeries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="toolRunsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-2xl border border-border bg-card p-3 shadow-lg text-xs">
                          <p className="font-bold text-foreground">{label}</p>
                          <p className="text-accent mt-1">Runs: {payload[0]?.value}</p>
                          <p className="text-muted-foreground">
                            Pass: {payload[0]?.payload.successes} • Fail: {payload[0]?.payload.failures}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="runs"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#toolRunsGradient)"
                  name="Runs"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {graphMode === "memory" && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report?.timeSeries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-2xl border border-border bg-card p-3 shadow-lg text-xs">
                          <p className="font-bold text-foreground">{label}</p>
                          <p className="text-emerald-500 mt-1">Memory: {payload[0]?.value} MB</p>
                          <p className="text-amber-500">Latency: {payload[0]?.payload.avgDurationMs} ms</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="memoryMb"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#memoryGradient)"
                  name="Memory (MB)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {graphMode === "topTools" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topToolsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0]?.payload;
                      return (
                        <div className="rounded-2xl border border-border bg-card p-3 shadow-lg text-xs">
                          <p className="font-bold text-foreground">{d.name}</p>
                          <p className="text-accent mt-1 font-mono">Executions: {d.runs}</p>
                          <p className="text-muted-foreground font-mono">Avg Latency: {d.latency}ms</p>
                          <p className="text-emerald-500 font-mono">Avg Memory: {d.memory} MB</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="runs" fill="var(--accent)" radius={[8, 8, 0, 0]} name="Executions" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── Accurate Per-Tool Breakdown Table ─────────────────────────────────── */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-accent" />
              <h3 className="font-display text-lg font-bold text-foreground">
                Today's Tools Activity & Run Counts
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Exact execution frequency, success ratios, processing latency, and data throughput per tool.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tool name or slug..."
                className="h-9 w-48 sm:w-64 rounded-2xl border border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="h-9 rounded-2xl border border-border bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              <option value="All">All Categories</option>
              {TOOL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tools List Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Tool Name & Slug</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Runs Count</th>
                <th className="py-3 px-3">Success Rate</th>
                <th className="py-3 px-3">Avg Latency</th>
                <th className="py-3 px-3">Memory (RAM)</th>
                <th className="py-3 px-3">Total Processed</th>
                <th className="py-3 px-3 text-right">Last Run</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredTools.map((t) => {
                const barWidth = Math.round((t.totalRuns / maxRuns) * 100);
                return (
                  <tr key={t.slug} className="hover:bg-muted/40 transition-colors">
                    {/* Tool Name */}
                    <td className="py-3.5 px-3">
                      <div>
                        <span className="font-bold text-foreground text-xs">{t.name}</span>
                        <div className="font-mono text-[10px] text-muted-foreground">{t.slug}</div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {t.category}
                      </span>
                    </td>

                    {/* Runs Count with visual bar */}
                    <td className="py-3.5 px-3 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-extrabold text-foreground">{t.totalRuns} runs</span>
                          <span className="text-[10px] text-muted-foreground">{barWidth}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            style={{ width: `${barWidth}%` }}
                            className="h-full bg-accent rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    </td>

                    {/* Success Rate */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          t.successRate >= 98
                            ? "text-emerald-600 dark:text-emerald-400"
                            : t.successRate >= 90
                            ? "text-amber-500"
                            : "text-rose-500"
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{t.successRate}%</span>
                      </span>
                    </td>

                    {/* Latency */}
                    <td className="py-3.5 px-3 font-mono text-muted-foreground">
                      <span className="text-foreground font-bold">{t.avgDurationMs}ms</span>
                      <span className="text-[10px] opacity-70 block">max {t.maxDurationMs}ms</span>
                    </td>

                    {/* Memory */}
                    <td className="py-3.5 px-3 font-mono">
                      <span className="font-bold text-foreground">{t.avgMemoryMb} MB</span>
                      <span className="text-[10px] text-muted-foreground block">peak {t.peakMemoryMb} MB</span>
                    </td>

                    {/* Data Throughput */}
                    <td className="py-3.5 px-3 font-mono text-muted-foreground">
                      {formatBytes(t.totalFileBytes)}
                    </td>

                    {/* Last Run */}
                    <td className="py-3.5 px-3 text-right font-mono text-[11px] text-muted-foreground">
                      {new Date(t.lastExecutedAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}

              {filteredTools.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Cog className="h-6 w-6 text-muted-foreground/40 mb-1" />
                      <p className="font-bold text-foreground text-xs">
                        {search || categoryFilter !== "All"
                          ? "No tools match your filter criteria."
                          : "No tool runs recorded yet for this timeframe."}
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-sm">
                        {search || categoryFilter !== "All"
                          ? "Try clearing the search query or selecting a different category."
                          : "Runs will be tracked accurately in real time when visitors or tests execute processing tools."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Recent Execution Logs ────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              Recent Tool Execution Stream
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live chronological log of individual tool operations.
            </p>
          </div>
          <span className="rounded-full bg-accent/10 px-3 py-1 font-mono text-[11px] font-bold text-accent">
            Latest 50 Invocations
          </span>
        </div>

        <div className="mt-4 divide-y divide-border/40 max-h-[360px] overflow-y-auto pr-1">
          {report?.recentLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-muted/20 px-2 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    log.success ? "bg-emerald-500" : "bg-destructive"
                  }`}
                />
                <div>
                  <span className="font-bold text-foreground">{log.toolName}</span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-2">({log.toolSlug})</span>
                </div>
              </div>

              <div className="flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
                <span>{log.durationMs}ms</span>
                <span>{log.memoryMb} MB</span>
                <span>{formatBytes(log.fileSizeBytes)}</span>
                <span className="text-foreground font-semibold">
                  {new Date(log.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {(!report?.recentLogs || report.recentLogs.length === 0) && (
            <p className="py-6 text-center text-xs text-muted-foreground">No recent tool logs found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
