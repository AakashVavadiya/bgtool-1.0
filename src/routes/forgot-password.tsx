import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthUser } from "@/lib/auth-user";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password | bg.tools" },
      { name: "description", content: "Reset your bg.tools account password securely." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await AuthUser.forgotPassword(cleanEmail);
      if (!res.success) {
        setErrorMsg(res.error || "Unable to process request.");
        toast.error(res.error || "Request failed.");
        setIsLoading(false);
        return;
      }

      setSubmitted(true);
      toast.success("Password reset instructions sent.");
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
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
            Reset password
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Enter the email associated with your bg.tools account and we will send you a secure link to reset your password.
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-600 dark:text-rose-400 animate-fade-in"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center animate-fade-in">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-foreground">Check your inbox</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If an account with <strong className="text-foreground">{email}</strong> exists, we've sent password reset instructions with a link valid for 30 minutes.
              </p>
            </div>
            <div className="pt-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-bold text-background hover:opacity-90 transition-opacity"
              >
                <span>Return to Login</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  disabled={isLoading}
                  className="rounded-xl border-border bg-muted/40 px-3.5 py-2.5 pl-10 text-sm focus:border-foreground"
                />
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-bold text-background transition-all hover:scale-[1.01] hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
