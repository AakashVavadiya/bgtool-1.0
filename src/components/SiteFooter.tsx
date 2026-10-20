import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { LanguageTranslator } from "@/components/LanguageTranslator";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { ProductHuntBadge } from "@/components/ProductHuntBadge";
import { AdminStore, type UiEditSettings } from "@/admin/lib/admin-store";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Mail,
} from "lucide-react";

export function SiteFooter() {
  const [uiSettings, setUiSettings] = useState<UiEditSettings>(() => AdminStore.getUiSettings());
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

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

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubscribed(true);
    toast.success("Subscribed! You'll receive AI product updates & credit drops.");
    setEmail("");
  };

  return (
    <footer className="w-full border-t border-border bg-card/60 text-foreground transition-colors">
      {/* Top Banner: Newsletter & Live Status */}
      {uiSettings.structure?.showFooterNewsletter !== false && (
        <div className="border-b border-border bg-muted/30 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8 sm:py-10">
          <div className="w-full flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All 5 AI Models Online • 99.9% Uptime</span>
              </div>
              <h3 className="mt-3 font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                Stay ahead with AI image processing releases
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-medium">
                Get weekly updates on model accuracy improvements, 4K batch features & bonus credits.
              </p>
            </div>

          {/* Newsletter Form */}
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row w-full max-w-md items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email…"
                className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm font-semibold placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-all shadow-xs"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-extrabold text-background shadow-md transition-all hover:scale-105 shrink-0"
            >
              {subscribed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Joined
                </>
              ) : (
                <>
                  Subscribe <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      )}

      {/* Main Grid Section */}
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-12 sm:py-16 md:py-20">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-1">
            <Link to="/" className="notranslate font-display text-4xl font-extrabold tracking-tight">
              bg<span className="text-accent">.</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed font-medium text-muted-foreground">
              Ultra-fast online AI image toolkit. Sub-pixel alpha matting background removal, 4K upscaling, and object cleaning.
            </p>
            <div className="mt-5">
              <ProductHuntBadge variant="compact" />
            </div>
          </div>

          {/* Tools & Shortcuts */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              AI Tools & Shortcuts
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold">
              {AdminStore.isToolEnabled("remove-background") && (
                <li>
                  <Link to="/tools/$slug" params={{ slug: "remove-background" }} className="hover:text-accent transition-colors">
                    Background Remover (4K)
                  </Link>
                </li>
              )}
              {AdminStore.isToolEnabled("rotate-crop") && (
                <li>
                  <Link to="/tools/$slug" params={{ slug: "rotate-crop" }} className="hover:text-accent transition-colors">
                    Rotate & Flip Image
                  </Link>
                </li>
              )}
              {AdminStore.isToolEnabled("remove-watermark") && (
                <li>
                  <Link to="/tools/$slug" params={{ slug: "remove-watermark" }} className="hover:text-accent transition-colors">
                    Watermark & Eraser
                  </Link>
                </li>
              )}
              {AdminStore.isToolEnabled("clean-upscale") && (
                <li>
                  <Link to="/tools/$slug" params={{ slug: "clean-upscale" }} className="hover:text-accent transition-colors">
                    Clean & 4K Upscale
                  </Link>
                </li>
              )}
              {AdminStore.isToolEnabled("convert-compress") && (
                <li>
                  <Link to="/tools/$slug" params={{ slug: "convert-compress" }} className="hover:text-accent transition-colors">
                    Convert PNG, JPG, WebP
                  </Link>
                </li>
              )}
              <li className="pt-1 border-t border-border/50">
                <Link to="/tools" className="font-bold text-accent hover:underline flex items-center gap-1">
                  <span>Browse All 130+ Tools</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* AI Models Suite - Hidden when AI Models is turned OFF */}
          {uiSettings.aiMasterEnabled &&
            uiSettings.aiModelsPageEnabled &&
            uiSettings.aiFooterLinksEnabled &&
            AdminStore.isPageEnabled("/models") && (
              <div>
                <h4 className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  AI Models Suite
                </h4>
                <ul className="mt-4 space-y-2.5 text-sm font-semibold">
                  <li>
                    <Link to="/models" className="hover:text-accent transition-colors flex items-center gap-1.5">
                      <span>Karudi (Universal Master)</span>
                      <span className="rounded-full bg-foreground text-background px-1.5 py-0.2 text-[9px] font-bold">★</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/models" className="hover:text-accent transition-colors">
                      Ganga (Background Removal)
                    </Link>
                  </li>
                  <li>
                    <Link to="/models" className="hover:text-accent transition-colors">
                      Brahmaputra (Format Conversion)
                    </Link>
                  </li>
                  <li>
                    <Link to="/models" className="hover:text-accent transition-colors">
                      Narmada (OCR, Summary & Memes)
                    </Link>
                  </li>
                  <li>
                    <Link to="/models" className="hover:text-accent transition-colors">
                      Saraswati (Research Tools)
                    </Link>
                  </li>
                </ul>
              </div>
            )}

          {/* Pricing & Accounts */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Plans & Apps
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold">
              <li>
                <Link to="/download" className="hover:text-accent transition-colors flex items-center gap-1.5 font-bold text-accent">
                  <span>Download Apps & Extension</span>
                  <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 px-1.5 py-0.2 text-[9px] font-bold">Coming Soon</span>
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-accent transition-colors">
                  Free Daily Credits (10/day)
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-accent transition-colors">
                  Pay-As-You-Go Packs
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-accent transition-colors">
                  Lite Plan (₹499/mo)
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-accent transition-colors">
                  Pro Plan (₹1,999/mo)
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-accent transition-colors">
                  Account Sign In / Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & API */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Support &amp; API
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold">
              <li>
                <Link to="/api" className="hover:text-accent transition-colors flex items-center gap-1.5 font-bold text-accent">
                  <span>API Platform &amp; Docs</span>
                  <span className="rounded-full bg-accent/15 text-accent border border-accent/25 px-1.5 py-0.2 text-[9px] font-bold">REST</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-accent transition-colors">
                  Contact Us & Support
                </Link>
              </li>
              <li>
                <Link to="/news" className="hover:text-accent transition-colors">
                  News &amp; Guides
                </Link>
              </li>
              <li>
                <Link to="/developer" className="hover:text-accent transition-colors flex items-center gap-1.5 font-bold text-amber-500">
                  <span>Meet the Developers</span>
                  <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 px-1.5 py-0.2 text-[9px] font-bold">Upanishad</span>
                </Link>
              </li>
              <li>
                <Link to="/pricing" hash="faq" className="hover:text-accent transition-colors">
                  General FAQs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature Badges & Security */}
        {uiSettings.structure?.showFooterBadges !== false && (
          <div className="mt-12 sm:mt-16 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 rounded-2xl sm:rounded-3xl border border-border bg-muted/20 p-5 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3.5 sm:gap-6 text-xs md:text-sm font-bold">
              <div className="flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Zero File Storage Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Sub-Second Latency</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" />
                <span>4K HD Lossless Exports</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground pt-3 md:pt-0 border-t md:border-t-0 border-border/50">
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-foreground shrink-0" />
                <span>Need enterprise high-volume batch API?</span>
              </div>
              <Link to="/contact" className="font-bold text-foreground hover:underline inline-flex items-center gap-1">
                Contact Team →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border bg-background px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-6 sm:py-8">
        <div className="w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs md:text-sm font-semibold text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            <span>© {new Date().getFullYear()} Upanishad. All rights reserved.</span>
            <LanguageTranslator variant="footer" />
            <CurrencySwitcher variant="footer" />
          </div>

          <div className="flex flex-wrap items-center gap-3.5 sm:gap-6">
            <Link to="/developer" className="hover:text-foreground transition-colors font-bold text-foreground/80 flex items-center gap-1">
              <span>Upanishad Team</span>
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Notice</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <span className="flex items-center gap-1">
              Made in Bharat
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
