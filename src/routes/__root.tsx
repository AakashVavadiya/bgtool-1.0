import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouterState, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";

import { NotFoundPage } from "@/components/NotFoundPage";
import { ErrorPage } from "@/components/ErrorPage";
import { Telemetry } from "@/lib/telemetry";
import { initWebsiteTranslator } from "@/lib/translator";
import { RestrictedUserDialog } from "@/components/RestrictedUserDialog";
import { GlobalSiteDialog } from "@/components/GlobalSiteDialog";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { name: "theme-color", content: "#ffffff" },
      { name: "format-detection", content: "telephone=no" },
      { title: "bg.tools | Free Online AI Background Remover & Image Toolkit" },
      { name: "description", content: "Free online AI background removal, image upscaling, compression, and photo editing tools with zero data storage." },
      { name: "author", content: "bg.tools" },
      { property: "og:site_name", content: "bg.tools" },
      { property: "og:title", content: "bg.tools | Free Online AI Background Remover & Image Toolkit" },
      { property: "og:description", content: "Free online AI background removal, image upscaling, compression, and photo editing tools with zero data storage." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "google-site-verification", content: "jC5UUl7aRRsi_dD89rywdzNZXQaKTZcVqDJQAUQffIE" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Canonical Host & Tracking Query Sanitizer */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=window.location;var p=l.pathname.length>1?l.pathname.replace(/\\/+$/,""):l.pathname;var u=new URL(l.href);var k=["ref","utm_source","utm_medium","utm_campaign","utm_term","utm_content","utm_id","fbclid","gclid","msclkid","_ga","_gl"];var c=false;for(var i=0;i<k.length;i++){if(u.searchParams.has(k[i])){u.searchParams.delete(k[i]);c=true;}}var qs=u.searchParams.toString();var s=qs?"?"+qs:"";if(l.hostname==="www.bg.tools"){l.replace("https://bg.tools"+p+s+l.hash);return;}if((c||p!==l.pathname)&&window.history&&window.history.replaceState){window.history.replaceState(null,"",p+s+l.hash);}}catch(e){}})();`,
          }}
        />
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-RP1JF6Q4TY" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-RP1JF6Q4TY');`,
          }}
        />
        {/* Day / Night Theme Initializer: Defaults to Day Mode unless user explicitly saved Night mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("bg.theme.v1");if(t==="dark"){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}}catch(e){}})();`,
          }}
        />
        {/* Razorpay Checkout SDK */}
        <script async src="https://checkout.razorpay.com/v1/checkout.js" />
      </head>
      <body>
        <div id="google_translate_element" style={{ display: "none" }} className="notranslate" aria-hidden="true" />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  useEffect(() => {
    // Initialize full website translation engine with regional auto-detection
    initWebsiteTranslator();

    // Track Real Page View on Route change
    Telemetry.trackPageView(currentPath, document.title);

    // Track Google Analytics 4 pageview on route change (SPA navigation)
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("config", "G-RP1JF6Q4TY", {
        page_path: currentPath,
        page_title: typeof document !== "undefined" ? document.title : "",
      });
    }

    // Heartbeat every 20s to keep real-time live visitors counter accurate
    const timer = setInterval(() => {
      Telemetry.sendHeartbeat(currentPath);
    }, 20000);

    // Global Error & Promise Rejection listener to auto-send crash logs to Admin
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.message || "";
      if (msg.includes("Hydration failed") || msg.includes("hydrating") || msg.includes("Minified React error #418")) {
        return; // Filter out non-fatal React hydration warnings
      }

      import("@/admin/lib/admin-store").then(({ AdminStore }) => {
        AdminStore.addErrorLog({
          url: window.location.pathname,
          errorName: event.error?.name || "GlobalWindowError",
          message: event.message || "Uncaught window exception",
          stack: event.error?.stack,
          userAgent: navigator.userAgent,
          userFeedback: "Auto-captured global browser exception",
          severity: "critical",
        });
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      import("@/admin/lib/admin-store").then(({ AdminStore }) => {
        AdminStore.addErrorLog({
          url: window.location.pathname,
          errorName: "UnhandledPromiseRejection",
          message: String(event.reason?.message || event.reason || "Unhandled async rejection"),
          stack: event.reason?.stack,
          userAgent: navigator.userAgent,
          userFeedback: "Auto-captured async promise rejection",
          severity: "warning",
        });
      });
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      clearInterval(timer);
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [currentPath]);

  const isAdminRoute = currentPath.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster />
      {!isAdminRoute && <RestrictedUserDialog />}
      {!isAdminRoute && <GlobalSiteDialog />}
    </QueryClientProvider>
  );
}
