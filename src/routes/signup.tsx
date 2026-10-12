import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AuthUser } from "@/lib/auth-user";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenCoin } from "@/components/TokenCoins";
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Sparkles,
  Zap,
  Check,
  Shield,
  Layers,
  ArrowLeft,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Free Account | bg.tools" },
      {
        name: "description",
        content: "Create your free bg.tools account. Get 10 daily Bronze Tokens, instant AI background removal and image conversion tools with zero tracking.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to account
  useEffect(() => {
    const user = AuthUser.getCurrentUser();
    if (user) {
      navigate({ to: "/account" });
    }
  }, [navigate]);

  // Dynamic Password Strength Calculator
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500 text-rose-500" };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500 text-amber-500" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500 text-blue-500" };
    return { score: 4, label: "Strong", color: "bg-emerald-500 text-emerald-500" };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await AuthUser.signUp(cleanName, cleanEmail, password);
      if (!res.success) {
        setErrorMsg(res.error || "Registration failed. Please check your information.");
        toast.error(res.error || "Registration failed.");
        setIsLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("bg_verify_email", cleanEmail);
      }

      toast.success("Account created! A 6-digit verification code has been sent to your email.");
      navigate({
        to: "/verify-email",
        search: { email: cleanEmail } as any,
      });
    } catch {
      setErrorMsg("An unexpected network error occurred. Please try again.");
      toast.error("Network error during registration.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:grid lg:grid-cols-12 selection:bg-amber-500/20 relative overflow-hidden">
      {/* Ambient Radial Lights */}
      <div className="pointer-events-none absolute -top-40 -left-20 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-orange-500/8 blur-[140px]" />

      {/* LEFT COLUMN: Creative Showcase Panel (5 or 6 cols on lg) */}
      <aside className="relative lg:col-span-6 xl:col-span-5 hidden lg:flex flex-col justify-between border-r border-border/70 bg-card/40 backdrop-blur-2xl p-10 xl:p-14 overflow-hidden">
        {/* Subtle Decorative Pattern Grid */}
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

        {/* Middle Creative Content */}
        <div className="relative z-10 my-auto py-8 space-y-8">
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 px-3.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 shadow-sm animate-in fade-in duration-500">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            <span>10 Free Bronze Tokens Daily Allowance</span>
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-4xl xl:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
              Create your account & unlock{" "}
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                instant AI tools.
              </span>
            </h1>
            <p className="text-sm xl:text-base text-muted-foreground leading-relaxed max-w-md">
              Experience ultra-fast background removal, high-definition exports, and automated conversions with zero watermarks and strict data privacy.
            </p>
          </div>

          {/* Creative Floating Visual Card */}
          <div className="rounded-3xl border border-border/80 bg-card/85 backdrop-blur-xl p-5 shadow-xl space-y-4 hover:shadow-2xl hover:border-amber-500/40 transition-all duration-300 group">
            {/* Live Token Status Pill */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 font-black text-sm shadow-md">
                  ✨
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Welcome Daily Allowance</p>
                  <p className="text-[10px] text-muted-foreground">Automatically credited upon signup</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                100% Free
              </span>
            </div>

            {/* Token Ecosystem Shimmer */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <TokenCoin type="bronze" size="xs" />
                  <span>Bronze Tokens</span>
                </div>
                <p className="text-[11px] text-muted-foreground">10 free tokens replenished every midnight UTC.</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <TokenCoin type="gold" size="xs" showGlow />
                  <span>Gold Tokens</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Permanent pay-as-you-go tokens that never expire.</p>
              </div>
            </div>

            {/* Status Footer */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>AI Vision Engine v2.4 Active</span>
              </span>
              <span className="font-mono text-foreground font-semibold">0.3s processing</span>
            </div>
          </div>

          {/* Value Props Checklist */}
          <div className="space-y-3 text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <Check className="h-3 w-3" />
              </div>
              <span><strong>Full Privacy:</strong> Uploaded images are wiped automatically from GPU memory</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <Check className="h-3 w-3" />
              </div>
              <span><strong>Fast Verification:</strong> Instant 6-digit OTP email delivery</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <Check className="h-3 w-3" />
              </div>
              <span><strong>No Credit Card Required:</strong> Get started completely free in under 60 seconds</span>
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

      {/* RIGHT COLUMN: Interactive Animated Form Area (6 or 7 cols on lg) */}
      <main className="lg:col-span-6 xl:col-span-7 flex items-center justify-center px-4 sm:px-8 py-12 lg:py-16 relative">
        <div className="w-full max-w-lg">
          {/* Mobile Top Header (hidden on desktop) */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link to="/" className="font-display text-2xl font-black tracking-tight text-foreground">
              bg<span className="text-amber-500">.</span>
            </Link>
            <Link
              to="/login"
              className="text-xs font-bold text-foreground border border-border/80 rounded-full px-3.5 py-1.5 hover:bg-muted transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Elevated Glassmorphic Card Container */}
          <div className="relative rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            {/* Top Gradient Highlight */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-t-3xl" />

            <div className="mb-8 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Create an account
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/25">
                  <Flame className="h-3 w-3 text-amber-500" />
                  <span>Free 10 Daily Tokens</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-foreground underline underline-offset-4 hover:text-amber-500 transition-colors"
                >
                  Log in
                </Link>
              </p>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400 animate-in fade-in duration-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="signup-name"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Full Name
                </Label>
                <div className="relative">
                  <Input
                    id="signup-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    disabled={isLoading}
                    className="rounded-2xl border-border bg-muted/30 px-3.5 py-3 pl-11 text-sm h-12 focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                  />
                  <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="signup-email"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="signup-email"
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
                    htmlFor="signup-password"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Password
                  </Label>
                  {password && (
                    <span className={`text-[11px] font-bold ${strength.color}`}>
                      {strength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
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

                {/* Animated Password Strength Bar */}
                {password && (
                  <div className="space-y-1 pt-1 animate-in fade-in duration-200">
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      <div className={`rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color.split(" ")[0] : "bg-muted"}`} />
                      <div className={`rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color.split(" ")[0] : "bg-muted"}`} />
                      <div className={`rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color.split(" ")[0] : "bg-muted"}`} />
                      <div className={`rounded-full transition-all duration-300 ${strength.score >= 4 ? strength.color.split(" ")[0] : "bg-muted"}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="signup-confirm-password"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Confirm Password
                  </Label>
                  {confirmPassword && (
                    <span
                      className={`text-[11px] font-bold ${
                        password === confirmPassword ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {password === confirmPassword ? "✓ Match" : "✗ Do not match"}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    disabled={isLoading}
                    className="rounded-2xl border-border bg-muted/30 px-3.5 py-3 pl-11 pr-11 text-sm h-12 focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                  />
                  <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                      <span>Creating Account & Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Terms and Security Footer */}
            <div className="mt-6 pt-5 border-t border-border/50 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link to="/terms" className="underline text-foreground hover:text-amber-500 transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="underline text-foreground hover:text-amber-500 transition-colors">
                  Privacy Policy
                </Link>
                .
              </p>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80 font-medium">
                <Shield className="h-3 w-3 text-emerald-500" />
                <span>256-bit Encrypted • Zero Tracking Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
