import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  FileText,
  ShieldCheck,
  Scale,
  Coins,
  CreditCard,
  Ban,
  Clock,
  Sparkles,
  HelpCircle,
  Mail,
  ExternalLink,
} from "lucide-react";
import { buildPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => {
    const seo = buildPageMeta({
      title: "Terms of Service | bg.tools",
      description:
        "Official Terms of Service for bg.tools. Details on token usage, Bronze/Silver/Gold credit lifecycle, commercial licensing, acceptable use policy, and zero data archiving.",
      path: "/terms",
    });
    return {
      meta: seo.meta,
      links: seo.links,
      scripts: seo.scripts,
    };
  },
  component: TermsPage,
});

export function TermsPage() {
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
            <span className="text-foreground">Terms of Service</span>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-1 font-mono text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Official Legal Agreement • bg.tools
            </div>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl md:text-6xl tracking-tight">
              Terms of Service<span className="text-accent">.</span>
            </h1>
            <p className="max-w-3xl text-base md:text-lg font-medium text-muted-foreground leading-relaxed">
              Effective Date: October 2026. Welcome to <strong>bg.tools</strong> (accessible at{" "}
              <a href="https://bg.tools" className="text-foreground underline underline-offset-4 hover:text-accent">
                https://bg.tools
              </a>
              ). These Terms of Service (&quot;Terms&quot;) govern your access to and usage of our automated image
              processing tools, machine learning pipelines, and credit services.
            </p>
          </div>

          {/* Key Principles Cards */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <Scale className="h-5 w-5 text-emerald-500 mb-2.5" />
              <h3 className="font-display text-sm font-bold">100% Commercial Rights</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                You retain full copyright over your original assets and all transparent or edited outputs.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <Coins className="h-5 w-5 text-amber-500 mb-2.5" />
              <h3 className="font-display text-sm font-bold">Fair Credit Policy</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Credits are only deducted for successful renders. Failed server requests trigger instant refunds.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <Clock className="h-5 w-5 text-blue-500 mb-2.5" />
              <h3 className="font-display text-sm font-bold">Zero Archiving</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Images are processed ephemerally in memory and purged immediately after download.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <Sparkles className="h-5 w-5 text-purple-500 mb-2.5" />
              <h3 className="font-display text-sm font-bold">No AI Model Training</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                We never feed your photos, client artwork, or documents into machine learning datasets.
              </p>
            </div>
          </div>

          {/* Terms Articles */}
          <div className="mt-12 space-y-8 text-sm md:text-base leading-relaxed text-foreground/90 font-normal">
            {/* Section 1 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  01
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Acceptance & Scope of Agreement
                </h2>
              </div>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                By visiting, registering an account on, or interacting with <strong>bg.tools</strong>, you confirm that you
                have read, understood, and agreed to be legally bound by these Terms and our companion Privacy Notice.
                If you are entering into these Terms on behalf of an enterprise or entity, you represent and warrant
                that you hold the legal authority to bind that entity. If you do not accept these Terms, do not access
                or utilize bg.tools.
              </p>
            </section>

            {/* Section 2 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  02
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Account Registration & Security
                </h2>
              </div>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                While certain basic preview tools may be sampled anonymously, full access to daily allowances and
                purchased token balances requires registering an account. You agree to provide accurate, current, and
                complete information during signup and to keep your credentials confidential. You are solely
                responsible for all activity initiated under your account. If you detect any unauthorized access,
                notify our security team immediately at{" "}
                <a href="mailto:Support@bg.tools" className="font-semibold text-foreground underline underline-offset-2">
                  Support@bg.tools
                </a>
                .
              </p>
            </section>

            {/* Section 3 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  03
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Token Economics & Credit Rules
                </h2>
              </div>
              <div className="space-y-3 text-muted-foreground text-sm md:text-base leading-relaxed">
                <p>
                  Platform operations (including AI background removal, upscaling, vector conversion, object erasing,
                  and photo enhancements) utilize a structured token model:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-foreground">Bronze Tokens (Free Daily Allowance):</strong> Registered users
                    receive 10 Bronze Tokens daily. Bronze Tokens refresh every 24 hours and do not roll over.
                  </li>
                  <li>
                    <strong className="text-foreground">Silver Tokens (Monthly Subscriptions):</strong> Active Lite (40
                    tokens/mo) and Pro (200 tokens/mo) plans receive Silver Tokens at the beginning of each billing
                    cycle. Silver Tokens expire at the close of each monthly cycle and do not accumulate.
                  </li>
                  <li>
                    <strong className="text-foreground">Gold Tokens (Pay-As-You-Go Packs):</strong> Gold Tokens purchased
                    via standalone packs (from 5 to 8,000 tokens) <span className="text-foreground font-semibold">never expire</span>.
                    They remain permanently available in your wallet until consumed.
                  </li>
                  <li>
                    <strong className="text-foreground">Deduction & Automatic Refund Guarantee:</strong> Credits are
                    deducted on an atomic per-image basis only when a processing task returns a valid completed file. If
                    a job fails due to an inference error, timeout, or server exception, our credit ledger
                    automatically restores your balance without manual intervention.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  04
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Billing, Payment Gateway & Refunds
                </h2>
              </div>
              <div className="space-y-3 text-muted-foreground text-sm md:text-base leading-relaxed">
                <p>
                  Payments on <strong>bg.tools</strong> are processed through certified PCI-DSS Level 1 compliant payment
                  gateways, primarily <strong>Razorpay</strong>. We accept UPI, major credit/debit cards, Net Banking, and
                  supported digital wallets. All prices are listed in Indian Rupees (INR) inclusive of applicable taxes
                  unless stated otherwise.
                </p>
                <p>
                  <strong>Subscriptions:</strong> Monthly and annual subscriptions auto-renew on their scheduled billing
                  dates. You may cancel your subscription at any time through your dashboard; upon cancellation, you retain
                  access to your Silver Tokens until the conclusion of the paid term.
                </p>
                <p>
                  <strong>Refund Policy:</strong> For one-time Gold Token packs, if you have made a purchase and have not
                  consumed any tokens from that pack, you may request a full refund within seven (7) business days of
                  purchase by contacting{" "}
                  <a href="mailto:Support@bg.tools" className="font-semibold text-foreground underline underline-offset-2">
                    Support@bg.tools
                  </a>
                  . Consumed tokens are non-refundable.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  05
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Intellectual Property & Commercial Licensing
                </h2>
              </div>
              <div className="space-y-3 text-muted-foreground text-sm md:text-base leading-relaxed">
                <p>
                  <strong>Your Ownership:</strong> You retain complete, unrestricted copyright, trademark, and ownership
                  rights over all source images, graphics, and assets uploaded to bg.tools. We assert zero ownership
                  claim over your inputs or the resulting outputs.
                </p>
                <p>
                  <strong>Commercial License:</strong> All processed images (transparent cutouts, upscaled renders,
                  color-corrected graphics) generated through your account are licensed for unrestricted personal,
                  commercial, advertising, e-commerce, and print production usage worldwide.
                </p>
                <p>
                  <strong>Platform Assets:</strong> The code, user interfaces, logos, brand identities, algorithms, and
                  design components comprising bg.tools are the exclusive property of bg.tools and protected by
                  intellectual property laws.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  06
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Acceptable Use Policy & Technical Constraints
                </h2>
              </div>
              <div className="space-y-3 text-muted-foreground text-sm md:text-base leading-relaxed">
                <p>When interacting with bg.tools, you explicitly agree not to:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Upload, process, or disseminate child sexual abuse material (CSAM), terroristic content, non-consensual explicit imagery, or content promoting hate speech and violence.</li>
                  <li>Upload malicious software, disguised executables, viruses, trojans, or scripts designed to compromise our GPU clusters or host servers.</li>
                  <li>Exceed the platform file constraint of <strong>30 MB per file</strong> or circumvent system rate limiters.</li>
                  <li>Reverse-engineer, decompile, crawl, or mass-scrape API endpoints without explicit written consent.</li>
                  <li>Infringe upon the intellectual property, privacy, or publicity rights of any third party.</li>
                </ul>
                <p>
                  We reserve the right to suspend or permanently terminate accounts found violating this Acceptable Use Policy.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  07
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Service Availability & Disclaimer of Warranties
                </h2>
              </div>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                We make commercially reasonable efforts to maintain 99.9% uptime for our AI processing infrastructure.
                However, <strong>bg.tools</strong> is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We
                disclaim all warranties of any kind, whether express or implied, including merchantability, fitness for
                a particular purpose, and non-infringement. We do not warrant that output quality will meet every
                individual aesthetic preference or that services will operate without transient network interruptions.
              </p>
            </section>

            {/* Section 8 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  08
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Limitation of Liability
                </h2>
              </div>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                To the maximum extent permitted by applicable law, in no event shall <strong>bg.tools</strong>, its
                founders, employees, partners, or suppliers be liable for any indirect, punitive, incidental, special,
                consequential, or exemplary damages, including loss of profits, goodwill, data, or business opportunities,
                arising out of or related to your use of the platform. Our aggregate liability for all claims related to
                the services shall not exceed the amount actually paid by you to bg.tools in the twelve (12) months
                preceding the incident.
              </p>
            </section>

            {/* Section 9 */}
            <section className="rounded-3xl border border-border bg-card p-7 md:p-9 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                  09
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Modifications to Terms
                </h2>
              </div>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                We may revise these Terms from time to time to reflect evolving regulatory frameworks or platform
                features. Changes will be posted to this page with an updated &quot;Effective Date.&quot; Continued use of
                bg.tools following published modifications constitutes your binding acceptance of the revised Terms.
              </p>
            </section>

            {/* Section 10: Official Contact Box */}
            <section className="rounded-3xl border border-border bg-muted/30 p-8 md:p-10 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">Legal & Support Inquiries</h2>
              <p className="max-w-xl mx-auto text-sm text-muted-foreground leading-relaxed">
                If you have questions regarding these Terms of Service, billing arrangements, or licensing verifications,
                please reach out to our dedicated support team:
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
