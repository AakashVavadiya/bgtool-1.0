import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AuthUser } from "@/lib/auth-user";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up | bg.tools" },
      {
        name: "description",
        content: "Create your free bg.tools account. Get 10 daily bronze tokens, studio background removal and conversion tools.",
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

  // If already logged in, redirect to account or home
  useEffect(() => {
    const user = AuthUser.getCurrentUser();
    if (user) {
      navigate({ to: "/account" });
    }
  }, [navigate]);

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
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      {/* Brand Panel */}
      <aside className="grain relative hidden flex-col justify-between border-r border-border p-10 lg:flex bg-card/30">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
          bg<span className="text-accent">.</span>
        </Link>
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>10 Free Bronze Tokens Daily</span>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground lg:text-5xl leading-tight">
            Create your account & unlock instant AI tools.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            Experience ultra-fast background removal, batch processing, face blur, and PDF conversion with zero tracking and full privacy.
          </p>
          <div className="mt-8 space-y-3 max-w-sm text-xs text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Full privacy — uploaded images deleted automatically</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Hostinger encrypted email delivery</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Pay-as-you-go Gold Tokens that never expire</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} bg.tools. All rights reserved.</p>
      </aside>

      {/* Main Form Area */}
      <main className="flex items-center justify-center px-5 py-12 md:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="font-display text-2xl font-semibold tracking-tight lg:hidden inline-block mb-6">
              bg<span className="text-accent">.</span>
            </Link>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-foreground underline hover:text-accent transition-colors">
                Log in
              </Link>
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400 animate-fade-in"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="signup-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  className="rounded-xl border-border bg-card/60 px-3.5 py-2.5 pl-10 text-sm focus:border-foreground"
                />
                <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  className="rounded-xl border-border bg-card/60 px-3.5 py-2.5 pl-10 text-sm focus:border-foreground"
                />
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="signup-confirm-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confirm Password
              </Label>
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
                  className="rounded-xl border-border bg-card/60 px-3.5 py-2.5 pl-10 pr-10 text-sm focus:border-foreground"
                />
                <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  <span>Creating Account & Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing up, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
