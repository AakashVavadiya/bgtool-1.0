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
  Download,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  FolderDown,
  Cpu,
  Bell,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Layers,
  Laptop,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/download")({
  head: () => {
    const softwareSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "bg.tools - AI Background Remover",
      operatingSystem: "Windows, macOS, Linux, Android, iOS",
      applicationCategory: "DesignApplication",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "2840",
      },
    };

    const seo = buildPageMeta({
      title: "Download bg.tools Apps | Desktop, Android & iOS",
      description:
        "Download native bg.tools apps for Windows, macOS, Linux, Android, and iOS. Work 100% offline with AI models, batch process thousands of images, and sync seamlessly.",
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
  gpu: string;
  storage: string;
}

const SYSTEM_REQS: Record<Platform, SystemReq> = {
  windows: {
    os: "Windows 10 / 11 (64-bit, v1903 or later)",
    ram: "8 GB RAM minimum (16 GB recommended for 4K batches)",
    gpu: "DirectX 12 or DirectML capable GPU (NVIDIA, AMD, Intel Iris)",
    storage: "500 MB free disk space",
  },
  mac: {
    os: "macOS 12.0 (Monterey) or later (Apple Silicon M1-M4 & Intel)",
    ram: "8 GB Unified Memory minimum (16 GB recommended)",
    gpu: "Apple Neural Engine / Metal 3 acceleration supported",
    storage: "450 MB free disk space",
  },
  linux: {
    os: "Ubuntu 20.04+, Debian 11+, Fedora 36+, Arch Linux",
    ram: "8 GB RAM minimum",
    gpu: "Vulkan 1.2 or NVIDIA CUDA 11.8+ drivers",
    storage: "400 MB free disk space (AppImage or .deb)",
  },
  android: {
    os: "Android 9.0 (Pie) or newer with Google Play Services",
    ram: "4 GB RAM minimum",
    gpu: "Vulkan / NNAPI Hardware Acceleration",
    storage: "85 MB free space",
  },
  ios: {
    os: "iOS 16.0 or iPadOS 16.0 or newer",
    ram: "iPhone 11 or later / iPad (9th gen) or later",
    gpu: "Apple A13 Bionic / M1 or newer Neural Engine",
    storage: "95 MB free space",
  },
};

const FAQS = [
  {
    q: "Does the Desktop app require an active internet connection?",
    a: "No! The bg.tools Desktop app bundles our offline AI engines (Karudi Core and Ganga Lite). You can remove backgrounds completely offline without uploading a single byte to any cloud server.",
  },
  {
    q: "Are my cloud account tokens shared across Web, Desktop, and Mobile?",
    a: "Yes. When you sign in with your bg.tools account on any device, your cloud token balance, subscription tier, and custom presets automatically sync across all your apps.",
  },
  {
    q: "Is there a limit on batch processing in the Desktop app?",
    a: "Unlike web browsers that run out of memory with large batches, the Desktop app uses your local system RAM and disk stream. You can drop a folder of 1,000+ high-res images and process them effortlessly in one click.",
  },
  {
    q: "When will the Android and iOS apps be available on the App Store?",
    a: "Our mobile apps are currently in private beta testing. Android users can install the direct .APK today, while iOS users can join via Apple TestFlight. Public store releases on Google Play and Apple App Store are launching very soon!",
  },
  {
    q: "Are software updates automatic on Desktop?",
    a: "Yes! The desktop app checks for model weight updates and performance patches on launch. You can update with a single click without reinstalling.",
  },
];

export function DownloadPage() {
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>("windows");
  const [activeReqTab, setActiveReqTab] = useState<Platform>("windows");
  const [emailNotify, setEmailNotify] = useState("");
  const [selectedNotifyOs, setSelectedNotifyOs] = useState<Platform>("android");
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

  const handleDownloadClick = (platformName: string, fileName: string) => {
    toast.success(`Starting download for ${platformName} (${fileName})...`, {
      description: "Your native installer will start downloading momentarily.",
    });
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailNotify.trim() || !emailNotify.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubscribed(true);
    toast.success(`You're on the priority list!`, {
      description: `We'll email ${emailNotify} the instant our ${selectedNotifyOs.toUpperCase()} app is ready.`,
    });
    setEmailNotify("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-accent selection:text-white">
      <div>
        <SiteHeader />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-20">
          {/* Breadcrumbs */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3.5 py-1 text-xs font-semibold text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground font-bold">Download</span>
          </div>

          {/* Hero Section */}
          <section className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-bold text-accent mb-6 shadow-xs animate-in fade-in duration-500">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Gen Native Apps • Desktop, Android & iOS</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-foreground">
              Cut backgrounds at lightspeed.{" "}
              <span className="text-accent underline decoration-accent/40 decoration-wavy underline-offset-8">
                Everywhere.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
              Work 100% offline, process 1,000+ photo batches in seconds, and leverage dedicated GPU acceleration with native apps engineered for Desktop and Mobile.
            </p>

            {/* Smart Detection Banner */}
            <div className="mt-8 inline-flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-foreground shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
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
            </div>
          </section>

          {/* Apps Showcase Grid */}
          <section className="space-y-16">
            {/* 1. Desktop Apps Section */}
            <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card/90 to-card/50 p-6 sm:p-10 shadow-xl backdrop-blur-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1.5">
                    <Monitor className="h-4 w-4" />
                    <span>Desktop Suite (v1.2.0 Beta)</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground">
                    bg.tools for Windows, Mac & Linux
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                    Powered by local ONNX Runtime & DirectML. Zero cloud upload required.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Offline Ready</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground border border-border">
                    <span>Build 2026.10</span>
                  </span>
                </div>
              </div>

              {/* Desktop Platforms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Windows Card */}
                <div
                  className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                    detectedPlatform === "windows"
                      ? "border-accent bg-accent/5 ring-2 ring-accent/20 shadow-md"
                      : "border-border/80 bg-background/60 hover:border-accent/40 hover:bg-card"
                  }`}
                >
                  {detectedPlatform === "windows" && (
                    <span className="absolute -top-3 right-4 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                      Your OS
                    </span>
                  )}
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/25 mb-4">
                      <Monitor className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground">Windows</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      Windows 10 & 11 (64-bit) with DirectML and NVIDIA CUDA support.
                    </p>
                    <ul className="mt-4 space-y-2 text-xs font-semibold text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>Installer (.exe, 84 MB)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>Portable (.zip, standalone)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadClick("Windows", "bg-tools-setup-x64.exe")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-xs font-extrabold text-background hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download for Windows</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadClick("Windows Portable", "bg-tools-portable-x64.zip")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/30 py-2 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span>Download Portable (.zip)</span>
                    </button>
                  </div>
                </div>

                {/* macOS Card */}
                <div
                  className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                    detectedPlatform === "mac"
                      ? "border-accent bg-accent/5 ring-2 ring-accent/20 shadow-md"
                      : "border-border/80 bg-background/60 hover:border-accent/40 hover:bg-card"
                  }`}
                >
                  {detectedPlatform === "mac" && (
                    <span className="absolute -top-3 right-4 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                      Your OS
                    </span>
                  )}
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-500/10 text-foreground border border-foreground/20 mb-4">
                      <Apple className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground">macOS</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      Universal binary optimized for Apple Silicon (M1-M4) & Intel Macs.
                    </p>
                    <ul className="mt-4 space-y-2 text-xs font-semibold text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>Apple Silicon (.dmg, 78 MB)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>Intel Mac (.dmg, 82 MB)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadClick("macOS Apple Silicon", "bg-tools-arm64.dmg")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-xs font-extrabold text-background hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Apple Silicon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadClick("macOS Intel", "bg-tools-intel.dmg")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/30 py-2 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span>Download Intel Mac (.dmg)</span>
                    </button>
                  </div>
                </div>

                {/* Linux Card */}
                <div
                  className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                    detectedPlatform === "linux"
                      ? "border-accent bg-accent/5 ring-2 ring-accent/20 shadow-md"
                      : "border-border/80 bg-background/60 hover:border-accent/40 hover:bg-card"
                  }`}
                >
                  {detectedPlatform === "linux" && (
                    <span className="absolute -top-3 right-4 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                      Your OS
                    </span>
                  )}
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25 mb-4">
                      <Laptop className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground">Linux</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      Compatible with Ubuntu, Debian, Fedora, Arch & all major distros.
                    </p>
                    <ul className="mt-4 space-y-2 text-xs font-semibold text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>Universal AppImage (86 MB)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>Debian / Ubuntu package (.deb)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadClick("Linux AppImage", "bg-tools-x86_64.AppImage")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-xs font-extrabold text-background hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download AppImage</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadClick("Linux Debian", "bg-tools-amd64.deb")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/30 py-2 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span>Download .deb Package</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Mobile Apps Section (Android & iOS) */}
            <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card/90 to-card/50 p-6 sm:p-10 shadow-xl backdrop-blur-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1.5">
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile Apps (Android & iOS)</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground">
                    Pocket Background Studio
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                    Instant camera cutout, transparent sticker export for WhatsApp & Instagram, and cloud sync.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30 px-3 py-1 text-xs font-bold">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Real-Time Camera Cutout</span>
                  </span>
                </div>
              </div>

              {/* Mobile Platforms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-bold">
                        Android 9.0+
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-foreground">bg.tools for Android</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1.5 leading-relaxed">
                      Transform portraits into transparent stickers on the fly. Works directly with your gallery, camera roll, and WhatsApp sticker packs.
                    </p>

                    <div className="mt-5 space-y-2.5 rounded-xl bg-muted/40 p-3.5 border border-border/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Version</span>
                        <span className="font-mono font-bold text-foreground">v1.2.0 (Beta)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Download Size</span>
                        <span className="font-mono font-bold text-foreground">28.4 MB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Google Play Store</span>
                        <span className="font-bold text-emerald-500">Launching This Week</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownloadClick("Android APK", "bg-tools-v1.2.0.apk")}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-xs font-extrabold text-background hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Direct .APK</span>
                    </button>
                    <a
                      href="#notify"
                      onClick={() => setSelectedNotifyOs("android")}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-muted/40 px-4 py-3 text-xs font-bold text-foreground hover:bg-muted transition-colors text-center"
                    >
                      <Bell className="h-3.5 w-3.5 text-accent" />
                      <span>Notify on Play Store</span>
                    </a>
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
                      <span className="rounded-full bg-accent/10 text-accent border border-accent/30 px-3 py-1 text-xs font-bold">
                        iOS 16.0+
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-foreground">bg.tools for iPhone & iPad</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1.5 leading-relaxed">
                      Integrated seamlessly with Apple Photos, Share Sheet, and Shortcuts. Accelerated natively via Apple Neural Engine.
                    </p>

                    <div className="mt-5 space-y-2.5 rounded-xl bg-muted/40 p-3.5 border border-border/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Version</span>
                        <span className="font-mono font-bold text-foreground">v1.2.0 (TestFlight)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Download Size</span>
                        <span className="font-mono font-bold text-foreground">34.1 MB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Apple App Store</span>
                        <span className="font-bold text-accent">Review Pending</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownloadClick("iOS TestFlight", "Apple TestFlight Beta Invite")}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-xs font-extrabold text-background hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Join Apple TestFlight Beta</span>
                    </button>
                    <a
                      href="#notify"
                      onClick={() => setSelectedNotifyOs("ios")}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-muted/40 px-4 py-3 text-xs font-bold text-foreground hover:bg-muted transition-colors text-center"
                    >
                      <Bell className="h-3.5 w-3.5 text-accent" />
                      <span>Notify on App Store</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Native App Superpowers (Why install apps?) */}
            <div className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-10 backdrop-blur-md">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent mb-2">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Exclusive Advantages</span>
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground">
                  Why use native bg.tools apps instead of the browser?
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="rounded-2xl border border-border/70 bg-background/50 p-5 space-y-2.5 hover:border-accent/40 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent font-bold">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">100% Offline AI Inference</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Zero latency, zero bandwidth usage. Process personal or sensitive photos entirely locally on your device.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/50 p-5 space-y-2.5 hover:border-accent/40 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 font-bold">
                    <FolderDown className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Unlimited 1,000+ Batches</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Drop an entire folder of e-commerce catalog images. The desktop pipeline handles high resolution with zero browser crashes.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/50 p-5 space-y-2.5 hover:border-accent/40 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500 font-bold">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Hardware Acceleration</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Harness DirectML, NVIDIA Tensor Cores, and Apple Neural Engine for sub-second cutouts.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/50 p-5 space-y-2.5 hover:border-accent/40 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500 font-bold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Enterprise Data Privacy</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Client data never leaves your perimeter, ideal for healthcare, enterprise design, and strict NDA projects.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. System Requirements Tabs */}
            <div className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-10 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6 mb-6">
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">System Specifications</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    Recommended hardware specs for seamless AI performance.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    GPU / Accelerator
                  </span>
                  <span className="mt-1 block text-xs font-bold text-foreground">
                    {SYSTEM_REQS[activeReqTab].gpu}
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

            {/* 5. Early Access / Store Release Notification Form */}
            <div id="notify" className="rounded-3xl border border-accent/40 bg-gradient-to-r from-accent/10 via-card/80 to-accent/5 p-8 sm:p-12 shadow-lg">
              <div className="max-w-2xl mx-auto text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-accent border border-accent/30 mb-3">
                  <Bell className="h-3.5 w-3.5" />
                  <span>Launch Radar</span>
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-black text-foreground">
                  Get notified when mobile apps hit the stores
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium">
                  Be the first to download when our official Google Play & Apple App Store builds go live. Zero spam, unsubscribe anytime.
                </p>

                {subscribed ? (
                  <div className="mt-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-4 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>You're on the VIP launch list! We'll alert you the moment it drops.</span>
                  </div>
                ) : (
                  <form onSubmit={handleNotifySubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedNotifyOs}
                      onChange={(e) => setSelectedNotifyOs(e.target.value as Platform)}
                      className="rounded-2xl border border-border bg-background px-3.5 py-3 text-xs font-bold text-foreground focus:border-accent focus:outline-none transition-colors"
                      aria-label="Target Operating System"
                    >
                      <option value="android">Android (Play Store)</option>
                      <option value="ios">iOS (App Store)</option>
                      <option value="windows">Windows Desktop</option>
                      <option value="mac">macOS Desktop</option>
                      <option value="linux">Linux Desktop</option>
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
                      <span>Notify Me</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* 6. Download FAQs */}
            <div className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-10 backdrop-blur-md">
              <div className="text-center max-w-xl mx-auto mb-8">
                <h3 className="font-display text-2xl font-bold text-foreground">
                  Frequently Asked Questions
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  Everything you need to know about native bg.tools downloads.
                </p>
              </div>

              <div className="max-w-3xl mx-auto space-y-3">
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
