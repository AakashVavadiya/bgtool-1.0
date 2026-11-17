import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AuthUser } from "@/lib/auth-user";
import { COUNTRIES, detectUserCountry, isCountryRestricted, type CountryInfo } from "@/lib/countries";
import { setSavedCurrency } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight, ShieldCheck, User, Mail, Lock, ArrowLeft, Shield, Phone, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { CountrySelectModal } from "@/components/CountrySelectModal";
import { ServiceUnavailableDialog } from "@/components/ServiceUnavailableDialog";

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
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(() => COUNTRIES[0]!);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false);

  // Auto-detect user's country and default currency
  useEffect(() => {
    const detected = detectUserCountry();
    if (isCountryRestricted(detected.code)) {
      setShowUnavailableDialog(true);
      setSelectedCountry(COUNTRIES[0]!);
    } else {
      setSelectedCountry(detected);
    }
  }, []);

  // If already logged in, redirect to account
  useEffect(() => {
    const user = AuthUser.getCurrentUser();
    if (user) {
      navigate({ to: "/account" });
    }
  }, [navigate]);

  // Password Strength Calculator
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
    const rawPhone = phone.trim();

    if (!cleanName) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (isCountryRestricted(selectedCountry.code)) {
      setErrorMsg("Our Service Not Available For You in this region.");
      toast.error("Our Service Not Available For You");
      setShowUnavailableDialog(true);
      return;
    }

    if (rawPhone && rawPhone.replace(/\D/g, "").length < 6) {
      setErrorMsg("Please enter a valid phone number (minimum 6 digits).");
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
      const formattedPhone = rawPhone ? `${selectedCountry.dialCode} ${rawPhone}` : undefined;
      const res = await AuthUser.signUp(
        cleanName,
        cleanEmail,
        password,
        formattedPhone,
        selectedCountry.dialCode,
        selectedCountry.name
      );
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

      {/* RIGHT COLUMN: Signup Form Area (NO gradients, Clean Website Card) */}
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
                Create an account
              </h1>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-foreground underline underline-offset-4 hover:text-accent transition-colors"
                >
                  Log in
                </Link>
              </p>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive"
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
                    className="rounded-2xl border-border bg-muted/30 px-3.5 py-3 pl-11 text-sm h-12 focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent"
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
                    className="rounded-2xl border-border bg-muted/30 px-3.5 py-3 pl-11 text-sm h-12 focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent"
                  />
                  <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Mobile Number & Country Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="signup-phone"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Mobile Number & Country
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {selectedCountry.dialCode === "+91" ? (
                      <span className="text-emerald-500 font-bold">🇮🇳 India (+91)</span>
                    ) : (
                      <span className="text-foreground font-semibold">
                        {selectedCountry.code} ({selectedCountry.dialCode})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex gap-2">
                  {/* Custom Country Code Selector Button */}
                  <div className="relative w-[130px] sm:w-[150px] shrink-0">
                    <button
                      type="button"
                      id="signup-country"
                      aria-label="Select Country Code"
                      aria-haspopup="dialog"
                      disabled={isLoading}
                      onClick={() => setIsCountryModalOpen(true)}
                      className="w-full h-12 rounded-2xl border border-border bg-muted/30 px-3 flex items-center justify-between gap-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        <img
                          src={`https://flagcdn.com/w40/${selectedCountry.flagCode}.png`}
                          alt={selectedCountry.name}
                          className="w-4 h-3 object-cover rounded-xs border border-border/50 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <span className="font-bold text-foreground">
                          {selectedCountry.dialCode}
                        </span>
                        <span className="text-[11px] text-muted-foreground hidden xs:inline sm:inline">
                          ({selectedCountry.code})
                        </span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  </div>

                  {/* Phone Input */}
                  <div className="relative flex-1">
                    <Input
                      id="signup-phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 98765 43210"
                      disabled={isLoading}
                      className="rounded-2xl border-border bg-muted/30 px-3.5 py-3 pl-10 text-sm h-12 focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent"
                    />
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Identifies your country location & defaults your currency automatically.
                </p>
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

                {/* Password Strength Meter */}
                {password && (
                  <div className="space-y-1 pt-1">
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
                        password === confirmPassword ? "text-emerald-500" : "text-destructive"
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
                    className="rounded-2xl border-border bg-muted/30 px-3.5 py-3 pl-11 pr-11 text-sm h-12 focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent"
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

            {/* Terms and Security Footer */}
            <div className="mt-6 pt-5 border-t border-border/50 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link to="/terms" className="underline text-foreground hover:text-accent transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="underline text-foreground hover:text-accent transition-colors">
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

      {/* Country Selection Bottom Sheet / Modal */}
      <CountrySelectModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        selectedCountry={selectedCountry}
        onSelectCountry={(country) => {
          setSelectedCountry(country);
          setSavedCurrency(country.defaultCurrency);
        }}
      />

      {/* Regional Restriction Notice (e.g. Pakistan) */}
      <ServiceUnavailableDialog
        isOpen={showUnavailableDialog}
        onClose={() => setShowUnavailableDialog(false)}
        onChangeCountry={() => {
          setShowUnavailableDialog(false);
          setIsCountryModalOpen(true);
        }}
        countryName="Pakistan"
        flagCode="pk"
      />
    </div>
  );
}
