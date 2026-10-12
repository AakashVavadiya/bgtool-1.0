import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AuthUser } from "@/lib/auth-user";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenCoin } from "@/components/TokenCoins";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  Shield,
  Check,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In | bg.tools" },
      { name: "description", content: "Log in to your bg.tools account to access tools, credits, and subscriptions." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => {
    return {
      redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
    };
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    const user = AuthUser.getCurrentUser();
    if (user) {
      navigate({ to: search.redirect || "/account" });
    }
  }, [navigate, search.redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setUnverifiedEmail(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await AuthUser.login(cleanEmail, password);
      if (!res.success) {
        if (res.requireVerification) {
          setUnverifiedEmail(res.email || cleanEmail);
          setErrorMsg(res.error || "Your email address has not been verified yet.");
        } else {
          setErrorMsg(res.error || "Invalid email or password.");
          toast.error(res.error || "Login failed.");
        }
        setIsLoading(false);
        return;
      }

      toast.success(`Welcome back, ${res.user!.name}!`);
      const target = search.redirect && search.redirect !== "/login" ? search.redirect : "/account";
      navigate({ to: target as any });
    } catch {
      setErrorMsg("An unexpected network error occurred. Please try again.");
      toast.error("Network error during login.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:grid lg:grid-cols-12 selection:bg-amber-500/20 relative overflow-hidden">
      {/* Ambient Lights */}
      <div className="pointer-events-none absolute -top-40 -left-20 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-orange-500/8 blur-[140px]" />

      {/* LEFT COLUMN: Creative Showcase Panel (5 or 6 cols on lg) */}
      <aside className="relative lg:col-span-6 xl:col-span-5 hidden lg:flex flex-col justify-between border-r border-border/70 bg-card/40 backdrop-blur-2xl p-10 xl:p-14 overflow-hidden">
        {/* Subtle Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Top Brand Link */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/"
            className="group flex items-center gap-2 font-display text-2xl font-black tracking-tight text-foreground transition-transform hover:scale-105"
          >
            <span>bg</span>
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 inline-block" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Middle Content */}
        <div className="relative z-10 my-auto py-8 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 px-3.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 shadow-sm animate-in fade-in duration-500">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Welcome Back to bg.tools</span>
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-4xl xl:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
              Log in & resume your{" "}
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                creative workflow.
              </span>
            </h1>
            <p className="text-sm xl:text-base text-muted-foreground leading-relaxed max-w-md">
              Access your daily token allowances, purchased Gold Token packs, processed batches, and fast export pipelines.
            </p>
          </div>

          {/* Creative Quick Stats Card */}
          <div className="rounded-3xl border border-border/80 bg-card/85 backdrop-blur-xl p-5 shadow-xl space-y-4 hover:shadow-2xl hover:border-amber-500/40 transition-all duration-300 group">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 font-black text-sm shadow-md">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Token System Active</p>
                  <p className="text-[10px] text-muted-foreground">All tools ready with high-speed queue</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Online
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <TokenCoin type="bronze" size="xs" />
                  <span>Daily Free Tokens</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Refreshed daily for active creators.</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <TokenCoin type="gold" size="xs" showGlow />
                  <span>Gold Tokens</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Your balance is securely preserved.</p>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="space-y-3 text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <Check className="h-3 w-3" />
              </div>
              <span>Hostinger encrypted SMTP OTP verification</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <Check className="h-3 w-3" />
              </div>
              <span>Session tokens secured with HttpOnly cookies & SHA-256</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
          <p>© {new Date().getFullYear()} bg.tools. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
        </div>
      </aside>

      {/* RIGHT COLUMN: Form Panel */}
      <main className="lg:col-span-6 xl:col-span-7 flex items-center justify-center px-4 sm:px-8 py-12 lg:py-16 relative">
        <div className="w-full max-w-lg">
          {/* Mobile Top Header */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link to="/" className="font-display text-2xl font-black tracking-tight text-foreground">
              bg<span className="text-amber-500">.</span>
            </Link>
            <Link
              to="/signup"
              className="text-xs font-bold text-foreground border border-border/80 rounded-full px-3.5 py-1.5 hover:bg-muted transition-colors"
            >
              Sign Up
            </Link>
          </div>

          {/* Elevated Glassmorphic Card Container */}
          <div className="relative rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            {/* Top Gradient Line */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-t-3xl" />

            <div className="mb-8 space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Sign in to your account
              </h2>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-bold text-foreground underline underline-offset-4 hover:text-amber-500 transition-colors"
                >
                  Create one now for free
                </Link>
              </p>
            </div>

            {/* Unverified Guidance Alert */}
            {unverifiedEmail && (
              <div
                role="alert"
                className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-700 dark:text-amber-300 animate-in fade-in duration-200 space-y-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                  <div className="flex-1">
                    <strong>Email Verification Required:</strong> Your account is registered but unverified. Please verify your 6-digit OTP to activate your account.
                  </div>
                </div>
                <div className="pt-1">
                  <Link
                    to="/verify-email"
                    search={{ email: unverifiedEmail } as any}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 font-bold text-xs text-slate-950 hover:bg-amber-400 transition-colors"
                  >
                    <span>Verify Email Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Error Message Box */}
            {errorMsg && !unverifiedEmail && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400 animate-in fade-in duration-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Email Address */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="login-email"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    disabled={isLoading}
                    className="rounded-2xl border-border bg-muted/30 px-3.5 py-3 pl-11 text-sm h-12 focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                  />
                  <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="login-password"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-muted-foreground hover:text-amber-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your account password"
                    disabled={isLoading}
                    className="rounded-2xl border-border bg-muted/30 px-3.5 py-3 pl-11 pr-11 text-sm h-12 focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                  />
                  <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm py-4 px-6 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Security Guarantee */}
            <div className="mt-8 pt-6 border-t border-border/50 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                <Shield className="h-3 w-3 text-emerald-500" />
                <span>256-bit Encrypted Session • Protected by bg.tools</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
