import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buildPageMeta } from "@/lib/seo";
import { toast } from "sonner";
import {
  Monitor,
  Smartphone,
  Apple,
  Sparkles,
  Zap,
  FolderDown,
  Cloud,
  Bell,
  ArrowRight,
  ChevronDown,
  Laptop,
  Check,
  Clock,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/download")({
  head: () => {
    const softwareSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "bg.tools - AI Background Remover Apps",
      operatingSystem: "Windows, macOS, Linux, Android, iOS",
      applicationCategory: "DesignApplication",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    };

    const seo = buildPageMeta({
      title: "Apps for Desktop, Android & iOS (Coming Soon) | bg.tools",
      description:
        "Official bg.tools online cloud apps for Windows, macOS, Linux, Android, and iOS. Powered by online AI image models with real-time cloud sync. Coming soon!",
      path: "/download",
      jsonLd: softwareSchema,
    });

    return {
      meta: seo.meta,
      links: seo.links,
      scripts: seo.scripts,
    };
  },
  component: DownloadPage,
});

type Platform = "windows" | "mac" | "linux" | "android" | "ios";

interface SystemReq {
  os: string;
  ram: string;
  connection: string;
  storage: string;
}

const SYSTEM_REQS: Record<Platform, SystemReq> = {
  windows: {
    os: "Windows 10 / 11 (64-bit, v1903 or later)",
    ram: "4 GB RAM minimum",
    connection: "High-speed broadband / WiFi for cloud AI processing",
    storage: "120 MB free disk space",
  },
  mac: {
    os: "macOS 12.0 (Monterey) or later (Apple Silicon M1-M4 & Intel)",
    ram: "4 GB Unified Memory minimum",
    connection: "High-speed broadband / WiFi for cloud AI processing",
    storage: "110 MB free disk space",
  },
  linux: {
    os: "Ubuntu 20.04+, Debian 11+, Fedora 36+, Arch Linux",
    ram: "4 GB RAM minimum",
    connection: "Broadband connection for cloud AI sync",
    storage: "100 MB free disk space",
  },
  android: {
    os: "Android 9.0 (Pie) or newer with Google Play Services",
    ram: "3 GB RAM minimum",
    connection: "4G / 5G / WiFi internet access",
    storage: "35 MB free space",
  },
  ios: {
    os: "iOS 16.0 or iPadOS 16.0 or newer",
    ram: "iPhone 11 or later / iPad (9th gen) or later",
    connection: "4G / 5G / WiFi internet access",
    storage: "40 MB free space",
  },
};

const FAQS = [
  {
    q: "Are the bg.tools apps online or offline?",
    a: "All bg.tools apps are 100% online cloud-powered! This means all image processing is computed on our high-speed GPU cloud infrastructure. You get the full accuracy of our top AI models (Karudi, Ganga, Brahmaputra, Narmada, Saraswati) without slowing down your phone or computer.",
  },
  {
    q: "When will the Desktop and Mobile apps be launched?",
    a: "Our Desktop (Windows, macOS, Linux) and Mobile (Android, iOS) apps are in active development and coming very soon! Sign up below to be notified the minute the public beta and store releases go live.",
  },
  {
    q: "Will my cloud account tokens sync across Web, Desktop, and Mobile?",
    a: "Yes! All apps connect directly to your bg.tools account. Your free daily tokens, purchase packs, subscription limits, and processing history sync automatically across every device.",
  },
  {
    q: "Can I process batch images in the desktop app?",
    a: "Yes! The online desktop app lets you drag and drop entire folders of images. The images are queued and processed simultaneously via our multi-threaded cloud pipeline for maximum speed.",
  },
  {
    q: "Will there be a free tier on the apps?",
    a: "Yes! The native apps will include your free 10 daily tokens just like the web version, so you can edit and remove backgrounds daily at zero cost.",
  },
];

