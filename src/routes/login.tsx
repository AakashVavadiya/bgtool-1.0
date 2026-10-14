import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AuthUser } from "@/lib/auth-user";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
  ArrowLeft,
  Shield,
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
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:grid lg:grid-cols-12 relative">
      {/* LEFT COLUMN: Clean Minimalist Brand Panel (NO gradients, ONLY BG., back button, terms, privacy, made in bharat) */}
      <aside className="relative lg:col-span-5 hidden lg:flex flex-col justify-between border-r border-border bg-card/40 p-10 xl:p-14">
        {/* Top: Back to Home Button Only (Top BG Logo removed) */}
        <div className="flex items-center justify-end">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-full border border-border px-3.5 py-1.5 hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Center: Dotted Halftone Big Logo (Same as Home Page) */}
        <div className="my-auto py-12 flex flex-col items-start justify-center select-none">
          <div className="leading-none">
            <span className="halftone-text font-display text-7xl sm:text-8xl xl:text-9xl font-medium tracking-tight text-foreground">
              bg
            </span>
            <span className="halftone-text font-display text-7xl sm:text-8xl xl:text-9xl font-medium tracking-tight text-accent">
              .
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground font-medium max-w-xs">
            High-precision AI image processing and creative suite.
          </p>
        </div>

        {/* Bottom: Made in Bharat Tag & Terms / Privacy Links */}
        <div className="flex items-center justify-between pt-6 border-t border-border text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
            <span className="h-2 w-2 rounded-full bg-[#f97316]" />
            <span>Made in Bharat</span>
          </span>

          <div className="flex items-center gap-4 font-medium">
            <Link to="/terms" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Terms
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </aside>

      {/* RIGHT COLUMN: Login Form Area (NO gradients, Clean Website Card) */}
      <main className="lg:col-span-7 flex items-center justify-center px-4 sm:px-8 py-12 lg:py-16 relative">
        <div className="w-full max-w-md">
          {/* Mobile Top Header */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link to="/" className="font-display text-2xl font-black tracking-tight text-foreground">
              BG<span className="text-accent">.</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Link>
          </div>

          {/* Clean Card Container (NO gradients) */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xl">
            <div className="mb-8 space-y-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Sign in to your account
              </h1>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-bold text-foreground underline underline-offset-4 hover:text-accent transition-colors"
                >
                  Create one now
                </Link>
              </p>
            </div>

            {/* Unverified Guidance Alert */}
            {unverifiedEmail && (
              <div
                role="alert"
                className="mb-6 rounded-2xl border border-border bg-muted/40 p-4 text-xs font-medium text-foreground space-y-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-[#f97316]" />
                  <div className="flex-1">
                    <strong>Email Verification Required:</strong> Your account is registered but unverified. Please verify your 6-digit OTP to activate your account.
                  </div>
                </div>
                <div className="pt-1">
                  <Link
                    to="/verify-email"
                    search={{ email: unverifiedEmail } as any}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-3.5 py-1.5 font-bold text-xs text-white transition-colors"
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
                className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive"
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
                    className="rounded-2xl border-border bg-muted/30 px-3.5 py-3 pl-11 text-sm h-12 focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent"
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
                    className="text-xs font-semibold text-muted-foreground hover:text-accent transition-colors"
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
                    className="rounded-2xl border-border bg-muted/30 px-3.5 py-3 pl-11 pr-11 text-sm h-12 focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent"
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

              {/* Solid Submit Button (NO Gradients) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-sm py-3.5 px-6 shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
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

            {/* Mobile Footer with Made in Bharat & Legal Links */}
            <div className="lg:hidden flex items-center justify-between pt-6 mt-6 border-t border-border text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                <span>Made in Bharat</span>
              </span>
              <div className="flex items-center gap-3 font-medium">
                <Link to="/terms" className="hover:text-foreground">Terms</Link>
                <span>•</span>
                <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="mt-6 pt-5 border-t border-border/50 text-center">
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
