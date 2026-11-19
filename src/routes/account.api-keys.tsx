import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ApiKeysManager } from "@/components/account/ApiKeysManager";
import { AuthUser, type CurrentUser } from "@/lib/auth-user";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { TokenCoin } from "@/components/TokenCoins";
import { toast } from "sonner";
import {
  ChevronLeft,
  KeyRound,
  Lock,
  ArrowRight,
  BookOpen,
  Plus,
  User,
  Code2,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/account/api-keys")({
  head: () => ({
    meta: [
      { title: "API Keys & Developer Console | bg.tools" },
      {
        name: "description",
        content:
          "Manage your bg.tools REST API keys, monitor quotas, and run live requests in the interactive developer console.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ApiKeysConsolePage,
});

const QUICKSTART_SNIPPETS: Record<"curl" | "node" | "python", string> = {
  curl: `curl -X POST https://bg.tools/api/v1/remove-background \\
  -H "Authorization: Bearer bgt_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600",
    "model": "ganga",
    "format": "png"
  }'`,
  node: `const res = await fetch("https://bg.tools/api/v1/remove-background", {
  method: "POST",
  headers: {
    "Authorization": "Bearer bgt_live_YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600",
    model: "ganga",
    format: "png",
  }),
});
const data = await res.json();
console.log(data.image);`,
  python: `import requests

res = requests.post(
    "https://bg.tools/api/v1/remove-background",
    headers={"Authorization": "Bearer bgt_live_YOUR_API_KEY"},
    json={
        "image_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600",
        "model": "ganga",
        "format": "png",
    },
)
print(res.json()["image"])`,
};

function ApiKeysConsolePage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => AuthUser.getCurrentUser());
  const [snippetLang, setSnippetLang] = useState<"curl" | "node" | "python">("curl");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(AuthUser.getCurrentUser());
    };
    window.addEventListener("bg:credit_updated", syncUser);
    window.addEventListener(REALTIME_EVENT_NAME, syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("bg:credit_updated", syncUser);
      window.removeEventListener(REALTIME_EVENT_NAME, syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(QUICKSTART_SNIPPETS[snippetLang]);
    setCopiedSnippet(true);
    toast.success("Code snippet copied to clipboard.");
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

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
              <h1 className="font-display text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                Sign In to Access API Console
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                Please log in to create secret REST API keys, inspect rate limits, and test live endpoints.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                search={{ redirect: "/account/api-keys" } as any}
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

  const totalTokens = (currentUser.freeCredits ?? 0) + (currentUser.paidCredits ?? 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-foreground flex flex-col justify-between selection:bg-orange-500/20 font-sans">
      <SiteHeader />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Developer Console Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-orange-600 hover:border-orange-500/40 shadow-xs transition-colors"
              title="Back to Home"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase">
                <span>WORKSPACE</span>
                <span>/</span>
                <span className="text-orange-600 dark:text-orange-500 font-extrabold">API KEYS & CONSOLE</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <KeyRound className="h-4 w-4 text-orange-500" />
                <h1 className="font-display text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Developer API Keys &amp; Console
                </h1>
                <span className="rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[10px] font-mono font-extrabold text-orange-600 dark:text-orange-400 uppercase">
                  REST v1
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-bold shadow-xs">
              <TokenCoin type="gold" size="xs" />
              <span className="text-slate-500 dark:text-zinc-400">Available:</span>
              <span className="font-mono font-black text-slate-900 dark:text-white">{totalTokens} tokens</span>
            </div>

            <Link
              to="/docs/api"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-xs transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5 text-slate-500" />
              <span>API Docs</span>
            </Link>

            <Link
              to="/account"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-xs transition-colors"
            >
              <User className="h-3.5 w-3.5 text-slate-500" />
              <span>Profile</span>
            </Link>

            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-xs font-extrabold transition-all shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Buy Tokens</span>
            </Link>
          </div>
        </div>

        {/* Dedicated API Keys & Interactive Console Workspace */}
        <ApiKeysManager />

        {/* Quick-Start Integration Examples */}
        <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-orange-500" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Quick-Start Integration
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-1">
                {(["curl", "node", "python"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSnippetLang(lang)}
                    className={`rounded-lg px-3 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                      snippetLang === lang
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950"
                        : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {lang === "curl" ? "cURL" : lang === "node" ? "Node.js" : "Python"}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopySnippet}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                {copiedSnippet ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSnippet ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          <pre className="rounded-xl bg-slate-950 text-zinc-200 p-4 text-xs font-mono overflow-x-auto leading-relaxed border border-zinc-800">
            {QUICKSTART_SNIPPETS[snippetLang]}
          </pre>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-400 pt-1">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Enterprise-grade security &amp; privacy · Keys are hashed at rest and never logged in plaintext</span>
            </span>
            <Link to="/docs/api" className="font-bold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1">
              <span>Explore full endpoint reference</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
