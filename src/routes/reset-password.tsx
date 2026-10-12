import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { AuthUser } from "@/lib/auth-user";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password | bg.tools" },
      { name: "description", content: "Create a new password for your bg.tools account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { token?: string | undefined } => {
    return {
      token: typeof search["token"] === "string" ? (search["token"] as string) : undefined,
    };
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/reset-password" });
  const token = search.token || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!token) {
      setErrorMsg("Missing or invalid password reset token. Please request a new link.");
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
      const res = await AuthUser.resetPassword(token, password);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to reset password. The link may have expired or already been used.");
        toast.error(res.error || "Password reset failed.");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 1500);
    } catch {
      setErrorMsg("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="font-display text-2xl font-semibold tracking-tight inline-block mb-4">
            bg<span className="text-accent">.</span>
          </Link>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Set new password
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Please choose a secure new password for your bg.tools account.
          </p>
        </div>

        {/* Missing token alert */}
        {!token && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400 space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong>Invalid Reset Link:</strong> No valid reset token was detected in the URL. Reset links expire after 30 minutes and can only be used once.
              </div>
            </div>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 font-bold text-xs text-white hover:bg-rose-500 transition-colors"
            >
              <span>Request New Link</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-600 dark:text-rose-400 animate-fade-in"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {success ? (
          <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center animate-fade-in">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-foreground">Password updated!</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your password has been changed successfully. Redirecting you to login...
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-bold text-background hover:opacity-90 transition-opacity"
              >
                <span>Go to Login</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          token && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div className="space-y-1.5">
                <Label htmlFor="reset-new-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="reset-new-password"
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
                <Label htmlFor="reset-confirm-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-bold text-background transition-all hover:scale-[1.01] hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-lg mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
