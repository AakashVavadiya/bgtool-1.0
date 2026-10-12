import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Server,
  FileCheck,
  Trash2,
  Database,
  Cpu,
  Mail,
  UserCheck,
} from "lucide-react";
import { buildPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => {
    const seo = buildPageMeta({
      title: "Privacy Notice & Zero-Retention Policy | bg.tools",
      description:
        "Official Privacy Notice for bg.tools. Details on our zero image retention guarantee, ephemeral in-memory processing, no AI model training, data security, and GDPR/DPDP user rights.",
      path: "/privacy",
    });
    return {
      meta: seo.meta,
      links: seo.links,
      scripts: seo.scripts,
    };
  },
  component: PrivacyPage,
});

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader />

        <main className="mx-auto max-w-5xl px-6 py-16 md:px-12 md:py-24">
          {/* Breadcrumb */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">Privacy Notice</span>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Zero-Retention Guarantee • bg.tools
            </div>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl md:text-6xl tracking-tight">
              Privacy Notice & Data Protection<span className="text-accent">.</span>
            </h1>
            <p className="max-w-3xl text-base md:text-lg font-medium text-muted-foreground leading-relaxed">
              Last Updated: October 2026. At <strong>bg.tools</strong> (operating at{" "}
              <a href="https://bg.tools" className="text-foreground underline underline-offset-4 hover:text-accent">
                https://bg.tools
              </a>
              ), we believe that your creative assets, photos, and personal data belong exclusively to you. This Privacy
              Notice explains how we handle technical data, enforce strict ephemeral processing, and protect your privacy.
            </p>
          </div>

          {/* Highlights Grid */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <EyeOff className="h-5 w-5 text-emerald-500 mb-2.5" />
              <h3 className="font-display text-sm font-bold">Zero Image Retention</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Images are processed in temporary memory and permanently discarded immediately after rendering.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <Lock className="h-5 w-5 text-amber-500 mb-2.5" />
              <h3 className="font-display text-sm font-bold">No AI Training</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                We never feed customer images, personal faces, or client designs into machine learning datasets.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <Server className="h-5 w-5 text-blue-500 mb-2.5" />
              <h3 className="font-display text-sm font-bold">TLS 1.3 Encryption</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                End-to-end cryptographic encryption in transit with strict Content Security Policy enforcement.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <Trash2 className="h-5 w-5 text-rose-500 mb-2.5" />
              <h3 className="font-display text-sm font-bold">Hourly Purge Daemon</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Automated background lifecycle daemon guarantees complete deletion of any orphaned temporary files.
              </p>
            </div>
          </div>

          {/* Privacy Articles */}
          <div className="mt-12 space-y-8 text-sm md:text-base leading-relaxed text-foreground/90 font-normal">
            {/* Section 1 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  01
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Our Privacy Philosophy & Data Minimization
                </h2>
              </div>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                The core principle of <strong>bg.tools</strong> is <em>data minimization</em>. We only collect the bare
                minimum technical information required to authenticate user sessions and securely manage credit
                balances. We reject the model of tracking users across the web or monetizing personal data. We do not
                sell, rent, or trade your personal information to data brokers or advertising networks.
              </p>
            </section>

            {/* Section 2 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  02
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Image File Lifecycle & Ephemeral Processing
                </h2>
              </div>
              <div className="space-y-3 text-muted-foreground text-sm md:text-base leading-relaxed">
                <p>
                  When you upload an image for background removal, vector generation, upscaling, or editing:
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <strong>Encrypted Ingest:</strong> The file is transmitted via TLS 1.3 encrypted HTTP directly to our
                    secure inference cluster.
                  </li>
                  <li>
                    <strong>In-Memory Processing:</strong> The image is decoded into volatile memory and processed by
                    our neural network engines.
                  </li>
                  <li>
                    <strong>Immediate Purge:</strong> Once the transparent PNG or converted output is generated and
                    returned to your client browser, both the source file and processed artifact are permanently
                    purged from disk and RAM.
                  </li>
                  <li>
                    <strong>Automated Cleanup Daemon:</strong> An automated background cleanup daemon runs continuously
                    to sweep and unlink any temporary cache entries older than 60 minutes.
                  </li>
                </ol>
                <p className="font-medium text-foreground">
                  We maintain zero historical galleries, image archives, or backup snapshots of your uploaded visual media.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  03
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  No AI or Machine Learning Model Training
                </h2>
              </div>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                We make an explicit, binding commitment: <strong>bg.tools will never use your uploaded images, photographs, artwork, or documents to train, fine-tune, or validate artificial intelligence models, computer vision systems, or public datasets.</strong> Your files are treated solely as transient inputs for on-demand inference requests.
              </p>
            </section>

            {/* Section 4 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  04
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Information We Collect & Why
                </h2>
              </div>
              <div className="space-y-3 text-muted-foreground text-sm md:text-base leading-relaxed">
                <p>We collect only the following categories of data:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-foreground">Account Information:</strong> When you register, we collect your
                    name and email address. Passwords are never stored in plaintext; they are securely hashed using
                    computationally intensive, salted <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">scrypt</code> key derivation.
                  </li>
                  <li>
                    <strong className="text-foreground">Credit & Transaction Metadata:</strong> We store your active
                    token balance (Bronze, Silver, Gold tokens) and an immutable credit ledger of deductions and top-ups
                    to guarantee transaction accuracy and process refunds.
                  </li>
                  <li>
                    <strong className="text-foreground">Payment Records:</strong> When you purchase tokens, transaction
                    references (Razorpay Order ID, Payment ID) are retained for accounting compliance. We do{" "}
                    <strong>not</strong> store or have access to your full credit card numbers, CVVs, or bank net banking credentials.
                  </li>
                  <li>
                    <strong className="text-foreground">Security & Rate Limiting Telemetry:</strong> We process IP
                    addresses in an ephemeral rate-limiting buffer to block volumetric denial-of-service attacks, brute-force
                    attempts, and automated abuse.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  05
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Cookies & Client-Side Storage
                </h2>
              </div>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                We use strictly functional, essential cookies:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm md:text-base leading-relaxed">
                <li>
                  <strong className="text-foreground">Authentication Cookies:</strong> Secure, HTTPOnly, SameSite=Strict
                  session tokens that maintain your logged-in state across page navigations.
                </li>
                <li>
                  <strong className="text-foreground">UI Preferences:</strong> Local storage flags to remember your dark/light
                  mode theme preference.
                </li>
              </ul>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                We do not employ third-party tracking pixels, marketing cookies, cross-site beacons, or intrusive session-recording scripts.
              </p>
            </section>

            {/* Section 6 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  06
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Infrastructure Security & Threat Mitigation
                </h2>
              </div>
              <div className="space-y-3 text-muted-foreground text-sm md:text-base leading-relaxed">
                <p>We deploy robust multi-layer technical defenses to secure our systems:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Magic-Byte Validation:</strong> All file uploads undergo binary signature verification to reject disguised executable files, scripts, or malicious polyglots before memory processing.</li>
                  <li><strong>30 MB Payload Capping:</strong> Strict gateway-level size limits reject oversized payloads with HTTP 413.</li>
                  <li><strong>Strict Content Security Policy (CSP):</strong> Prevents unauthorized script injections, enforces strict origin controls, and permits only approved payment gateway frames.</li>
                  <li><strong>Isolated Workspaces:</strong> File transformation occurs in temporary sandboxed workspaces with strict path-traversal prevention.</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  07
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Your Data Rights (GDPR, CCPA & Global Regulations)
                </h2>
              </div>
              <div className="space-y-3 text-muted-foreground text-sm md:text-base leading-relaxed">
                <p>Regardless of your geographic location, bg.tools affords you comprehensive rights over your personal data:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Right to Access:</strong> You may request an export of your account details and credit history.</li>
                  <li><strong>Right to Rectification:</strong> You may correct or update your profile information at any time.</li>
                  <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> You may request the permanent deletion of your account and all associated records.</li>
                  <li><strong>Right to Restrict Processing:</strong> You may object to any non-essential data processing.</li>
                </ul>
                <p>
                  To exercise any of these rights, email our team at{" "}
                  <a href="mailto:Support@bg.tools" className="font-semibold text-foreground underline underline-offset-2">
                    Support@bg.tools
                  </a>
                  . We will process your verified request within 30 days without charge.
                </p>
              </div>
            </section>

            {/* Section 8: Official Contact Box */}
            <section className="rounded-3xl border border-border bg-muted/30 p-8 md:p-10 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">Data Protection & Privacy Contact</h2>
              <p className="max-w-xl mx-auto text-sm text-muted-foreground leading-relaxed">
                For questions regarding this Privacy Notice, data handling policies, or to request account deletion,
                contact our designated Data Protection Officer:
              </p>
              <div className="pt-2">
                <a
                  href="mailto:Support@bg.tools"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90 transition-opacity"
                >
                  <Mail className="h-4 w-4" />
                  <span>Support@bg.tools</span>
                </a>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Official Domain: <span className="font-mono text-foreground font-semibold">https://bg.tools</span>
              </p>
            </section>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
