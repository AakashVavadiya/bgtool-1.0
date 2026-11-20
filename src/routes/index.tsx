import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import shapeTwo from "@/assets/shape-2.png";
import { TrendingToolsSection } from "@/components/TrendingToolsSection";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Faq } from "@/components/Faq";
import { ScrollBeforeAfter } from "@/components/ScrollBeforeAfter";
import { ProductHuntBadge } from "@/components/ProductHuntBadge";
import { AdminStore, type UiEditSettings } from "@/admin/lib/admin-store";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { tools } from "@/lib/tools";
import { getCurrentWebsiteLanguage, getLocalizedHeroPhrases } from "@/lib/translator";
import {
  buildPageMeta,
  buildWebSiteSchema,
  buildOrganizationSchema,
  SITE_URL,
} from "@/lib/seo";
import { Zap, Maximize2, Layers, Gift } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => {
    const webAppSchema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "bg.tools",
      url: SITE_URL,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "All",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        priceValidUntil: "2027-12-31",
        availability: "https://schema.org/InStock",
      },
      description: "Free online AI background remover with sub-pixel hair matting and 4K exports. No watermark, zero tracking.",
    };

    const seo = buildPageMeta({
      title: "bg.tools — Free Online AI Background Remover & 4K Export",
      description: "Remove image backgrounds online in 1-click with bg.tools. Sub-pixel edge matting, 4K exports, free daily credits, and zero data tracking.",
      path: "/",
      keywords: [
        "background remover",
        "free background remover online",
        "remove background from image",
        "ai photo editor",
        "upscale image 4k",
        "compress image online",
        "pdf editor free",
        "sub pixel matting",
        "transparent png",
      ],
      jsonLd: [webAppSchema, buildWebSiteSchema(), buildOrganizationSchema()],
    });

    return {
      meta: seo.meta,
      links: seo.links,
      scripts: seo.scripts,
    };
  },
  component: Index,
});

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-visible={visible}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${className}`}
    >
      {children}
    </div>
  );
}

const stats = [
  {
    icon: Zap,
    tag: "Processing Speed",
    n: "1s",
    unit: "avg",
    t: "Average Cutout",
    d: "Edge-aware matting runs in about a second, even on large, complex files.",
    badge: "Sub-second neural inference",
  },
  {
    icon: Maximize2,
    tag: "Lossless Output",
    n: "4K",
    unit: "UHD",
    t: "Export Quality",
    d: "Download transparent PNGs at full original resolution with zero downscaling.",
    badge: "Pixel-perfect alpha transparency",
  },
  {
    icon: Layers,
    tag: "Creative Suite",
    n: `${Math.floor(tools.length / 10) * 10}+`,
    unit: "tools",
    t: "Studio Tools",
    d: "Background removal, conversion, compression, and editing all in one place.",
    badge: "All-in-one creator toolkit",
  },
  {
    icon: Gift,
    tag: "Daily Allowance",
    n: "10",
    unit: "free/day",
    t: "Free Daily Credits",
    d: "Generous daily credit allowance replenished every 24 hours for creators.",
    badge: "Resets automatically at midnight",
  },
];


const features = [
  {
    k: "01",
    title: "Hair & fur precision.",
    body: "A matting model trained on fine detail keeps every strand instead of carving a soft halo around your subject.",
  },
  {
    k: "02",
    title: "Batch in one drop.",
    body: "Drag a hundred product shots at once. Consistent framing, consistent margins, one zip on the way out.",
  },
  {
    k: "03",
    title: "Transparent or styled.",
    body: "Ship a clean alpha channel, or drop the subject onto a solid, gradient or studio-grey backdrop instantly.",
  },
  {
    k: "04",
    title: "Nothing kept.",
    body: "Uploads are processed and discarded. No archive, no training set, no quiet second life for your images.",
  },
];

const checkerStyle = {
  backgroundImage:
    "linear-gradient(45deg,var(--color-secondary) 25%,transparent 25%),linear-gradient(-45deg,var(--color-secondary) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,var(--color-secondary) 75%),linear-gradient(-45deg,transparent 75%,var(--color-secondary) 75%)",
  backgroundSize: "26px 26px",
  backgroundPosition: "0 0,0 13px,13px -13px,-13px 0",
};

function getGraphemes(str: string): string[] {
  if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter(undefined, { granularity: "grapheme" });
      return Array.from(segmenter.segment(str), (s: any) => s.segment);
    } catch {}
  }
  return Array.from(str);
}

function TypewriterHeroTitle() {
  const [currentLang, setCurrentLang] = useState<string>(() => getCurrentWebsiteLanguage());
  const phrases = useMemo(() => getLocalizedHeroPhrases(currentLang), [currentLang]);

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPhrase = phrases[phraseIndex % phrases.length] || phrases[0]!;

  const line1Chars = useMemo(() => getGraphemes(currentPhrase.line1), [currentPhrase.line1]);
  const line2Chars = useMemo(() => getGraphemes(currentPhrase.line2), [currentPhrase.line2]);
  const fullTextLength = line1Chars.length + line2Chars.length;

  const [charCount, setCharCount] = useState(fullTextLength);
  const [isWaiting, setIsWaiting] = useState(true);

  // Sync active language dynamically when changed anywhere (header, footer, etc.)
  useEffect(() => {
    const handleLang = (e: any) => {
      const newLang = e.detail?.language || getCurrentWebsiteLanguage();
      setCurrentLang(newLang);
    };
    window.addEventListener("bg_language_changed", handleLang);
    window.addEventListener("storage", handleLang);
    return () => {
      window.removeEventListener("bg_language_changed", handleLang);
      window.removeEventListener("storage", handleLang);
    };
  }, []);

  // When user changes language, re-sync to full text of phrase 0 in the new language
  useEffect(() => {
    setPhraseIndex(0);
    const p = phrases[0] || currentPhrase;
    const l1 = getGraphemes(p.line1);
    const l2 = getGraphemes(p.line2);
    setCharCount(l1.length + l2.length);
    setIsWaiting(true);
    setIsDeleting(false);
  }, [currentLang]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isWaiting) {
      // Pause when fully written (2200ms) or when fully backspaced before next phrase (280ms)
      const waitDuration = isDeleting ? 280 : 2200;
      timeout = setTimeout(() => {
        setIsWaiting(false);
        if (isDeleting) {
          // Finished backspacing! Advance to next phrase and start writing from 0
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
          setCharCount(0);
        } else {
          // Finished writing! Start backspacing
          setIsDeleting(true);
        }
      }, waitDuration);
      return () => clearTimeout(timeout);
    }

    if (isDeleting) {
      // Backspace animation (deleting character-by-character)
      if (charCount > 0) {
        timeout = setTimeout(() => {
          setCharCount((prev) => prev - 1);
        }, 24);
      } else {
        // Fully backspaced to 0: brief pause
        setIsWaiting(true);
      }
    } else {
      // Write animation (typing character-by-character)
      if (charCount < fullTextLength) {
        timeout = setTimeout(() => {
          setCharCount((prev) => prev + 1);
        }, 50);
      } else {
        // Fully typed out: pause to let user read
        setIsWaiting(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [charCount, isDeleting, isWaiting, fullTextLength, phrases.length]);

  const l1Len = line1Chars.length;
  const currentLine1 = line1Chars.slice(0, Math.min(charCount, l1Len)).join("");
  const currentLine2 = charCount > l1Len ? line2Chars.slice(0, charCount - l1Len).join("") : "";

  const showCursorOnLine1 = charCount <= l1Len;
  const showCursorOnLine2 = charCount > l1Len;

  return (
    <h1
      className="rise-in halftone-text notranslate relative mx-auto w-full text-center font-display text-3xl sm:text-5xl md:text-6xl lg:text-[5.5vw] xl:text-[6vw] font-black leading-[1.08] sm:leading-[1.02] pb-3 tracking-tight sm:tracking-tighter text-foreground min-h-[2.4em] flex flex-col items-center justify-center select-none max-w-full px-1"
      translate="no"
    >
      <span className="block min-h-[1.1em] max-w-full">
        <span className="inline-title-text break-words">{currentLine1 || "\u00A0"}</span>
        {showCursorOnLine1 && (
          <span
            aria-hidden="true"
            className="inline-block ml-1 sm:ml-1.5 w-[3px] sm:w-[4px] md:w-[6px] h-[0.82em] bg-accent align-baseline rounded-full animate-pulse shadow-[0_0_10px_var(--color-accent)]"
            style={{
              WebkitBackgroundClip: "border-box",
              backgroundClip: "border-box",
            }}
          />
        )}
      </span>
      <span className="block mt-1 sm:mt-2 min-h-[1.1em] max-w-full">
        <span className="inline-title-text break-words">{currentLine2 || "\u00A0"}</span>
        {showCursorOnLine2 && (
          <span
            aria-hidden="true"
            className="inline-block ml-1 sm:ml-1.5 w-[3px] sm:w-[4px] md:w-[6px] h-[0.82em] bg-accent align-baseline rounded-full animate-pulse shadow-[0_0_10px_var(--color-accent)]"
            style={{
              WebkitBackgroundClip: "border-box",
              backgroundClip: "border-box",
            }}
          />
        )}
      </span>
    </h1>
  );
}

function Index() {
  const [uiSettings, setUiSettings] = useState<UiEditSettings>(() => AdminStore.getUiSettings());
  const scrollerTools = tools.filter((t) => AdminStore.isToolEnabled(t.slug));

  useEffect(() => {
    const sync = () => {
      setUiSettings(AdminStore.getUiSettings());
    };
    window.addEventListener(REALTIME_EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground w-full">
      <SiteHeader />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 pb-14 pt-10 sm:pb-20 sm:pt-16 md:pb-28 md:pt-20 w-full max-w-full">
        <p className="rise-in text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-muted-foreground text-center">
          free · online · instant
        </p>

        <div className="relative mt-4 sm:mt-6 w-full max-w-[98%] mx-auto">
          {/* Charcoal typographic mark behind title */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -z-0 -translate-x-1/2 -translate-y-1/2 font-display text-[18vw] sm:text-[20vw] md:text-[18vw] font-bold leading-none tracking-tighter text-foreground/[0.03] select-none"
          >
            BG.
          </span>

          <TypewriterHeroTitle />
        </div>

        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-2">
          {["· Transparent PNG", "· 4K export", "· Batch upload", "· No watermark"].map((p, i) => (
            <span
              key={p}
              style={{ animationDelay: `${300 + i * 120}ms` }}
              className="rise-in rounded-full bg-card px-3.5 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs md:text-sm font-semibold shadow-xs border border-border"
            >
              {p}
            </span>
          ))}
        </div>

        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none">
          <Link
            to="/tools/$slug"
            params={{ slug: "remove-background" }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-foreground px-7 sm:px-9 py-4 sm:py-5 text-sm sm:text-base font-bold text-background shadow-xl transition-all hover:scale-105 hover:gap-5"
          >
            Remove a background <span aria-hidden>→</span>
          </Link>
          <Link
            to="/pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border-2 border-border bg-card px-7 sm:px-9 py-4 sm:py-5 text-sm sm:text-base font-bold transition-all hover:scale-105 hover:border-foreground shadow-md"
          >
            See pricing
          </Link>
        </div>

        {/* Product Hunt Social Proof Badge */}
        <div className="mt-8 sm:mt-10">
          <ProductHuntBadge variant="hero" />
        </div>

        <p className="mt-6 max-w-md text-center text-xs sm:text-sm text-muted-foreground px-4">
          Free online background remover for people who care about edges.
        </p>
      </section>

      {/* Stats Section spanning full width with properly balanced alignment */}
      <section className="grain border-y border-border px-4 sm:px-6 md:px-8 lg:px-10 py-12 md:py-16 w-full">
        <div className="w-full">
          <div className="grid gap-4 sm:gap-5 lg:gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.t} delay={i * 80}>
                  <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-card/60 p-7 md:p-8 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5">
                    {/* Ambient top glowing line on hover */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Ambient corner radial glow */}
                    <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/5 blur-2xl transition-all duration-300 group-hover:scale-150 group-hover:bg-accent/15" />

                    <div>
                      {/* Top Bar: Icon + Category Badge */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-foreground group-hover:shadow-md group-hover:shadow-accent/20">
                          <Icon className="h-5 w-5" strokeWidth={2.2} />
                        </div>
                        <span className="rounded-full border border-border/70 bg-secondary/80 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                          {s.tag}
                        </span>
                      </div>

                      {/* Hero Stat + Unit Pill */}
                      <div className="mt-6 flex items-baseline gap-2">
                        <span className="font-display text-4xl lg:text-5xl font-black tracking-tight text-foreground">
                          {s.n}
                        </span>
                        {s.unit && (
                          <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent border border-accent/20">
                            {s.unit}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="mt-3 font-display text-xl lg:text-2xl font-bold tracking-tight text-foreground">
                        {s.t}
                      </h3>

                      {/* Description */}
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {s.d}
                      </p>
                    </div>

                    {/* Bottom Feature Micro-Indicator */}
                    <div className="mt-6 pt-5 border-t border-border/50 flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                      <span>{s.badge}</span>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="px-5 py-24 md:px-10 md:py-36">
        <Reveal>
          <h2 className="max-w-4xl font-display text-3xl leading-[1.1] font-medium md:text-6xl">
            Built for every image that needs to stand alone. From a single portrait to a
            thousand-SKU catalogue.
          </h2>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            <span className="text-foreground">
              We obsess over the one pixel most tools give up on.
            </span>{" "}
            Hair, fur, smoke, glass, motion blur — the places where a cutout usually falls apart are
            exactly where bg does its best work.
          </p>
          <a
            href="#upload"
            className="mt-10 inline-flex items-center gap-3 rounded-full border border-foreground px-7 py-4 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
          >
            Try it now
            <span aria-hidden>→</span>
          </a>
        </Reveal>
      </section>

      {/* Marquee — All Tools names with orange accent dot */}
      <div className="grain overflow-hidden border-y border-border py-6 select-none group">
        <div
          className="marquee-track gap-14 whitespace-nowrap group-hover:[animation-play-state:paused]"
          style={{ animationDuration: `${Math.max(80, scrollerTools.length * 2.2)}s` }}
        >
          {[...scrollerTools, ...scrollerTools].map((tool, i) => (
            <Link
              key={`${tool.slug}-${i}`}
              to="/tools/$slug"
              params={{ slug: tool.slug }}
              className="font-display text-2xl font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
            >
              <span>{tool.name.replace(/\.+$/, "")}</span>
              <span className="text-accent font-bold">.</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Showcase with Scroll-Driven Before/After Reveal Animation */}
      <section id="work" className="px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="mb-10 text-center">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                interactive result
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-5xl">
                Scroll to Reveal Background Removal<span className="text-accent">.</span>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                Watch the background disappear automatically as you scroll down the page.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <ScrollBeforeAfter />
          </Reveal>
        </div>
      </section>

      {/* Removal models overview & link to separate models page */}
      {uiSettings.aiMasterEnabled &&
        uiSettings.aiModelsPageEnabled &&
        uiSettings.aiHomeSectionsEnabled &&
        AdminStore.isPageEnabled("/models") && (
          <section id="models-summary" className="border-t border-border bg-card/30 px-5 py-16 md:px-10 md:py-24">
            <div className="mx-auto max-w-5xl text-center">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                ai removal engines
              </p>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight md:text-5xl">
                Five Neural Engines for Any Edge Challenge<span className="text-accent">.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
                From 4K ultra-resolution exports to fine hair and translucent matting, pick the engine engineered for your image.
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  to="/models"
                  className="inline-flex items-center gap-3 rounded-full bg-foreground px-8 py-4 text-base font-semibold text-background transition-all hover:scale-[1.03]"
                >
                  View All Model Details & FAQ
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </section>
        )}





      {/* Trending Tools Section */}
      <div className="border-t border-border">
        <TrendingToolsSection />
      </div>

      {/* Features */}
      <section className="border-t border-border">
        {features.map((f, i) => (
          <Reveal key={f.k} delay={i * 60}>
            <article className="group grid gap-4 border-b border-border px-5 py-10 transition-colors hover:bg-secondary md:grid-cols-[6rem_1fr_1fr] md:items-baseline md:px-10 md:py-14">
              <span className="font-display text-sm text-muted-foreground">{f.k}</span>
              <h3 className="font-display text-2xl font-medium transition-transform duration-500 group-hover:translate-x-2 md:text-4xl">
                {f.title}
              </h3>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          </Reveal>
        ))}
      </section>

      {/* CTA */}
      <section
        id="upload"
        className="relative overflow-hidden px-5 pt-36 pb-32 text-center md:px-10 md:py-44"
      >
        <img
          src={shapeTwo}
          alt=""
          aria-hidden
          loading="lazy"
          width={900}
          height={900}
          className="spin-slow pointer-events-none select-none absolute -right-6 sm:-right-10 md:-right-16 top-2 sm:top-4 md:top-10 w-32 sm:w-48 md:w-80 opacity-90 z-0"
        />
        <div className="relative z-10">
          <Reveal>
            <h2 className="mx-auto max-w-5xl font-display text-4xl leading-[0.95] font-medium md:text-8xl">
              Drop an image.
              <br />
              Keep the subject<span className="text-accent">.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-xl text-sm text-muted-foreground md:text-base">
              Up to 4K exports, batch uploads and credits that only spend when a job succeeds.
            </p>
            <Link
              to="/tools/$slug"
              params={{ slug: "remove-background" }}
              className="mt-12 inline-flex items-center gap-3 bg-foreground px-9 py-5 text-sm font-medium text-background transition-all hover:gap-6"
            >
              Remove a background
              <span aria-hidden>→</span>
            </Link>
          </Reveal>
        </div>
      </section>

      <Faq />

      <SiteFooter />
    </div>
  );
}
