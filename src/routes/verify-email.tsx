import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AuthUser } from "@/lib/auth-user";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Mail,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Verify Your Email | bg.tools" },
      { name: "description", content: "Verify your bg.tools account with your 6-digit email OTP." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { email?: string | undefined } => {
    return {
      email: typeof search["email"] === "string" ? (search["email"] as string) : undefined,
    };
  },
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/verify-email" });

  const [email, setEmail] = useState(() => {
    if (search.email) return search.email;
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("bg_verify_email") || "";
    }
    return "";
  });

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Countdown timer for 60s cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first OTP input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, "");
    setErrorMsg("");

    if (!cleaned) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    // If pasted string has multiple digits
    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, 6).split("");
      const nextOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) nextOtp[i] = d;
      });
      setOtp(nextOtp);
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();

      // If full 6 digits pasted, trigger submit
      if (digits.length === 6) {
        submitVerification(nextOtp.join(""));
      }
      return;
    }

    // Single digit input
    const nextOtp = [...otp];
    nextOtp[index] = cleaned[0] || "";
    setOtp(nextOtp);

    // Auto advance
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (cleaned && index === 5) {
      const fullCode = nextOtp.join("");
      if (fullCode.length === 6) {
        submitVerification(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const digits = pasted.split("");
    const nextOtp = [...otp];
    digits.forEach((d, i) => {
      if (i < 6) nextOtp[i] = d;
    });
    setOtp(nextOtp);
    const nextIndex = Math.min(digits.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      submitVerification(pasted);
    }
  };

  const submitVerification = async (codeOverride?: string) => {
    const code = codeOverride || otp.join("");
    setErrorMsg("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please provide a valid email address.");
      return;
    }

    if (code.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsVerifying(true);

    try {
      const res = await AuthUser.verifyEmailOtp(cleanEmail, code);
      if (!res.success) {
        setErrorMsg(res.error || "Invalid or expired verification code.");
        toast.error(res.error || "Verification failed.");
        setIsVerifying(false);
        return;
      }

      setSuccessMsg("Email verified successfully! Welcome to bg.tools.");
      toast.success("Email verified! 10 free daily tokens added.");

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("bg_verify_email");
      }

      setTimeout(() => {
        navigate({ to: "/account" });
      }, 800);
    } catch {
      setErrorMsg("Network error during verification. Please try again.");
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address first.");
      return;
    }

    setIsResending(true);
    setErrorMsg("");

    try {
      const res = await AuthUser.resendOtp(cleanEmail);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to resend code.");
        toast.error(res.error || "Resend failed.");
      } else {
        setCooldown(60);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        toast.success(res.message || "A new 6-digit code has been sent.");
      }
    } catch {
      setErrorMsg("Failed to connect to email service.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-end sm:items-center justify-center bg-background/95 sm:bg-background text-foreground p-0 sm:px-4 sm:py-12 relative">
      {/* Mobile Backdrop Tint */}
      <div className="fixed inset-0 bg-black/40 sm:hidden pointer-events-none -z-0" />

      <div className="relative z-10 w-full max-w-md space-y-5 sm:space-y-6 rounded-t-[32px] sm:rounded-3xl border-t border-x sm:border border-border/80 bg-card p-6 sm:p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_-20px_50px_rgba(0,0,0,0.5)] sm:shadow-2xl animate-in slide-in-from-bottom-8 duration-300 sm:animate-fade-in max-h-[92dvh] overflow-y-auto pb-8 sm:pb-8">
        {/* Mobile Drag/Pull Indicator Handle */}
        <div className="mx-auto -mt-2 mb-3 h-1.5 w-12 rounded-full bg-muted-foreground/30 sm:hidden" />

        {/* Header */}
        <div className="text-center">
          <Link to="/" className="font-display text-2xl font-semibold tracking-tight inline-block mb-3 sm:mb-4">
            bg<span className="text-accent">.</span>
          </Link>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Check your inbox
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            We sent a secure 6-digit verification code to
          </p>
          <div className="mt-1 font-mono text-xs sm:text-sm font-semibold text-foreground break-all">
            {email || "your email address"}
          </div>
        </div>

        {/* Change Email Accordion / Input if not set */}
        {!search.email && (
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="verify-email-field" className="text-xs font-semibold text-muted-foreground">
              Verify address
            </Label>
            <Input
              id="verify-email-field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="rounded-xl border-border bg-muted/40 text-xs"
            />
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-600 dark:text-rose-400 animate-fade-in"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-fade-in"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        {/* 6-Digit OTP Inputs */}
        <div className="space-y-3">
          <Label className="block text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Enter 6-Digit Code
          </Label>
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isVerifying}
                aria-label={`Digit ${idx + 1}`}
                className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border-2 border-border bg-card text-center font-mono text-xl sm:text-2xl font-bold text-foreground transition-all focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <Clock className="h-3 w-3" />
            <span>Code expires in 10 minutes (maximum 5 attempts)</span>
          </div>
        </div>

        {/* Submit Verification Button */}
        <button
          type="button"
          onClick={() => submitVerification()}
          disabled={isVerifying || otp.join("").length !== 6}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-bold text-background transition-all hover:scale-[1.01] hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-lg"
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying Code...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              <span>Verify & Continue</span>
            </>
          )}
        </button>

        {/* Resend Cooldown Section */}
        <div className="flex flex-col items-center gap-3 pt-2 border-t border-border/60">
          <div className="text-xs text-muted-foreground">
            Didn't receive the email? Check your spam folder or
          </div>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="inline-flex items-center gap-2 text-xs font-semibold text-foreground hover:text-accent transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed cursor-pointer"
          >
            {isResending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Sending new code...</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 opacity-50" />
                <span>Resend OTP in {cooldown}s</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Resend code now</span>
              </>
            )}
          </button>
        </div>

        {/* Switch Account Link */}
        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <span>Wrong email or need to log in?</span>
            <span className="font-semibold underline">Back to login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
