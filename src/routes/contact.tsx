import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronDown,
  Check,
  HelpCircle,
  CreditCard,
  Zap,
  Bug,
  X,
} from "lucide-react";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { buildPageMeta } from "@/lib/seo";

interface ContactTopic {
  id: string;
  label: string;
  desc: string;
  badge?: string;
  icon: typeof HelpCircle;
}

const CONTACT_TOPICS: ContactTopic[] = [
  {
    id: "General Support",
    label: "General Support & Question",
    desc: "Assistance with your account, features, or general inquiries",
    icon: HelpCircle,
    badge: "General",
  },
  {
    id: "Billing & Credits",
    label: "Billing & Credits Inquiry",
    desc: "Invoices, subscription changes, payment or refund questions",
    icon: CreditCard,
    badge: "Billing",
  },
  {
    id: "Enterprise API",
    label: "Enterprise API & High-Volume Batch",
    desc: "Custom pricing, dedicated throughput & SLA agreements",
    icon: Zap,
    badge: "Enterprise",
  },
  {
    id: "Bug Report",
    label: "Model Accuracy or Bug Report",
    desc: "Report segmentation edge cases, artifacts or site glitches",
    icon: Bug,
    badge: "Technical",
  },
];

export const Route = createFileRoute("/contact")({
  head: () => {
    const seo = buildPageMeta({
      title: "Contact Us & Support | bg.tools",
      description: "Contact the bg.tools team for API integration, enterprise high-volume processing, billing inquiries, and technical support.",
      path: "/contact",
    });
    return {
      meta: seo.meta,
      links: seo.links,
      scripts: seo.scripts,
    };
  },
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Support");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const topicRef = useRef<HTMLDivElement>(null);

  // Close topic dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (topicRef.current && !topicRef.current.contains(event.target as Node)) {
        setIsTopicOpen(false);
      }
    };

    if (isTopicOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isTopicOpen]);

  // Lock body scroll on mobile and handle Escape key
  useEffect(() => {
    if (!isTopicOpen) return;

    const originalOverflow = document.body.style.overflow;
    if (window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsTopicOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTopicOpen]);

  const activeTopic =
    CONTACT_TOPICS.find((t) => t.id === subject) || CONTACT_TOPICS[0]!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please complete all required fields.");
      return;
    }
    
    // Save to server persistence
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
    } catch (err) {
      console.warn("Failed to post to /api/contact directly:", err);
    }

    // Save to Admin Support Desk Inbox
    import("@/admin/lib/admin-store").then(({ AdminStore }) => {
      AdminStore.addContactInquiry(name, email, subject, message);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(REALTIME_EVENT_NAME, {
            detail: { type: "contact_submission", name, email, subject },
          })
        );
      }
    });

    setSubmitted(true);
    toast.success("Message sent! Our support team will reply within 2 working days.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader />

        <main className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-foreground">Contact Us</span>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 items-start">
            {/* Left Contact Info */}
            <div>
              <h1 className="font-display text-4xl font-extrabold sm:text-5xl md:text-6xl tracking-tight">
                Get in Touch with Team bg.tools<span className="text-accent">.</span>
              </h1>
              <p className="mt-4 text-base md:text-lg font-medium text-muted-foreground leading-relaxed">
                Have questions about our AI models, custom enterprise API rates, or need assistance with your credits? We’re here to help.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 font-bold">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">Direct Email Support</h3>
                    <p className="text-sm font-semibold text-foreground mt-0.5">support@bg.tools</p>
                    <p className="text-xs text-muted-foreground mt-1">For general help, billing & account inquiries.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 font-bold">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">Enterprise & High Volume API</h3>
                    <p className="text-sm font-semibold text-foreground mt-0.5">enterprise@bg.tools</p>
                    <p className="text-xs text-muted-foreground mt-1">Dedicated GPU nodes, custom SLAs & batch webhooks.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 font-bold">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">Response Guarantee</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Average reply time: <strong>2 Working Days</strong> (Mon – Sat)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Contact Form */}
            <div className="rounded-3xl border-2 border-border bg-card p-8 md:p-10 shadow-xl">
              {submitted ? (
                <div className="py-12 text-center rise-in">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-500 shadow-md">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold">Thank You!</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Your message has been sent directly to our support engineering team. We'll be in touch shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-6 rounded-full border border-border bg-background px-6 py-3 text-sm font-bold transition-all hover:bg-foreground hover:text-background"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="font-display text-2xl font-bold text-foreground">Send Us a Message</h2>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Your Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm font-semibold text-foreground focus:border-foreground focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Work Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm font-semibold text-foreground focus:border-foreground focus:outline-none"
                    />
                  </div>

                  <div className="relative" ref={topicRef}>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Topic</label>
                    <button
                      type="button"
                      onClick={() => setIsTopicOpen(!isTopicOpen)}
                      className="w-full flex items-center justify-between rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm font-semibold text-foreground focus:border-foreground focus:outline-none transition-all hover:border-border/80 cursor-pointer shadow-xs text-left"
                      aria-haspopup="listbox"
                      aria-expanded={isTopicOpen}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/15 text-accent shrink-0">
                          <activeTopic.icon className="h-4 w-4" />
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-foreground block truncate">
                            {activeTopic.label}
                          </span>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                          isTopicOpen ? "rotate-180 text-foreground" : ""
                        }`}
                      />
                    </button>

                    {/* Mobile Backdrop Overlay */}
                    {isTopicOpen && (
                      <div
                        className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-xs sm:hidden animate-in fade-in duration-200"
                        onClick={() => setIsTopicOpen(false)}
                        aria-hidden="true"
                      />
                    )}

                    {/* Dropdown Menu (Desktop) / Bottom Sheet Drawer (Mobile) */}
                    {isTopicOpen && (
                      <div
                        role="listbox"
                        aria-label="Select Inquiry Topic"
                        className="fixed inset-x-0 bottom-0 z-[99999] w-full rounded-t-[32px] border-t border-border bg-card/98 p-5 text-foreground shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh] pb-8 sm:fixed-none sm:absolute sm:inset-auto sm:top-full sm:mt-2 sm:left-0 sm:right-0 sm:z-50 sm:w-full sm:rounded-2xl sm:border sm:border-border/80 sm:p-2 sm:pb-2 sm:max-h-[380px] sm:animate-in sm:fade-in sm:zoom-in-95 sm:duration-150 overflow-hidden"
                      >
                        {/* Mobile Pull Handle */}
                        <div className="pt-0.5 pb-3 sm:hidden flex justify-center shrink-0">
                          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                        </div>

                        {/* Sheet Header (Mobile) */}
                        <div className="flex items-center justify-between pb-3 border-b border-border/70 sm:hidden shrink-0">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/25">
                              <MessageSquare className="h-4 w-4" />
                            </span>
                            <div>
                              <h4 className="text-sm font-extrabold uppercase tracking-wide text-foreground">
                                Select Inquiry Topic
                              </h4>
                              <p className="text-[11px] text-muted-foreground font-medium">
                                Routes your inquiry to the dedicated specialist
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsTopicOpen(false)}
                            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted text-sm transition-colors cursor-pointer"
                            aria-label="Close"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Options List */}
                        <div className="space-y-1.5 pt-2 sm:pt-0 overflow-y-auto max-h-[60vh] sm:max-h-none">
                          {CONTACT_TOPICS.map((topic) => {
                            const isSelected = subject === topic.id;
                            const Icon = topic.icon;
                            return (
                              <button
                                key={topic.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setSubject(topic.id);
                                  setIsTopicOpen(false);
                                }}
                                className={`w-full flex items-center justify-between rounded-xl p-3 sm:p-2.5 text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-accent/15 border border-accent/40 text-foreground font-bold shadow-xs"
                                    : "hover:bg-muted/70 text-foreground border border-transparent"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-xl shrink-0 ${
                                      isSelected
                                        ? "bg-accent text-white"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs sm:text-sm font-bold text-foreground">
                                        {topic.label}
                                      </span>
                                      {topic.badge && (
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                          {topic.badge}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      {topic.desc}
                                    </p>
                                  </div>
                                </div>

                                {isSelected && (
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shrink-0 ml-2">
                                    <Check className="h-3 w-3 stroke-[3]" />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your request or question…"
                      className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm font-semibold text-foreground focus:border-foreground focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-foreground px-8 py-4 text-base font-extrabold text-background shadow-xl transition-all hover:scale-[1.02]"
                  >
                    <Send className="h-5 w-5" /> Send Message →
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
