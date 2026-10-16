import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  RotateCw,
  Trash2,
  Shield,
  ShieldAlert,
  Zap,
  Play,
  Terminal,
  Activity,
  AlertTriangle,
  Info,
  Clock,
  Globe,
  UploadCloud,
  Loader2,
  ExternalLink,
  ChevronRight,
  Code,
  Lock,
} from "lucide-react";
import { SafeApiKey } from "@/lib/db/api-keys-repo";

interface ApiUsageStats {
  totalCalls: number;
  totalCredits: number;
  successRate: number;
  dailyBreakdown: Array<{ date: string; calls: number; credits: number; errors: number }>;
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<SafeApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<ApiUsageStats | null>(null);

  // Creation modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyType, setNewKeyType] = useState<"live" | "test">("live");
  const [newKeyScope, setNewKeyScope] = useState<string>("*");
  const [newKeyIpAllowlist, setNewKeyIpAllowlist] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Copy-once secret modal state
  const [revealedKey, setRevealedKey] = useState<{ rawKey: string; key: SafeApiKey } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Test Console state
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("/api/v1/remove-background");
  const [selectedModel, setSelectedModel] = useState<string>("ganga");
  const [testImageUrl, setTestImageUrl] = useState<string>("https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80");
  const [testFile, setTestFile] = useState<File | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/user/api-keys");
      const data = await res.json();
      if (data.success && Array.isArray(data.keys)) {
        setKeys(data.keys);
        if (data.keys.length > 0 && !selectedKeyId) {
          const active = data.keys.find((k: SafeApiKey) => k.status === "active");
          if (active) setSelectedKeyId(active.id);
        }
      }
    } catch {
      // Failed to load keys
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await fetch("/api/v1/usage?limit=10&days=14");
      const data = await res.json();
      if (data.success && data.summary) {
        setUsageStats(data.summary);
      }
    } catch {}
  };

  useEffect(() => {
    fetchKeys();
    fetchUsage();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for this API key.");
      return;
    }

    setIsSubmitting(true);
    try {
      const ips = newKeyIpAllowlist
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          keyType: newKeyType,
          scopes: newKeyScope === "*" ? ["*"] : [newKeyScope],
          ipAllowlist: ips.length > 0 ? ips : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.rawKey) {
        setRevealedKey({ rawKey: data.rawKey, key: data.key });
        setIsCreateOpen(false);
        setNewKeyName("");
        setNewKeyIpAllowlist("");
        toast.success("API key generated successfully!");
        fetchKeys();
      } else {
        toast.error(data.error || "Failed to create API key.");
      }
    } catch {
      toast.error("Failed to connect to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? Any applications using this key will immediately be blocked.")) {
      return;
    }

    try {
      const res = await fetch("/api/user/api-keys/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("API key revoked.");
        fetchKeys();
      } else {
        toast.error(data.error || "Failed to revoke key.");
      }
    } catch {
      toast.error("Network error.");
    }
  };

  const handleRotate = async (keyId: string) => {
    if (!confirm("Rotate this API key? This will revoke the existing key and generate a new secret immediately.")) {
      return;
    }

    try {
      const res = await fetch("/api/user/api-keys/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      const data = await res.json();
      if (data.success && data.rawKey) {
        setRevealedKey({ rawKey: data.rawKey, key: data.key });
        toast.success("API key rotated successfully!");
        fetchKeys();
      } else {
        toast.error(data.error || "Failed to rotate key.");
      }
    } catch {
      toast.error("Network error.");
    }
  };

  const handleCopySecret = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setHasCopied(true);
    toast.success("API key copied to clipboard!");
    setTimeout(() => setHasCopied(false), 2500);
  };

  const runTestCall = async () => {
    if (!revealedKey && !selectedKeyId) {
      toast.error("Please create an API key first or enter a test key.");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const startTime = performance.now();
    try {
      const headers: Record<string, string> = {};
      let body: any;

      // Prefer the newly created raw key if available, otherwise test sandbox header
      const authHeader = revealedKey ? `Bearer ${revealedKey.rawKey}` : "";
      if (authHeader) headers["Authorization"] = authHeader;

      if (testFile) {
        const formData = new FormData();
        formData.append("image", testFile);
        formData.append("model", selectedModel);
        formData.append("response_format", "json");
        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
          image_url: testImageUrl,
          model: selectedModel,
          response_format: "json",
        });
      }

      const res = await fetch(selectedEndpoint, {
        method: "POST",
        headers,
        body,
      });

      const elapsed = Math.round(performance.now() - startTime);
      const json = await res.json().catch(() => null);

      setTestResult({
        status: res.status,
        statusText: res.statusText,
        elapsedMs: elapsed,
        headers: {
          "x-request-id": res.headers.get("x-request-id"),
          "x-credits-used": res.headers.get("x-credits-used"),
          "x-credits-remaining": res.headers.get("x-credits-remaining"),
          "x-ratelimit-remaining": res.headers.get("x-ratelimit-remaining"),
          "content-type": res.headers.get("content-type"),
        },
        body: json,
      });

      if (res.ok) {
        toast.success(`API Call succeeded (${elapsed}ms)`);
      } else {
        toast.error(`API returned HTTP ${res.status}: ${json?.error?.message || "Failed"}`);
      }
    } catch (err: any) {
      setTestResult({
        status: 0,
        statusText: "Client Network Error",
        elapsedMs: 0,
        headers: {},
        body: { error: { message: err?.message || "Failed to make request" } },
      });
      toast.error("Test call failed.");
    } finally {
      setIsTesting(false);
    }
  };

  const activeKeysCount = keys.filter((k) => k.status === "active").length;

  return (
    <div className="space-y-6">
      {/* ── Header Summary Card ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 px-3 py-1 text-xs font-black text-orange-600 dark:text-orange-400">
              <Terminal className="h-3.5 w-3.5" />
              <span>Developer REST API v1</span>
            </div>
            <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              API Keys & Integrations
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xl">
              Integrate background removal, watermark erasing, and face anonymization directly into your SaaS, iOS, Android, or desktop applications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/docs/api"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <Code className="h-3.5 w-3.5 text-slate-400" />
              <span>Read API Docs</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Link>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              disabled={activeKeysCount >= 5}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Key</span>
            </button>
          </div>
        </div>

        {/* ── Stats Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800">
          <div className="rounded-xl bg-slate-50 dark:bg-zinc-800/50 p-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Keys</div>
            <div className="font-mono text-xl font-black text-slate-900 dark:text-white mt-1">
              {activeKeysCount} <span className="text-xs text-slate-400 font-normal">/ 5 max</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-zinc-800/50 p-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rate Limit</div>
            <div className="font-mono text-xl font-black text-slate-900 dark:text-white mt-1">
              60 <span className="text-xs text-slate-400 font-normal">req/min</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-zinc-800/50 p-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Calls (14d)</div>
            <div className="font-mono text-xl font-black text-orange-600 dark:text-orange-400 mt-1">
              {usageStats?.totalCalls ?? 0}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-zinc-800/50 p-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Success Rate</div>
            <div className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {usageStats ? `${usageStats.successRate}%` : "100%"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Key List Table ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-orange-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Secret Keys</h3>
          </div>
          <span className="text-xs text-slate-400">Tokens are deducted per processed image</span>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center text-slate-400 text-xs">
            <Loader2 className="h-5 w-5 animate-spin mr-2 text-orange-500" />
            <span>Loading API keys...</span>
          </div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <KeyRound className="h-10 w-10 text-slate-300 dark:text-zinc-700 mx-auto" />
            <div className="text-sm font-bold text-slate-700 dark:text-zinc-300">No API keys created yet</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create your first live or sandbox API key to start calling background removal and conversion tools.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 text-white px-4 py-2 text-xs font-bold hover:bg-orange-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Generate API Key</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-mono text-[11px] uppercase border-b border-slate-100 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-6">Name & Type</th>
                  <th className="py-3 px-4">Key Prefix</th>
                  <th className="py-3 px-4">Scopes</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Last Used</th>
                  <th className="py-3 px-4">Calls</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{k.name}</span>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase ${
                            k.keyType === "test"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                          }`}
                        >
                          {k.keyType}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-zinc-300 font-bold">
                      {k.keyPrefix}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {k.scopes.includes("*") ? "All Tools (*)" : k.scopes.join(", ")}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(k.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Never"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-zinc-300">
                      {k.totalCalls ?? 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          k.status === "active"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${k.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        {k.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {k.status === "active" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRotate(k.id)}
                            title="Rotate Key"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-orange-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevoke(k.id)}
                            title="Revoke Key"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Interactive Test Console & Playground ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-orange-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">API Test Console</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Execute live requests directly in browser</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Endpoint</label>
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="/api/v1/remove-background">POST /api/v1/remove-background (1 credit)</option>
              <option value="/api/v1/remove-watermark">POST /api/v1/remove-watermark (1 credit)</option>
              <option value="/api/v1/blur-face">POST /api/v1/blur-face (1 credit)</option>
              <option value="/api/v1/detect-faces">POST /api/v1/detect-faces (0.5 credit)</option>
              <option value="/api/v1/compress-image">POST /api/v1/compress-image (0.25 credit)</option>
              <option value="/api/v1/convert-image">POST /api/v1/convert-image (0.25 credit)</option>
              <option value="/api/v1/resize-image">POST /api/v1/resize-image (0.25 credit)</option>
              <option value="/api/v1/crop-image">POST /api/v1/crop-image (0.25 credit)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">AI Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ganga">Ganga 1.0 (Alpha Matting & Hair, Default)</option>
              <option value="karudi">Karudi 1.0 (Universal Master Orchestrator)</option>
              <option value="brahmaputra">Brahmaputra (Batch Image Engine)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Test Image URL (HTTPS)</label>
            <input
              type="url"
              value={testImageUrl}
              onChange={(e) => setTestImageUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400">
            {revealedKey ? (
              <span className="text-emerald-600 font-mono font-bold">Using freshly generated key: {revealedKey.key.keyPrefix}</span>
            ) : (
              <span>Testing through active user session token</span>
            )}
          </div>

          <button
            type="button"
            onClick={runTestCall}
            disabled={isTesting}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-orange-500 dark:hover:bg-orange-600 text-white px-5 py-2 text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            <span>{isTesting ? "Executing Request..." : "Send Test Call"}</span>
          </button>
        </div>

        {/* ── Test Output Viewer ── */}
        {testResult && (
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-950 p-4 text-xs font-mono text-zinc-300 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    testResult.status >= 200 && testResult.status < 300
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-rose-950 text-rose-400 border border-rose-800"
                  }`}
                >
                  HTTP {testResult.status} {testResult.statusText}
                </span>
                <span className="text-zinc-500">• {testResult.elapsedMs}ms</span>
              </div>
              <span className="text-[10px] text-zinc-500">ID: {testResult.headers?.["x-request-id"] || "req_test"}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-400">
              <div>Credits Used: <span className="text-white font-bold">{testResult.headers?.["x-credits-used"] || 0}</span></div>
              <div>Remaining: <span className="text-white font-bold">{testResult.headers?.["x-credits-remaining"] || "N/A"}</span></div>
              <div>Model: <span className="text-orange-400 font-bold">{testResult.headers?.["x-model-used"] || testResult.body?.model || selectedModel}</span></div>
              <div>Rate Limit Left: <span className="text-white font-bold">{testResult.headers?.["x-ratelimit-remaining"] || "OK"}</span></div>
            </div>

            {testResult.body?.image && (
              <div className="pt-2 border-t border-zinc-800 flex items-center gap-4">
                <img
                  src={testResult.body.image}
                  alt="Processed Output"
                  className="h-24 w-24 object-contain rounded-lg border border-zinc-800 bg-zinc-900 checkerboard-bg"
                />
                <div className="space-y-1 text-xs">
                  <div className="text-emerald-400 font-bold">Processed image returned!</div>
                  <div className="text-zinc-400">Format: {testResult.body.format} • Size: {Math.round((testResult.body.file_size_bytes || 0) / 1024)} KB</div>
                  <a
                    href={testResult.body.image}
                    download={`api_output.${testResult.body.format || "png"}`}
                    className="inline-flex items-center gap-1 text-orange-400 hover:underline pt-1"
                  >
                    Download Output Image →
                  </a>
                </div>
              </div>
            )}

            <pre className="overflow-x-auto text-[11px] text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg max-h-48">
              {JSON.stringify(testResult.body, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* ── Modal: Create API Key ── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="space-y-1">
              <h3 className="font-display text-lg font-black text-slate-900 dark:text-white">
                Create New API Secret Key
              </h3>
              <p className="text-xs text-slate-500">
                Generate an authentication key to make calls from your code.
              </p>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Web App, Mobile App"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Environment</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewKeyType("live")}
                    className={`rounded-xl border p-2.5 text-left text-xs transition-colors cursor-pointer ${
                      newKeyType === "live"
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-bold"
                        : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400"
                    }`}
                  >
                    <div className="font-bold">Live Key</div>
                    <div className="text-[10px] text-slate-400">Deducts credits, production SLAs</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewKeyType("test")}
                    className={`rounded-xl border p-2.5 text-left text-xs transition-colors cursor-pointer ${
                      newKeyType === "test"
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-bold"
                        : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400"
                    }`}
                  >
                    <div className="font-bold">Sandbox (Test)</div>
                    <div className="text-[10px] text-slate-400">Zero cost, development testing</div>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Permission Scope</label>
                <select
                  value={newKeyScope}
                  onChange={(e) => setNewKeyScope(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="*">All Tools (Full Access)</option>
                  <option value="remove-bg">Remove Background Only</option>
                  <option value="remove-watermark">Remove Watermark Only</option>
                  <option value="blur-face">Face Blur Only</option>
                  <option value="convert-image">Format Converters Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  IP Allowlist <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.10, 203.0.113.0/24"
                  value={newKeyIpAllowlist}
                  onChange={(e) => setNewKeyIpAllowlist(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[10px] text-slate-400">Leave blank to allow calls from any server IP address.</p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-zinc-800 px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-2 text-xs font-extrabold transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Generating..." : "Generate Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Copy-Once Secret Key Reveal ── */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-orange-500/40 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-500">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-black text-slate-900 dark:text-white">
                  Save Your Secret API Key
                </h3>
                <p className="text-xs text-slate-500">
                  Key created: <span className="font-bold">{revealedKey.key.name}</span> ({revealedKey.key.keyType} mode)
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/20 p-3.5 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                <strong>Important:</strong> For your security, this key will <strong>never be shown again</strong>. Please copy and store it securely in your server environment variables or secret manager.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Secret API Key</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={revealedKey.rawKey}
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-950 px-3.5 py-3 pr-24 font-mono text-xs font-bold text-slate-900 dark:text-white select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopySecret(revealedKey.rawKey)}
                  className="absolute right-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {hasCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{hasCopied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setRevealedKey(null)}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-slate-900 px-5 py-2.5 text-xs font-bold transition-colors cursor-pointer"
              >
                I have saved my key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
