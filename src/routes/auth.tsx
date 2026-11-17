import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AuthUser, type CurrentUser } from "@/lib/auth-user";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Zap, LogOut, ArrowRight, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Log In or Sign Up | bg.tools" },
      {
        name: "description",
        content:
          "Access your bg.tools account to remove backgrounds, upscale images and manage credits with zero tracking.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => AuthUser.getCurrentUser());
  const [mode, setMode] = useState<"login" | "signup">("login");
  const isLogin = mode === "login";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const update = () => setCurrentUser(AuthUser.getCurrentUser());
    window.addEventListener(REALTIME_EVENT_NAME, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await AuthUser.login(email, password);
        if (!res.success) {
          if (res.requireVerification) {
            setErrorMsg("Your email is not verified yet. Please enter your verification code.");
            toast.error("Email verification required.");
            setTimeout(() => {
              window.location.href = `/verify-email?email=${encodeURIComponent(res.email || email)}`;
            }, 800);
          } else {
            setErrorMsg(res.error || "Login failed. Please check your credentials.");
            toast.error(res.error || "Login failed.");
          }
          setIsLoading(false);
          return;
        }

        toast.success(`Welcome back, ${res.user!.name}! (${res.user!.credits} credits available)`);
        setCurrentUser(res.user!);
        setTimeout(() => {
          window.location.href = "/account";
        }, 300);
      } else {
        const res = await AuthUser.signUp(name, email, password);
        if (!res.success) {
          setErrorMsg(res.error || "Registration failed.");
          toast.error(res.error || "Registration failed.");
          setIsLoading(false);
          return;
        }

        toast.success("Account created! A 6-digit verification code has been sent to your email.");
        setTimeout(() => {
          window.location.href = `/verify-email?email=${encodeURIComponent(res.email || email)}`;
        }, 800);
      }
    } catch {
      setErrorMsg("Authentication request failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    AuthUser.logout();
    setCurrentUser(null);
    toast.success("Logged out successfully.");
  };

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      {/* Left / brand panel */}
      <aside className="grain relative hidden flex-col justify-between border-r border-border p-10 lg:flex bg-card/30">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
          bg<span className="text-accent">.</span>
        </Link>
        <div>
          <p className="halftone-text font-display text-[7vw] font-medium leading-normal pb-3 text-foreground">
            bg.
          </p>
          <p className="mt-8 max-w-sm text-sm leading-relaxed text-muted-foreground">
            One account for all thirty studio tools — background removal, upscaling, conversion and
            clean-up, with credits shared seamlessly across every one of them.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} bg. tools</p>
      </aside>

      {/* Main Content Area */}
      <main className="flex items-center justify-center px-5 py-16 md:px-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-display text-2xl font-semibold tracking-tight lg:hidden">
            bg<span className="text-accent">.</span>
          </Link>

          {/* IF ALREADY LOGGED IN: SHOW ACTIVE PROFILE CARD */}
          {currentUser ? (
            <div className="mt-8 space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xl animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background font-display text-2xl font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-foreground">{currentUser.name}</h2>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-500 uppercase">
                      {currentUser.plan}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
              </div>

              {/* Credits Status */}
              <div className="flex items-center justify-between rounded-2xl bg-muted/60 p-4 border border-border">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500 fill-current" />
                  <span className="text-xs font-bold text-foreground">Available Credits</span>
                </div>
                <span className="font-mono text-xl font-black text-amber-500">
                  {currentUser.credits}
                </span>
              </div>

              {/* Navigation Actions */}
              <div className="space-y-2.5 pt-2">
                <Link
                  to="/"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-bold text-background hover:scale-[1.02] transition-all cursor-pointer shadow-md"
                >
                  <span>Go to Studio & Tools</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/pricing"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 px-6 py-3 text-xs font-bold text-foreground hover:bg-secondary transition-all"
                >
                  <Wand2 className="h-3.5 w-3.5 text-amber-500" />
                  <span>Get More Credits</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-500/20 px-6 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          ) : (
            /* IF NOT LOGGED IN: SHOW AUTH FORM */
            <div>
              {/* Tab Switcher */}
              <div className="mt-8 inline-flex rounded-full border border-border p-1 lg:mt-0">
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setErrorMsg("");
                    }}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition-all cursor-pointer ${
                      mode === m
                        ? "bg-foreground text-background shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "login" ? "Log in" : "Sign up"}
                  </button>
                ))}
              </div>

              <h1 className="mt-8 font-display text-3xl font-medium leading-tight md:text-4xl">
                {isLogin ? "Welcome back." : "Create your account."}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {isLogin
                  ? "Log in to access your tools and studio credits."
                  : "Set up a free account with 10 daily credits to process images."}
              </p>

              {/* Error Banner */}
              {errorMsg && (
                <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-500 animate-shake">
                  {errorMsg}
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold">Your Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrorMsg("");
                      }}
                      placeholder="Enter your name"
                      autoComplete="name"
                      className="rounded-2xl"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="you@studio.com"
                    autoComplete="email"
                    required
                    className="rounded-2xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg("");
                      }}
                      placeholder="••••••••"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      required
                      className="rounded-2xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div className="flex justify-end pt-0.5">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-extrabold text-background transition-all hover:opacity-90 hover:scale-[1.01] active:scale-95 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{isLoading ? "Authenticating..." : isLogin ? "Log in" : "Create Account (Free 10 Credits)"}</span>
                </button>
              </form>

              <p className="mt-8 text-xs leading-relaxed text-muted-foreground text-center">
                By continuing you agree to the Terms and Privacy Policy.{" "}
                <Link to="/pricing" className="text-foreground underline">
                  See pricing
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
