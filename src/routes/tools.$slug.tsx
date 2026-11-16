import { useState, useEffect } from "react";
import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { getTool, tools, LEGACY_TOOL_SLUG_ALIASES } from "@/lib/tools";
import { RemovalProcess } from "@/components/RemovalProcess";
import { InteractiveToolWorkspace } from "@/components/InteractiveToolWorkspace";
import { PdfToolWorkspace } from "@/components/PdfToolWorkspace";
import { BgModels } from "@/components/BgModels";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolMaintenanceDialog } from "@/components/ToolMaintenanceDialog";
import { AdminStore } from "@/admin/lib/admin-store";
import { AuthUser } from "@/lib/auth-user";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { CheckCircle2, ShieldAlert, Wrench, UploadCloud, Download, Zap, Sliders, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import { MandalaDecor, MandalaCorner } from "@/components/decorations/MandalaDecor";

import { ToolLimitReachedDialog } from "@/components/ToolLimitReachedDialog";
import { AddCreditsDialog } from "@/components/AddCreditsDialog";
import { GuestLoginDialog } from "@/components/GuestLoginDialog";
import { ToolVisualShowcase } from "@/components/ToolVisualShowcase";
import type { CurrentUser } from "@/lib/auth-user";

function getStepMeta(step: string, i: number, total: number) {
  const lower = step.toLowerCase();
  let title = `Step 0${i + 1}`;
  let Icon = Sparkles;

  if (
    i === 0 ||
    lower.includes("upload") ||
    lower.includes("select") ||
    lower.includes("choose") ||
    lower.includes("paste") ||
    lower.includes("open") ||
    lower.includes("allow")
  ) {
    Icon = UploadCloud;
    if (lower.includes("upload")) title = "Upload Files";
    else if (lower.includes("paste")) title = "Paste Input";
    else if (lower.includes("select") || lower.includes("choose")) title = "Select Source";
    else if (lower.includes("camera")) title = "Capture Photo";
    else title = "Upload & Prepare";
  } else if (
    i === total - 1 ||
    lower.includes("download") ||
    lower.includes("save") ||
    lower.includes("copy") ||
    lower.includes("export")
  ) {
    Icon = Download;
    if (lower.includes("download")) title = "Download Result";
    else if (lower.includes("copy")) title = "Copy to Clipboard";
    else if (lower.includes("save")) title = "Save Output File";
    else title = "Export Result";
  } else if (
    lower.includes("click") ||
    lower.includes("convert") ||
    lower.includes("process") ||
    lower.includes("compress") ||
    lower.includes("merge") ||
    lower.includes("split") ||
    lower.includes("generate")
  ) {
    Icon = Zap;
    if (lower.includes("merge")) title = "Merge Files";
    else if (lower.includes("split")) title = "Split Document";
    else if (lower.includes("compress")) title = "Compress Document";
    else if (lower.includes("convert")) title = "Convert Format";
    else if (lower.includes("generate") || lower.includes("process")) title = "Process Output";
    else title = "Execute Action";
  } else {
    Icon = Sliders;
    if (lower.includes("reorder") || lower.includes("drag")) title = "Arrange & Reorder";
    else if (lower.includes("adjust") || lower.includes("format") || lower.includes("style")) title = "Configure Settings";
    else if (lower.includes("signature") || lower.includes("sign")) title = "Apply Signature";
    else if (lower.includes("page")) title = "Select Pages";
    else title = "Customize Options";
  }

  return { title, Icon };
}

import {
  buildPageMeta,
  buildBreadcrumbsSchema,
  buildFaqSchema,
  buildHowToSchema,
} from "@/lib/seo";

export const Route = createFileRoute("/tools/$slug")({
  loader: ({ params }) => {
    const rawSlug = decodeURIComponent(params.slug || "").trim();
    if (!rawSlug || rawSlug === "$slug" || rawSlug.startsWith("$")) {
      throw redirect({ to: "/tools", statusCode: 301 });
    }
    const aliasTarget = LEGACY_TOOL_SLUG_ALIASES[rawSlug];
    if (aliasTarget && aliasTarget !== rawSlug) {
      throw redirect({
        to: "/tools/$slug",
        params: { slug: aliasTarget },
        statusCode: 301,
      });
    }
    const tool = getTool(rawSlug);
    if (!tool) throw notFound();
    return { slug: tool.slug, name: tool.name, blurb: tool.blurb };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Tool Not Found | bg.tools" }, { name: "robots", content: "noindex, nofollow" }],
      };
    }
    const tool = getTool(loaderData.slug);
    const seo = tool?.seo;

    // Preserve rich keyword-targeted title without destructive character slicing
    const rawTitle = seo?.title || `${loaderData.name} Online Free — Fast, Secure & No Watermark`;
    const title = rawTitle.includes("bg.tools") ? rawTitle : `${rawTitle} | bg.tools`;
    const description = seo?.description || loaderData.blurb || `Free online ${loaderData.name} tool on bg.tools with zero tracking.`;

    const toolSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: loaderData.name,
      operatingSystem: "All",
      applicationCategory: "DesignApplication",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
      description,
    };

    const breadcrumbsSchema = buildBreadcrumbsSchema([
      { name: "Home", path: "/" },
      { name: "Tools", path: "/tools" },
      { name: loaderData.name, path: `/tools/${loaderData.slug}` },
    ]);

    const faqSchema = seo?.article?.faqs ? buildFaqSchema(seo.article.faqs) : null;
    const howToSchema = seo?.article?.howTo
      ? buildHowToSchema({
        name: loaderData.name,
        description,
        steps: seo.article.howTo,
      })
      : null;

    const allSchemas = [
      toolSchema,
      breadcrumbsSchema,
      ...(faqSchema ? [faqSchema] : []),
      ...(howToSchema ? [howToSchema] : []),
    ];

    const pageMeta = buildPageMeta({
      title,
      description,
      path: `/tools/${loaderData.slug}`,
      keywords: seo?.keywords,
      jsonLd: allSchemas,
    });

    return {
      meta: pageMeta.meta,
      links: pageMeta.links,
      scripts: pageMeta.scripts,
    };
  },
  component: ToolPage,
});

