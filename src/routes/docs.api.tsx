import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BookOpen, KeyRound, Shield, Zap, Copy, Check, Download, AlertTriangle, Lock, Layers, Cpu } from "lucide-react";
import { toast } from "sonner";

import { buildPageMeta, buildBreadcrumbsSchema } from "@/lib/seo";

export const Route = createFileRoute("/docs/api")({
  head: () =>
    buildPageMeta({
      title: "API Reference & Developer Documentation — bg.tools Public REST API",
      description:
        "Comprehensive API documentation for bg.tools public REST API. Endpoints, cURL/Python/Node.js code examples, JSON schemas, error codes, and API key authentication.",
      path: "/docs/api",
      keywords: [
        "bg.tools api",
        "background removal api",
        "image processing api",
        "rest api documentation",
        "ai photo api",
        "image upscaler api",
      ],
      jsonLd: [
        buildBreadcrumbsSchema([
          { name: "Home", path: "/" },
          { name: "API", path: "/api" },
          { name: "Documentation", path: "/docs/api" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: "bg.tools Public REST API Documentation & Reference",
          description:
            "Complete reference for authenticating, removing image backgrounds, upscaling images, and batch processing via the bg.tools REST API.",
          url: "https://bg.tools/docs/api",
          author: {
            "@type": "Organization",
            name: "bg.tools",
          },
        },
      ],
    }),
  component: ApiDocsPage,
});

export function ApiDocsPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-foreground flex flex-col justify-between selection:bg-orange-500/20 font-sans">
      <SiteHeader />

      <main className="flex-1 w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Sidebar Navigation */}
          <aside className="lg:col-span-3 sticky top-20 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-4 text-xs font-semibold">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800 font-display font-black text-sm text-slate-900 dark:text-white">
              <BookOpen className="h-4 w-4 text-orange-500" />
              <span>API Reference v1</span>
            </div>

            <nav className="space-y-1">
              <a href="#quickstart" className="block px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                1. Quickstart (5 Mins)
              </a>
              <a href="#authentication" className="block px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                2. Authentication & Keys
              </a>
              <a href="#idempotency" className="block px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                3. Idempotency & Retries
              </a>
              <a href="#credits" className="block px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                4. Credits & Billing
              </a>
              <a href="#remove-background" className="block px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                POST /remove-background
              </a>
              <a href="#remove-watermark" className="block px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                POST /remove-watermark
              </a>
              <a href="#blur-face" className="block px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                POST /blur-face
              </a>
              <a href="#detect-faces" className="block px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                POST /detect-faces
              </a>
              <a href="#conversion-tools" className="block px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                Format & Image Converters
              </a>
              <a href="#account-usage" className="block px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                GET /account & /usage
              </a>
              <a href="#error-codes" className="block px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                Error Codes & Handling
              </a>
              <a href="#security-privacy" className="block px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
                Security & Privacy Policy
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
              <a
                href="/api/v1/openapi.json"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 px-3 py-2 text-[11px] font-mono text-slate-700 dark:text-zinc-300 hover:bg-slate-100"
              >
                <span>OpenAPI 3.1 Spec</span>
                <Download className="h-3.5 w-3.5 text-slate-400" />
              </a>

              <a
                href="/api/v1/postman.json"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 px-3 py-2 text-[11px] font-mono text-slate-700 dark:text-zinc-300 hover:bg-slate-100"
              >
                <span>Postman Collection</span>
                <Download className="h-3.5 w-3.5 text-slate-400" />
              </a>
            </div>
          </aside>

          {/* Main Documentation Content */}
          <div className="lg:col-span-9 space-y-12">
            {/* Header intro */}
            <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-zinc-800">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 px-3 py-1 text-xs font-black text-orange-600 dark:text-orange-400">
                <span>Version 1.0</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                bg.tools REST API Documentation
              </h1>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
                The bg.tools REST API allows you to programmatically perform neural background removal, watermark erasing, facial anonymization, and image conversion over standard HTTPS requests.
              </p>
            </div>

            {/* 1. Quickstart */}
            <section id="quickstart" className="space-y-4 scroll-mt-24">
              <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <span>1. Quickstart (5 Minutes)</span>
              </h2>

              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Follow these three simple steps to start processing images:
              </p>

              <ol className="list-decimal list-inside text-xs space-y-2 text-slate-700 dark:text-zinc-300 font-medium">
                <li>
                  <strong>Create an Account & Sign In:</strong> Register on <Link to="/signup" className="text-orange-600 hover:underline">bg.tools</Link> (includes 10 free credits daily).
                </li>
                <li>
                  <strong>Generate an API Key:</strong> Visit your <Link to="/account/api-keys" className="text-orange-600 hover:underline">API Keys &amp; Console</Link> and generate a secret key (e.g. <code>bgt_live_...</code>).
                </li>
                <li>
                  <strong>Make your first request:</strong> Copy and run the cURL snippet below:
                </li>
              </ol>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-950 p-4 font-mono text-xs text-zinc-300 relative">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `curl -X POST https://bg.tools/api/v1/remove-background -H "Authorization: Bearer bgt_live_YOUR_KEY" -F "image=@photo.jpg" --output result.png`,
                      "quickstart_curl"
                    )
                  }
                  className="absolute right-3 top-3 p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white"
                >
                  {copiedSection === "quickstart_curl" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <pre className="overflow-x-auto leading-relaxed">
                  {`curl -X POST https://bg.tools/api/v1/remove-background \\
  -H "Authorization: Bearer bgt_live_YOUR_KEY" \\
  -F "image=@photo.jpg" \\
  --output result.png`}
                </pre>
              </div>
            </section>

            {/* 2. Authentication */}
            <section id="authentication" className="space-y-4 scroll-mt-24">
              <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-orange-500" />
                <span>2. Authentication & API Keys</span>
              </h2>

              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Authenticate your API requests by including your secret API key in the standard <code>Authorization</code> header:
              </p>

              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 p-3 font-mono text-xs text-slate-800 dark:text-zinc-200">
                Authorization: Bearer bgt_live_YOUR_API_KEY
              </div>

              <div className="rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>Security Best Practice:</strong> Never expose your live API key in client-side code (browser JavaScript, React apps, or mobile bundles). Always invoke bg.tools through your server-side backend or API gateway.
                </div>
              </div>
            </section>

            {/* 3. Idempotency */}
            <section id="idempotency" className="space-y-4 scroll-mt-24">
              <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                <span>3. Idempotency & Safe Retries</span>
              </h2>

              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                The bg.tools API supports the <code>Idempotency-Key</code> header to prevent double-charging your token balance during network retries.
              </p>

              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 p-3 font-mono text-xs text-slate-800 dark:text-zinc-200">
                Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
              </div>

              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                When you include an idempotency key, the server caches the response for 24 hours. Any retry with the same key returns the cached result with header <code>X-Idempotent-Replay: true</code> and does NOT charge additional tokens.
              </p>
            </section>

            {/* 4. Credits & Billing */}
            <section id="credits" className="space-y-4 scroll-mt-24">
              <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <span>4. Credits & Billing</span>
              </h2>

              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Every API response includes two custom headers detailing your current token status:
              </p>

              <ul className="list-disc list-inside text-xs space-y-1 text-slate-700 dark:text-zinc-300 font-mono">
                <li><code>X-Credits-Used: 1</code> (the amount deducted for this request)</li>
                <li><code>X-Credits-Remaining: 49</code> (your updated total token balance)</li>
              </ul>

              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Credits are reserved inside an atomic SQLite transaction before image processing. If downstream inference fails for any reason, all credits are automatically refunded.
              </p>
            </section>

            {/* 5. POST /remove-background */}
            <section id="remove-background" className="space-y-4 scroll-mt-24">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-500 text-white font-mono text-xs font-black px-2.5 py-1">POST</span>
                <h2 className="font-mono text-xl font-bold text-slate-900 dark:text-white">/api/v1/remove-background</h2>
              </div>

              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Segment and remove backgrounds cleanly, outputting a transparent PNG with edge matting. You can specify which dedicated AI model engine to use according to your specific precision and speed requirements.
              </p>

              {/* Model Selection Guide */}
              <div className="rounded-2xl border border-orange-200 dark:border-orange-900/60 bg-orange-50/50 dark:bg-orange-950/20 p-5 space-y-3 text-xs">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-orange-500" />
                  <span>Available AI Models & Engines</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 dark:text-zinc-300">
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                    <div className="font-mono font-bold text-orange-600 dark:text-orange-400">model: "ganga" (Default)</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Our dedicated alpha matting model. Ideal for portraits, e-commerce products, animals, and intricate flyaway hair and transparent fabrics.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                    <div className="font-mono font-bold text-orange-600 dark:text-orange-400">model: "karudi"</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Our universal flagship orchestrator. Intelligently analyzes complex multi-subject scenes, applies edge refinement, and maximizes cut-out accuracy.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                    <div className="font-mono font-bold text-slate-800 dark:text-zinc-200">model: "brahmaputra"</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      High-throughput conversion, resizing, and lightweight segmentation for high-volume batch processing.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                    <div className="font-mono font-bold text-slate-800 dark:text-zinc-200">model: "narmada" & "saraswati"</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Narmada powers watermark removal inpainting; Saraswati powers automated facial detection and anonymization.
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">Request Parameters</div>
                <div className="space-y-2 text-slate-700 dark:text-zinc-300">
                  <div><code>image</code> (binary file, multipart): Image file (PNG, JPG, WebP up to 30 MB)</div>
                  <div><code>image_url</code> (string, JSON): Remote HTTPS URL to download image with SSRF protection</div>
                  <div><code>model</code> (string, optional): AI model to execute (<code>ganga</code>, <code>karudi</code>, <code>brahmaputra</code>). Default: <code>ganga</code></div>
                  <div><code>response_format</code> (string): <code>binary</code> (default) or <code>json</code></div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-950 p-4 font-mono text-xs text-zinc-300">
                <pre className="overflow-x-auto">
{`// Example Response when response_format="json"
{
  "success": true,
  "model": "ganga",
  "image": "data:image/png;base64,iVBORw0KGgo...",
  "format": "png",
  "width": 1200,
  "height": 800,
  "credits_used": 1,
  "credits_remaining": 49,
  "request_id": "req_9f3a18b2c45e"
}`}
                </pre>
              </div>
            </section>

            {/* 6. POST /remove-watermark */}
            <section id="remove-watermark" className="space-y-4 scroll-mt-24">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-500 text-white font-mono text-xs font-black px-2.5 py-1">POST</span>
                <h2 className="font-mono text-xl font-bold text-slate-900 dark:text-white">/api/v1/remove-watermark</h2>
              </div>

              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Deep neural inpainting to erase text, watermarks, and logos while preserving 100% of the original background texture.
              </p>
            </section>

            {/* 7. POST /blur-face & /detect-faces */}
            <section id="blur-face" className="space-y-4 scroll-mt-24">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-500 text-white font-mono text-xs font-black px-2.5 py-1">POST</span>
                <h2 className="font-mono text-xl font-bold text-slate-900 dark:text-white">/api/v1/blur-face</h2>
              </div>

              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Automated facial detection and blurring with customizable <code>blurType</code> (<code>gaussian</code>, <code>pixelate</code>, <code>solid_black</code>) and <code>strength</code>.
              </p>
            </section>

            {/* 8. Conversion Tools */}
            <section id="conversion-tools" className="space-y-4 scroll-mt-24">
              <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-orange-500" />
                <span>Image Converters & Optimization (0.25 Credit Each)</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">POST /api/v1/compress-image</div>
                  <div className="text-slate-500 mt-1">Shrinks file size up to 85% with quality loss minimized (params: <code>quality</code>: 10-100).</div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">POST /api/v1/convert-image</div>
                  <div className="text-slate-500 mt-1">Converts image formats between PNG, JPEG, and WebP (params: <code>format</code>: png|jpeg|webp).</div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">POST /api/v1/resize-image</div>
                  <div className="text-slate-500 mt-1">High-quality Lanczos resampling (params: <code>width</code>, <code>height</code>).</div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">POST /api/v1/crop-image</div>
                  <div className="text-slate-500 mt-1">Crops bounding box (params: <code>x</code>, <code>y</code>, <code>width</code>, <code>height</code>).</div>
                </div>
              </div>
            </section>

            {/* 9. Error Codes Table */}
            <section id="error-codes" className="space-y-4 scroll-mt-24">
              <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white">
                HTTP Status Codes & Error Catalog
              </h2>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 font-bold border-b border-slate-100 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-4 font-mono">Status</th>
                      <th className="py-2.5 px-4 font-mono">Error Code</th>
                      <th className="py-2.5 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-mono text-[11px]">
                    <tr><td className="py-2.5 px-4 font-bold text-rose-600">400</td><td className="py-2.5 px-4">api_key_in_query</td><td className="font-sans text-slate-600">Keys in query parameters rejected</td></tr>
                    <tr><td className="py-2.5 px-4 font-bold text-rose-600">401</td><td className="py-2.5 px-4">unauthorized / invalid_api_key</td><td className="font-sans text-slate-600">Missing, invalid, or revoked key</td></tr>
                    <tr><td className="py-2.5 px-4 font-bold text-amber-600">402</td><td className="py-2.5 px-4">insufficient_credits</td><td className="font-sans text-slate-600">Credit balance too low for tool</td></tr>
                    <tr><td className="py-2.5 px-4 font-bold text-rose-600">403</td><td className="py-2.5 px-4">insufficient_scope / ip_not_allowed</td><td className="font-sans text-slate-600">Scope violation or IP allowlist block</td></tr>
                    <tr><td className="py-2.5 px-4 font-bold text-rose-600">413</td><td className="py-2.5 px-4">payload_too_large</td><td className="font-sans text-slate-600">File size exceeds 30 MB</td></tr>
                    <tr><td className="py-2.5 px-4 font-bold text-rose-600">415</td><td className="py-2.5 px-4">unsupported_media_type</td><td className="font-sans text-slate-600">Non-image or executable binary detected</td></tr>
                    <tr><td className="py-2.5 px-4 font-bold text-amber-600">429</td><td className="py-2.5 px-4">rate_limit_exceeded / quota_exceeded</td><td className="font-sans text-slate-600">Requests per minute or daily quota reached</td></tr>
                    <tr><td className="py-2.5 px-4 font-bold text-rose-600">503</td><td className="py-2.5 px-4">engine_busy / api_disabled</td><td className="font-sans text-slate-600">Inference queue saturated or maintenance</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 10. Security & Privacy */}
            <section id="security-privacy" className="space-y-4 scroll-mt-24">
              <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-500" />
                <span>Security & Privacy Guarantees</span>
              </h2>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                <p>
                  <strong>Zero Image Storage:</strong> bg.tools operates a strict ephemeral-only processing architecture. Customer images are decoded in memory, processed through our neural engines, and discarded immediately after HTTP transmission.
                </p>
                <p>
                  <strong>No Plaintext Key Storage:</strong> Your API secret keys are salted and hashed using cryptographic SHA-256 before storing in our database. We only store the key prefix for display. Plaintext keys are shown exactly once at creation time.
                </p>
                <p>
                  <strong>GDPR & Compliance:</strong> All metadata and EXIF location tags are automatically stripped from output images.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
