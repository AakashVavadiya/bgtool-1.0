import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Terminal,
  Zap,
  Shield,
  Code2,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Layers,
  Cpu,
  Lock,
  Flame,
  CheckCircle2,
  ExternalLink,
  Download,
  BookOpen,
  Server,
  FileCode,
  Gauge,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/api/")({
  head: () => ({
    meta: [
      { title: "Public REST API for Background Removal & Image AI | bg.tools" },
      {
        name: "description",
        content:
          "Integrate ultra-fast AI background removal, watermark erasing, face blur, and image optimization into your apps with the bg.tools developer REST API.",
      },
      { name: "keywords", content: "background removal api, remove bg api, image processing api, watermark remover api, face blur api" },
    ],
  }),
  component: ApiMarketingPage,
});

const CODE_EXAMPLES = {
  curl: `curl -X POST https://bg.tools/api/v1/remove-background \\
  -H "Authorization: Bearer bgt_live_YOUR_API_KEY" \\
  -F "image=@photo.jpg" \\
  -F "model=ganga" \\
  -F "response_format=binary" \\
  --output result.png`,

  python: `import requests

url = "https://bg.tools/api/v1/remove-background"
headers = {
    "Authorization": "Bearer bgt_live_YOUR_API_KEY"
}

with open("photo.jpg", "rb") as f:
    files = {"image": f}
    data = {"model": "ganga"}  # Choose 'ganga' (sub-pixel matting) or 'karudi' (universal)
    response = requests.post(url, headers=headers, files=files, data=data)

if response.status_code == 200:
    with open("result.png", "wb") as out:
        out.write(response.content)
    print("Background removed via", response.headers.get("X-Model-Used"))
else:
    print("Error:", response.json())`,

  node: `import fs from "fs";

const form = new FormData();
const fileBuffer = fs.readFileSync("photo.jpg");
form.append("image", new Blob([fileBuffer], { type: "image/jpeg" }), "photo.jpg");
form.append("model", "ganga"); // Choose 'ganga' (sub-pixel matting) or 'karudi' (universal)

const response = await fetch("https://bg.tools/api/v1/remove-background", {
  method: "POST",
  headers: {
    "Authorization": "Bearer bgt_live_YOUR_API_KEY",
  },
  body: form,
});

if (response.ok) {
  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync("result.png", Buffer.from(arrayBuffer));
  console.log("Success! Model used:", response.headers.get("X-Model-Used"));
} else {
  console.error("API Error:", await response.json());
}`,

  php: `<?php
$ch = curl_init('https://bg.tools/api/v1/remove-background');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer bgt_live_YOUR_API_KEY'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, [
    'image' => new CURLFile('photo.jpg', 'image/jpeg'),
    'model' => 'ganga' // 'ganga' or 'karudi'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    file_put_contents('result.png', $result);
    echo "Saved to result.png\\n";
} else {
    echo "Error: " . $result;
}`,

  csharp: `using System.Net.Http.Headers;

using var client = new HttpClient();
client.DefaultRequestHeaders.Authorization = 
    new AuthenticationHeaderValue("Bearer", "bgt_live_YOUR_API_KEY");

using var content = new MultipartFormDataContent();
using var fileStream = File.OpenRead("photo.jpg");
content.Add(new StreamContent(fileStream), "image", "photo.jpg");
content.Add(new StringContent("ganga"), "model"); // 'ganga' or 'karudi'

var response = await client.PostAsync("https://bg.tools/api/v1/remove-background", content);
if (response.IsSuccessStatusCode)
{
    var bytes = await response.Content.ReadAsByteArrayAsync();
    await File.WriteAllBytesAsync("result.png", bytes);
    Console.WriteLine("Background removed successfully!");
}`,
};

