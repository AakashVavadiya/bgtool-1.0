import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AuthUser, type CurrentUser } from "@/lib/auth-user";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { TokenCoin } from "@/components/TokenCoins";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  ShieldCheck,
  Lock,
  LogOut,
  Wand2,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Coins,
  Check,
  Zap,
  KeyRound,
  Calendar,
  Clock,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account & Settings | bg.tools" },
      { name: "description", content: "Manage your bg.tools profile, tokens, security and credentials." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => AuthUser.getCurrentUser());
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  // Profile form
  const [editName, setEditName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState("");
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("");

  useEffect(() => {
    const update = () => {
      const u = AuthUser.getCurrentUser();
      setCurrentUser(u);
      if (u) {
        setEditName(u.name);
      }
    };
    update();
    window.addEventListener(REALTIME_EVENT_NAME, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    if (!editName.trim()) {
      setProfileErrorMsg("Name cannot be empty.");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await AuthUser.updateProfile(editName.trim());
      if (!res.success) {
        setProfileErrorMsg(res.error || "Failed to update profile.");
        toast.error(res.error || "Update failed.");
      } else {
        setProfileSuccessMsg("Profile updated successfully!");
        toast.success("Profile updated!");
      }
    } catch {
      setProfileErrorMsg("Network error.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg("");
    setPasswordErrorMsg("");

    if (!currentPassword) {
      setPasswordErrorMsg("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordErrorMsg("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordErrorMsg("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await AuthUser.changePassword(currentPassword, newPassword);
      if (!res.success) {
        setPasswordErrorMsg(res.error || "Failed to update password.");
        toast.error(res.error || "Password change failed.");
      } else {
        setPasswordSuccessMsg("Password changed successfully! Other sessions have been revoked.");
        toast.success("Password updated!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch {
      setPasswordErrorMsg("Network error.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await AuthUser.logoutAsync();
    setCurrentUser(null);
    toast.success("Logged out successfully.");
    navigate({ to: "/" });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center space-y-5 rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-8 sm:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold tracking-tight">Authentication Required</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Please log in to your account to view your token balances, update settings, and manage subscriptions.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                search={{ redirect: "/account" } as any}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-bold text-background hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md cursor-pointer"
              >
                <span>Sign In to Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const freeCredits = currentUser.freeCredits ?? 10;
  const paidCredits = currentUser.paidCredits ?? 0;
  const planName = currentUser.plan.toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-amber-500/20">
      <SiteHeader />

      <main className="flex-1 relative overflow-hidden pb-20 pt-8 sm:pt-12 px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 w-full space-y-8 sm:space-y-10">
        {/* Ambient Warm Gradient Backdrop */}
        <div className="pointer-events-none absolute -top-40 right-10 h-96 w-96 rounded-full bg-amber-500/8 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -left-20 h-80 w-80 rounded-full bg-orange-500/6 blur-3xl" />

        {/* 1. Top Profile Hero Card */}
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/85 backdrop-blur-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300">
          {/* Decorative Top Accent Border */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
            {/* User Identity Info */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative shrink-0">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-foreground via-foreground/90 to-foreground/80 text-background font-display text-2xl sm:text-3xl font-black shadow-lg ring-4 ring-background">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span
                  title="Account Active"
                  className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-background ring-offset-0 animate-pulse"
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight truncate">
                    {currentUser.name}
                  </h1>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {planName} PLAN
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1.5 font-mono text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 self-start lg:self-center">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm px-5 py-3 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
              >
                <Wand2 className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                <span>Top Up Tokens</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm px-4 py-3 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
              >
                <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </section>

        {/* 2. Interactive Token Balances Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Card 1: Total Available */}
          <div className="group rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-5 sm:p-6 space-y-3 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Available
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Coins className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl sm:text-4xl font-black text-foreground">
                {currentUser.credits}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">Tokens</span>
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Ready across all tools</span>
              <span className="font-semibold text-emerald-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
          </div>

          {/* Card 2: Bronze Tokens (Daily Allowance) */}
          <div className="group rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card/90 to-card/90 backdrop-blur-xl p-5 sm:p-6 space-y-3 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-amber-500/50 transition-all duration-300 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <TokenCoin type="bronze" size="xs" />
                <span>Bronze Tokens (Daily)</span>
              </span>
              <span className="rounded-md bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                10 Free / Day
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl sm:text-4xl font-black text-amber-700 dark:text-amber-300">
                {freeCredits}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">/ 10 allowance</span>
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                <span>Refreshes daily at 00:00 UTC</span>
              </span>
            </div>
          </div>

          {/* Card 3: Gold Tokens (Purchased) */}
          <div className="group rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-5 sm:p-6 space-y-3 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TokenCoin type="gold" size="xs" showGlow={paidCredits > 0} />
                <span>Gold Tokens (Purchased)</span>
              </span>
              <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                Never Expire
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl sm:text-4xl font-black text-amber-500">
                {paidCredits}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">Paid Tokens</span>
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Permanent pay-as-you-go</span>
              <Link
                to="/pricing"
                className="font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
              >
                <span>Top up</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* 3. Navigation Tab Bar */}
        <div className="flex items-center justify-start">
          <div className="inline-flex p-1.5 rounded-2xl bg-muted/70 border border-border/60 backdrop-blur-md gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeTab === "profile"
                  ? "bg-card text-foreground shadow-sm scale-[1.01]"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Profile Details</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeTab === "security"
                  ? "bg-card text-foreground shadow-sm scale-[1.01]"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>Security & Password</span>
            </button>
          </div>
        </div>

        {/* 4. Two-Column Dashboard Content Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Active Form Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tab 1: Profile Details */}
            {activeTab === "profile" && (
              <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <div className="border-b border-border/60 pb-5">
                  <h3 className="font-display text-xl font-bold text-foreground">Personal Information</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Update your account display name and check your registered email details.
                  </p>
                </div>

                {profileSuccessMsg && (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {profileErrorMsg && (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400 animate-in fade-in duration-200">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{profileErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  {/* Display Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="account-name" className="text-xs font-bold text-foreground">
                      Display Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="account-name"
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        disabled={isUpdatingProfile}
                        className="rounded-2xl border-border bg-muted/30 focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:border-amber-500 pl-10 text-sm h-11"
                      />
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      This name is displayed across your workspace and profile menu.
                    </p>
                  </div>

                  {/* Registered Email */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground">
                        Email Address
                      </Label>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Verified via OTP
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="email"
                        value={currentUser.email}
                        disabled
                        className="rounded-2xl border-border bg-muted/20 opacity-80 cursor-not-allowed pl-10 text-sm h-11 font-mono"
                      />
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Primary email used for security OTP codes, transaction receipts, and recovery.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile || editName === currentUser.name}
                      className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-xs sm:text-sm font-bold text-background hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Security & Password */}
            {activeTab === "security" && (
              <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <div className="border-b border-border/60 pb-5">
                  <h3 className="font-display text-xl font-bold text-foreground">Security & Credentials</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Keep your account secure with a strong password. Changing your password revokes other active sessions.
                  </p>
                </div>

                {passwordSuccessMsg && (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{passwordSuccessMsg}</span>
                  </div>
                )}

                {passwordErrorMsg && (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400 animate-in fade-in duration-200">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{passwordErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-5">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="account-current-password" className="text-xs font-bold text-foreground">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="account-current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="Enter current password"
                        disabled={isChangingPassword}
                        className="rounded-2xl border-border bg-muted/30 pr-10 pl-10 text-sm h-11 focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                      />
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="account-new-password" className="text-xs font-bold text-foreground">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="account-new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="At least 8 characters"
                        disabled={isChangingPassword}
                        className="rounded-2xl border-border bg-muted/30 pr-10 pl-10 text-sm h-11 focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                      />
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="flex items-center gap-2 pt-1 text-[11px]">
                        <span
                          className={`font-semibold ${
                            newPassword.length >= 8 ? "text-emerald-500" : "text-amber-500"
                          }`}
                        >
                          {newPassword.length >= 8 ? "✓ 8+ characters met" : "Must be at least 8 characters"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="account-confirm-new-password" className="text-xs font-bold text-foreground">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="account-confirm-new-password"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        placeholder="Re-enter new password"
                        disabled={isChangingPassword}
                        className="rounded-2xl border-border bg-muted/30 pl-10 text-sm h-11 focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                      />
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {confirmNewPassword && (
                      <p
                        className={`text-[11px] font-semibold ${
                          newPassword === confirmNewPassword ? "text-emerald-500" : "text-rose-500"
                        }`}
                      >
                        {newPassword === confirmNewPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmNewPassword}
                      className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-xs sm:text-sm font-bold text-background hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Account Hub & Perks Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card 1: Current Plan & Features */}
            <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                    Subscription Status
                  </span>
                  <h4 className="font-display text-lg font-bold text-foreground">
                    {planName} Plan
                  </h4>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">
                  Active
                </span>
              </div>

              <div className="space-y-3 text-xs text-foreground">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>10 Bronze Tokens replenished daily at midnight UTC</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>Full access to AI background removal & image converters</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>High-speed cloud AI processing queue</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>Zero tracking & automatic privacy deletion</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <Link
                  to="/pricing"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold text-xs py-3 px-4 transition-all duration-200 cursor-pointer group"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
                  <span>Upgrade to Lite or Pro Plans</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Card 2: Pay-as-you-go Gold Tokens Banner */}
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card/90 to-card/90 backdrop-blur-xl p-6 space-y-4 shadow-sm relative overflow-hidden group">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    <Flame className="h-3 w-3 text-amber-500" />
                    <span>Pay As You Go</span>
                  </div>
                  <h4 className="font-display text-base font-bold text-foreground">
                    Need extra processing capacity?
                  </h4>
                </div>
                <TokenCoin type="gold" size="sm" showGlow />
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Gold Tokens never expire and kick in automatically if you exceed your daily Bronze quota. Starting from just ₹199 with instant checkout.
              </p>

              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs px-5 py-2.5 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Get Gold Tokens</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Card 3: Account Protection Info */}
            <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-5 space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Account Protection Active</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Your credentials are encrypted using secure cryptographic hashing. All transactions are processed through RBI-authorized payment gateways.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
