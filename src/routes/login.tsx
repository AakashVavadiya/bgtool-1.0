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
  Sparkles,
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
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      {/* Brand Panel */}
      <aside className="grain relative hidden flex-col justify-between border-r border-border p-10 lg:flex bg-card/30">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
          bg<span className="text-accent">.</span>
        </Link>
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Secure Authentication</span>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground lg:text-5xl leading-tight">
            Welcome back to your creative studio.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            Sign in to access your saved balances, Gold Tokens, bulk processing pipelines, and high-resolution exports.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} bg.tools. All rights reserved.</p>
      </aside>

      {/* Main Login Form */}
      <main className="flex items-center justify-center px-5 py-12 md:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="font-display text-2xl font-semibold tracking-tight lg:hidden inline-block mb-6">
              bg<span className="text-accent">.</span>
            </Link>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Sign in to bg.tools
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="font-semibold text-foreground underline hover:text-accent transition-colors">
                Create one now
              </Link>
            </p>
          </div>

          {/* Unverified Guidance Alert */}
          {unverifiedEmail && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-700 dark:text-amber-300 animate-fade-in space-y-2.5"
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

          {/* Error Alert */}
          {errorMsg && !unverifiedEmail && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400 animate-fade-in"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  className="rounded-xl border-border bg-card/60 px-3.5 py-2.5 pl-10 text-sm focus:border-foreground"
                />
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
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
                  className="rounded-xl border-border bg-card/60 px-3.5 py-2.5 pl-10 pr-10 text-sm focus:border-foreground"
                />
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-bold text-background transition-all hover:scale-[1.01] hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-lg mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Social / Free Tools note */}
          <div className="mt-8 rounded-2xl border border-border/60 bg-muted/30 p-4 text-center text-xs text-muted-foreground">
            Looking to try tools without logging in? You can use free tools as a guest anytime on the{" "}
            <Link to="/" className="font-semibold text-foreground underline">
              Home Studio
            </Link>
            .
          </div>
        </div>
      </main>
    </div>
  );
}