export function ApiMarketingPage() {
  const [activeLang, setActiveLang] = useState<keyof typeof CODE_EXAMPLES>("curl");
  const [hasCopied, setHasCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeLang]);
    setHasCopied(true);
    toast.success("Code sample copied to clipboard!");
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-foreground flex flex-col justify-between selection:bg-orange-500/20 font-sans">
      <SiteHeader />

      <main className="flex-1 w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8 sm:py-12 space-y-16">
        {/* ─── Hero Section ────────────────────────────────────────────────────── */}
        <section className="text-center space-y-6 w-full max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 dark:border-orange-900/60 bg-orange-50 dark:bg-orange-950/40 px-4 py-1.5 text-xs font-black text-orange-600 dark:text-orange-400 shadow-xs">
            <Terminal className="h-4 w-4" />
            <span>Developer REST API v1.0 • Now Live</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.1]">
            The Fastest Background Removal & Image AI API
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed font-medium">
            Integrate enterprise-grade neural background removal, watermark erasing, and face anonymization into your product with a single API call.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/account"
              search={{ tab: "api-keys" }}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 text-sm font-extrabold shadow-md shadow-orange-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              <span>Get Your API Key</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/docs/api"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3 text-sm font-bold text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-slate-400" />
              <span>Read Documentation</span>
            </Link>

            <a
              href="/api/v1/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 px-4 py-3 text-xs font-mono font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <span>OpenAPI 3.1</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </section>

        {/* ─── Interactive Code Playground Preview ─────────────────────────────── */}
        <section className="w-full rounded-3xl border border-slate-200 dark:border-zinc-800 bg-slate-950 p-4 sm:p-7 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-xs text-zinc-400 font-bold">POST /api/v1/remove-background</span>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl">
              {(["curl", "python", "node", "php", "csharp"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                    activeLang === lang
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {lang === "node" ? "Node.js" : lang === "csharp" ? "C#" : lang}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mt-4">
            <button
              type="button"
              onClick={copyCode}
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-mono text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              {hasCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
              <span>{hasCopied ? "Copied" : "Copy"}</span>
            </button>

            <pre className="overflow-x-auto text-xs sm:text-sm font-mono text-zinc-200 p-4 leading-relaxed">
              <code>{CODE_EXAMPLES[activeLang]}</code>
            </pre>
          </div>
        </section>

        {/* ─── Feature Pillars ─────────────────────────────────────────────────── */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Built for High-Growth Production Workloads
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Everything developers expect: zero customer image retention, ultra-low latency, and transparent pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-orange-500">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-black text-slate-900 dark:text-white">Sub-Second Processing</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Native neural segmentation runs in pure C++ and ONNX runtimes. Returns hair-level transparent PNGs in under 600ms.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-black text-slate-900 dark:text-white">Zero Data Retention</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Your images are processed purely in memory and wiped immediately. We never store customer photos or use them for training.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-500">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-black text-slate-900 dark:text-white">Enterprise Security</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Built-in SSRF protection, decompression bomb defense, IP allowlisting, cryptographic key hashing, and idempotency key safety.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Pricing Per Call Table ─────────────────────────────────────────── */}
        <section className="rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-6">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white">
                Simple, Predictable Token Pricing
              </h2>
              <p className="text-xs text-slate-500">
                All public API calls draw from your account credit balance. No recurring commitments or surprises.
              </p>
            </div>

            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-xs"
            >
              <span>View Credit Packs</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 p-4 space-y-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white">Remove Background</div>
              <div className="font-mono text-2xl font-black text-orange-600">1 Credit</div>
              <p className="text-[11px] text-slate-500">Transparent PNG output up to 4K resolution.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 p-4 space-y-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white">Remove Watermark</div>
              <div className="font-mono text-2xl font-black text-orange-600">1 Credit</div>
              <p className="text-[11px] text-slate-500">Deep neural inpainting for stamps and overlays.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 p-4 space-y-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white">Face Blur / Anonymize</div>
              <div className="font-mono text-2xl font-black text-orange-600">1 Credit</div>
              <p className="text-[11px] text-slate-500">Multi-face detection & smooth blur or pixelate.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 p-4 space-y-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white">Image Conversion & Resize</div>
              <div className="font-mono text-2xl font-black text-emerald-600">0.25 Credit</div>
              <p className="text-[11px] text-slate-500">Format converter, resize, crop, and compression.</p>
            </div>
          </div>
        </section>

        {/* ─── SLA and Limits Table ────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white">
            Default Limits & Service Level Agreement
          </h2>

          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 border-b border-slate-100 dark:border-zinc-800 font-bold bg-slate-50 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-300">
              <div>Metric</div>
              <div>Default Standard Limit</div>
              <div>Enterprise / Dedicated</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="font-bold text-slate-900 dark:text-white">Rate Limit</div>
              <div className="font-mono text-slate-600 dark:text-zinc-400">60 requests / minute</div>
              <div className="font-mono text-orange-600 font-bold">1,000+ req/min</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="font-bold text-slate-900 dark:text-white">Maximum Image File Size</div>
              <div className="font-mono text-slate-600 dark:text-zinc-400">30 MB per file</div>
              <div className="font-mono text-orange-600 font-bold">60 MB per file</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="font-bold text-slate-900 dark:text-white">Maximum Resolution</div>
              <div className="font-mono text-slate-600 dark:text-zinc-400">6000 x 6000 px (36 MP)</div>
              <div className="font-mono text-orange-600 font-bold">8K Ultra-HD</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="font-bold text-slate-900 dark:text-white">Uptime Target</div>
              <div className="font-mono text-slate-600 dark:text-zinc-400">99.9% Uptime</div>
              <div className="font-mono text-emerald-600 font-bold">99.99% with SLA Guarantee</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4">
              <div className="font-bold text-slate-900 dark:text-white">Active Keys Allowed</div>
              <div className="font-mono text-slate-600 dark:text-zinc-400">5 active keys per user</div>
              <div className="font-mono text-orange-600 font-bold">Unlimited</div>
            </div>
          </div>
        </section>

        {/* ─── Frequently Asked Questions ──────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white">
              API Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500">Everything you need to know about integrating bg.tools.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-xs">
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white">Do you store our images?</h3>
              <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
                No. Images sent to the API are processed in volatile RAM and immediately discarded once the response is emitted. We never retain customer data.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white">Can I use sandbox keys for free testing?</h3>
              <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
                Yes! Any key prefixed with <code>bgt_test_</code> operates in sandbox mode with zero credit deduction so you can test end-to-end integration safely.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white">What happens if a request fails?</h3>
              <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
                If the processing engine encounters an error or downstream failure, all reserved credits are automatically refunded to your ledger in an immediate transaction.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white">How does idempotency work?</h3>
              <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
                Send the <code>Idempotency-Key: &lt;uuid&gt;</code> header with any POST request. If your network drops and you retry, the cached result is returned without double billing.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Final CTA ──────────────────────────────────────────────────────── */}
        <section className="rounded-3xl bg-slate-950 text-white p-8 sm:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight">
              Ready to automate image processing?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Create an account in 30 seconds, generate your API key, and start processing in under 5 minutes.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/account"
              search={{ tab: "api-keys" }}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 text-xs font-extrabold shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
            >
              <span>Get API Key Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-3 text-xs font-bold text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <span>Buy Credit Packs</span>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