function ToolPage() {
  const { slug } = Route.useParams();
  const tool = getTool(slug);

  const [isEnabled, setIsEnabled] = useState(() => AdminStore.isToolEnabled(slug));
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(() => !AdminStore.isToolEnabled(slug));
  const [dailyStatus, setDailyStatus] = useState(() => AdminStore.checkDailyToolLimit(slug));
  const [showLimitModal, setShowLimitModal] = useState(() => AdminStore.checkDailyToolLimit(slug).reached);
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);
  const [addCreditsDetail, setAddCreditsDetail] = useState<{
    toolName?: string;
    toolSlug?: string;
    creditCost?: number;
    currentCredits?: number;
  }>({});
  const [isRestricted, setIsRestricted] = useState(() => AuthUser.isUserRestricted());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => AuthUser.getCurrentUser());

  useEffect(() => {
    setIsRestricted(AuthUser.isUserRestricted());
    setCurrentUser(AuthUser.getCurrentUser());
    AdminStore.syncToolsConfigFromServer().then(() => {
      const enabled = AdminStore.isToolEnabled(slug);
      setIsEnabled(enabled);
      if (!enabled) setShowMaintenanceModal(true);
      const ds = AdminStore.checkDailyToolLimit(slug);
      setDailyStatus(ds);
      if (ds.reached) setShowLimitModal(true);
      setIsRestricted(AuthUser.isUserRestricted());
      setCurrentUser(AuthUser.getCurrentUser());
    });

    const handleUpdate = () => {
      setIsRestricted(AuthUser.isUserRestricted());
      setCurrentUser(AuthUser.getCurrentUser());
      const enabled = AdminStore.isToolEnabled(slug);
      setIsEnabled(enabled);
      if (!enabled) {
        setShowMaintenanceModal(true);
      }
      const ds = AdminStore.checkDailyToolLimit(slug);
      setDailyStatus(ds);
    };

    const handleAddCreditsEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail) {
        setAddCreditsDetail(customEvt.detail);
      }
      setShowAddCreditsModal(true);
    };

    window.addEventListener(REALTIME_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("bg:show_restricted_dialog", handleUpdate);
    window.addEventListener("bg:show_add_credits_dialog", handleAddCreditsEvent);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("bg:show_restricted_dialog", handleUpdate);
      window.removeEventListener("bg:show_add_credits_dialog", handleAddCreditsEvent);
    };
  }, [slug]);

  if (!tool) return null;

  const Icon = tool.icon;
  const isBgRemover = tool.slug === "remove-background";
  const enabledTools = tools.filter((t) => AdminStore.isToolEnabled(t.slug));
  const sameCat = enabledTools.filter((t) => t.category === tool.category && t.slug !== tool.slug);
  const otherCat = enabledTools.filter((t) => t.category !== tool.category && t.slug !== tool.slug);
  const related = [...sameCat, ...otherCat].slice(0, 4);
  const seo = tool.seo;
  const creditCost = AdminStore.getToolCreditCost(tool.slug);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader />

        {/* Maintenance Dialog Popup */}
        <ToolMaintenanceDialog
          isOpen={!isEnabled && showMaintenanceModal}
          onClose={() => setShowMaintenanceModal(false)}
          toolName={tool.name}
          toolSlug={tool.slug}
        />

        {/* Add Credits Dialog Popup */}
        <AddCreditsDialog
          isOpen={showAddCreditsModal}
          onClose={() => setShowAddCreditsModal(false)}
          toolName={addCreditsDetail.toolName || tool.name}
          toolSlug={addCreditsDetail.toolSlug || tool.slug}
          creditCost={addCreditsDetail.creditCost ?? creditCost}
          currentCredits={addCreditsDetail.currentCredits ?? AuthUser.getCredits()}
        />

        {/* Free Daily Limit Reached Dialog Popup (Active for Free Tools only) */}
        {creditCost === 0 && (
          <ToolLimitReachedDialog
            isOpen={dailyStatus.reached && showLimitModal}
            onClose={() => setShowLimitModal(false)}
            toolName={tool.name}
            limit={dailyStatus.limit || 20}
            usedToday={dailyStatus.usedToday}
          />
        )}

        {/* Guest 5 Free Uses Reached Dialog Popup */}
        <GuestLoginDialog toolName={tool.name} />

        {/* UPLOAD ZONE & WORKSPACE */}
        <section className="grain border-b border-border px-4 py-4 md:px-8 md:py-6 relative">
          {isRestricted ? (
            <div className="relative rounded-3xl border border-destructive/40 bg-destructive/5 p-8 sm:p-14 text-center my-4 overflow-hidden shadow-sm">
              <div className="max-w-lg mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-1.5 text-xs font-bold text-destructive">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Account Restricted</span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                  Access Restricted
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  You cannot use Bg. because you have violated our terms and conditions.
                </p>
                <div className="pt-3 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("bg:show_restricted_dialog"))}
                    className="rounded-2xl bg-destructive px-5 py-3 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>View Violation Notice</span>
                  </button>
                  <Link
                    to="/contact"
                    className="rounded-2xl border border-border bg-card px-5 py-3 text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          ) : !isEnabled ? (
            <div className="relative rounded-3xl border border-amber-500/30 bg-amber-500/5 p-8 sm:p-14 text-center my-4 overflow-hidden shadow-sm">
              <div className="max-w-lg mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Scheduled Tool Maintenance</span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                  {tool.name} is Currently Offline
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  This tool is right now under maintenance and upgradation mode. Our engineering team is currently upgrading the processing model to deliver faster speeds, higher resolution limits, and superior quality output.
                </p>
                <div className="pt-3 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMaintenanceModal(true)}
                    className="rounded-2xl bg-foreground px-5 py-3 text-xs font-bold text-background shadow-xs hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    <span>View Maintenance Notice</span>
                  </button>
                  <Link
                    to="/tools"
                    className="rounded-2xl border border-border bg-card px-5 py-3 text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center"
                  >
                    Explore Active Tools
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {dailyStatus.reached && (
                <div className="relative rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6 text-left overflow-hidden shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                        Daily Usage Limit Reached ({dailyStatus.usedToday} of {dailyStatus.limit} files today)
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Your free quota automatically resets at midnight. You can review, compare, and download your processed results below!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowLimitModal(true)}
                      className="rounded-xl bg-foreground px-3.5 py-1.5 text-xs font-bold text-background shadow-xs hover:opacity-90 transition-all cursor-pointer"
                    >
                      Quota Details
                    </button>
                    <Link
                      to="/pricing"
                      className="rounded-xl bg-accent px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all flex items-center"
                    >
                      Upgrade Plan
                    </Link>
                  </div>
                </div>
              )}
              {isBgRemover ? (
                <RemovalProcess key="removal-process" />
              ) : tool.category === "PDF Tools" || tool.slug === "image-to-pdf" ? (
                <PdfToolWorkspace key={`pdf-${tool.slug}`} tool={tool} />
              ) : (
                <InteractiveToolWorkspace key={`workspace-${tool.slug}`} tool={tool} />
              )}
            </>
          )}
        </section>

        {/* HERO: ICON + HEADING (BELOW UPLOAD) */}
        <section className="relative overflow-hidden border-b border-border px-5 py-14 md:px-10 md:py-20">
          {/* Subtle light background mandala for decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] pointer-events-none opacity-[0.06] dark:opacity-[0.04] text-accent select-none" aria-hidden="true">
            <MandalaDecor spin size={580} />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center mx-auto max-w-3xl gap-5">
            <span className="tool-icon rise-in relative flex h-16 w-16 items-center justify-center rounded-2xl">
              <Icon className="relative z-10 h-8 w-8" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="rounded-full bg-card border border-border px-3.5 py-1 text-[0.7rem] font-semibold text-muted-foreground">
                  {tool.category}
                </span>
                {tool.tag ? (
                  <span className="rounded-full bg-accent/20 border border-accent/30 px-3.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-accent-foreground">
                    {tool.tag}
                  </span>
                ) : null}
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
                {tool.name}
                <span className="text-accent">.</span>
              </h1>
              <p className="mt-4 max-w-xl mx-auto text-base text-muted-foreground md:text-lg font-medium">
                {tool.blurb}
              </p>
            </div>

            {/* Stats row */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {currentUser && (
                <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium">
                  <span className="text-muted-foreground">Credit Cost:</span>
                  <span className="font-semibold text-accent">
                    {creditCost === 0 ? "Free (0 Credits)" : `${creditCost} Credit${creditCost === 1 ? "" : "s"}`}
                  </span>
                </div>
              )}
              {dailyStatus.limit > 0 && (
                <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium">
                  <span className="text-muted-foreground">Daily Limit:</span>
                  <span className={`font-semibold ${dailyStatus.reached ? "text-destructive" : "text-foreground"}`}>
                    {dailyStatus.usedToday} / {dailyStatus.limit} used today
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium">
                <span className="text-muted-foreground">Accepts:</span>
                <span className="font-semibold">{tool.accepts}</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium">
                <span className="text-muted-foreground">Returns:</span>
                <span className="font-semibold">{tool.outputs}</span>
              </div>
            </div>
          </div>
        </section>

        {/* MODELS SHOWCASE (bg remover only) */}
        {isBgRemover ? (
          <section className="border-b border-border px-5 py-20 md:px-10 md:py-28">
            <BgModels compact />
          </section>
        ) : null}

        {/* SEO ARTICLE */}
        {seo ? (
          <article className="relative overflow-hidden border-b border-border px-5 py-20 md:px-10 md:py-28">
            {/* Ambient light decorative Mandalas */}
            <div className="absolute -top-36 -right-36 w-[480px] h-[480px] pointer-events-none opacity-20 dark:opacity-10 text-accent select-none" aria-hidden="true">
              <MandalaDecor spin size={480} />
            </div>
            <div className="absolute -bottom-36 -left-36 w-[420px] h-[420px] pointer-events-none opacity-15 dark:opacity-10 text-accent select-none" aria-hidden="true">
              <MandalaDecor spin size={420} />
            </div>

            <div className="relative z-10">
              {/* Visual Showcase & About This Tool (Inspired by remove.bg/g/individuals) */}
              <ToolVisualShowcase tool={tool} />

              {/* How To */}
              <div className="mb-18">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-3">
                  <div>
                    <p className="font-display text-xs uppercase tracking-[0.3em] text-accent font-semibold mb-2">
                      Easy {seo.article.howTo.length}-Step Guide
                    </p>
                    <h2 className="font-display text-2xl font-semibold md:text-4xl">
                      How to Use {tool.name}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Follow these simple steps to get clean, professional results in seconds.
                  </p>
                </div>

                <ol className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  {seo.article.howTo.map((step, i) => {
                    const stepMeta = getStepMeta(step, i, seo.article.howTo.length);
                    const StepIcon = stepMeta.Icon;
                    return (
                      <li
                        key={i}
                        className="group relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card/90 to-card/50 p-6 flex flex-col justify-between transition-all duration-300 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1.5 backdrop-blur-xs"
                      >
                        {/* Light corner mandala for decoration */}
                        <MandalaCorner
                          position="top-right"
                          size={140}
                          className="opacity-20 dark:opacity-15 group-hover:opacity-40 transition-opacity duration-300"
                        />

                        {/* Top: Step pill + Icon */}
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-display font-bold text-xs uppercase tracking-wider">
                              Step 0{i + 1}
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border/80 text-accent shadow-xs group-hover:border-accent/50 group-hover:scale-105 transition-all">
                              <StepIcon className="h-5 w-5" strokeWidth={1.8} />
                            </div>
                          </div>

                          <h3 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-accent transition-colors">
                            {stepMeta.title}
                          </h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {step}
                          </p>
                        </div>

                        {/* Bottom: Step progress tracker */}
                        <div className="relative z-10 mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-mono text-[11px] font-medium text-accent/90">
                            0{i + 1} / 0{seo.article.howTo.length}
                          </span>
                          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-all duration-500"
                              style={{ width: `${((i + 1) / seo.article.howTo.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Benefits */}
              <div className="mb-18">
                <div className="mb-8">
                  <p className="font-display text-xs uppercase tracking-[0.3em] text-accent font-semibold mb-2">
                    Key Advantages
                  </p>
                  <h2 className="font-display text-2xl font-semibold md:text-4xl">
                    Why Use Our {tool.name} Tool?
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  {seo.article.benefits.map((b, i) => (
                    <div
                      key={i}
                      className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 p-6 flex flex-col gap-4 transition-all duration-300 hover:border-accent/40 hover:shadow-lg hover:-translate-y-1"
                    >
                      {/* Subtle corner mandala decoration */}
                      <MandalaCorner
                        position="bottom-right"
                        size={110}
                        className="opacity-15 dark:opacity-10 group-hover:opacity-30 transition-opacity duration-300"
                      />
                      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 text-accent flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="relative z-10">
                        <h3 className="font-display font-semibold text-base mb-2 group-hover:text-accent transition-colors">
                          {b.heading}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div className="mb-6">
                <h2 className="font-display text-2xl font-semibold md:text-4xl mb-8">
                  Frequently Asked Questions
                </h2>
                <div className="grid gap-5 lg:grid-cols-2">
                  {seo.article.faqs.map((faq, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-border bg-card/40 p-6"
                    >
                      <h3 className="font-display font-semibold text-base mb-2">{faq.q}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords / Tags */}
              <div className="mt-10 pt-8 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-5">
                  Related Keywords
                </p>
                <div className="flex flex-wrap gap-2">
                  {seo.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-accent/40 transition-colors cursor-default"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Comprehensive Guide & Masterclass Callout */}
              <div className="mt-10 rounded-2xl border border-accent/30 bg-accent/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xs">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wider">
                    <BookOpen className="h-4 w-4" />
                    <span>In-Depth Masterclass Guide</span>
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                    Want to master {tool.name}?
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                    Read our complete 4,000+ word masterclass guide with step-by-step pro tips, common workflows, and expert recommendations.
                  </p>
                </div>
                <Link
                  to="/news/$slug"
                  params={{ slug: tool.slug }}
                  className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-bold text-background transition-all hover:bg-foreground/90 shrink-0 shadow-md group"
                >
                  <span>Read Full Article</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </article>
        ) : null}

        {/* RELATED TOOLS */}
        <section className="border-t border-border px-5 py-20 md:px-10 md:py-28">
          <p className="font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">
            more tools
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t) => {
              const RelIcon = t.icon;
              return (
                <Link
                  key={t.slug}
                  to="/tools/$slug"
                  params={{ slug: t.slug }}
                  className="tool-card group relative flex flex-col items-center rounded-2xl border border-border bg-card px-6 pb-8 pt-8 text-center"
                >
                  <span className="tool-icon relative flex h-14 w-14 items-center justify-center rounded-2xl">
                    <RelIcon className="relative z-10 h-6 w-6" strokeWidth={1.75} aria-hidden />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-medium leading-tight transition-transform duration-500 group-hover:-translate-y-0.5">
                    {t.name}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-all duration-500 group-hover:gap-3 group-hover:text-foreground">
                    Open tool <span aria-hidden>→</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
