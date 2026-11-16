import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BuyMeCoffeeDialog } from "@/components/BuyMeCoffeeDialog";
import {
  Code2,
  Coffee,
  Heart,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  Globe2,
  Award,
  Terminal,
  ExternalLink,
  Mail,
  Linkedin,
  Github,
  Compass,
} from "lucide-react";

import { buildPageMeta, buildBreadcrumbsSchema } from "@/lib/seo";

export const Route = createFileRoute("/developer")({
  head: () =>
    buildPageMeta({
      title: "Meet the Developers & Founders — Upanishad | bg.tools",
      description:
        "Meet the engineers and creators behind bg.tools. Founded by Upanishad, lead developer Aakash Vavadiya, and co-founder Piyush Chodvadiya. Privacy-first AI photo tools built in Bharat.",
      path: "/developer",
      keywords: [
        "bg.tools developer",
        "Aakash Vavadiya",
        "Piyush Chodvadiya",
        "Upanishad",
        "bg tools team",
        "ai background removal creators",
      ],
      jsonLd: [
        buildBreadcrumbsSchema([
          { name: "Home", path: "/" },
          { name: "Developers & Founders", path: "/developer" },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name: "Aakash Vavadiya",
            jobTitle: "Founder & Lead Software Architect",
            worksFor: {
              "@type": "Organization",
              name: "Upanishad / bg.tools",
            },
            sameAs: [
              "https://github.com/AakashVavadiya",
              "https://linkedin.com/in/aakash-vavadiya",
            ],
          },
        },
      ],
    }),
  component: DeveloperPage,
});