export function DownloadPage() {
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>("windows");
  const [activeReqTab, setActiveReqTab] = useState<Platform>("windows");
  const [emailNotify, setEmailNotify] = useState("");
  const [selectedNotifyOs, setSelectedNotifyOs] = useState<Platform>("windows");
  const [subscribed, setSubscribed] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setDetectedPlatform("ios");
        setActiveReqTab("ios");
        setSelectedNotifyOs("ios");
      } else if (/android/.test(ua)) {
        setDetectedPlatform("android");
        setActiveReqTab("android");
        setSelectedNotifyOs("android");
      } else if (/macintosh|mac os x/.test(ua)) {
        setDetectedPlatform("mac");
        setActiveReqTab("mac");
        setSelectedNotifyOs("mac");
      } else if (/linux/.test(ua)) {
        setDetectedPlatform("linux");
        setActiveReqTab("linux");
        setSelectedNotifyOs("linux");
      } else {
        setDetectedPlatform("windows");
        setActiveReqTab("windows");
        setSelectedNotifyOs("windows");
      }
    }
  }, []);

  const handleNotifyAction = (platform: Platform, name: string) => {
    setSelectedNotifyOs(platform);
    const element = document.getElementById("notify-form");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    toast.info(`${name} is Coming Soon!`, {
      description: "Enter your email below to receive instant early-access when it launches.",
    });
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailNotify.trim() || !emailNotify.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubscribed(true);
    toast.success(`You're on the priority launch waitlist!`, {
      description: `We'll email ${emailNotify} the instant our ${selectedNotifyOs.toUpperCase()} app goes live.`,
    });
    setEmailNotify("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-accent selection:text-white">
      <div className="w-full">
        <SiteHeader />

        {/* Full-width container with consistent edge padding (no narrow max-w-7xl) */}
        <main className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 pt-8 sm:pt-12 pb-20">
          {/* Breadcrumbs */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3.5 py-1 text-xs font-semibold text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground font-bold">Download</span>
          </div>

          {/* Hero Section */}
          <section className="text-center w-full max-w-4xl mx-auto mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 mb-6 shadow-xs animate-in fade-in duration-500">
              <Clock className="h-3.5 w-3.5 animate-pulse" />
              <span>Coming Soon • Desktop, Android & iOS Apps</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-foreground">
              Cut backgrounds at lightspeed.{" "}
              <span className="text-accent underline decoration-accent/40 decoration-wavy underline-offset-8">
                Everywhere.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-muted-foreground font-medium leading-relaxed max-w-3xl mx-auto">
              Our official native apps for Windows, macOS, Linux, Android, and iOS are currently in active development. Powered by online cloud AI with instant real-time account sync and heavy batch processing.
            </p>

            {/* Smart Detection Banner */}
            <div className="mt-8 inline-flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md px-4 py-2 text-xs font-semibold text-foreground shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              <span>Detected Device:</span>
              <span className="font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                {detectedPlatform === "windows"
                  ? "Windows (64-bit)"
                  : detectedPlatform === "mac"
                  ? "macOS (Apple Silicon / Intel)"
                  : detectedPlatform === "linux"
                  ? "Linux (x86_64)"
                  : detectedPlatform === "android"
                  ? "Android OS"
                  : "iOS / iPadOS"}
              </span>
              <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                In Development
              </span>
            </div>
          </section>

          {/* Apps Showcase */}
          <section className="space-y-12 w-full">
            {/* 1. Desktop Apps Section */}
            <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card/90 to-card/50 p-6 sm:p-10 shadow-xl backdrop-blur-md w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1.5">
                    <Monitor className="h-4 w-4" />
                    <span>Desktop Suite</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground">
                    bg.tools for Windows, Mac & Linux
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                    Direct access to all 5 cloud AI models. 100% online processing with cloud account sync.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-3.5 py-1 text-xs font-bold">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Coming Soon</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground border border-border">
                    <Cloud className="h-3 w-3 text-accent" />
                    <span>Online Cloud AI</span>
                  </span>
                </div>
              </div>

              {/* Desktop Platforms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {/* Windows Card */}
                <div
                  className={`relative flex flex-col justify-between rounded-2xl border p-6 sm:p-7 transition-all ${
                    detectedPlatform === "windows"
                      ? "border-accent bg-accent/5 ring-2 ring-accent/20 shadow-md"
                      : "border-border/80 bg-background/60 hover:border-accent/40 hover:bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/25">
                      <Monitor className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                      Coming Soon
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-foreground">Windows</h3>
                      {detectedPlatform === "windows" && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
                          Your OS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                      Windows 10 & 11 (64-bit). Seamless folder drop with ultra-fast online cloud processing.
                    </p>
                    <ul className="mt-4 space-y-2 text-xs font-semibold text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>Windows Installer (.exe)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>Online Cloud AI pipeline</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>Token & subscription auto-sync</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => handleNotifyAction("windows", "Windows App")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-xs font-extrabold text-white hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      <span>Notify Me When Ready</span>
                    </button>
                  </div>
                </div>

                {/* macOS Card */}
                <div
                  className={`relative flex flex-col justify-between rounded-2xl border p-6 sm:p-7 transition-all ${
                    detectedPlatform === "mac"
                      ? "border-accent bg-accent/5 ring-2 ring-accent/20 shadow-md"
                      : "border-border/80 bg-background/60 hover:border-accent/40 hover:bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-500/10 text-foreground border border-foreground/20">
                      <Apple className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                      Coming Soon
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-foreground">macOS</h3>
                      {detectedPlatform === "mac" && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
                          Your OS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                      Optimized for Apple Silicon (M1-M4) & Intel Macs with native macOS menus and shortcuts.
                    </p>
                    <ul className="mt-4 space-y-2 text-xs font-semibold text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>Universal DMG package</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>Online Cloud AI pipeline</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>Batch drag-and-drop export</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => handleNotifyAction("mac", "macOS App")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-xs font-extrabold text-white hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      <span>Notify Me When Ready</span>
                    </button>
                  </div>
                </div>

                {/* Linux Card */}
                <div
                  className={`relative flex flex-col justify-between rounded-2xl border p-6 sm:p-7 transition-all ${
                    detectedPlatform === "linux"
                      ? "border-accent bg-accent/5 ring-2 ring-accent/20 shadow-md"
                      : "border-border/80 bg-background/60 hover:border-accent/40 hover:bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25">
                      <Laptop className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                      Coming Soon
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-foreground">Linux</h3>
                      {detectedPlatform === "linux" && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
                          Your OS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                      Compatible with Ubuntu, Debian, Fedora, Arch & all major Linux distributions.
                    </p>
                    <ul className="mt-4 space-y-2 text-xs font-semibold text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>Universal AppImage & .deb</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>Online Cloud AI pipeline</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>CLI & GUI batch workflows</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => handleNotifyAction("linux", "Linux App")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-xs font-extrabold text-white hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      <span>Notify Me When Ready</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Mobile Apps Section (Android & iOS) */}
            <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card/90 to-card/50 p-6 sm:p-10 shadow-xl backdrop-blur-md w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1.5">
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile Apps</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground">
                    bg.tools for Android & iOS
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                    Fast mobile cutout, transparent sticker export for WhatsApp & Instagram, and cloud account sync.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-3.5 py-1 text-xs font-bold">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Coming Soon</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground border border-border">
                    <Cloud className="h-3 w-3 text-accent" />
                    <span>Online Cloud AI</span>
                  </span>
                </div>
              </div>

              {/* Mobile Platforms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Android Card */}
                <div
                  className={`flex flex-col justify-between rounded-2xl border p-6 sm:p-8 transition-all ${
                    detectedPlatform === "android"
                      ? "border-accent bg-accent/5 ring-2 ring-accent/20 shadow-md"
                      : "border-border/80 bg-background/60 hover:border-accent/40 hover:bg-card"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                        <Smartphone className="h-7 w-7" />
                      </div>
                      <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-3 py-1 text-xs font-extrabold uppercase">
                        Coming Soon
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-foreground">Android App</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1.5 leading-relaxed">
                      Instant photo background removal straight from your camera roll. Create transparent stickers and share to WhatsApp or Instagram stories in one tap.
                    </p>

                    <div className="mt-5 space-y-2.5 rounded-xl bg-muted/40 p-4 border border-border/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-semibold">Platform</span>
                        <span className="font-bold text-foreground">Android 9.0+</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-semibold">Processing Mode</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Cloud className="h-3.5 w-3.5" />
                          <span>High-Speed Cloud AI</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-semibold">Store Status</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">Google Play Store • Coming Soon</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => handleNotifyAction("android", "Android App")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-xs font-extrabold text-white hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
                    >
                      <Bell className="h-4 w-4" />
                      <span>Notify Me On Google Play Launch</span>
                    </button>
                  </div>
                </div>

                {/* iOS Card */}
                <div
                  className={`flex flex-col justify-between rounded-2xl border p-6 sm:p-8 transition-all ${
                    detectedPlatform === "ios"
                      ? "border-accent bg-accent/5 ring-2 ring-accent/20 shadow-md"
                      : "border-border/80 bg-background/60 hover:border-accent/40 hover:bg-card"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-500/10 text-foreground border border-foreground/20">
                        <Apple className="h-7 w-7" />
                      </div>
                      <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-3 py-1 text-xs font-extrabold uppercase">
                        Coming Soon
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-foreground">iOS App (iPhone & iPad)</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1.5 leading-relaxed">
                      Deeply integrated with iOS Photos, Share Sheet, and Shortcuts. Remove backgrounds instantly with online AI processing.
                    </p>

                    <div className="mt-5 space-y-2.5 rounded-xl bg-muted/40 p-4 border border-border/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-semibold">Platform</span>
                        <span className="font-bold text-foreground">iOS 16.0+ & iPadOS</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-semibold">Processing Mode</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Cloud className="h-3.5 w-3.5" />
                          <span>High-Speed Cloud AI</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-semibold">Store Status</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">Apple App Store • Coming Soon</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => handleNotifyAction("ios", "iOS App")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-xs font-extrabold text-white hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
                    >
                      <Bell className="h-4 w-4" />
                      <span>Notify Me On App Store Launch</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Online Cloud AI Superpowers */}
            <div className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-10 backdrop-blur-md w-full">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent mb-2">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Cloud Power</span>
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground">
                  Why use bg.tools online native apps?
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                <div className="rounded-2xl border border-border/70 bg-background/50 p-5 space-y-2.5 hover:border-accent/40 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent font-bold">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">High-Speed Online Cloud AI</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Zero battery drain or heavy CPU heating. All complex neural network cutouts are calculated on our cloud GPU clusters in seconds.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/50 p-5 space-y-2.5 hover:border-accent/40 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 font-bold">
                    <FolderDown className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Fast Batch Processing</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Queue multiple e-commerce images at once with parallel cloud server workers and download transparent PNG results instantly.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/50 p-5 space-y-2.5 hover:border-accent/40 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500 font-bold">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Real-Time Account Sync</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your daily free tokens, paid packages, and custom preferences automatically sync in real-time across Web, Desktop, and Mobile.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/50 p-5 space-y-2.5 hover:border-accent/40 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500 font-bold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Zero-Retention Privacy</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All images processed through our online cloud are transmitted over encrypted TLS and automatically purged immediately after download.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. System Requirements Tabs */}
            <div className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-10 backdrop-blur-md w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6 mb-6">
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">System Specifications</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    Recommended requirements for using bg.tools apps.
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-muted/50 border border-border/60 text-xs font-bold">
                  {(["windows", "mac", "linux", "android", "ios"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveReqTab(tab)}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer capitalize ${
                        activeReqTab === tab
                          ? "bg-foreground text-background shadow-xs font-black"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specs Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Operating System
                  </span>
                  <span className="mt-1 block text-xs font-bold text-foreground">
                    {SYSTEM_REQS[activeReqTab].os}
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    System RAM / Memory
                  </span>
                  <span className="mt-1 block text-xs font-bold text-foreground">
                    {SYSTEM_REQS[activeReqTab].ram}
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Network Connection
                  </span>
                  <span className="mt-1 block text-xs font-bold text-foreground">
                    {SYSTEM_REQS[activeReqTab].connection}
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Disk Storage
                  </span>
                  <span className="mt-1 block text-xs font-bold text-foreground">
                    {SYSTEM_REQS[activeReqTab].storage}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Early Access / Launch Notification Form */}
            <div id="notify-form" className="rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-card/80 to-accent/5 p-8 sm:p-12 shadow-lg w-full">
              <div className="max-w-2xl mx-auto text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-500/30 mb-3">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Launch Waitlist</span>
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-black text-foreground">
                  Get notified when apps go live
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium">
                  Be the first to get access when our Desktop and Mobile apps launch. Free daily tokens included on launch day!
                </p>

                {subscribed ? (
                  <div className="mt-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-4 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>You're on the priority waitlist! We will alert you the moment the app is ready.</span>
                  </div>
                ) : (
                  <form onSubmit={handleNotifySubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedNotifyOs}
                      onChange={(e) => setSelectedNotifyOs(e.target.value as Platform)}
                      className="rounded-2xl border border-border bg-background px-3.5 py-3 text-xs font-bold text-foreground focus:border-accent focus:outline-none transition-colors"
                      aria-label="Target Operating System"
                    >
                      <option value="windows">Windows Desktop</option>
                      <option value="mac">macOS Desktop</option>
                      <option value="linux">Linux Desktop</option>
                      <option value="android">Android (Google Play)</option>
                      <option value="ios">iOS (Apple App Store)</option>
                    </select>
                    <input
                      type="email"
                      value={emailNotify}
                      onChange={(e) => setEmailNotify(e.target.value)}
                      placeholder="Enter your email address..."
                      className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="submit"
                      className="rounded-2xl bg-accent px-6 py-3 text-xs font-extrabold text-white hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Join Waitlist</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* 6. Download FAQs */}
            <div className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-10 backdrop-blur-md w-full">
              <div className="text-center max-w-xl mx-auto mb-8">
                <h3 className="font-display text-2xl font-bold text-foreground">
                  Frequently Asked Questions
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  Everything you need to know about upcoming bg.tools apps.
                </p>
              </div>

              <div className="max-w-4xl mx-auto space-y-3">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={faq.q}
                      className="rounded-2xl border border-border/70 bg-background/50 overflow-hidden transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-foreground hover:text-accent transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-accent" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 sm:px-5 pb-5 text-xs text-muted-foreground font-medium leading-relaxed border-t border-border/40 pt-3">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
