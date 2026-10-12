import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AuthUser, type CurrentUser } from "@/lib/auth-user";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { TokenCoin } from "@/components/TokenCoins";
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
      <div className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-16 text-foreground">
        <div className="w-full max-w-md text-center space-y-4 rounded-3xl border border-border bg-card p-8 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-bold">Authentication Required</h2>
          <p className="text-sm text-muted-foreground">
            Please log in to view and manage your account details.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              search={{ redirect: "/account" } as any}
              className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-bold text-background hover:opacity-90 transition-opacity"
            >
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const freeCredits = currentUser.freeCredits ?? 10;
  const paidCredits = currentUser.paidCredits ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 pt-8 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Top Banner / User Hero */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 sm:p-8 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background font-display text-2xl sm:text-3xl font-bold shadow-md">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                {currentUser.name}
              </h1>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-500 uppercase">
                {currentUser.plan} plan
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span>{currentUser.email}</span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold">
                <ShieldCheck className="h-3 w-3" />
                <span>Verified</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm"
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>Top Up Tokens</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Token Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Tokens */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Available</span>
            <Coins className="h-4 w-4 text-foreground" />
          </div>
          <div className="font-mono text-3xl font-black text-foreground">
            {currentUser.credits}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Active tokens across all 30 studio tools
          </p>
        </div>

        {/* Bronze Free Tokens */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <TokenCoin type="bronze" size="xs" />
              <span>Bronze Tokens (Daily)</span>
            </span>
          </div>
          <div className="font-mono text-3xl font-black text-amber-700 dark:text-amber-300">
            {freeCredits}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Refreshes automatically to 10 every midnight UTC
          </p>
        </div>

        {/* Gold Tokens */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <TokenCoin type="gold" size="xs" showGlow={paidCredits > 0} />
              <span>Gold Tokens (Purchased)</span>
            </span>
          </div>
          <div className="font-mono text-3xl font-black text-amber-500">
            {paidCredits}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Permanent tokens that never expire
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "profile"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile Details</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "security"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Security & Password</span>
        </button>
      </div>

      {/* Tab 1: Profile Details */}
      {activeTab === "profile" && (
        <div className="max-w-xl rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-md animate-fade-in">
          <div>
            <h3 className="font-display text-xl font-bold">Personal Information</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Update your display name and review account details.
            </p>
          </div>

          {profileSuccessMsg && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="account-name" className="text-xs font-semibold text-muted-foreground">
                Display Name
              </Label>
              <Input
                id="account-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                disabled={isUpdatingProfile}
                className="rounded-xl border-border bg-muted/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Email Address (Verified)
              </Label>
              <Input
                type="email"
                value={currentUser.email}
                disabled
                className="rounded-xl border-border bg-muted/20 opacity-70 cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground">
                Primary email used for OTP verification and transactional notifications.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile || editName === currentUser.name}
                className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-xs font-bold text-background hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === "security" && (
        <div className="max-w-xl rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-md animate-fade-in">
          <div>
            <h3 className="font-display text-xl font-bold">Change Password</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Ensure your account stays protected by using a strong, unique password.
            </p>
          </div>

          {passwordSuccessMsg && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          {passwordErrorMsg && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <Label htmlFor="account-current-password" className="text-xs font-semibold text-muted-foreground">
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
                  className="rounded-xl border-border bg-muted/40 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="account-new-password" className="text-xs font-semibold text-muted-foreground">
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
                  className="rounded-xl border-border bg-muted/40 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="account-confirm-new-password" className="text-xs font-semibold text-muted-foreground">
                Confirm New Password
              </Label>
              <Input
                id="account-confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                placeholder="Re-enter new password"
                disabled={isChangingPassword}
                className="rounded-xl border-border bg-muted/40"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword}
                className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-xs font-bold text-background hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