function DeveloperPage() {
  const [isCoffeeDialogOpen, setIsCoffeeDialogOpen] = useState<boolean>(false);

  // 3D Card Hover states
  const [aakashTilt, setAakashTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [piyushTilt, setPiyushTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTilt = (
    e: React.MouseEvent<HTMLDivElement>,
    setTilt: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: -(y / (rect.height / 2)) * 8,
      y: (x / (rect.width / 2)) * 8,
    });
  };

  const resetTilt = (setTilt: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>) => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500/20 selection:text-amber-600">
      <SiteHeader />

      <main className="flex-1 w-full">
        {/* HERO SECTION WITH PARENT COMPANY UPANISHAD */}
        <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-border/60">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[600px] sm:w-[900px] bg-linear-to-tr from-amber-500/15 via-orange-500/10 to-rose-500/10 blur-[130px] pointer-events-none rounded-full" />
          <div className="absolute -top-10 left-10 h-72 w-72 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />

          <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-8 md:px-12 lg:px-16">
            {/* Upanishad Brand Logo & Identity */}
            <div className="text-center space-y-6 max-w-5xl mx-auto">
              {/* Brand Logo Presentation with Glow */}
              <div className="relative inline-flex items-center justify-center p-3 sm:p-4 rounded-3xl bg-linear-to-b from-card/90 to-background/90 border border-border/80 shadow-2xl backdrop-blur-xl group hover:border-amber-500/50 transition-all duration-300">
                <div className="absolute inset-0 bg-radial from-amber-500/20 to-transparent blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
                <img
                  src="/brand/upanishad-logo.png"
                  alt="Upanishad Logo"
                  className="relative h-24 sm:h-32 md:h-36 w-auto object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Title & Introduction */}
              <div className="space-y-3">
                <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground">
                  Architected by <span className="bg-linear-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">Upanishad</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium leading-relaxed max-w-3xl mx-auto">
                  An independent AI & software craft studio driven by a singular obsession:{" "}
                  <span className="text-foreground font-semibold">
                    building ultra-fast, zero-file-storage, browser-native intelligence
                  </span>{" "}
                  for creators, photographers, and developers around the world.
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setIsCoffeeDialogOpen(true)}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Coffee className="h-4 w-4" />
                  <span>Buy Us a Coffee</span>
                </button>

                <a
                  href="#team"
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-6 py-3.5 text-sm font-bold text-foreground hover:bg-muted/60 transition-all"
                >
                  <span>Meet The Creators</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Studio Key Metrics */}
            <div className="mt-14 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 w-full">
              <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-6 text-center backdrop-blur-xs shadow-xs">
                <div className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-foreground">130+</div>
                <div className="text-xs sm:text-sm font-semibold text-muted-foreground mt-1">Specialized AI Tools</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-6 text-center backdrop-blur-xs shadow-xs">
                <div className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-amber-500">5</div>
                <div className="text-xs sm:text-sm font-semibold text-muted-foreground mt-1">Deep Learning Models</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-6 text-center backdrop-blur-xs shadow-xs">
                <div className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-emerald-500">0 KB</div>
                <div className="text-xs sm:text-sm font-semibold text-muted-foreground mt-1">Zero Cloud File Storage</div>
              </div>
              <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-6 text-center backdrop-blur-xs shadow-xs">
                <div className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-foreground">99.9%</div>
                <div className="text-xs sm:text-sm font-semibold text-muted-foreground mt-1">Operational Reliability</div>
              </div>
            </div>
          </div>
        </section>

        {/* TEAM LEADERSHIP / CREATORS SECTION */}
        <section id="team" className="py-16 sm:py-24 border-b border-border/60">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 md:px-12 lg:px-16">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3.5 py-1 text-xs font-bold text-muted-foreground">
                <Code2 className="h-3.5 w-3.5 text-amber-500" />
                <span>Core Leadership & Founders</span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight text-foreground">
                The Minds Behind The Craft
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Hands-on founders who write the code, train the neural nets, and support the users directly every single day.
              </p>
            </div>

            {/* Profile Cards Grid with 3D Perspective */}
            <div className="grid gap-8 md:grid-cols-2">
              {/* DEVELOPER / OWNER: AAKASH VAVADIYA */}
              <div
                style={{
                  perspective: 1000,
                }}
                className="group"
              >
                <div
                  onMouseMove={(e) => handleTilt(e, setAakashTilt)}
                  onMouseLeave={() => resetTilt(setAakashTilt)}
                  style={{
                    transform: `rotateX(${aakashTilt.x}deg) rotateY(${aakashTilt.y}deg)`,
                    transition: "transform 0.15s ease-out, border-color 0.2s ease",
                    transformStyle: "preserve-3d",
                  }}
                  className="h-full rounded-3xl border-2 border-border/80 bg-linear-to-b from-card via-card to-card/60 p-6 sm:p-8 shadow-xl hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    {/* Header: Avatar, Name & Role */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-linear-to-tr from-amber-500 to-orange-500 shadow-lg shadow-orange-500/30 overflow-hidden ring-4 ring-amber-500/20">
                          <img
                            src="/profile-avatars/Boy6.jpg"
                            alt="Aakash Vavadiya"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-xl sm:text-2xl font-black tracking-tight text-foreground">
                              Aakash Vavadiya
                            </h3>
                          </div>
                          <div className="text-xs sm:text-sm font-extrabold text-amber-500 mt-0.5">
                            Developer & Owner
                          </div>
                          <div className="text-xs text-muted-foreground font-medium mt-0.5">
                            Lead Architect & Full-Stack AI Engineer
                          </div>
                        </div>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Terminal className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Bio & Introduction */}
                    <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-muted-foreground font-medium">
                      <p>
                        Aakash is the creator and technical mastermind behind the entire bg.tools ecosystem under Upanishad. He architects high-throughput neural pipelines, sub-pixel matting models, and the local WebAssembly runtime that executes deep learning inference directly on user hardware.
                      </p>
                      <p>
                        Driven by a deep commitment to user privacy, he designed the site's signature{" "}
                        <strong className="text-foreground">Zero File Storage Guarantee</strong>, ensuring no user artwork, photos, or confidential documents ever linger on remote disks.
                      </p>
                    </div>

                    {/* Personal Quote */}
                    <blockquote className="border-l-2 border-amber-500 pl-3.5 text-xs italic text-muted-foreground">
                      "True software excellence happens when massive computational complexity is hidden behind a clean, immediate, and respectful user interface."
                    </blockquote>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Parent Studio: Upanishad</span>
                    <button
                      type="button"
                      onClick={() => setIsCoffeeDialogOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-500 hover:text-amber-400 hover:underline cursor-pointer"
                    >
                      <Coffee className="h-3.5 w-3.5" />
                      <span>Buy Aakash a Coffee →</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CO-OWNER: PIYUSH CHODVADIYA */}
              <div
                style={{
                  perspective: 1000,
                }}
                className="group"
              >
                <div
                  onMouseMove={(e) => handleTilt(e, setPiyushTilt)}
                  onMouseLeave={() => resetTilt(setPiyushTilt)}
                  style={{
                    transform: `rotateX(${piyushTilt.x}deg) rotateY(${piyushTilt.y}deg)`,
                    transition: "transform 0.15s ease-out, border-color 0.2s ease",
                    transformStyle: "preserve-3d",
                  }}
                  className="h-full rounded-3xl border-2 border-border/80 bg-linear-to-b from-card via-card to-card/60 p-6 sm:p-8 shadow-xl hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/10 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    {/* Header: Avatar, Name & Role */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-linear-to-tr from-orange-500 to-rose-500 shadow-lg shadow-rose-500/30 overflow-hidden ring-4 ring-orange-500/20">
                          <img
                            src="/profile-avatars/Boy10.jpg"
                            alt="Piyush Chodvadiya"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-xl sm:text-2xl font-black tracking-tight text-foreground">
                              Piyush Chodvadiya
                            </h3>
                          </div>
                          <div className="text-xs sm:text-sm font-extrabold text-orange-500 mt-0.5">
                            Co-Owner & Strategy Lead
                          </div>
                          <div className="text-xs text-muted-foreground font-medium mt-0.5">
                            Product Growth & Global Operations
                          </div>
                        </div>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                        <Compass className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Bio & Introduction */}
                    <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-muted-foreground font-medium">
                      <p>
                        Piyush co-leads Upanishad's product roadmap, business operations, and international expansion. He bridges the gap between state-of-the-art AI algorithms and real-world creator workflows, ensuring that every tool solves tangible user bottlenecks.
                      </p>
                      <p>
                        He spearheads developer outreach, community engagement, and enterprise partnership initiatives, guaranteeing reliable infrastructure uptime, frictionless payment gateways, and rapid customer support turnaround.
                      </p>
                    </div>

                    {/* Personal Quote */}
                    <blockquote className="border-l-2 border-orange-500 pl-3.5 text-xs italic text-muted-foreground">
                      "Our goal at Upanishad is simple: empower anyone with an image to achieve studio-grade results in seconds, without a learning curve or expensive hardware."
                    </blockquote>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Parent Studio: Upanishad</span>
                    <button
                      type="button"
                      onClick={() => setIsCoffeeDialogOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-orange-500 hover:text-orange-400 hover:underline cursor-pointer"
                    >
                      <Coffee className="h-3.5 w-3.5" />
                      <span>Buy Piyush a Coffee →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* UPANISHAD PHILOSOPHY & TECH PILLARS */}
        <section className="py-16 sm:py-24 border-b border-border/60 bg-muted/20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 md:px-12 lg:px-16">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-bold text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Our Engineering Creed</span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight text-foreground">
                Why We Built bg.tools Differently
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Most web tools secretly harvest user photos, slap predatory watermarks, or force bloated subscriptions. Upanishad operates on three unbreakable promises.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Zero File Storage Guarantee
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Images processed with our browser tools are never archived, retained, or utilized for unauthorized AI model training. Your files remain exclusively yours.
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Sub-Second Local Acceleration
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  By compiling optimized neural runtimes to WebAssembly and WebGPU, tasks that previously took 10 seconds in the cloud now execute in under 400 milliseconds locally.
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Fair Access & Daily Free Credits
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Every user receives free tokens daily without needing credit cards. Affordable pay-as-you-go packs and transparent plans keep professional AI accessible to all.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3D INTERACTIVE BUY ME A COFFEE SPOTLIGHT BANNER */}
        <section className="py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-amber-500/5 via-orange-500/10 to-transparent pointer-events-none" />

          <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-8 md:px-12 lg:px-16">
            <div className="rounded-3xl border-2 border-amber-500/40 bg-linear-to-tr from-card via-card to-amber-500/10 p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
              {/* Floating Background Sparkles */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />

              <div className="space-y-4 max-w-lg">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Coffee className="h-3.5 w-3.5 animate-bounce" />
                  <span>Support Independent Creators</span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">
                  Love the tools? Fuel our next late-night coding session! ☕
                </h3>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  bg.tools is self-funded and lovingly crafted by <strong className="text-foreground">Aakash & Piyush</strong> at Upanishad. A small token of support fuels our development, keeps servers humming, and ensures our models remain fast and accessible for everyone.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Instant Razorpay UPI & Cards</span>
                  </div>
                </div>
              </div>

              {/* Action Button & 3D Teaser */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCoffeeDialogOpen(true)}
                  className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="text-2xl group-hover:rotate-12 transition-transform">☕</span>
                  <span>Buy Us a Coffee</span>
                </button>
                <span className="text-[11px] font-bold text-muted-foreground">
                  Support Aakash & Piyush • Upanishad
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 3D Animated Coffee Modal */}
      <BuyMeCoffeeDialog
        open={isCoffeeDialogOpen}
        onOpenChange={setIsCoffeeDialogOpen}
      />

      <SiteFooter />
    </div>
  );
}
